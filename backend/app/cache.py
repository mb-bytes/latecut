import time
from typing import Optional, Dict, Any

class CatchupCache:
    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        entry = self._store.get(key)
        if not entry:
            return None
        if time.time() > entry["expires_at"]:
            del self._store[key]
            return None
        return entry["payload"]

    def set(self, key: str, payload: Dict[str, Any], ttl_seconds: int = 60):
        self._store[key] = {
            "payload": payload,
            "expires_at": time.time() + ttl_seconds
        }

catchup_cache = CatchupCache()
