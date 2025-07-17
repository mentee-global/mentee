
import os
import json
import base64
import hashlib
import logging
from typing import Any, Dict, List, Optional, Union, Tuple
from datetime import datetime, timedelta
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from api.core import logger

class EncryptionKeyManager:
    def __init__(self, key_storage_path: str = None):
        self.key_storage_path = key_storage_path or os.path.join(
            os.path.dirname(__file__), '..', '..', 'secure_keys'
        )
        self.ensure_key_directory()
        self.current_key_id = self._get_current_key_id()
        self.keys = self._load_keys()
    
    def ensure_key_directory(self):
        
        Path(self.key_storage_path).mkdir(parents=True, exist_ok=True)
        os.chmod(self.key_storage_path, 0o700)
    
    def _get_current_key_id(self) -> str:
        key_index_file = os.path.join(self.key_storage_path, 'current_key.txt')
        
        if os.path.exists(key_index_file):
            with open(key_index_file, 'r') as f:
                return f.read().strip()
        else:
            
            key_id = f"key_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            with open(key_index_file, 'w') as f:
                f.write(key_id)
            os.chmod(key_index_file, 0o600)
            return key_id
    
    def _load_keys(self) -> Dict[str, bytes]:
        keys = {}
        
        
        current_key_file = os.path.join(self.key_storage_path, f'{self.current_key_id}.key')
        if not os.path.exists(current_key_file):
            
            key = Fernet.generate_key()
            with open(current_key_file, 'wb') as f:
                f.write(key)
            os.chmod(current_key_file, 0o600)
            keys[self.current_key_id] = key
            logger.info(f"Generated new encryption key: {self.current_key_id}")
        else:
            with open(current_key_file, 'rb') as f:
                keys[self.current_key_id] = f.read()
        
        
        for key_file in os.listdir(self.key_storage_path):
            if key_file.endswith('.key') and not key_file.startswith(self.current_key_id):
                key_id = key_file.replace('.key', '')
                key_path = os.path.join(self.key_storage_path, key_file)
                with open(key_path, 'rb') as f:
                    keys[key_id] = f.read()
        
        return keys
    
    def get_current_key(self) -> Tuple[str, bytes]:
        return self.current_key_id, self.keys[self.current_key_id]
    
    def get_key(self, key_id: str) -> Optional[bytes]:
        return self.keys.get(key_id)
    
    def rotate_key(self) -> str:
        new_key_id = f"key_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        new_key = Fernet.generate_key()
        
        
        new_key_file = os.path.join(self.key_storage_path, f'{new_key_id}.key')
        with open(new_key_file, 'wb') as f:
            f.write(new_key)
        os.chmod(new_key_file, 0o600)
        
        
        key_index_file = os.path.join(self.key_storage_path, 'current_key.txt')
        with open(key_index_file, 'w') as f:
            f.write(new_key_id)
        
        
        self.keys[new_key_id] = new_key
        self.current_key_id = new_key_id
        
        logger.info(f"Rotated to new encryption key: {new_key_id}")
        return new_key_id

