import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.cache.redis_client import close_cache
from app.config import get_settings
from app.db.pool import close_pool, get_pool
from app.errors import register_exception_handlers
from app.logging import configure_logging
from app.middleware.request_logger import RequestLoggerMiddleware
from app.routers import auth, health, leaderboard, runs, territory


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.started_at = time.time()
    try:
        app.state.db_pool = await get_pool()
    except Exception:
        app.state.db_pool = None
    yield
    await close_pool()
    await close_cache()


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(production=settings.node_env == "production")

    app = FastAPI(title="Territory Run API", version=settings.version, lifespan=lifespan)
    app.state.started_at = time.time()

    allowed_origins = ["http://localhost:5173"]
    if settings.frontend_url:
        allowed_origins.append(settings.frontend_url)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestLoggerMiddleware)
    register_exception_handlers(app)

    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(runs.router)
    app.include_router(territory.router)
    app.include_router(leaderboard.router)
    return app


app = create_app()
