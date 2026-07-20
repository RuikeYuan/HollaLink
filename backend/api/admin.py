from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from api.deps import require_admin
from database import get_db
from models.conversation import Conversation
from schemas.chat import ConversationOut

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db)):
    return (
        db.query(Conversation)
        .options(joinedload(Conversation.messages))
        .order_by(Conversation.created_at.desc())
        .all()
    )
