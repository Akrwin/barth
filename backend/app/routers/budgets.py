from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction, TransactionType
from app.schemas.budget import BudgetCreate, BudgetOut

router = APIRouter(prefix="/budgets", tags=["budgets"])

@router.get("", response_model=list[BudgetOut])
def list_budgets(
    month: int = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id, Budget.month == month, Budget.year == year)
        .all()
    )
    result = []
    for b in budgets:
        spent_row = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.category_id == b.category_id,
                Transaction.type == TransactionType.EXPENSE,
                Transaction.month == month,
                Transaction.year == year,
            )
            .scalar()
        )
        spent = float(spent_row)
        limit = float(b.amount_limit)
        pct = int((spent / limit * 100)) if limit > 0 else 0
        result.append(BudgetOut(
            id=b.id,
            category_id=b.category_id,
            category_name=b.category.name if b.category else "",
            amount_limit=limit,
            spent=spent,
            percentage=pct,
            month=b.month,
            year=b.year,
        ))
    return result

@router.post("", response_model=BudgetOut, status_code=201)
def create_budget(
    body: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = Budget(**body.model_dump(), user_id=current_user.id)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    cat_name = budget.category.name if budget.category else ""
    return BudgetOut(
        id=budget.id,
        category_id=budget.category_id,
        category_name=cat_name,
        amount_limit=float(budget.amount_limit),
        spent=0.0,
        percentage=0,
        month=budget.month,
        year=budget.year,
    )
