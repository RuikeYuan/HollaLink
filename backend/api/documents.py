from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from api.deps import require_admin
from database import get_db
from models.document import Document
from rag.ingest import extract_text_from_pdf, ingest_document
from rag.vector_store import delete_document_chunks
from schemas.document import KNOWLEDGE_CATEGORIES, DocumentOut

router = APIRouter(prefix="/api/admin/documents", tags=["admin-documents"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    category: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if category not in KNOWLEDGE_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"category 必须是 {KNOWLEDGE_CATEGORIES} 之一")

    raw = await file.read()
    filename = file.filename or "untitled"

    if filename.lower().endswith(".pdf"):
        content = extract_text_from_pdf(raw)
    else:
        content = raw.decode("utf-8", errors="ignore")

    if not content.strip():
        raise HTTPException(status_code=400, detail="无法从文件中提取到文本内容")

    doc = ingest_document(db, filename, category, content)
    return doc


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")

    delete_document_chunks(doc.id)
    db.delete(doc)
    db.commit()
    return {"status": "deleted"}
