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
            print(f"已创建演示用户，user_id = {demo_user.id}")
        else:
            print(f"演示用户已存在，user_id = {demo_user.id}")

        print("正在导入 knowledge/ 目录下的知识库文档并写入向量数据库……")
        docs = ingest_knowledge_base_folder(db)
        print(f"已导入 {len(docs)} 篇知识库文档：")
        for doc in docs:
            print(f"  - [{doc.category}] {doc.filename} ({doc.chunk_count} 个片段)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
