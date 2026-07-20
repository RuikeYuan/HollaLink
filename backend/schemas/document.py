from datetime import datetime

from pydantic import BaseModel

KNOWLEDGE_CATEGORIES = ["business", "horeca", "tax", "immigration", "location", "cases"]


class DocumentOut(BaseModel):
    id: str
    filename: str
    category: str
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True
