import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.transaction import TransactionType

class TransactionCreate(BaseModel):
    amount: float
    type: TransactionType
    category_id: uuid.UUID | None = None
    month: int
    year: int
    note: str | None = None

class CategoryInfo(BaseModel):
    id: uuid.UUID
    name: str
    icon: str | None = None
    category_type: str = "EXPENSE"
    model_config = {"from_attributes": True}

class CategoryCreate(BaseModel):
    name: str
    icon: str | None = None
    category_type: str = "EXPENSE"   # 'EXPENSE' | 'INCOME' | 'BOTH'

class TransactionOut(BaseModel):
    id: uuid.UUID
    amount: float
    type: TransactionType
    category: CategoryInfo | None = None
    month: int
    year: int
    note: str | None = None
    created_at: datetime
    model_config = {"from_attributes": True}

class MonthHistoryItem(BaseModel):
    label: str        # e.g. "FEB 2026"
    month: int
    year: int
    total: float | None
