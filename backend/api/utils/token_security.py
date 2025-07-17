import time
from typing import Dict, Set, Optional
from threading import Lock
from api.core import logger
from api.utils.security_config import TOKEN_SECURITY_CONFIG

class TokenManager:
    def __init__(self):
        self._revoked_tokens: Set[str] = set()
        self._user_sessions: Dict[str, Set[str]] = {}
        self._lock = Lock()

    def revoke_token(self, token_id: str, user_id: Optional[str] = None) -> bool:
        with self._lock:
            self._revoked_tokens.add(token_id)
            if user_id and user_id in self._user_sessions:
                self._user_sessions[user_id].discard(token_id)
            logger.info(f"Token {token_id[:8]}... revoked for user {user_id}")
            return True

    def revoke_all_user_tokens(self, user_id: str) -> int:
        with self._lock:
            if user_id not in self._user_sessions:
                return 0

            user_tokens = self._user_sessions[user_id].copy()
            for token_id in user_tokens:
                self._revoked_tokens.add(token_id)

            revoked_count = len(user_tokens)
            self._user_sessions[user_id].clear()

            logger.info(f"Revoked {revoked_count} tokens for user {user_id}")
            return revoked_count

    def is_token_revoked(self, token_id: str) -> bool:
        with self._lock:
            return token_id in self._revoked_tokens

    def register_token(self, token_id: str, user_id: str) -> None:
        with self._lock:
            if user_id not in self._user_sessions:
                self._user_sessions[user_id] = set()
            self._user_sessions[user_id].add(token_id)

    def cleanup_expired_tokens(self, max_age_seconds: int = 86400) -> int:
        return 0


token_manager = TokenManager()


def extract_token_id(claims: Dict) -> str:
    user_id = claims.get('uid', '')
    issued_at = claims.get('iat', int(time.time()))
    return f"{user_id}_{issued_at}"


def validate_token_security(claims: Dict) -> tuple[bool, Optional[str]]:
    if not TOKEN_SECURITY_CONFIG["enable_additional_validation"]:
        return True, None

    required_claims = ['uid', 'iat', 'exp']
    for claim in required_claims:
        if claim not in claims:
            return False, f"Missing required claim: {claim}"

    issued_at = claims.get('iat', 0)
    current_time = int(time.time())
    token_age = current_time - issued_at

    max_token_age = TOKEN_SECURITY_CONFIG["max_token_age_seconds"]
    if token_age > max_token_age:
        return False, "Token is too old"

    clock_tolerance = TOKEN_SECURITY_CONFIG["clock_skew_tolerance_seconds"]
    if issued_at > current_time + clock_tolerance:
        return False, "Token issued in the future"

    return True, None
