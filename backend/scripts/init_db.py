import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import Base, engine
import models  # noqa: F401  (ensures all models are registered on Base.metadata)


def main():
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified.")


if __name__ == "__main__":
    main()
