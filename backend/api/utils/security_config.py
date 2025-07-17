
TOKEN_SECURITY_CONFIG = {
    
    "max_token_age_seconds": 24 * 60 * 60,
    
    
    "clock_skew_tolerance_seconds": 5 * 60,
    
    
    "enable_additional_validation": True,
    
   
    "enable_token_revocation": True,
    
   
    "admin_bypass_min_role": 0,
}


ROLE_HIERARCHY = {
    "ADMIN": 0,      
    "MODERATOR": 1,
    "SUPPORT": 2,
    "MENTOR": 3,
    "PARTNER": 4,
    "MENTEE": 5,     
    "GUEST": 6,     
    "HUB": 7,       
}


SECURITY_LOGGING = {
    "log_authentication_failures": True,
    "log_authorization_failures": True,
    "log_token_revocations": True,
    "log_suspicious_activity": True,
}


RATE_LIMITING = {
    "enable_rate_limiting": True,
    "max_auth_attempts_per_minute": 10,
    "max_token_validations_per_minute": 100,
    "lockout_duration_minutes": 15,
}


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
}

def get_role_level(role_name: str) -> int:
    
    return ROLE_HIERARCHY.get(role_name.upper(), 999)

def has_sufficient_privilege(user_role: int, required_role: int) -> bool:
    
    return user_role <= required_role
