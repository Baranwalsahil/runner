import traceback

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.logging import get_logger

log = get_logger("errors")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_handler(_request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=jsonable_encoder(
                {
                    "error": "validation_error",
                    "message": "Invalid request",
                    "details": exc.errors(),
                }
            ),
        )

    @app.exception_handler(HTTPException)
    async def http_handler(_request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": "http_error", "message": exc.detail},
        )

    @app.exception_handler(Exception)
    async def fallback_handler(request: Request, exc: Exception):
        log.exception("unhandled_exception", path=request.url.path, exc_type=type(exc).__name__)
        settings = get_settings()
        body = {"error": "server_error", "message": "Internal server error"}
        if settings.node_env != "production":
            body["traceback"] = traceback.format_exc()
        return JSONResponse(status_code=500, content=body)
