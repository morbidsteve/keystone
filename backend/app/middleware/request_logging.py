import time
import uuid
import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger("request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()

        # Try to get user from auth header (don't import auth deps, just peek at token subject)
        user = "anonymous"
        auth = request.headers.get("authorization", "")
        if auth.startswith("Bearer "):
            try:
                from jose import jwt
                from app.config import settings

                payload = jwt.decode(
                    auth[7:], settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
                )
                user = payload.get("sub", "anonymous")
            except Exception:
                pass

        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "request",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            duration_ms=round(duration_ms, 2),
            user=user,
            client=request.client.host if request.client else "unknown",
        )

        response.headers["X-Request-ID"] = request_id
        return response
