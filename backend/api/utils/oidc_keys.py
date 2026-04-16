import os
from functools import lru_cache

from authlib.jose import JsonWebKey


_KEY_PATH_ENV = "OIDC_PRIVATE_KEY_PATH"
_KEY_PEM_ENV = "OIDC_PRIVATE_KEY_PEM"
_KEY_ID_ENV = "OIDC_KEY_ID"
_DEFAULT_KEY_ID = "mentee-oidc-v1"


def _default_pem_path() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.normpath(os.path.join(here, "..", "..", "keys", "oidc-private.pem"))


def _read_pem() -> str:
    env_pem = os.environ.get(_KEY_PEM_ENV)
    if env_pem:
        return env_pem
    path = os.environ.get(_KEY_PATH_ENV) or _default_pem_path()
    with open(path, "r") as fh:
        return fh.read()


@lru_cache(maxsize=1)
def load_private_jwk():
    pem = _read_pem()
    key = JsonWebKey.import_key(pem, {"kty": "RSA", "alg": "RS256", "use": "sig"})
    kid = os.environ.get(_KEY_ID_ENV, _DEFAULT_KEY_ID)
    try:
        key["kid"] = kid
    except Exception:
        data = key.as_dict(is_private=True)
        data["kid"] = kid
        key = JsonWebKey.import_key(data)
    return key


def public_jwks() -> dict:
    jwk = load_private_jwk()
    public = jwk.as_dict(is_private=False)
    public["use"] = "sig"
    public["alg"] = "RS256"
    public["kid"] = os.environ.get(_KEY_ID_ENV, _DEFAULT_KEY_ID)
    return {"keys": [public]}


def private_pem_bytes() -> bytes:
    return _read_pem().encode("utf-8")
