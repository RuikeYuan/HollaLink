import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import SessionLocal
from models.user import User
from rag.ingest import ingest_knowledge_base_folder


def main():
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter_by(email="demo@dutchbusinessnavigator.com").first()
        if not demo_user:
            demo_user = User(email="demo@dutchbusinessnavigator.com", name="Demo User")
            db.add(demo_user)
            db.commit()
            print(f"Created demo user, user_id = {demo_user.id}")
        else:
            print(f"Demo user already exists, user_id = {demo_user.id}")

        print("Importing knowledge base documents from knowledge/ and writing them to the vector store...")
        docs = ingest_knowledge_base_folder(db)
        print(f"Imported {len(docs)} knowledge base documents:")
        for doc in docs:
            print(f"  - [{doc.category}] {doc.filename} ({doc.chunk_count} chunks)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
