
import logging
from typing import Dict, List, Optional, Any, Tuple
from functools import wraps
from flask import request, g
from enum import Enum

from api.core import create_response
from api.utils.require_auth import verify_user
from api.utils.constants import Account
from api.utils.data_protection import data_protection_manager

logger = logging.getLogger(__name__)

class DataAccessLevel(Enum):
    
    PUBLIC = "public"          
    INTERNAL = "internal"      
    RESTRICTED = "restricted"  
    CONFIDENTIAL = "confidential"  

class ExportPermission(Enum):
    
    NONE = "none"
    BASIC = "basic"
    FULL = "full"
    ADMIN_ONLY = "admin_only"

class SecureAccessControl:
    
    
    
    ROLE_PERMISSIONS = {
        Account.ADMIN: {
            'data_access': DataAccessLevel.CONFIDENTIAL,
            'export_permission': ExportPermission.FULL,
            'can_access_all_users': True,
            'can_bulk_export': True,
            'sensitive_fields_access': True
        },
        Account.SUPPORT: {
            'data_access': DataAccessLevel.RESTRICTED,
            'export_permission': ExportPermission.BASIC,
            'can_access_all_users': True,
            'can_bulk_export': False,
            'sensitive_fields_access': False
        },
        Account.MODERATOR: {
            'data_access': DataAccessLevel.INTERNAL,
            'export_permission': ExportPermission.BASIC,
            'can_access_all_users': False,
            'can_bulk_export': False,
            'sensitive_fields_access': False
        },
        Account.MENTOR: {
            'data_access': DataAccessLevel.INTERNAL,
            'export_permission': ExportPermission.NONE,
            'can_access_all_users': False,
            'can_bulk_export': False,
            'sensitive_fields_access': False
        },
        Account.MENTEE: {
            'data_access': DataAccessLevel.PUBLIC,
            'export_permission': ExportPermission.NONE,
            'can_access_all_users': False,
            'can_bulk_export': False,
            'sensitive_fields_access': False
        },
        Account.PARTNER: {
            'data_access': DataAccessLevel.INTERNAL,
            'export_permission': ExportPermission.BASIC,
            'can_access_all_users': False,
            'can_bulk_export': False,
            'sensitive_fields_access': False
        }
    }
    
    
    SENSITIVE_FIELD_CATEGORIES = {
        'personal_identifiers': [
            'email', 'phone_number', 'social_security', 'passport_number',
            'driver_license', 'personal_id', 'date_of_birth'
        ],
        'financial_data': [
            'bank_account', 'credit_card', 'financial_info', 'salary',
            'income', 'tax_id'
        ],
        'location_data': [
            'address', 'full_address', 'home_address', 'precise_location',
            'coordinates', 'zip_code'
        ],
        'private_communications': [
            'message_content', 'private_notes', 'personal_comments',
            'confidential_feedback', 'internal_notes'
        ],
        'health_data': [
            'medical_info', 'health_status', 'disability_info',
            'mental_health', 'medical_history'
        ]
    }
    
    def __init__(self):
        self.access_logger = data_protection_manager.access_logger
    
    def get_user_permissions(self, user_role: int) -> Dict[str, Any]:
       
        return self.ROLE_PERMISSIONS.get(user_role, self.ROLE_PERMISSIONS[Account.MENTEE])
    
    def can_access_data_level(self, user_role: int, required_level: DataAccessLevel) -> bool:
        
        user_permissions = self.get_user_permissions(user_role)
        user_access_level = user_permissions['data_access']
        
        access_hierarchy = {
            DataAccessLevel.PUBLIC: 0,
            DataAccessLevel.INTERNAL: 1,
            DataAccessLevel.RESTRICTED: 2,
            DataAccessLevel.CONFIDENTIAL: 3
        }
        
        return access_hierarchy[user_access_level] >= access_hierarchy[required_level]
    
    def can_export_data(self, user_role: int, export_type: str = "basic") -> bool:
        
        user_permissions = self.get_user_permissions(user_role)
        export_permission = user_permissions['export_permission']
        
        if export_permission == ExportPermission.NONE:
            return False
        elif export_permission == ExportPermission.BASIC and export_type in ['basic', 'minimal']:
            return True
        elif export_permission == ExportPermission.FULL:
            return True
        elif export_permission == ExportPermission.ADMIN_ONLY and user_role == Account.ADMIN:
            return True
        
        return False
    
    def can_access_sensitive_fields(self, user_role: int, field_category: str = None) -> bool:
        
        user_permissions = self.get_user_permissions(user_role)
        
        
        if user_role == Account.ADMIN:
            return True
        
        
        return user_permissions.get('sensitive_fields_access', False)
    
    def filter_sensitive_fields(self, data: Dict[str, Any], user_role: int) -> Dict[str, Any]:
       
        if self.can_access_sensitive_fields(user_role):
            return data
        
        filtered_data = data.copy()
        
       
        for category, fields in self.SENSITIVE_FIELD_CATEGORIES.items():
            if not self.can_access_sensitive_fields(user_role, category):
                for field in fields:
                    if field in filtered_data:
                        filtered_data[field] = "***RESTRICTED***"
        
        return filtered_data
    
    def validate_bulk_access(self, user_role: int, record_count: int) -> Tuple[bool, str]:
       
        user_permissions = self.get_user_permissions(user_role)
        
        if not user_permissions['can_bulk_export']:
            return False, 
        
        
        limits = {
            Account.ADMIN: 10000,
            Account.SUPPORT: 1000,
            Account.MODERATOR: 500
        }
        
        max_records = limits.get(user_role, 0)
        if record_count > max_records:
            return False, f"Record count ({record_count}) exceeds limit ({max_records}) for your role"
        
        return True, "Access granted"
    
    def log_sensitive_access(self, action: str, data_type: str, user_role: int,
                           sensitive_fields: List[str] = None, record_id: str = None):
        
        self.access_logger.log_data_access(
            action=f"SENSITIVE_{action}",
            data_type=data_type,
            record_id=record_id,
            user_id=getattr(g, 'user_id', 'unknown'),
            sensitive_fields=sensitive_fields
        )
        
        
        if user_role in [Account.ADMIN, Account.SUPPORT] and sensitive_fields:
            logger.warning(
                f"High-privilege access: User {getattr(g, 'user_id', 'unknown')} "
                f"(role {user_role}) accessed sensitive fields: {sensitive_fields}"
            )

