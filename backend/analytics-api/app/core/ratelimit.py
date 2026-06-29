import logging
from datetime import timedelta
from functools import lru_cache
from typing import Callable

from fastapi import HTTPException, Request, status
import redis

from app.core.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_redis_client() -> redis.Redis | None:
    try:
        return redis.from_url(settings.REDIS_URL, decode_responses=True)
    except Exception as e:
        logger.error("Failed to create Redis client for rate limiting: %s", e)
        return None


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    ip = forwarded.split(",")[0].strip() if forwarded else request.client.host if request.client else "unknown"
    return ip or "unknown"


def rate_limit(max_requests: int, window_seconds: int) -> Callable:
    """FastAPI dependency factory that enforces Redis-backed per-IP rate limits."""

    def dependency(request: Request) -> None:
        rdb = _get_redis_client()
        if rdb is None:
            return

        ip = _client_key(request)
        key = f"ratelimit:analytics:{ip}:{request.url.path}"

        try:
            current = rdb.incr(key)
            if current == 1:
                rdb.expire(key, timedelta(seconds=window_seconds))
        except Exception as e:
            logger.error("Rate limiter Redis error: %s", e)
            return

        if current > max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="rate limit exceeded, try again later",
            )

    return dependency
