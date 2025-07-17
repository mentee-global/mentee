
import re
import logging
import os
from typing import Any, Dict, Optional
from urllib.parse import urlparse, parse_qs, urlencode
from flask import request


class SecureLogFilter:
    
    
    
    SENSITIVE_PATTERNS = [
        
        (r'(?i)(password|pwd|secret|token|key|auth)[\s]*[=:]\s*["\']?([^"\'\s&]+)', r'\1=***MASKED***'),
        (r'(?i)bearer\s+([a-zA-Z0-9\-_\.]+)', r'bearer ***MASKED***'),
        (r'(?i)authorization:\s*([^\s]+)', r'authorization: ***MASKED***'),
        
        
        (r'\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b', r'***@\2'),
        (r'\b(?:\d{4}[-\s]?){3}\d{4}\b', '***CARD***'),
        (r'\b\d{3}-\d{2}-\d{4}\b', '***SSN***'),
        
       
        (r'([?&])(password|pwd|secret|token|key|auth|session|csrf)=([^&\s]*)', r'\1\2=***MASKED***'),
    ]
    
    def sanitize_message(self, message: str) -> str:
       
        if not isinstance(message, str):
            return str(message)
        
        sanitized = message
        for pattern, replacement in self.SENSITIVE_PATTERNS:
            sanitized = re.sub(pattern, replacement, sanitized)
        
        return sanitized
    
    def sanitize_url(self, url: str) -> str:
       
        if not url:
            return url
        
        try:
            parsed = urlparse(url)
            if not parsed.query:
                return url
            
            query_params = parse_qs(parsed.query, keep_blank_values=True)
            sanitized_params = {}
            
            sensitive_params = ['password', 'pwd', 'secret', 'token', 'key', 'auth', 'session', 'csrf']
            
            for key, values in query_params.items():
                if key.lower() in sensitive_params:
                    sanitized_params[key] = ['***MASKED***']
                else:
                    sanitized_params[key] = values
            
            sanitized_query = urlencode(sanitized_params, doseq=True)
            return f"{parsed.scheme}://{parsed.netloc}{parsed.path}?{sanitized_query}"
            
        except Exception:
            return self.sanitize_message(url)



_secure_filter = SecureLogFilter()


def sanitize_for_logging(message: Any) -> str:
   
    return _secure_filter.sanitize_message(str(message))


def get_sanitized_request_info() -> Dict[str, str]:
   
    if not request:
        return {
            'method': 'UNKNOWN',
            'path': 'UNKNOWN',
            'url': 'UNKNOWN',
            'remote_addr': 'UNKNOWN'
        }
    
    return {
        'method': request.method,
        'path': request.path,
        'url': _secure_filter.sanitize_url(request.url),
        'remote_addr': request.remote_addr or 'UNKNOWN'
    }


def secure_log_request(app_logger, response):
   
    try:
        req_info = get_sanitized_request_info()
        status_code = response.status_code if response else 'UNKNOWN'
        
        if response and hasattr(response, 'status_code') and response.status_code >= 400:
           
            app_logger.debug(
                "REQUEST_ERROR: %s %s %s from %s", 
                req_info['method'], 
                req_info['path'], 
                status_code,
                req_info['remote_addr']
            )
        else:
            
            app_logger.debug(
                "REQUEST_SUCCESS: %s %s %s from %s", 
                req_info['method'], 
                req_info['path'], 
                status_code,
                req_info['remote_addr']
            )
    except Exception as e:
        
        if app_logger:
            app_logger.error(f"LOGGING_ERROR: {sanitize_for_logging(str(e))}")


def secure_log_security_event(logger, event_type: str, message: str, **kwargs):
    
    try:
        req_info = get_sanitized_request_info()
        sanitized_kwargs = {k: sanitize_for_logging(v) for k, v in kwargs.items()}
        
        log_message = f"SECURITY_EVENT[{event_type}]: {sanitize_for_logging(message)} from {req_info['remote_addr']}"
        if sanitized_kwargs:
            log_message += f" - Details: {sanitized_kwargs}"
        
        logger.warning(log_message)
    except Exception as e:
        logger.error(f"SECURITY_LOGGING_ERROR: {sanitize_for_logging(str(e))}")



def ensure_logs_directory():
    
    logs_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir, mode=0o750)  
    return logs_dir
