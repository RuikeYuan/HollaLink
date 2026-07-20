from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    llm_provider: str = "gemini"

    gemini_api_key: str = ""
    gemini_chat_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"

    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4.1-mini"

    groq_api_key: str = ""
    groq_chat_model: str = "llama-3.3-70b-versatile"

    database_url: str = Field(
        default="postgresql+psycopg2://dutch_app:dutch_app@localhost:5432/dutch_business_ai",
        validation_alias=AliasChoices("database_url", "DATABASE_URL"),
    )

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
    return Settings()
