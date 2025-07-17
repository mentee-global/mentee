import time
from flask import request, g, current_app
from functools import wraps
from api.core import logger
from api.utils.security_config import SECURITY_HEADERS, SECURITY_LOGGING

def add_security_headers(response):
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    
    if 'Server' in response.headers:
        del response.headers['Server']
    
    return response

def security_middleware(app):
    @app.after_request
    def apply_security_headers(response):
        return add_security_headers(response)
    
    @app.before_request
    def security_checks():
        if SECURITY_LOGGING["log_suspicious_activity"]:
            user_agent = request.headers.get('User-Agent', '').lower()
            if any(pattern in user_agent for pattern in ['sqlmap', 'nikto', 'nmap', 'dirb', 'burp', 'owasp']):
                from api.utils.secure_logging import log_security_warning
                log_security_warning(
                    "Suspicious user agent detected", 
                    attack_type="recon_tools",
                    user_agent_pattern="security_scanner"
                )
            
            
            for param in request.args.values():
                if any(pattern in param.lower() for pattern in ["'", "union", "select", "drop", "delete", "insert", "update", "exec", "script"]):
                    from api.utils.secure_logging import log_security_warning
                    log_security_warning(
                        "Potential SQL injection attempt", 
                        attack_type="sql_injection",
                        parameter_type="url_params"
                    )
            
            
            for param in request.args.values():
                if any(pattern in param for pattern in ["$where", "$ne", "$gt", "$regex", "$exists"]):
                    from api.utils.secure_logging import log_security_warning
                    log_security_warning(
                        "Potential NoSQL injection attempt", 
                        attack_type="nosql_injection",
                        parameter_type="url_params"
                    )
            
            for param in request.args.values():
                if any(pattern in param.lower() for pattern in ["<script", "javascript:", "vbscript:", "onload=", "onerror="]):
                    from api.utils.secure_logging import log_security_warning
                    log_security_warning(
                        "Potential XSS attempt", 
                        attack_type="xss",
                        parameter_type="url_params"
                    )
            
            if '../' in request.path or '..\\' in request.path or '%2e%2e' in request.path:
                from api.utils.secure_logging import log_security_warning
                log_security_warning(
                    "Path traversal attempt", 
                    attack_type="path_traversal",
                    path_indicators="directory_traversal"
                )
            
            if request.content_type and 'multipart/form-data' in request.content_type:
                if request.content_length and request.content_length > 50 * 1024 * 1024:
                    from api.utils.secure_logging import log_security_warning
                    log_security_warning(
                        "Large file upload attempt", 
                        attack_type="file_upload",
                        content_length=request.content_length
                    )
        
        if request.method in ['POST', 'PUT', 'PATCH'] and request.path.startswith('/api/'):
            if not request.content_type:
                from api.utils.secure_logging import log_security_warning
                log_security_warning(
                    "Missing Content-Type header", 
                    validation_type="content_type",
                    http_method=request.method
                )
            elif 'application/json' in request.content_type:
                try:
                    if request.content_length and request.content_length > 1024 * 1024:
                        from api.utils.secure_logging import log_security_warning
                        log_security_warning(
                            "Large JSON payload", 
                            validation_type="payload_size",
                            content_length=request.content_length
                        )
                except Exception:
                    pass
        
        g.request_start_time = time.time()

def require_https(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_secure and not request.headers.get('X-Forwarded-Proto') == 'https':
            if current_app.config.get('ENV') == 'production':
                return {"error": "HTTPS required"}, 403
        return f(*args, **kwargs)
    return decorated_function

def log_security_event(event_type: str, details: dict, user_id: str = None):
    log_message = f"Security Event: {event_type}"
    if user_id:
        log_message += f" | User: {user_id}"
    
    log_message += f" | Details: {details}"
    log_message += f" | IP: {request.remote_addr if request else 'N/A'}"
    
    logger.warning(log_message)
