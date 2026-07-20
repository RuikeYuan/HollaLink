import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")

    llm_provider: str = "gemini"

    gemini_api_key: str = ""
    gemini_chat_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"

    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4.1-mini"

    groq_api_key: str = ""
    groq_chat_model: str = "llama-3.3-70b-versatile"

    database_url: str = "postgresql+psycopg2://dutch_app:dutch_app@localhost:5432/dutch_business_ai"

    chroma_persist_dir: str = "./chroma_data"

    admin_token: str = "change-me-admin-token"

    cors_origins: str = "http://localhost:3000"
    rate_limit_per_minute: int = 30

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        # Managed Postgres providers (Railway, Render, Heroku-style) hand out
        # "postgres://" or plain "postgresql://" URLs; SQLAlchemy needs the
        # explicit psycopg2 driver in the scheme.
        url = self.database_url
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        if url.startswith("postgresql://"):
            url = "postgresql+psycopg2://" + url[len("postgresql://"):]
        return url


@lru_cache
def get_settings() -> Settings:
    settings = Settings()

    # Pydantic 的环境变量自动推断在某些部署环境（例如 Railway）下可能因为
    # .env 文件路径、大小写或别名等问题而没有按预期生效。这里直接、显式地
    # 读取 DATABASE_URL 环境变量并覆盖默认值，避免应用误用硬编码的
    # localhost 连接串去连接数据库。
    env_database_url = os.environ.get("DATABASE_URL")
    if env_database_url:
        settings.database_url = env_database_url

    return settings
