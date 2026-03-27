import uuid
from pydantic import BaseModel

class BudgetCreate(BaseModel):
    category_id: uuid.UUID
    amount_limit: float
    month: int
    year: int

class BudgetOut(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    category_name: str
    amount_limit: float
    spent: float
    percentage: int
    month: int
    year: int
    model_config = {"from_attributes": True}
