from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionOut, MonthHistoryItem

router = APIRouter(prefix="/transactions", tags=["transactions"])

MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

@router.get("/history", response_model=list[MonthHistoryItem])
def get_history(
    category_id: uuid.UUID = Query(...),
    month: int = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return totals for the 3 months prior to (not including) the selected month."""
    uid = current_user.id
    results = []
    m, y = month, year
    for _ in range(3):
        m -= 1
        if m == 0:
            m = 12
            y -= 1
        total_row = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == uid,
                Transaction.category_id == category_id,
                Transaction.month == m,
                Transaction.year == y,
            )
            .scalar()
        )
        total_val = float(total_row) if total_row else None
        results.append(MonthHistoryItem(
            label=f"{MONTH_ABBR[m - 1]} {y}",
            month=m,
            year=y,
            total=total_val if total_val and total_val > 0 else None,
        ))
    return results


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    month: int = Query(...),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id, Transaction.month == month, Transaction.year == year)
        .order_by(Transaction.created_at.desc())
        .all()
    )

@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    body: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn = Transaction(**body.model_dump(), user_id=current_user.id)
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn

@router.delete("/{txn_id}", status_code=204)
def delete_transaction(
    txn_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id,
        Transaction.user_id == current_user.id,
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(txn)
    db.commit()
