from datetime import datetime

from pydantic import BaseModel


class ReportRequest(BaseModel):
    industry: str
    city: str
    budget_eur: int
    user_id: str | None = None
    notes: str = ""


class ReportOut(BaseModel):
    id: str
    industry: str
    city: str
    budget_eur: int
    title: str
    content_markdown: str
    created_at: datetime

    class Config:
        from_attributes = True
