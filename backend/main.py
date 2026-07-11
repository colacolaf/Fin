"""Fin API — FastAPI application with CORS, rate limiting, error handling, all routers."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from auth.router import router as auth_router
from config import settings
from integrations.scheduler import start_scheduler, stop_scheduler
from middleware.error_handler import ErrorHandlerMiddleware
from middleware.rate_limiter import limiter
from routers import debt, execution, integrations, memory, orchestration, portfolio, recommendations, retirement, settings as settings_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fin")

app = FastAPI(title="Fin API", version="0.1.0")

# ── CORS ────────────────────────────────────
origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate limiter ────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Error handler (last added = outermost) ──
app.add_middleware(ErrorHandlerMiddleware)

# ── Health ───────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok"}

# ── Auth router (with per-route rate limits) ─
# ponytail: import existing router, apply limits via decorator in auth module
app.include_router(auth_router, prefix="/api")

# ── Feature routers ─────────────────────────
app.include_router(portfolio.router)
app.include_router(recommendations.router)
app.include_router(debt.router)
app.include_router(retirement.router)
app.include_router(execution.router)
app.include_router(memory.router)
app.include_router(integrations.router)
app.include_router(settings_router.router)
app.include_router(orchestration.router)

# ── Background scheduler ──────────────────────
@app.on_event("startup")
def _startup():
    if settings.fin_env == "local" or settings.alpaca_api_key:
        start_scheduler()


@app.on_event("shutdown")
def _shutdown():
    stop_scheduler()