class DatabaseFieldEncryption:
    
    def __init__(self, key_manager: EncryptionKeyManager = None):
        self.key_manager = key_manager or EncryptionKeyManager()
        self.sensitive_fields = {
            'user_profile': [
                'email', 'phone_number', 'address', 'full_address',
                'date_of_birth', 'social_security', 'passport_number',
                'driver_license', 'bank_account', 'credit_card'
            ],
            'communication': [
                'message_content', 'private_notes', 'personal_comments',
                'confidential_feedback', 'medical_info'
            ],
            'files': [
                'document_content', 'image_metadata', 'file_path'
            ]
        }
    
    def encrypt_field(self, value: Any, field_name: str = None) -> Dict[str, Any]:
        if not value:
            return {'value': value, 'encrypted': False}
        
        try:
            key_id, key = self.key_manager.get_current_key()
            fernet = Fernet(key)
            
            
            str_value = str(value) if not isinstance(value, str) else value
            
           
            encrypted_value = fernet.encrypt(str_value.encode())
            encoded_value = base64.b64encode(encrypted_value).decode()
            
            return {
                'value': encoded_value,
                'encrypted': True,
                'key_id': key_id,
                'encrypted_at': datetime.utcnow().isoformat(),
                'field_type': type(value).__name__
            }
        
        except Exception as e:
            logger.error(f"Field encryption failed for {field_name}: {str(e)}")
            raise
    
    def decrypt_field(self, encrypted_data: Dict[str, Any]) -> Any:
        if not encrypted_data.get('encrypted', False):
            return encrypted_data.get('value')
        
        try:
            key_id = encrypted_data.get('key_id')
            key = self.key_manager.get_key(key_id)
            
            if not key:
                raise ValueError(f"Encryption key not found: {key_id}")
            
            fernet = Fernet(key)
            
            encoded_value = encrypted_data['value']
            encrypted_value = base64.b64decode(encoded_value.encode())
            decrypted_value = fernet.decrypt(encrypted_value).decode()
            
            field_type = encrypted_data.get('field_type', 'str')
            if field_type == 'int':
                return int(decrypted_value)
            elif field_type == 'float':
                return float(decrypted_value)
            elif field_type == 'bool':
                return decrypted_value.lower() in ('true', '1', 'yes')
            else:
                return decrypted_value
            encoded_value = encrypted_data['value']
            encrypted_value = base64.b64decode(encoded_value.encode())
            decrypted_value = fernet.decrypt(encrypted_value).decode()
            field_type = encrypted_data.get('field_type', 'str')
            if field_type == 'int':
                return int(decrypted_value)
            elif field_type == 'float':
                return float(decrypted_value)
            elif field_type == 'bool':
                return decrypted_value.lower() in ('true', '1', 'yes')
            else:
                return decrypted_value
        
        except Exception as e:
            logger.error(f"Field decryption failed: {str(e)}")
            raise
    
    def encrypt_document(self, data: Dict[str, Any], document_type: str = 'user_profile') -> Dict[str, Any]:
        encrypted_doc = data.copy()
        fields_to_encrypt = self.sensitive_fields.get(document_type, [])
        
        for field in fields_to_encrypt:
            if field in encrypted_doc and encrypted_doc[field]:
                encrypted_doc[field] = self.encrypt_field(
                    encrypted_doc[field], field
                )
        
        
        encrypted_doc['_encryption_metadata'] = {
            'encrypted_fields': fields_to_encrypt,
            'encrypted_at': datetime.utcnow().isoformat(),
            'encryption_version': '1.0'
        }
        
        return encrypted_doc
    
    def decrypt_document(self, encrypted_doc: Dict[str, Any]) -> Dict[str, Any]:
        if '_encryption_metadata' not in encrypted_doc:
            return encrypted_doc
        
        decrypted_doc = encrypted_doc.copy()
        encrypted_fields = encrypted_doc['_encryption_metadata']['encrypted_fields']
        
        for field in encrypted_fields:
            if field in decrypted_doc and isinstance(decrypted_doc[field], dict):
                if decrypted_doc[field].get('encrypted', False):
                    decrypted_doc[field] = self.decrypt_field(decrypted_doc[field])
        
        
        del decrypted_doc['_encryption_metadata']
        
        return decrypted_doc

class FileEncryption:
    
    def __init__(self, key_manager: EncryptionKeyManager = None):
        self.key_manager = key_manager or EncryptionKeyManager()
        self.encrypted_storage_path = os.path.join(
            os.path.dirname(__file__), '..', '..', 'encrypted_files'
        )
        self.ensure_storage_directory()
    
    def ensure_storage_directory(self):
        Path(self.encrypted_storage_path).mkdir(parents=True, exist_ok=True)
        os.chmod(self.encrypted_storage_path, 0o700)
    
    def encrypt_file(self, file_path: str, output_path: str = None) -> Dict[str, Any]:
        try:
            key_id, key = self.key_manager.get_current_key()
            fernet = Fernet(key)
            
            
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            
            encrypted_data = fernet.encrypt(file_data)
            
            
            if not output_path:
                file_name = os.path.basename(file_path)
                encrypted_name = hashlib.sha256(file_name.encode()).hexdigest()[:16]
                output_path = os.path.join(
                    self.encrypted_storage_path, f"{encrypted_name}.enc"
                )
            
           
            with open(output_path, 'wb') as f:
                f.write(encrypted_data)
            os.chmod(output_path, 0o600)
            
        
            metadata = {
                'original_name': os.path.basename(file_path),
                'encrypted_path': output_path,
                'key_id': key_id,
                'file_size': len(file_data),
                'encrypted_size': len(encrypted_data),
                'encrypted_at': datetime.utcnow().isoformat(),
                'checksum': hashlib.sha256(file_data).hexdigest()
            }
            
            logger.info(f"File encrypted: {file_path} -> {output_path}")
            return metadata
        
        except Exception as e:
            logger.error(f"File encryption failed: {str(e)}")
            raise
    
    def decrypt_file(self, metadata: Dict[str, Any], output_path: str) -> bool:
        try:
            key_id = metadata['key_id']
            key = self.key_manager.get_key(key_id)
            
            if not key:
                raise ValueError(f"Encryption key not found: {key_id}")
            
            fernet = Fernet(key)
            
           
            encrypted_path = metadata['encrypted_path']
            with open(encrypted_path, 'rb') as f:
                encrypted_data = f.read()
            
        
            decrypted_data = fernet.decrypt(encrypted_data)
            
           
            if hashlib.sha256(decrypted_data).hexdigest() != metadata['checksum']:
                raise ValueError("File integrity check failed")
            
       
            with open(output_path, 'wb') as f:
                f.write(decrypted_data)
            
            logger.info(f"File decrypted: {encrypted_path} -> {output_path}")
            return True
        
        except Exception as e:
            logger.error(f"File decryption failed: {str(e)}")
            raise

