from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionType
from app.models.budget import Budget
from app.models.installment import Installment
from app.schemas.dashboard import DashboardSummary, BudgetItem, CategoryBreakdown

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _month_filter(query, month: int, year: int, period: str):
    """Apply time-range filter based on period."""
    if period == "YEARLY":
        return query.filter(Transaction.year == year)
    elif period == "QUARTERLY":
        quarter = (month - 1) // 3
        q_months = list(range(quarter * 3 + 1, quarter * 3 + 4))
        return query.filter(Transaction.year == year, Transaction.month.in_(q_months))
    else:  # MONTHLY (default)
        return query.filter(Transaction.month == month, Transaction.year == year)


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    month: int = Query(...),
    year: int = Query(...),
    period: str = Query("MONTHLY"),   # MONTHLY | QUARTERLY | YEARLY
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id

    # Total assets = income for the selected period (matches overview filter)
    base_assets_q = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == uid, Transaction.type == TransactionType.INCOME
    )
    total_assets = float(_month_filter(base_assets_q, month, year, period).scalar())

    # Period income & expense
    base_income_q = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == uid, Transaction.type == TransactionType.INCOME
    )
    base_expense_q = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == uid, Transaction.type == TransactionType.EXPENSE
    )

    period_income = float(_month_filter(base_income_q, month, year, period).scalar())
    period_expense = float(_month_filter(base_expense_q, month, year, period).scalar())

    net_income = period_income - period_expense
    outflow_pct = int((period_expense / period_income * 100)) if period_income > 0 else 0

    # Total debt = remaining installment amount
    installments = (
        db.query(Installment)
        .filter(Installment.user_id == uid, Installment.months_paid < Installment.months_total)
        .all()
    )
    total_debt = sum(
        float(i.total_amount) * (i.months_total - i.months_paid) / i.months_total
        for i in installments
    )

    # Trend vs previous period
    if period == "YEARLY":
        prev_income = float(
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(Transaction.user_id == uid, Transaction.type == TransactionType.INCOME,
                    Transaction.year == year - 1)
            .scalar()
        )
    elif period == "QUARTERLY":
        prev_quarter = ((month - 1) // 3) - 1
        if prev_quarter < 0:
            prev_quarter = 3
            prev_year_q = year - 1
        else:
            prev_year_q = year
        pq_months = list(range(prev_quarter * 3 + 1, prev_quarter * 3 + 4))
        prev_income = float(
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(Transaction.user_id == uid, Transaction.type == TransactionType.INCOME,
                    Transaction.year == prev_year_q, Transaction.month.in_(pq_months))
            .scalar()
        )
    else:
        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1
        prev_income = float(
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(Transaction.user_id == uid, Transaction.type == TransactionType.INCOME,
                    Transaction.month == prev_month, Transaction.year == prev_year)
            .scalar()
        )

    trend_pct = ((period_income - prev_income) / prev_income * 100) if prev_income > 0 else 0.0

    # Budget list (always monthly for budget tracking)
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == uid, Budget.month == month, Budget.year == year)
        .all()
    )
    budget_list = []
    for b in budgets:
        spent = float(
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(Transaction.user_id == uid, Transaction.category_id == b.category_id,
                    Transaction.type == TransactionType.EXPENSE,
                    Transaction.month == month, Transaction.year == year)
            .scalar()
        )
        limit = float(b.amount_limit)
        budget_list.append(BudgetItem(
            category_name=b.category.name if b.category else "",
            spent=spent,
            limit=limit,
            percentage=int(spent / limit * 100) if limit > 0 else 0,
        ))

    # ── Compute previous-period filter params ────────────────────────────────
    if period == "YEARLY":
        prev_p_month, prev_p_year, prev_period = month, year - 1, "YEARLY"
    elif period == "QUARTERLY":
        prev_quarter = ((month - 1) // 3) - 1
        if prev_quarter < 0:
            prev_quarter = 3
            prev_p_year = year - 1
        else:
            prev_p_year = year
        prev_p_month = prev_quarter * 3 + 1   # first month of prev quarter
        prev_period = "QUARTERLY"
    else:
        prev_p_month = month - 1 if month > 1 else 12
        prev_p_year  = year if month > 1 else year - 1
        prev_period  = "MONTHLY"

    # Category breakdown (top 3 expense categories by %)
    cat_q = (
        db.query(Transaction.category_id, func.sum(Transaction.amount).label("total"))
        .filter(Transaction.user_id == uid, Transaction.type == TransactionType.EXPENSE)
    )
    cat_q = _month_filter(cat_q, month, year, period)
    cat_totals = (
        cat_q
        .group_by(Transaction.category_id)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(3)
        .all()
    )
    from app.models.category import Category
    breakdown = []
    for row in cat_totals:
        cat = db.query(Category).filter(Category.id == row.category_id).first()
        current_amt = float(row.total)
        pct = int(current_amt / period_expense * 100) if period_expense > 0 else 0

        # Previous period amount for this category
        prev_cat_q = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == uid,
                Transaction.type == TransactionType.EXPENSE,
                Transaction.category_id == row.category_id,
            )
        )
        prev_amt = float(
            _month_filter(prev_cat_q, prev_p_month, prev_p_year, prev_period).scalar()
        )
        trend_amt = round(current_amt - prev_amt, 2)
        trend_pct_cat = round((trend_amt / prev_amt * 100), 1) if prev_amt > 0 else 0.0

        breakdown.append(CategoryBreakdown(
            category=cat.name if cat else "OTHER",
            percentage=pct,
            amount=round(current_amt, 2),
            prev_amount=round(prev_amt, 2),
            trend_amount=trend_amt,
            trend_pct=trend_pct_cat,
        ))

    return DashboardSummary(
        total_assets=total_assets,
        net_income=net_income,
        total_debt=round(total_debt, 2),
        outflow_percentage=outflow_pct,
        trend_percentage=round(trend_pct, 1),
        budget_list=budget_list,
        category_breakdown=breakdown,
    )
