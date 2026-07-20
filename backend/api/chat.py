from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from agents.business_consultant import answer_with_rag
from database import get_db
from models.conversation import Conversation
from models.message import Message
from models.user import User
from schemas.chat import ChatRequest, ChatResponse, ConversationOut, MessageOut
from services.llm_client import LLMNotConfiguredError

router = APIRouter(prefix="/api", tags=["chat"])


def _get_or_create_user(db: Session, user_id: str | None) -> User:
    if user_id:
        user = db.get(User, user_id)
        if user:
            return user
    user = User(name="Guest")
    db.add(user)
    db.flush()
    return user


def _get_or_create_conversation(db: Session, conversation_id: str | None, user_id: str, first_message: str) -> Conversation:
    if conversation_id:
        conversation = db.get(Conversation, conversation_id)
        if conversation:
            return conversation

    title = (first_message[:30] + "...") if len(first_message) > 30 else first_message
    conversation = Conversation(user_id=user_id, title=title or "新的咨询")
    db.add(conversation)
    db.flush()
    return conversation


@router.post("/chat", response_model=ChatResponse)
def send_chat_message(payload: ChatRequest, db: Session = Depends(get_db)):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="消息内容不能为空")

    user = _get_or_create_user(db, payload.user_id)
    conversation = _get_or_create_conversation(db, payload.conversation_id, user.id, payload.message)

    history = [{"role": m.role, "content": m.content} for m in conversation.messages]

    user_message = Message(conversation_id=conversation.id, role="user", content=payload.message)
    db.add(user_message)
    db.flush()

    try:
        reply_text, sources = answer_with_rag(payload.message, history)
    except LLMNotConfiguredError as exc:
        db.commit()
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    assistant_message = Message(conversation_id=conversation.id, role="assistant", content=reply_text)
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return ChatResponse(
        conversation_id=conversation.id,
        user_id=user.id,
        reply=MessageOut.model_validate(assistant_message),
        sources=sources,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="会话不存在")
    return conversation
