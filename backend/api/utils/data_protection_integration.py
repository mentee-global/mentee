
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from flask import Flask

from api.utils.data_protection import data_protection_manager
from api.utils.secure_access_control import secure_access_control, data_export_controller
from api.utils.data_storage_encryption import (
    database_field_encryption, file_encryption, backup_manager
)

logger = logging.getLogger(__name__)

class DataProtectionIntegration:
    def __init__(self):
        self.data_manager = data_protection_manager
        self.access_control = secure_access_control
        self.export_controller = data_export_controller
        self.field_encryption = database_field_encryption
        self.file_encryption = file_encryption
        self.backup_manager = backup_manager
        
        self.classification_levels = {
            'public': 0,
            'internal': 1,
            'confidential': 2,
            'restricted': 3,
            'top_secret': 4
        }
        
        self.sensitive_categories = {
            'personal_identifiers': {
                'level': 'restricted',
                'fields': [
                    'email', 'phone_number', 'social_security_number',
                    'passport_number', 'driver_license', 'national_id'
                ],
                'encryption_required': True,
                'access_logging': True
            },
            'financial_data': {
                'level': 'top_secret',
                'fields': [
                    'bank_account', 'credit_card', 'financial_info',
                    'salary', 'income', 'tax_information'
                ],
                'encryption_required': True,
                'access_logging': True
            },
            'location_data': {
                'level': 'confidential',
                'fields': [
                    'address', 'home_address', 'precise_location',
                    'coordinates', 'zip_code', 'postal_code'
                ],
                'encryption_required': True,
                'access_logging': True
            },
            'health_data': {
                'level': 'top_secret',
                'fields': [
                    'medical_info', 'health_status', 'disability_info',
                    'mental_health', 'medical_history', 'allergies'
                ],
                'encryption_required': True,
                'access_logging': True
            },
            'communications': {
                'level': 'confidential',
                'fields': [
                    'message_content', 'private_notes', 'personal_comments',
                    'confidential_feedback', 'chat_messages'
                ],
                'encryption_required': True,
                'access_logging': True
            },
            'profile_data': {
                'level': 'internal',
                'fields': [
                    'biography', 'personal_statement', 'preferences',
                    'interests', 'goals', 'background'
                ],
                'encryption_required': False,
                'access_logging': True
            }
        }
    
    def classify_data(self, data: Dict[str, Any]) -> Dict[str, str]:
        classification = {}
        
        for field_name, field_value in data.items():
            classification[field_name] = self._classify_field(field_name, field_value)
        
        return classification
    
    def _classify_field(self, field_name: str, field_value: Any) -> str:
        field_lower = field_name.lower()
        
        for category, config in self.sensitive_categories.items():
            if any(sensitive_field in field_lower for sensitive_field in config['fields']):
                return config['level']
        
        if any(pattern in field_lower for pattern in ['password', 'secret', 'token', 'key']):
            return 'top_secret'
        elif any(pattern in field_lower for pattern in ['private', 'confidential', 'internal']):
            return 'confidential'
        elif any(pattern in field_lower for pattern in ['personal', 'contact', 'profile']):
            return 'internal'
        else:
            return 'public'
    
    def protect_user_data(self, user_data: Dict[str, Any], user_type: str = 'user_profile') -> Dict[str, Any]:
        try:
            classification = self.classify_data(user_data)
            
            fields_to_encrypt = []
            for field_name, level in classification.items():
                category = self._get_field_category(field_name)
                if category and self.sensitive_categories[category]['encryption_required']:
                    fields_to_encrypt.append(field_name)
            
            protected_data = self.field_encryption.encrypt_document(user_data, user_type)
            
            protected_data['_data_protection'] = {
                'protected_at': datetime.utcnow().isoformat(),
                'classification': classification,
                'encrypted_fields': fields_to_encrypt,
                'protection_version': '1.0'
            }
            
            self.data_manager.access_logger.log_data_access(
                action='PROTECT_DATA',
                data_type=user_type,
                record_id=user_data.get('id', 'unknown'),
                sensitive_fields=fields_to_encrypt
            )
            
            logger.info(f"Data protection applied: {len(fields_to_encrypt)} fields encrypted")
            return protected_data
            
        except Exception as e:
            logger.error(f"Data protection failed: {str(e)}")
            raise
    
    def retrieve_protected_data(self, protected_data: Dict[str, Any], 
                              user_role: int, request_context: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            if '_data_protection' not in protected_data:
                return protected_data  
            
            protection_meta = protected_data['_data_protection']
            classification = protection_meta.get('classification', {})
            
            filtered_data = self.access_control.filter_sensitive_fields(protected_data, user_role)
            
            if self.access_control.can_access_sensitive_fields(user_role):
                decrypted_data = self.field_encryption.decrypt_document(filtered_data)
            else:
                decrypted_data = filtered_data.copy()
                for field in protection_meta.get('encrypted_fields', []):
                    if field in decrypted_data:
                        decrypted_data[field] = '***CLASSIFIED***'
            
            accessed_fields = [
                field for field in protection_meta.get('encrypted_fields', [])
                if field in decrypted_data and decrypted_data[field] != '***CLASSIFIED***'
            ]
            
            if accessed_fields:
                self.access_control.log_sensitive_access(
                    action='RETRIEVE_DATA',
                    data_type=request_context.get('data_type', 'protected_data'),
                    user_role=user_role,
                    sensitive_fields=accessed_fields,
                    record_id=protected_data.get('id', 'unknown')
                )
            
            decrypted_data.pop('_data_protection', None)
            
            return decrypted_data
            
        except Exception as e:
            logger.error(f"Data retrieval failed: {str(e)}")
            raise
    
    def _get_field_category(self, field_name: str) -> Optional[str]:
        field_lower = field_name.lower()
        
        for category, config in self.sensitive_categories.items():
            if any(sensitive_field in field_lower for sensitive_field in config['fields']):
                return category
        
        return None
    
    def secure_bulk_export(self, data_list: List[Dict[str, Any]], 
                          user_role: int, export_type: str = 'basic') -> List[Dict[str, Any]]:
        try:
            if not self.access_control.can_export_data(user_role, export_type):
                raise PermissionError(f"Export type '{export_type}' not permitted for user role {user_role}")
            
            is_valid, message = self.access_control.validate_bulk_access(user_role, len(data_list))
            if not is_valid:
                raise PermissionError(message)
            
            export_data = []
            sensitive_fields_accessed = set()
            
            for record in data_list:
                if '_data_protection' in record:
                    processed_record = self.retrieve_protected_data(
                        record, user_role, {'data_type': 'bulk_export'}
                    )
                    protection_meta = record.get('_data_protection', {})
                    sensitive_fields_accessed.update(protection_meta.get('encrypted_fields', []))
                else:
                    processed_record = self.access_control.filter_sensitive_fields(record, user_role)
                
                sanitized_record = self.data_manager.sensitive_handler.sanitize_for_export(
                    processed_record, export_type
                )
                
                export_data.append(sanitized_record)
            
            self.data_manager.access_logger.log_bulk_export(
                export_type=export_type,
                record_count=len(export_data),
                export_level=export_type,
                user_id='bulk_export_user'
            )
            
            if sensitive_fields_accessed:
                self.access_control.log_sensitive_access(
                    action='BULK_EXPORT',
                    data_type='protected_data',
                    user_role=user_role,
                    sensitive_fields=list(sensitive_fields_accessed)
                )
            
            logger.info(f"Secure bulk export completed: {len(export_data)} records, {len(sensitive_fields_accessed)} sensitive fields")
            return export_data
            
        except Exception as e:
            logger.error(f"Secure bulk export failed: {str(e)}")
            raise
    
    def encrypt_uploaded_file(self, file_path: str, file_metadata: Dict[str, Any]) -> Dict[str, Any]:
        try:
            is_sensitive = self._is_sensitive_file(file_metadata)
            
            if is_sensitive:
                encryption_metadata = self.file_encryption.encrypt_file(file_path)
                
                self.data_manager.access_logger.log_data_access(
                    action='ENCRYPT_FILE',
                    data_type='uploaded_file',
                    record_id=file_metadata.get('id', 'unknown'),
                    sensitive_fields=['file_content']
                )
                
                return {
                    'encrypted': True,
                    'encryption_metadata': encryption_metadata,
                    'original_metadata': file_metadata
                }
            else:
                return {
                    'encrypted': False,
                    'file_metadata': file_metadata
                }
                
        except Exception as e:
            logger.error(f"File encryption failed: {str(e)}")
            raise
    
    def _is_sensitive_file(self, file_metadata: Dict[str, Any]) -> bool:
        sensitive_types = [
            'application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument'
        ]
        
        file_type = file_metadata.get('content_type', '')
        file_name = file_metadata.get('filename', '').lower()
        
        sensitive_patterns = [
            'personal', 'private', 'confidential', 'id', 'license',
            'passport', 'medical', 'financial', 'tax', 'bank'
        ]
        
        return (
            any(stype in file_type for stype in sensitive_types) or
            any(pattern in file_name for pattern in sensitive_patterns)
        )
    
    def create_data_backup(self, data: Dict[str, Any], backup_name: str) -> str:
        try:
            protected_data = self.protect_user_data(data, 'backup_data')
            
            backup_path = self.backup_manager.create_encrypted_backup(
                protected_data, backup_name
            )
            
            self.data_manager.access_logger.log_data_access(
                action='CREATE_BACKUP',
                data_type='sensitive_data',
                record_id=backup_name,
                sensitive_fields=['encrypted_backup']
            )
            
            logger.info(f"Encrypted backup created: {backup_path}")
            return backup_path
            
        except Exception as e:
            logger.error(f"Backup creation failed: {str(e)}")
            raise
    
    def get_data_protection_status(self) -> Dict[str, Any]:
        return {
            'protection_enabled': True,
            'encryption_status': 'active',
            'access_control_status': 'active',
            'audit_logging_status': 'active',
            'sensitive_categories': len(self.sensitive_categories),
            'classification_levels': len(self.classification_levels),
            'last_updated': datetime.utcnow().isoformat(),
            'compliance_features': [
                'Data Encryption at Rest',
                'Access Control and Authorization',
                'Audit Logging and Monitoring',
                'Sensitive Data Classification',
                'Secure Data Export',
                'File Encryption',
                'Encrypted Backups'
            ]
        }

data_protection_integration = DataProtectionIntegration()

def init_data_protection(app: Flask):
    try:
        from api.utils.secure_download import secure_download
        app.register_blueprint(secure_download, url_prefix='/api/secure')
        
        protection_status = data_protection_integration.get_data_protection_status()
        logger.info(f"Data Protection initialized: {protection_status}")
        
        return True
        
    except Exception as e:
        logger.error(f"Data Protection initialization failed: {str(e)}")
        return False

def protect_data(data: Dict[str, Any], data_type: str = 'user_profile') -> Dict[str, Any]:
    return data_protection_integration.protect_user_data(data, data_type)

def retrieve_data(protected_data: Dict[str, Any], user_role: int, 
                 context: Dict[str, Any] = None) -> Dict[str, Any]:
    return data_protection_integration.retrieve_protected_data(
        protected_data, user_role, context or {}
    )

def secure_export(data_list: List[Dict[str, Any]], user_role: int, 
                 export_type: str = 'basic') -> List[Dict[str, Any]]:
    return data_protection_integration.secure_bulk_export(data_list, user_role, export_type)
