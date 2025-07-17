
import os
import base64
import hashlib
import logging
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta
from functools import wraps

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from flask import request, g


logger = logging.getLogger(__name__)

class DataEncryption:
    def __init__(self):
        self.master_key = self._get_or_create_master_key()
        self.fernet = Fernet(self.master_key)
    
    def _get_or_create_master_key(self) -> bytes:
        key_file = os.path.join(os.path.dirname(__file__), '..', '..', 'encryption_key.key')
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            os.makedirs(os.path.dirname(key_file), exist_ok=True)
            with open(key_file, 'wb') as f:
                f.write(key)
            os.chmod(key_file, 0o600)
            logger.info("Generated new encryption key")
            return key
    
    def encrypt_field(self, data: str) -> str:
        if not data:
            return data
        
        try:
            encrypted_data = self.fernet.encrypt(data.encode())
            return base64.b64encode(encrypted_data).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise
    
    def decrypt_field(self, encrypted_data: str) -> str:
        if not encrypted_data:
            return encrypted_data
        
        try:
            decoded_data = base64.b64decode(encrypted_data.encode())
            decrypted_data = self.fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise
    
    def encrypt_object(self, data: Dict[str, Any], sensitive_fields: List[str]) -> Dict[str, Any]:
        encrypted_data = data.copy()
        
        for field in sensitive_fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = self.encrypt_field(str(encrypted_data[field]))
                encrypted_data[f"{field}_encrypted"] = True
        
        return encrypted_data
    
    def decrypt_object(self, data: Dict[str, Any], sensitive_fields: List[str]) -> Dict[str, Any]:
        decrypted_data = data.copy()
        
        for field in sensitive_fields:
            if field in decrypted_data and decrypted_data.get(f"{field}_encrypted"):
                decrypted_data[field] = self.decrypt_field(decrypted_data[field])
                del decrypted_data[f"{field}_encrypted"]
        
        return decrypted_data

class SensitiveDataHandler:
    SENSITIVE_FIELDS = {
        'user_data': [
            'email', 'phone_number', 'date_of_birth', 'social_security',
            'passport_number', 'driver_license', 'address', 'full_address',
            'personal_id', 'bank_account', 'credit_card'
        ],
        'profile_data': [
            'biography', 'personal_statement', 'linkedin', 'website',
            'emergency_contact', 'medical_info', 'financial_info'
        ],
        'communication': [
            'message_content', 'notes', 'comments', 'feedback'
        ]
    }
    
    LOG_MASKED_FIELDS = [
        'password', 'token', 'secret', 'key', 'email', 'phone',
        'ssn', 'credit_card', 'bank_account'
    ]
    
    def __init__(self):
        self.encryption = DataEncryption()
    
    def is_sensitive_field(self, field_name: str) -> bool:
        field_lower = field_name.lower()
        
        for category, fields in self.SENSITIVE_FIELDS.items():
            if field_lower in [f.lower() for f in fields]:
                return True
        
        sensitive_patterns = [
            'email', 'phone', 'address', 'personal', 'private',
            'ssn', 'social', 'passport', 'license', 'id_number'
        ]
        
        return any(pattern in field_lower for pattern in sensitive_patterns)
    
    def mask_sensitive_data(self, data: Union[str, Dict[str, Any]]) -> Union[str, Dict[str, Any]]:
        if isinstance(data, str):
            import re
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            return re.sub(email_pattern, '***@***.***', data)
        
        elif isinstance(data, dict):
            masked_data = {}
            for key, value in data.items():
                if any(pattern in key.lower() for pattern in self.LOG_MASKED_FIELDS):
                    masked_data[key] = '***MASKED***'
                else:
                    masked_data[key] = self.mask_sensitive_data(value) if isinstance(value, (str, dict)) else value
            return masked_data
        
        return data
    
    def sanitize_for_export(self, data: Dict[str, Any], export_level: str = 'basic') -> Dict[str, Any]:
        sanitized_data = data.copy()
        
        if export_level == 'basic':
            sensitive_fields = [
                'social_security', 'passport_number', 'driver_license',
                'bank_account', 'credit_card', 'medical_info'
            ]
            for field in sensitive_fields:
                sanitized_data.pop(field, None)
        
        elif export_level == 'minimal':
            allowed_fields = [
                'id', 'name', 'created_at', 'updated_at', 'status',
                'organization', 'role', 'specializations'
            ]
            sanitized_data = {
                key: value for key, value in sanitized_data.items()
                if key in allowed_fields
            }
        
        return sanitized_data