class EncryptedBackupManager:
    
    def __init__(self, key_manager: EncryptionKeyManager = None):
        self.key_manager = key_manager or EncryptionKeyManager()
        self.backup_path = os.path.join(
            os.path.dirname(__file__), '..', '..', 'encrypted_backups'
        )
        self.ensure_backup_directory()
    
    def ensure_backup_directory(self):
        Path(self.backup_path).mkdir(parents=True, exist_ok=True)
        os.chmod(self.backup_path, 0o700)
    
    def create_encrypted_backup(self, data: Dict[str, Any], backup_name: str) -> str:
        try:
            key_id, key = self.key_manager.get_current_key()
            fernet = Fernet(key)
            
            
            json_data = json.dumps(data, default=str)
            
           
            encrypted_data = fernet.encrypt(json_data.encode())
            
        
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            backup_filename = f"{backup_name}_{timestamp}.backup"
            backup_file_path = os.path.join(self.backup_path, backup_filename)
            
            
            with open(backup_file_path, 'wb') as f:
                f.write(encrypted_data)
            os.chmod(backup_file_path, 0o600)
            
          
            metadata = {
                'backup_name': backup_name,
                'created_at': datetime.utcnow().isoformat(),
                'key_id': key_id,
                'data_checksum': hashlib.sha256(json_data.encode()).hexdigest(),
                'backup_file': backup_filename
            }
            
            metadata_file = f"{backup_filename}.meta"
            metadata_path = os.path.join(self.backup_path, metadata_file)
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f)
            os.chmod(metadata_path, 0o600)
            
            logger.info(f"Encrypted backup created: {backup_file_path}")
            return backup_file_path
        
        except Exception as e:
            logger.error(f"Backup creation failed: {str(e)}")
            raise
    
    def restore_encrypted_backup(self, backup_file_path: str) -> Dict[str, Any]:
        try:
          
            metadata_file = f"{backup_file_path}.meta"
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            
            key_id = metadata['key_id']
            key = self.key_manager.get_key(key_id)
            
            if not key:
                raise ValueError(f"Backup key not found: {key_id}")
            
            fernet = Fernet(key)
            
         
            with open(backup_file_path, 'rb') as f:
                encrypted_data = f.read()
            
            decrypted_data = fernet.decrypt(encrypted_data)
            json_data = decrypted_data.decode()
            
        
            if hashlib.sha256(json_data.encode()).hexdigest() != metadata['data_checksum']:
                raise ValueError("Backup integrity check failed")
            
          
            restored_data = json.loads(json_data)
            
            logger.info(f"Backup restored: {backup_file_path}")
            return restored_data
        
        except Exception as e:
            logger.error(f"Backup restoration failed: {str(e)}")
            raise


encryption_key_manager = EncryptionKeyManager()
database_field_encryption = DatabaseFieldEncryption(encryption_key_manager)
file_encryption = FileEncryption(encryption_key_manager)
backup_manager = EncryptedBackupManager(encryption_key_manager)

def encrypt_sensitive_data(data: Dict[str, Any], data_type: str = 'user_profile') -> Dict[str, Any]:
    return database_field_encryption.encrypt_document(data, data_type)

def decrypt_sensitive_data(encrypted_data: Dict[str, Any]) -> Dict[str, Any]:
    return database_field_encryption.decrypt_document(encrypted_data)

def rotate_encryption_keys() -> str:
    return encryption_key_manager.rotate_key()