class DataExportController:
    
    
    def __init__(self):
        self.access_control = SecureAccessControl()
        self.sensitive_handler = data_protection_manager.sensitive_handler
    
    def prepare_export_data(self, data: List[Dict[str, Any]], user_role: int,
                          export_level: str = "basic") -> List[Dict[str, Any]]:
        
        if not self.access_control.can_export_data(user_role, export_level):
            raise PermissionError("Export not permitted for your role")
        
        export_data = []
        sensitive_fields_accessed = set()
        
        for record in data:
            
            filtered_record = self.access_control.filter_sensitive_fields(record, user_role)
            
            
            sanitized_record = self.sensitive_handler.sanitize_for_export(
                filtered_record, export_level
            )
            
           
            for field in record.keys():
                if self.sensitive_handler.is_sensitive_field(field):
                    sensitive_fields_accessed.add(field)
            
            export_data.append(sanitized_record)
        
       
        self.access_control.access_logger.log_bulk_export(
            export_type=export_level,
            record_count=len(export_data),
            export_level=export_level,
            user_id=getattr(g, 'user_id', 'unknown')
        )
        
       
        if sensitive_fields_accessed:
            self.access_control.log_sensitive_access(
                action="EXPORT",
                data_type="bulk_data",
                user_role=user_role,
                sensitive_fields=list(sensitive_fields_accessed)
            )
        
        return export_data


secure_access_control = SecureAccessControl()
data_export_controller = DataExportController()

def require_data_access_level(required_level: DataAccessLevel):
    
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            
            headers = request.headers
            token = headers.get("Authorization")
            
            if not token:
                return create_response(status=401, message="Missing authorization token")
            
            if token.startswith('Bearer '):
                token = token[7:]
            
            try:
                from firebase_admin import auth as firebase_admin_auth
                claims = firebase_admin_auth.verify_id_token(token, check_revoked=True)
                user_role = int(claims.get("role"))
                user_id = claims.get("uid")
                
               
                g.user_id = user_id
                g.user_role = user_role
                
            except Exception as e:
                logger.error(f"Token verification failed: {str(e)}")
                return create_response(status=401, message="Invalid token")
            
            
            if not secure_access_control.can_access_data_level(user_role, required_level):
                logger.warning(
                    f"Access denied: User {user_id} (role {user_role}) "
                    f"attempted to access {required_level.value} level data"
                )
                return create_response(
                    status=403,
                    message="Insufficient permissions for this data access level"
                )
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

def require_export_permission(export_type: str = "basic"):
    
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user_role = getattr(g, 'user_role', None)
            
            if not user_role:
                return create_response(status=401, message="User role not found")
            
            if not secure_access_control.can_export_data(user_role, export_type):
                logger.warning(
                    f"Export denied: User {getattr(g, 'user_id', 'unknown')} "
                    f"(role {user_role}) attempted {export_type} export"
                )
                return create_response(
                    status=403,
                    message="Export not permitted for your role"
                )
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

def log_sensitive_data_access(data_type: str, sensitive_fields: List[str] = None):
    
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user_role = getattr(g, 'user_role', None)
            
           
            secure_access_control.log_sensitive_access(
                action="ACCESS",
                data_type=data_type,
                user_role=user_role,
                sensitive_fields=sensitive_fields
            )
            
            return f(*args, **kwargs)
        return wrapper
    return decorator