class DataAccessLogger:
    def __init__(self):
        self.logger = logging.getLogger('data_access')
        self.logger.setLevel(logging.INFO)
        
        log_file = os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'data_access.log')
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        
        handler = logging.FileHandler(log_file)
        handler.setLevel(logging.INFO)
        
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        
        if not self.logger.handlers:
            self.logger.addHandler(handler)
    
    def log_data_access(self, action: str, data_type: str, record_id: str = None,
                       user_id: str = None, sensitive_fields: List[str] = None):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'data_type': data_type,
            'record_id': record_id,
            'user_id': user_id or getattr(g, 'user_id', 'unknown'),
            'ip_address': request.remote_addr if request else 'unknown',
            'user_agent': request.headers.get('User-Agent', 'unknown') if request else 'unknown',
            'sensitive_fields_accessed': sensitive_fields or []
        }
        
        self.logger.info(f"DATA_ACCESS: {log_entry}")
    
    def log_bulk_export(self, export_type: str, record_count: int, export_level: str,
                       user_id: str = None):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': 'BULK_EXPORT',
            'export_type': export_type,
            'record_count': record_count,
            'export_level': export_level,
            'user_id': user_id or getattr(g, 'user_id', 'unknown'),
            'ip_address': request.remote_addr if request else 'unknown'
        }
        
        self.logger.warning(f"BULK_EXPORT: {log_entry}")

class DataProtectionManager:
    def __init__(self):
        self.encryption = DataEncryption()
        self.sensitive_handler = SensitiveDataHandler()
        self.access_logger = DataAccessLogger()
    
    def protect_user_data(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        sensitive_fields = [
            field for field in user_data.keys()
            if self.sensitive_handler.is_sensitive_field(field)
        ]
        
        protected_data = self.encryption.encrypt_object(user_data, sensitive_fields)
        
        self.access_logger.log_data_access(
            action='PROTECT',
            data_type='user_data',
            record_id=user_data.get('id'),
            sensitive_fields=sensitive_fields
        )
        
        return protected_data
    
    def retrieve_user_data(self, protected_data: Dict[str, Any], user_id: str = None) -> Dict[str, Any]:
        encrypted_fields = [
            field.replace('_encrypted', '') for field in protected_data.keys()
            if field.endswith('_encrypted') and protected_data[field]
        ]
        
        user_data = self.encryption.decrypt_object(protected_data, encrypted_fields)
        
        self.access_logger.log_data_access(
            action='RETRIEVE',
            data_type='user_data',
            record_id=protected_data.get('id'),
            user_id=user_id,
            sensitive_fields=encrypted_fields
        )
        
        return user_data

data_protection_manager = DataProtectionManager()

def require_data_access_logging(data_type: str):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            data_protection_manager.access_logger.log_data_access(
                action='ACCESS',
                data_type=data_type,
                user_id=getattr(g, 'user_id', 'unknown')
            )
            
            result = f(*args, **kwargs)
            
            data_protection_manager.access_logger.log_data_access(
                action='ACCESS_SUCCESS',
                data_type=data_type,
                user_id=getattr(g, 'user_id', 'unknown')
            )
            
            return result
        return wrapper
    return decorator

def encrypt_sensitive_response(sensitive_fields: List[str] = None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            result = f(*args, **kwargs)
            
            if hasattr(result, 'json') and sensitive_fields:
                json_data = result.get_json()
                if isinstance(json_data, dict):
                    protected_data = data_protection_manager.encryption.encrypt_object(
                        json_data, sensitive_fields
                    )
                    result.data = str(protected_data)
            
            return result
        return wrapper
    return decorator
