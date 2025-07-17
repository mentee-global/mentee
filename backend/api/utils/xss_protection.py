import logging
import re
from typing import Any, Dict, List, Optional, Union
from functools import wraps
from flask import request, current_app
from markupsafe import Markup, escape
import bleach
from bleach import clean
from bleach.linkifier import Linker

logger = logging.getLogger(__name__)

class XSSProtection:
    def __init__(self, app=None):
        self.app = app
        self.allowed_tags = self.get_default_allowed_tags()
        self.allowed_attributes = self.get_default_allowed_attributes()
        self.allowed_protocols = ['http', 'https', 'mailto']
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        self.app = app
        self.allowed_tags = app.config.get('XSS_ALLOWED_TAGS', self.allowed_tags)
        self.allowed_attributes = app.config.get('XSS_ALLOWED_ATTRIBUTES', self.allowed_attributes)
        self.allowed_protocols = app.config.get('XSS_ALLOWED_PROTOCOLS', self.allowed_protocols)
        app.jinja_env.filters['sanitize'] = self.sanitize_html
        app.jinja_env.filters['safe_markdown'] = self.safe_markdown
        app.jinja_env.globals['sanitize_output'] = self.sanitize_output
        logger.info("XSS protection initialized successfully")

    def get_default_allowed_tags(self) -> List[str]:
        return [
            'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'code', 'pre',
            'a', 'img'
        ]

    def get_default_allowed_attributes(self) -> Dict[str, List[str]]:
        return {
            'a': ['href', 'title', 'target'],
            'img': ['src', 'alt', 'title', 'width', 'height'],
            '*': ['class', 'id']
        }

    def sanitize_html(self, content: str, strict: bool = False) -> str:
        if not content:
            return ""
        if strict:
            allowed_tags = ['p', 'br', 'strong', 'em']
            allowed_attributes = {}
        else:
            allowed_tags = self.allowed_tags
            allowed_attributes = self.allowed_attributes
        cleaned = clean(
            content,
            tags=allowed_tags,
            attributes=allowed_attributes,
            protocols=self.allowed_protocols,
            strip=True,
            strip_comments=True
        )
        cleaned = self._remove_dangerous_patterns(cleaned)
        return cleaned

    def sanitize_output(self, content: Any) -> str:
        if content is None:
            return ""
        content_str = str(content)
        if not self._looks_like_html(content_str):
            return escape(content_str)
        return self.sanitize_html(content_str)

    def safe_markdown(self, content: str) -> Markup:
        try:
            import markdown
            from markdown.extensions import codehilite, fenced_code
            md = markdown.Markdown(
                extensions=['fenced_code', 'codehilite', 'tables'],
                extension_configs={
                    'codehilite': {
                        'css_class': 'highlight',
                        'use_pygments': False
                    }
                }
            )
            html = md.convert(content)
            safe_html = self.sanitize_html(html)
            return Markup(safe_html)
        except ImportError:
            logger.warning("Markdown library not available, using basic sanitization")
            return Markup(self.sanitize_html(content))

    def _looks_like_html(self, content: str) -> bool:
        html_pattern = re.compile(r'<[^>]+>')
        return bool(html_pattern.search(content))

    def _remove_dangerous_patterns(self, content: str) -> str:
        content = re.sub(r'javascript:', '', content, flags=re.IGNORECASE)
        content = re.sub(r'vbscript:', '', content, flags=re.IGNORECASE)
        content = re.sub(r'data:', '', content, flags=re.IGNORECASE)
        content = re.sub(r'\bon\w+\s*=', '', content, flags=re.IGNORECASE)
        content = re.sub(r'expression\s*\(', '', content, flags=re.IGNORECASE)
        return content

    def validate_user_input(self, data: Union[str, Dict, List]) -> Union[str, Dict, List]:
        if isinstance(data, str):
            return self.sanitize_html(data, strict=True)
        elif isinstance(data, dict):
            return {key: self.validate_user_input(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self.validate_user_input(item) for item in data]
        else:
            return data

xss_protection = XSSProtection()

def sanitize_input(strict: bool = False):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                if request.is_json and request.get_json():
                    original_data = request.get_json()
                    sanitized_data = xss_protection.validate_user_input(original_data)
                    request._cached_json = (sanitized_data, True)
                if request.form:
                    for key in request.form.keys():
                        values = request.form.getlist(key)
                        sanitized_values = [
                            xss_protection.sanitize_html(value, strict=strict) 
                            for value in values
                        ]
                        if any(val != orig for val, orig in zip(sanitized_values, values)):
                            logger.info(f"Sanitized form input for field: {key}")
                return f(*args, **kwargs)
            except Exception as e:
                logger.error(f"Error in input sanitization: {str(e)}")
                return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_clean_input(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            if request.is_json and request.get_json():
                data = request.get_json()
                if not _is_input_clean(data):
                    from api.utils.simple_secure_logging import secure_log_security_event
                    secure_log_security_event(
                        logger, "XSS_DETECTION", 
                        "Malicious input detected in JSON data"
                    )
                    from api.core import create_response
                    return create_response(
                        status=400,
                        message="Invalid input detected"
                    )
            for value in request.form.values():
                if not _is_input_clean(value):
                    from api.utils.simple_secure_logging import secure_log_security_event
                    secure_log_security_event(
                        logger, "XSS_DETECTION", 
                        "Malicious form input detected"
                    )
                    from api.core import create_response
                    return create_response(
                        status=400,
                        message="Invalid form input detected"
                    )
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in input validation: {str(e)}")
            return f(*args, **kwargs)
    return decorated_function

def _is_input_clean(data: Any) -> bool:
    if isinstance(data, str):
        return _check_string_for_xss(data)
    elif isinstance(data, dict):
        return all(_is_input_clean(value) for value in data.values())
    elif isinstance(data, list):
        return all(_is_input_clean(item) for item in data)
    else:
        return True

def _check_string_for_xss(text: str) -> bool:
    dangerous_patterns = [
        r'<script[^>]*>',
        r'javascript:',
        r'vbscript:',
        r'on\w+\s*=',
        r'expression\s*\(',
        r'<iframe[^>]*>',
        r'<object[^>]*>',
        r'<embed[^>]*>',
        r'<link[^>]*>',
        r'<meta[^>]*>',
        r'<style[^>]*>.*?</style>',
        r'<img[^>]*src\s*=\s*["\']?javascript:',
    ]
    for pattern in dangerous_patterns:
        if re.search(pattern, text, re.IGNORECASE | re.DOTALL):
            return False
    return True

def configure_xss_protection(app):
    xss_protection.init_app(app)
    @app.template_global()
    def safe_output(content):
        return xss_protection.sanitize_output(content)
    @app.after_request
    def add_xss_headers(response):
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        return response
    @app.before_request
    def validate_request_input():
        try:
            for param_value in request.args.values():
                if not _check_string_for_xss(param_value):
                    from api.utils.simple_secure_logging import secure_log_security_event
                    secure_log_security_event(
                        logger, "XSS_DETECTION", 
                        "XSS pattern detected in URL parameters"
                    )
            dangerous_headers = ['X-Forwarded-For', 'User-Agent', 'Referer']
            for header_name in dangerous_headers:
                header_value = request.headers.get(header_name, '')
                if header_value and not _check_string_for_xss(header_value):
                    from api.utils.simple_secure_logging import secure_log_security_event
                    secure_log_security_event(
                        logger, "XSS_DETECTION", 
                        f"XSS pattern detected in {header_name} header"
                    )
        except Exception as e:
            logger.error(f"Error in request XSS validation: {str(e)}")
    logger.info("XSS protection configured for application")

XSS_CONFIG = {
    'development': {
        'XSS_ALLOWED_TAGS': [
            'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'blockquote', 'code', 'pre', 'a', 'img'
        ],
        'XSS_ALLOWED_ATTRIBUTES': {
            'a': ['href', 'title', 'target'],
            'img': ['src', 'alt', 'title', 'width', 'height'],
            '*': ['class', 'id']
        }
    },
    'production': {
        'XSS_ALLOWED_TAGS': [
            'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
            'blockquote', 'code', 'a'
        ],
        'XSS_ALLOWED_ATTRIBUTES': {
            'a': ['href', 'title'],
            '*': ['class']
        }
    },
    'testing': {
        'XSS_ALLOWED_TAGS': [],
        'XSS_ALLOWED_ATTRIBUTES': {}
    }
}

def get_xss_config(environment: str = 'production') -> Dict[str, Any]:
    return XSS_CONFIG.get(environment, XSS_CONFIG['production'])
