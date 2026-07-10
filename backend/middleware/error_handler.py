"""Global error handler — catches unhandled exceptions, returns JSON, hides internals."""
import traceback
import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("fin.error_handler")


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception:
            logger.error("Unhandled exception on %s %s\n%s", request.method, request.url.path, traceback.format_exc())
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )