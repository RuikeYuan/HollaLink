import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from database import Base, engine
import models  # noqa: F401  (ensures all models are registered on Base.metadata)

MAX_RETRIES = 5
RETRY_DELAY_SECONDS = 3


def health_check() -> bool:
    """尝试建立一次数据库连接，确认数据库是否可用。"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:  # noqa: BLE001 - 任何异常都视为数据库不可用
        print(f"数据库健康检查失败: {exc}")
        return False


def init_tables_with_retry() -> bool:
    """带重试逻辑地创建数据库表。失败不会抛出异常导致进程崩溃。"""
    for attempt in range(1, MAX_RETRIES + 1):
        if not health_check():
            print(f"数据库暂不可用（尝试 {attempt}/{MAX_RETRIES}）。")
        else:
            try:
                Base.metadata.create_all(bind=engine)
                print("数据库表已创建/确认完毕。")
                return True
            except OperationalError as exc:
                print(f"创建数据库表失败（尝试 {attempt}/{MAX_RETRIES}）: {exc}")
            except Exception as exc:  # noqa: BLE001 - 保证初始化脚本不会崩溃退出
                print(f"数据库初始化时发生未知错误（尝试 {attempt}/{MAX_RETRIES}）: {exc}")

        if attempt < MAX_RETRIES:
            time.sleep(RETRY_DELAY_SECONDS)

    print("数据库初始化在多次重试后仍未成功，应用将继续运行（数据库表可能尚未创建）。")
    return False


def main():
    try:
        init_tables_with_retry()
    except Exception as exc:  # noqa: BLE001 - 兜底，确保脚本永不以非零状态崩溃
        print(f"数据库初始化脚本遇到未预期的错误，已忽略并继续: {exc}")


if __name__ == "__main__":
    main()
