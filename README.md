# 荷兰开店通 · Dutch Business Navigator AI

面向中国创业者的荷兰开店 AI 商业顾问平台 MVP：AI 聊天咨询 + RAG 知识库 + 开店成本计算器 + 商业分析报告生成 + 管理后台。

## 目录结构

```
dutch-business-ai (本仓库)/
├── frontend/           Next.js 14 + TypeScript + Tailwind
├── backend/
│   └── knowledge/      知识库 Markdown 种子内容（business/horeca/tax/immigration/location/cases）
├── docker-compose.yml
├── .env.example
└── README.md
```

## 技术栈

- 前端：Next.js 14（App Router）、TypeScript、TailwindCSS、react-markdown
- 后端：FastAPI、SQLAlchemy、PostgreSQL、Chroma（向量数据库，以嵌入式方式运行在后端容器内）
- AI：默认使用 Gemini（`gemini-2.5-flash` 对话 + `gemini-embedding-001` embedding），可通过 `LLM_PROVIDER` 切换到 OpenAI 或 Groq（Groq 无 embedding 能力，embedding 会自动回退到 Gemini/OpenAI）

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

| 变量 | 说明 |
| --- | --- |
| `LLM_PROVIDER` | `gemini` \| `openai` \| `groq`，决定聊天/报告用哪个模型 |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `GROQ_API_KEY` | 对应服务商的 API Key，缺失时相关功能会返回明确的"未配置"错误而不是崩溃 |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `CHROMA_PERSIST_DIR` | Chroma 向量数据持久化目录 |
| `ADMIN_TOKEN` | 管理后台的共享密钥（登录时输入，通过 `X-Admin-Token` 请求头校验） |
| `CORS_ORIGINS` | 允许访问后端 API 的前端源 |
| `RATE_LIMIT_PER_MINUTE` | 每个 IP 每分钟的请求上限（限流保护） |
| `NEXT_PUBLIC_API_BASE_URL` | 前端调用后端 API 的地址 |

**`.env` 已加入 `.gitignore`，切勿提交到版本库。**

## 使用 Docker 运行（推荐）

```bash
docker compose up -d --build
```

首次启动后，初始化演示用户并把 `knowledge/` 目录下的种子知识库写入向量数据库：

```bash
docker compose exec backend python scripts/seed.py
```

访问：
- 前端：http://localhost:3000
- 后端 API 文档（Swagger）：http://localhost:8010/docs

> 本仓库的 `docker-compose.yml` 默认把后端映射到宿主机 **8010** 端口（而不是常见的 8000），因为本机 8000/5432 端口已被其他本地服务占用。如果你的机器上 8000 端口空闲，可以把 `docker-compose.yml` 里 `8010:8000` 改回 `8000:8000`，并同步修改 `NEXT_PUBLIC_API_BASE_URL`。

## 本地开发（不使用 Docker）

### 后端

> 注意：`chromadb` 依赖的 `chroma-hnswlib` 在 Windows 上没有预编译 wheel，本地无 Visual C++ Build Tools 时会安装失败。Windows 用户建议直接使用上面的 Docker 方式运行后端；Linux/macOS 可按以下步骤本地运行。

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 需要本地 PostgreSQL，或用 docker compose up -d postgres 只起数据库
python scripts/init_db.py
python scripts/seed.py

uvicorn main:app --reload
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

## 数据库结构

- `users`：用户（含匿名访客与 Demo 账号）
- `conversations` / `messages`：AI 咨询会话与消息
- `documents`：知识库文档元数据（正文存 Postgres，切片向量存 Chroma）
- `reports`：生成的商业分析报告

## 核心功能

1. **AI 聊天咨询**（`/chat`）：结合 RAG 检索知识库回答问题，自动维护会话历史（`localStorage` 保存 `conversation_id`/`user_id`）。
2. **开店成本计算器**（`POST /api/calculator`，报告页有"快速试算"入口）：基于行业 + 城市 + 预算做确定性成本测算，不调用 LLM，响应快。
3. **商业分析报告生成**（`/report`）：结合成本计算器结果 + RAG 检索到的知识库资料，由 LLM 生成包含"项目概况/市场分析/投资预算/风险分析/开店路线/建议"六部分的 Markdown 报告，可下载。
4. **知识库文件上传**（`/admin`，需 `ADMIN_TOKEN`）：支持上传 PDF/TXT/Markdown，自动切片、embedding、写入 Chroma。
5. **管理后台**（`/admin`）：查看/删除知识库文档、查看所有用户咨询记录、查看所有已生成报告。

