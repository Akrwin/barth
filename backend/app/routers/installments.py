from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.installment import Installment
from app.schemas.installment import InstallmentCreate, InstallmentOut

router = APIRouter(prefix="/installments", tags=["installments"])

@router.get("", response_model=list[InstallmentOut])
def list_installments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Installment)
        .filter(
            Installment.user_id == current_user.id,
            Installment.months_paid < Installment.months_total,
        )
        .all()
    )

@router.post("", response_model=InstallmentOut, status_code=201)
def create_installment(
    body: InstallmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = Installment(**body.model_dump(), user_id=current_user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.patch("/{item_id}/pay", response_model=InstallmentOut)
def pay_installment(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Installment).filter(
        Installment.id == item_id, Installment.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Installment not found")
    if item.months_paid >= item.months_total:
        raise HTTPException(status_code=400, detail="Installment already fully paid")
    item.months_paid += 1
    db.commit()
    db.refresh(item)
    return item
