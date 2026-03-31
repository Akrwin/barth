import uuid
from datetime import date, datetime
from pydantic import BaseModel

class InstallmentCreate(BaseModel):
    name: str
    category: str | None = None
    total_amount: float
    months_total: int
    first_payment_date: date | None = None
    next_billing_date: date | None = None

class InstallmentOut(BaseModel):
    id: uuid.UUID
    name: str
    category: str | None = None
    total_amount: float
    months_total: int
    months_paid: int
    first_payment_date: date | None = None
    next_billing_date: date | None = None
    created_at: datetime
    model_config = {"from_attributes": True}
