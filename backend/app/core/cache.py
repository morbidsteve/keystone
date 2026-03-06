"""Redis caching layer for expensive queries."""

import json

import redis.asyncio as aioredis

from app.config import settings

_redis = None


async def get_redis():
    """Get or create the global async Redis connection."""
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def cache_get(key: str):
    """Get a value from cache, returning parsed JSON or None."""
    r = await get_redis()
    val = await r.get(key)
    return json.loads(val) if val else None


async def cache_set(key: str, value, ttl: int = 30):
    """Set a value in cache with a TTL in seconds."""
    r = await get_redis()
    await r.set(key, json.dumps(value, default=str), ex=ttl)


async def cache_delete(pattern: str):
    """Delete all keys matching a glob pattern."""
    r = await get_redis()
    keys = []
    async for key in r.scan_iter(match=pattern):
        keys.append(key)
    if keys:
        await r.delete(*keys)
