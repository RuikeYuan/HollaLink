#!/bin/sh
# 注意：这里不使用 `set -e`。数据库初始化失败不应该导致整个容器退出，
# 应用应该先启动起来（/api/health 等端点仍然可用），数据库表会在
# 连接恢复后由 init_db.py 的重试逻辑自动补建。

# 使用 `python -u` 关闭输出缓冲，并将初始化脚本放到后台运行（`&`），
# 这样启动流程不会被数据库连接问题阻塞，应用可以立即对外提供服务。
python -u scripts/init_db.py &

exec uvicorn main:app --host 0.0.0.0 --port 8000
