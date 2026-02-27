"""
HTTP middleware for request logging, metrics, and tracing.
"""

import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import get_logger, log_context, clear_log_context
from app.core.metrics import (
    HTTP_REQUESTS_TOTAL,
    HTTP_REQUEST_DURATION_SECONDS,
    HTTP_REQUESTS_IN_PROGRESS,
)

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request logging, metrics, and request-ID tracing."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        log_context(request_id=request_id, method=request.method, path=request.url.path)

        endpoint = request.url.path
        method = request.method

        HTTP_REQUESTS_IN_PROGRESS.labels(method=method, endpoint=endpoint).inc()
        start_time = time.perf_counter()

        try:
            response = await call_next(request)
            duration = time.perf_counter() - start_time

            HTTP_REQUESTS_TOTAL.labels(
                method=method, endpoint=endpoint, status_code=response.status_code
            ).inc()
            HTTP_REQUEST_DURATION_SECONDS.labels(method=method, endpoint=endpoint).observe(duration)

            if not (settings.is_production and endpoint == "/health"):
                logger.info(
                    "Request completed",
                    status_code=response.status_code,
                    duration_ms=round(duration * 1000, 2),
                )

            response.headers["X-Request-ID"] = request_id
            return response

        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.error("Request failed", error=str(e), duration_ms=round(duration * 1000, 2))
            raise

        finally:
            HTTP_REQUESTS_IN_PROGRESS.labels(method=method, endpoint=endpoint).dec()
            clear_log_context()
