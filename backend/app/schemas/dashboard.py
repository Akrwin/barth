from pydantic import BaseModel

class BudgetItem(BaseModel):
    category_name: str
    spent: float
    limit: float
    percentage: int

class CategoryBreakdown(BaseModel):
    category: str
    percentage: int
    amount: float           # total spend this period
    prev_amount: float      # total spend previous period (0 if none)
    trend_amount: float     # current - previous (positive = more, negative = less)
    trend_pct: float        # % change vs previous period (0 if no prev data)

class DashboardSummary(BaseModel):
    total_assets: float
    net_income: float
    total_debt: float
    outflow_percentage: int
    trend_percentage: float
    budget_list: list[BudgetItem]
    category_breakdown: list[CategoryBreakdown]
