
import re
import logging
import json
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse, parse_qs, urlencode
from flask import request, g

class SecureLoggerFilter:
   
    
    
    SENSITIVE_PATTERNS = [
        
        (r'(?i)(token|key|secret|password|auth)[\s]*[=:]\s*["\']?([^"\'\s&]+)', r'\1=***REDACTED***'),
        (r'(?i)bearer\s+([a-zA-Z0-9\-_\.]+)', r'bearer ***REDACTED***'),
        (r'(?i)authorization:\s*([^\s]+)', r'authorization: ***REDACTED***'),
        
       
        (r'\b(?:\d{4}[-\s]?){3}\d{4}\b', '***CREDIT_CARD***'),
        
        (r'\b\d{3}-\d{2}-\d{4}\b', '***SSN***'),
        
        (r'\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b', r'***@\2'),
        
        (r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b', r'***-***-\3'),
        
        
        (r'(?i)([?&])(password|pwd|secret|token|key|auth|session|csrf)=([^&\s]*)', r'\1\2=***REDACTED***'),
        
        
        (r'(?i)"(password|secret|token|key|auth|session|csrf|credit_card|ssn)"\s*:\s*"[^"]*"', r'"\1": "***REDACTED***"'),
        
        
        (r'\b\d{9,18}\b', '***ACCOUNT_NUMBER***'),
    ]
    
  
    SENSITIVE_URL_PARAMS = [
        'password', 'pwd', 'secret', 'token', 'key', 'auth', 'session', 
        'csrf', 'api_key', 'access_token', 'refresh_token', 'jwt',
        'credit_card', 'ssn', 'social_security', 'bank_account'
    ]
    
   
    SENSITIVE_CONTENT_TYPES = [
        'application/pdf', 'image/', 'audio/', 'video/', 'application/octet-stream'
    ]

    def sanitize_url(self, url: str) -> str:
        
        if not url:
            return url
        
        try:
            parsed = urlparse(url)
            if not parsed.query:
                return url
            
            query_params = parse_qs(parsed.query, keep_blank_values=True)
            sanitized_params = {}
            
            for key, values in query_params.items():
                if key.lower() in self.SENSITIVE_URL_PARAMS:
                    sanitized_params[key] = ['***REDACTED***']
                else:
                    
                    sanitized_values = []
                    for value in values:
                        sanitized_value = self.sanitize_text(str(value))
                        sanitized_values.append(sanitized_value)
                    sanitized_params[key] = sanitized_values
            
            
            sanitized_query = urlencode(sanitized_params, doseq=True)
            sanitized_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            if sanitized_query:
                sanitized_url += f"?{sanitized_query}"
            if parsed.fragment:
                sanitized_url += f"#{parsed.fragment}"
            
            return sanitized_url
            
        except Exception:
            
            return self.sanitize_text(url)

    def sanitize_text(self, text: str) -> str:
        
        if not isinstance(text, str):
            return str(text)
        
        sanitized = text
        for pattern, replacement in self.SENSITIVE_PATTERNS:
            sanitized = re.sub(pattern, replacement, sanitized)
        
        return sanitized

    def sanitize_response_data(self, response_data: bytes, content_type: str = None) -> str:
        
        if not response_data:
            return ""
        
        
        if content_type:
            for sensitive_type in self.SENSITIVE_CONTENT_TYPES:
                if sensitive_type in content_type.lower():
                    return f"***BINARY_CONTENT_{content_type}***"
        
        try:
            
            text_data = response_data.decode('utf-8', errors='ignore')
            
            
            if len(text_data) > 1000:
                text_data = text_data[:1000] + "...[TRUNCATED]"
            
            
            try:
                json_data = json.loads(text_data)
                sanitized_json = self.sanitize_json_object(json_data)
                return json.dumps(sanitized_json, separators=(',', ':'))
            except (json.JSONDecodeError, TypeError):
                
                return self.sanitize_text(text_data)
                
        except Exception:
            return "***BINARY_DATA***"

    def sanitize_json_object(self, obj: Any) -> Any:
        
        if isinstance(obj, dict):
            sanitized = {}
            for key, value in obj.items():
                if key.lower() in self.SENSITIVE_URL_PARAMS:
                    sanitized[key] = "***REDACTED***"
                else:
                    sanitized[key] = self.sanitize_json_object(value)
            return sanitized
        elif isinstance(obj, list):
            return [self.sanitize_json_object(item) for item in obj]
        elif isinstance(obj, str):
            return self.sanitize_text(obj)
        else:
            return obj

    def sanitize_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        
        sanitized_headers = {}
        sensitive_headers = [
            'authorization', 'cookie', 'x-api-key', 'x-auth-token',
            'x-csrf-token', 'x-session-id'
        ]
        
        for key, value in headers.items():
            if key.lower() in sensitive_headers:
                sanitized_headers[key] = "***REDACTED***"
            else:
                sanitized_headers[key] = self.sanitize_text(str(value))
        
        return sanitized_headers


class SecureRequestLogger:
    
    
    def __init__(self):
        self.filter = SecureLoggerFilter()
        self.logger = logging.getLogger('secure_request')
        self.logger.setLevel(logging.INFO)
        
       
        import os
        from logging.handlers import RotatingFileHandler
        
        log_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        log_file = os.path.join(log_dir, 'secure_requests.log')
        handler = RotatingFileHandler(
            log_file, 
            maxBytes=10*1024*1024,  
            backupCount=5
        )
        handler.setLevel(logging.INFO)
        
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        
        if not self.logger.handlers:
            self.logger.addHandler(handler)

    def log_request(self, response, include_response_data: bool = True):
        
        try:
            
            method = request.method if request else 'UNKNOWN'
            path = request.path if request else 'UNKNOWN'
            remote_addr = request.remote_addr if request else 'UNKNOWN'
            status_code = response.status_code if response else 'UNKNOWN'
            
            
            url = request.url if request else 'UNKNOWN'
            sanitized_url = self.filter.sanitize_url(url)
            
            
            log_entry = {
                'timestamp': self._get_timestamp(),
                'method': method,
                'path': path,
                'sanitized_url': sanitized_url,
                'status_code': status_code,
                'remote_addr': remote_addr,
                'user_id': getattr(g, 'user_id', 'anonymous'),
                'user_agent': self.filter.sanitize_text(
                    request.headers.get('User-Agent', 'unknown') if request else 'unknown'
                )
            }
            
            
            if (include_response_data and response and 
                hasattr(response, 'status_code') and response.status_code >= 400):
                
                content_type = response.headers.get('Content-Type', '') if response else ''
                response_data = response.get_data() if hasattr(response, 'get_data') else b''
                
                log_entry['response_data'] = self.filter.sanitize_response_data(
                    response_data, content_type
                )
                log_entry['content_type'] = content_type
            
            
            if status_code >= 400:
                self.logger.warning(f"REQUEST_ERROR: {json.dumps(log_entry, separators=(',', ':'))}")
            else:
                self.logger.info(f"REQUEST_SUCCESS: {json.dumps(log_entry, separators=(',', ':'))}")
                
        except Exception as e:
            
            self.logger.error(f"LOGGING_ERROR: Failed to log request securely: {str(e)}")

    def log_security_event(self, event_type: str, details: Dict[str, Any], severity: str = 'warning'):
        
        try:
            sanitized_details = {}
            for key, value in details.items():
                if isinstance(value, str):
                    sanitized_details[key] = self.filter.sanitize_text(value)
                elif isinstance(value, dict):
                    sanitized_details[key] = self.filter.sanitize_json_object(value)
                else:
                    sanitized_details[key] = value
            
            log_entry = {
                'timestamp': self._get_timestamp(),
                'event_type': event_type,
                'details': sanitized_details,
                'remote_addr': request.remote_addr if request else 'unknown',
                'user_id': getattr(g, 'user_id', 'anonymous')
            }
            
            log_message = f"SECURITY_EVENT: {json.dumps(log_entry, separators=(',', ':'))}"
            
            if severity == 'error':
                self.logger.error(log_message)
            elif severity == 'warning':
                self.logger.warning(log_message)
            else:
                self.logger.info(log_message)
                
        except Exception as e:
            self.logger.error(f"SECURITY_LOGGING_ERROR: {str(e)}")

    def _get_timestamp(self) -> str:
       
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'


# Global instance
secure_logger = SecureRequestLogger()


def secure_after_request(response):
   
    secure_logger.log_request(response, include_response_data=True)
    return response


def log_security_warning(message: str, **kwargs):
   
    secure_logger.log_security_event('security_warning', {'message': message, **kwargs}, 'warning')


def log_security_error(message: str, **kwargs):
    
    secure_logger.log_security_event('security_error', {'message': message, **kwargs}, 'error')
