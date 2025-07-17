
import os
import re
import hashlib
import logging
from typing import Dict, Any, Optional, Set
from pathlib import Path
from api.core import logger


try:
    from api.utils.cloud_secrets import cloud_secret_manager, get_cloud_secret
    CLOUD_SECRETS_AVAILABLE = True
except ImportError:
    CLOUD_SECRETS_AVAILABLE = False
    logger.warning("Cloud secrets not available - falling back to environment variables only")

class SecretManager:
    
    
    
    SECRET_PATTERNS = [
        r'(?i)(api[_-]?key|apikey)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{20,})',
        r'(?i)(secret[_-]?key|secretkey)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{20,})',
        r'(?i)(password|passwd|pwd)\s*[:=]\s*["\']?([^\s"\']{8,})',
        r'(?i)(token)\s*[:=]\s*["\']?([a-zA-Z0-9_\-\.]{20,})',
        r'(?i)(private[_-]?key|privatekey)\s*[:=]\s*["\']?([a-zA-Z0-9_\-\+\/=]{40,})',
        r'(?i)(database[_-]?url|db[_-]?url)\s*[:=]\s*["\']?([^\s"\']+)',
        r'(?i)(mongodb[_-]?uri|mongo[_-]?uri)\s*[:=]\s*["\']?([^\s"\']+)',
        r'(?i)(firebase[_-]?key|firebase[_-]?config)\s*[:=]\s*["\']?([^\s"\']+)',
    ]
    
  
    REQUIRED_SECRETS = {
        'MONGODB_URI',
        'SECRET_KEY', 
        'FIREBASE_PRIVATE_KEY_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_CLIENT_ID',
        'FIREBASE_PROJECT_ID'
    }
    
   
    OPTIONAL_SECRETS = {
        'FLASK_ENV': 'production',
        'DEBUG': 'False',
        'UPLOAD_FOLDER': 'uploads',
        'LOG_LEVEL': 'INFO'
    }
    
    def __init__(self):
        self.secrets: Dict[str, str] = {}
        self.masked_secrets: Dict[str, str] = {}
        self._load_secrets()
        self._validate_secrets()
    
    def _load_secrets(self) -> None:
       
        for secret_name in self.REQUIRED_SECRETS:
            value = os.environ.get(secret_name)
            if value:
                self.secrets[secret_name] = value
                self.masked_secrets[secret_name] = self._mask_secret(value)
            else:
                logger.error(f"Required secret '{secret_name}' not found in environment")
        
        
        for secret_name, default_value in self.OPTIONAL_SECRETS.items():
            value = os.environ.get(secret_name, default_value)
            self.secrets[secret_name] = value
            if self._is_sensitive(secret_name):
                self.masked_secrets[secret_name] = self._mask_secret(value)
            else:
                self.masked_secrets[secret_name] = value
    
    def _validate_secrets(self) -> None:
        
        missing_secrets = self.REQUIRED_SECRETS - set(self.secrets.keys())
        if missing_secrets:
            error_msg = f"Missing required secrets: {', '.join(missing_secrets)}"
            logger.critical(error_msg)
            raise ValueError(error_msg)
        
        
        validation_errors = []
        
        
        mongodb_uri = self.secrets.get('MONGODB_URI', '')
        if not mongodb_uri.startswith(('mongodb://', 'mongodb+srv://')):
            validation_errors.append("MONGODB_URI must start with mongodb:// or mongodb+srv://")
        
        
        secret_key = self.secrets.get('SECRET_KEY', '')
        if len(secret_key) < 32:
            validation_errors.append("SECRET_KEY must be at least 32 characters long")
        
        
        project_id = self.secrets.get('FIREBASE_PROJECT_ID', '')
        if not re.match(r'^[a-z0-9-]+$', project_id):
            validation_errors.append("FIREBASE_PROJECT_ID format invalid")
        
        if validation_errors:
            for error in validation_errors:
                logger.error(f"Secret validation error: {error}")
            raise ValueError(f"Secret validation failed: {'; '.join(validation_errors)}")
    
    def get_secret(self, secret_name: str, default: Optional[str] = None) -> Optional[str]:
        
        value = self.secrets.get(secret_name, default)
        if value is None and secret_name in self.REQUIRED_SECRETS:
            logger.error(f"Attempted to access missing required secret: {secret_name}")
        return value
    
    def get_masked_secret(self, secret_name: str) -> str:
        
        return self.masked_secrets.get(secret_name, "***UNKNOWN***")
    
    def _mask_secret(self, value: str) -> str:
        
        if not value:
            return "***EMPTY***"
        if len(value) <= 8:
            return "***MASKED***"
        return f"{value[:4]}***{value[-4:]}"
    
    def _is_sensitive(self, key: str) -> bool:
        
        sensitive_keywords = [
            'key', 'secret', 'password', 'token', 'uri', 'url', 
            'private', 'auth', 'credential', 'api'
        ]
        return any(keyword in key.lower() for keyword in sensitive_keywords)
    
    def scan_code_for_secrets(self, file_path: str) -> Dict[str, list]:
       
        findings = {
            'potential_secrets': [],
            'hardcoded_patterns': [],
            'suspicious_lines': []
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                for line_num, line in enumerate(file, 1):
                    
                    stripped_line = line.strip()
                    if not stripped_line or stripped_line.startswith('#'):
                        continue
                    
                    
                    for pattern in self.SECRET_PATTERNS:
                        matches = re.finditer(pattern, line)
                        for match in matches:
                            findings['potential_secrets'].append({
                                'line': line_num,
                                'pattern': pattern,
                                'match': match.group(0),
                                'context': line.strip()
                            })
                    
                    
                    if self._detect_hardcoded_secret(line):
                        findings['hardcoded_patterns'].append({
                            'line': line_num,
                            'content': line.strip()
                        })
        
        except Exception as e:
            logger.error(f"Error scanning file {file_path}: {str(e)}")
        
        return findings
    
    def _detect_hardcoded_secret(self, line: str) -> bool:
        
        long_string_pattern = r'["\']([a-zA-Z0-9+/=]{32,})["\']'
        matches = re.findall(long_string_pattern, line)
        
        for match in matches:
            
            if any(pattern in match.lower() for pattern in ['test', 'example', 'dummy', 'placeholder']):
                continue
            
            
            if len(match) >= 32 and re.match(r'^[A-Za-z0-9+/=]+$', match):
                return True
        
        return False
    
    def generate_secure_key(self, length: int = 32) -> str:
        
        import secrets
        import string
        
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def validate_environment_setup(self) -> Dict[str, Any]:
        
        validation_result = {
            'status': 'success',
            'errors': [],
            'warnings': [],
            'recommendations': []
        }
        
       
        env_file = Path('.env')
        if not env_file.exists():
            validation_result['warnings'].append("No .env file found - ensure environment variables are set")
        
        
        gitignore_file = Path('.gitignore')
        if gitignore_file.exists():
            with open(gitignore_file, 'r') as f:
                gitignore_content = f.read()
                if '.env' not in gitignore_content:
                    validation_result['errors'].append(".env file not in .gitignore")
                if 'firebase_service_key.json' not in gitignore_content:
                    validation_result['warnings'].append("firebase_service_key.json should be in .gitignore")
        
        
        secret_key = self.secrets.get('SECRET_KEY', '')
        if len(secret_key) < 50:
            validation_result['recommendations'].append("Consider using a longer SECRET_KEY (50+ characters)")
        
        
        flask_env = self.secrets.get('FLASK_ENV', '').lower()
        debug = self.secrets.get('DEBUG', '').lower()
        if flask_env != 'production' or debug == 'true':
            validation_result['warnings'].append("Application not in production mode")
        
        if validation_result['errors']:
            validation_result['status'] = 'error'
        elif validation_result['warnings']:
            validation_result['status'] = 'warning'
        
        return validation_result


secret_manager = SecretManager()

def get_secret(secret_name: str, default: Optional[str] = None) -> Optional[str]:
   
    return secret_manager.get_secret(secret_name, default)

def validate_no_hardcoded_secrets(file_path: str) -> bool:
   
    findings = secret_manager.scan_code_for_secrets(file_path)
    has_secrets = bool(findings['potential_secrets'] or findings['hardcoded_patterns'])
    
    if has_secrets:
        logger.warning(f"Potential secrets found in {file_path}")
        for secret in findings['potential_secrets']:
            logger.warning(f"Line {secret['line']}: {secret['context']}")
    
    return not has_secrets
