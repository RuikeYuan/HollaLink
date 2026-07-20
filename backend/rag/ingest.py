import os
from pathlib import Path

from sqlalchemy.orm import Session

from models.document import Document
from rag.chunking import chunk_text
from rag.vector_store import upsert_chunks, delete_document_chunks

_default_knowledge_dir = Path(__file__).resolve().parent.parent.parent / "knowledge"
KNOWLEDGE_DIR = Path(os.environ.get("KNOWLEDGE_DIR", str(_default_knowledge_dir)))


def extract_text_from_pdf(file_bytes: bytes) -> str:
    from io import BytesIO

    from pypdf import PdfReader

    reader = PdfReader(BytesIO(file_bytes))
    return "\n\n".join(page.extract_text() or "" for page in reader.pages)


def ingest_document(db: Session, filename: str, category: str, content: str) -> Document:
    existing = db.query(Document).filter_by(filename=filename, category=category).first()
    if existing:
        delete_document_chunks(existing.id)
        db.delete(existing)
        db.flush()

    doc = Document(filename=filename, category=category, content=content, chunk_count=0)
    db.add(doc)
    db.flush()

    chunks = chunk_text(content)
    chunk_count = upsert_chunks(doc.id, category, filename, chunks)

    doc.chunk_count = chunk_count
    db.commit()
    db.refresh(doc)
    return doc


def ingest_knowledge_base_folder(db: Session) -> list[Document]:
    ingested = []
    if not KNOWLEDGE_DIR.exists():
        return ingested

    for category_dir in sorted(KNOWLEDGE_DIR.iterdir()):
        if not category_dir.is_dir():
            continue
        category = category_dir.name
        for file_path in sorted(category_dir.glob("*.md")):
            content = file_path.read_text(encoding="utf-8")
            doc = ingest_document(db, file_path.name, category, content)
            ingested.append(doc)

    return ingested
