import uuid
from datetime import datetime
from pydantic import BaseModel


class ChecklistItemOut(BaseModel):
    id: uuid.UUID
    name: str
    sort_order: int
    created_at: datetime
    model_config = {"from_attributes": True}


class ChecklistBulkUpdate(BaseModel):
    """Replace the user's entire master list with a new ordered list of names."""
    items: list[str]


class MonthChecklistResponse(BaseModel):
    """Checklist state for a specific month."""
    items: list[str]     # ordered item names to display
    is_past: bool        # True = frozen historical month (no edit)
    is_current: bool     # True = ongoing month
