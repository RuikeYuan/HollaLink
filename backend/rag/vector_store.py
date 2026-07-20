import chromadb

from config import get_settings
from services.llm_client import embed_text

settings = get_settings()

_client = None
_collection = None


def get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        _collection = _client.get_or_create_collection(name="knowledge_base")
    return _collection


def upsert_chunks(doc_id: str, category: str, filename: str, chunks: list[str]) -> int:
    collection = get_collection()

    ids = [f"{doc_id}-{i}" for i in range(len(chunks))]
    embeddings = [embed_text(chunk) for chunk in chunks]
    metadatas = [{"category": category, "filename": filename, "document_id": doc_id} for _ in chunks]

    collection.upsert(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)
    return len(chunks)


def delete_document_chunks(doc_id: str) -> None:
    collection = get_collection()
    collection.delete(where={"document_id": doc_id})


def query_knowledge_base(query: str, k: int = 4, category: str | None = None) -> list[dict]:
    collection = get_collection()
    query_embedding = embed_text(query)

    where = {"category": category} if category else None
    results = collection.query(query_embeddings=[query_embedding], n_results=k, where=where)

    hits = []
    documents = results.get("documents") or [[]]
    metadatas = results.get("metadatas") or [[]]
    for doc, meta in zip(documents[0], metadatas[0]):
        hits.append({"content": doc, "category": meta.get("category"), "filename": meta.get("filename")})
    return hits
