import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.errors import register_exception_handlers
from app.logging import configure_logging
from app.middleware.request_logger import RequestLoggerMiddleware
from app.routers import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.started_at = time.time()
    yield


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
    return app


app = create_app()
