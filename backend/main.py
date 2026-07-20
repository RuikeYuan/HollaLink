from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from api import admin, calculator, chat, documents, reports
from config import get_settings
from rate_limit import limiter

settings = get_settings()

app = FastAPI(title="荷兰开店通 API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(calculator.router)
app.include_router(reports.router)
app.include_router(documents.router)
app.include_router(admin.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "llm_provider": settings.llm_provider}
