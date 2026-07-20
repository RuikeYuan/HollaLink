from pydantic import BaseModel


class CostCalculatorRequest(BaseModel):
    industry: str  # horeca | retail | beauty | bubble_tea | other
    city: str
    budget_eur: int
    size_sqm: int | None = None
    staff_count: int | None = None


class CostBreakdownItem(BaseModel):
    label: str
    monthly_eur: int | None = None
    one_time_eur: int | None = None
    note: str = ""


class CostCalculatorResponse(BaseModel):
    industry: str
    city: str
    budget_eur: int
    one_time_total_eur: int
    monthly_total_eur: int
    breakdown: list[CostBreakdownItem]
    risks: list[str]
    budget_verdict: str
