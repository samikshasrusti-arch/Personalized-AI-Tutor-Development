from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api import topics, learn, practice, quiz, progress
from app.db.database import init_db
from app.core.config import settings

# Initialize SQLite tables on startup
init_db()

app = FastAPI(
    title="AI Tutor API",
    description="Personalized Python learning assistant powered by Groq.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(topics.router,   prefix="/api/topics",   tags=["Topics"])
app.include_router(learn.router,    prefix="/api/learn",    tags=["Learn"])
app.include_router(practice.router, prefix="/api/practice", tags=["Practice"])
app.include_router(quiz.router,     prefix="/api/quiz",     tags=["Quiz"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "AI Tutor backend is running.",
        "model": settings.groq_model,
        "ai_configured": bool(settings.groq_api_key),
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
