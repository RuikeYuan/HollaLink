from datetime import date, datetime

from pydantic import BaseModel


class RoadmapRequest(BaseModel):
    shop_type: str
    city: str
    company_type: str
    sells_food_beverage: bool = False
    sells_alcohol: bool = False
    has_staff: bool = False
    needs_renovation: bool = False
    user_id: str | None = None


class RoadmapStepOut(BaseModel):
    id: str
    step_key: str
    title: str
    category: str
    materials: str
    official_link: str
    estimated_days: str
    note: str
    priority: str
    status: str
    due_date: date | None = None
    sort_order: int

    class Config:
        from_attributes = True


class RoadmapOut(BaseModel):
    id: str
    shop_type: str
    city: str
    company_type: str
    sells_food_beverage: bool
    sells_alcohol: bool
    has_staff: bool
    needs_renovation: bool
    created_at: datetime
    steps: list[RoadmapStepOut]

    class Config:
        from_attributes = True


class RoadmapStepUpdate(BaseModel):
    status: str | None = None
    due_date: date | None = None
