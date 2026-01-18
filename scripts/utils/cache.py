"""
Cache utility for API responses.

Provides file-based caching with TTL to reduce redundant API calls
and improve performance.
"""

import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)


class CacheManager:
    """File-based cache manager with TTL support."""

    def __init__(self, cache_dir: Path, default_ttl_hours: float = 24):
        """
        Initialize cache manager.

        Args:
            cache_dir: Directory to store cache files
            default_ttl_hours: Default time-to-live in hours
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.default_ttl_hours = default_ttl_hours

    def _get_cache_key(self, key: str) -> str:
        """Generate a safe cache filename from key."""
        return hashlib.md5(key.encode()).hexdigest()

    def _get_cache_path(self, key: str) -> Path:
        """Get the cache file path for a key."""
        return self.cache_dir / f"{self._get_cache_key(key)}.json"

    def get(self, key: str, ttl_hours: Optional[float] = None) -> Optional[Any]:
        """
        Get a value from cache if it exists and is not expired.

        Args:
            key: Cache key
            ttl_hours: Time-to-live in hours (uses default if not specified)

        Returns:
            Cached value or None if not found/expired
        """
        ttl = ttl_hours if ttl_hours is not None else self.default_ttl_hours
        cache_path = self._get_cache_path(key)

        if not cache_path.exists():
            return None

        try:
            # Check if cache is expired
            mtime = cache_path.stat().st_mtime
            age_hours = (time.time() - mtime) / 3600

            if age_hours > ttl:
                logger.debug(f"Cache expired for key: {key[:50]}...")
                cache_path.unlink()
                return None

            # Read cached value
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.debug(f"Cache hit for key: {key[:50]}...")
                return data.get("value")

        except Exception as e:
            logger.warning(f"Error reading cache for {key[:50]}: {e}")
            return None

    def set(self, key: str, value: Any) -> bool:
        """
        Store a value in cache.

        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)

        Returns:
            True if successful, False otherwise
        """
        cache_path = self._get_cache_path(key)

        try:
            data = {
                "key": key,
                "value": value,
                "cached_at": time.time(),
            }
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.debug(f"Cached value for key: {key[:50]}...")
            return True
        except Exception as e:
            logger.warning(f"Error caching value for {key[:50]}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete a cache entry."""
        cache_path = self._get_cache_path(key)
        try:
            if cache_path.exists():
                cache_path.unlink()
                return True
            return False
        except Exception:
            return False

    def clear(self) -> int:
        """Clear all cache entries. Returns count of deleted files."""
        count = 0
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cache_file.unlink()
                count += 1
            except Exception:
                pass
        return count

    def get_stats(self) -> dict:
        """Get cache statistics."""
        total_size = 0
        file_count = 0
        expired_count = 0

        for cache_file in self.cache_dir.glob("*.json"):
            file_count += 1
            total_size += cache_file.stat().st_size

            # Check if expired
            age_hours = (time.time() - cache_file.stat().st_mtime) / 3600
            if age_hours > self.default_ttl_hours:
                expired_count += 1

        return {
            "total_files": file_count,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "expired_files": expired_count,
        }


# Global cache instance
_cache_instance: Optional[CacheManager] = None


def get_cache_manager(cache_dir: Optional[Path] = None) -> CacheManager:
    """Get or create the global cache manager instance."""
    global _cache_instance
    if _cache_instance is None:
        from scripts.config import CACHE_DIR
        _cache_instance = CacheManager(cache_dir or CACHE_DIR)
    return _cache_instance


def cached_api_call(
    url: str,
    fetch_func: Callable[[], Any],
    ttl_hours: float = 24,
    cache_dir: Optional[Path] = None
) -> Any:
    """
    Decorator-like function for caching API calls.

    Args:
        url: URL or unique key for the API call
        fetch_func: Function to call if cache miss
        ttl_hours: Cache TTL in hours
        cache_dir: Optional custom cache directory

    Returns:
        Cached or fresh response
    """
    cache = get_cache_manager(cache_dir)

    # Try to get from cache
    cached_value = cache.get(url, ttl_hours)
    if cached_value is not None:
        return cached_value

    # Cache miss - fetch fresh data
    result = fetch_func()

    # Store in cache
    if result is not None:
        cache.set(url, result)

    return result
