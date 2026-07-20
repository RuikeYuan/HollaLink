from datetime import datetime

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    user_id: str | None = None


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    conversation_id: str
    user_id: str
    reply: MessageOut
    sources: list[str] = []


class ConversationOut(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    messages: list[MessageOut] = []

    class Config:
        from_attributes = True