## Demo 账号

- 管理后台：使用 `.env` 中的 `ADMIN_TOKEN` 值作为登录 Token（示例值 `demo-admin-2026`，生产环境请务必修改）。
- 演示用户：运行 `scripts/seed.py` 后会创建 `demo@dutchbusinessnavigator.com`，用于测试数据关联；前端聊天/报告本身无需登录，首次访问会自动创建匿名用户。

## 部署到 Railway（推荐，全托管、按量计费）

先决条件：把本仓库推到一个 GitHub 仓库（私有也可以）。

1. **建 Postgres**：在 Railway 项目里点 "New" → "Database" → "PostgreSQL"，自动生成一个 `DATABASE_URL`（形如 `postgres://user:pass@host:port/db`，代码已做兼容处理，直接原样使用即可，不用手动改 scheme）。
2. **部署后端**：点 "New" → "GitHub Repo" 选中本仓库，设置 **Root Directory 为 `backend`**（Railway 会自动识别 `backend/Dockerfile`）。在该服务的 Variables 里填入：
   - `GEMINI_API_KEY`（以及可选的 `OPENAI_API_KEY` / `GROQ_API_KEY`）
   - `DATABASE_URL` → 用 Railway 提供的变量引用 Postgres 服务的连接串（Railway 支持 `${{Postgres.DATABASE_URL}}` 这种跨服务引用）
   - `ADMIN_TOKEN`、`CORS_ORIGINS`（先填占位符，等前端域名生成后回来改成真实的前端地址）
   - 在该服务的 "Volumes" 里加一个卷，挂载到 `/app/chroma_data`（**这一步不做的话，每次重新部署知识库向量都会丢，得重新跑一次 seed**）
3. **部署前端**：再 "New" → 同一个 GitHub Repo，Root Directory 设为 `frontend`。在 Variables 里设置 `NEXT_PUBLIC_API_BASE_URL` 为后端服务的 Railway 公网域名（例如 `https://xxx-backend.up.railway.app`）——这个值是构建时打包进前端的，改了要重新部署一次才生效。
4. **回填 CORS**：拿到前端的 Railway 域名后，回到后端服务的 `CORS_ORIGINS` 改成该域名，重新部署。
5. **初始化知识库**：装好 Railway CLI 后，在项目里跑：
   ```bash
   railway link          # 关联到你的项目
   railway run --service backend python scripts/seed.py
   ```
   （`init_db.py` 已经在容器启动脚本 `entrypoint.sh` 里自动跑了，不用手动执行。）

费用上 Railway 是按用量计费，MVP 阶段这种小流量、偶尔调用一次 LLM 的场景，一个月大概几美元到十几美元。之后要是决定主打国内用户，可以把整个 `docker-compose.yml` 原样迁到国内云（阿里云/腾讯云的轻量服务器）或加一层 CDN，架构不用改。

**Render** 是几乎等价的替代方案（同样支持从 Dockerfile 部署 + 托管 Postgres），流程类似，如果 Railway 用不惯可以试试。

## 自建 VPS / AWS（需要自己运维）

直接使用根目录的 `docker-compose.yml`：`docker compose up -d --build`，确保开放 80/443 端口并在前面加一层反向代理（Nginx/Caddy）做 TLS 终止；`postgres_data`、`chroma_data` 两个卷要做好定期备份。

## 安全说明

- 所有密钥通过环境变量注入，代码中不出现明文密钥。
- 聊天/报告接口按 IP 做速率限制（`RATE_LIMIT_PER_MINUTE`，基于 `slowapi`）。
- 管理端接口（文档上传/删除、查看全部会话与报告）需要 `X-Admin-Token` 请求头匹配 `ADMIN_TOKEN`，未配置或错误一律拒绝。
- 用户输入不会被拼接为可执行代码；文件上传仅接受 PDF/TXT/Markdown 并做文本提取，不执行上传内容。

## 未来扩展（预留）

微信小程序、支付系统、人工顾问工单系统、房源搜索集成、会计/律师推荐网络、多语言支持（英文/荷兰语）。
