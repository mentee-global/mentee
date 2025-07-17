
import os
import hashlib
import time
from pathlib import Path
from typing import Tuple, Optional, Dict, Any

try:
    import magic
except ImportError:
    magic = None

try:
    from werkzeug.utils import secure_filename
    from werkzeug.datastructures import FileStorage
except ImportError:
    
    import re
    def secure_filename(filename):
        """Fallback secure filename implementation."""
        filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
        return filename[:255]
    
  
    FileStorage = type('FileStorage', (), {})

from api.core import logger
from api.utils.validation_schemas import ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE


UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
QUARANTINE_FOLDER = os.path.join(UPLOAD_FOLDER, 'quarantine')
MAX_FILENAME_LENGTH = 255
ALLOWED_EXTENSIONS = {
    'image': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    'document': ['pdf', 'txt', 'doc', 'docx']
}


os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(QUARANTINE_FOLDER, exist_ok=True)

class SecureFileHandler:
    
    
    def __init__(self):
        self.mime = magic.Magic(mime=True) if hasattr(magic, 'Magic') else None
    
    def validate_file(self, file: FileStorage) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
       
        try:
            
            if not file or not file.filename:
                return False, "No file provided", None
            
            
            filename = secure_filename(file.filename)
            if not filename:
                return False, "Invalid filename", None
            
            if len(filename) > MAX_FILENAME_LENGTH:
                return False, f"Filename too long (max {MAX_FILENAME_LENGTH} characters)", None
            
          
            extension = filename.lower().split('.')[-1] if '.' in filename else ''
            if not extension:
                return False, "File must have an extension", None
            
           
            file.seek(0)
            file_content = file.read()
            file.seek(0)  
            file_size = len(file_content)
            if file_size == 0:
                return False, "Empty file not allowed", None
            
            if file_size > MAX_FILE_SIZE:
                return False, f"File too large (max {MAX_FILE_SIZE // (1024*1024)}MB)", None
            
            
            actual_mime_type = self._detect_mime_type(file_content)
            
           
            is_valid_type, type_error = self._validate_file_type(extension, actual_mime_type)
            if not is_valid_type:
                return False, type_error, None
            
           
            is_safe, safety_error = self._scan_file_content(file_content, extension)
            if not is_safe:
                return False, safety_error, None
            
            
            file_hash = hashlib.sha256(file_content).hexdigest()
            
            file_info = {
                'original_filename': file.filename,
                'secure_filename': filename,
                'extension': extension,
                'mime_type': actual_mime_type,
                'size': file_size,
                'hash': file_hash
            }
            
            return True, "", file_info
            
        except Exception as e:
            logger.error(f"File validation error: {str(e)}")
            return False, "File validation failed", None
    
    def _detect_mime_type(self, file_content: bytes) -> str:
        
        try:
            if self.mime:
                return self.mime.from_buffer(file_content)
            else:
                
                if file_content.startswith(b'\\xff\\xd8\\xff'):
                    return 'image/jpeg'
                elif file_content.startswith(b'\\x89PNG'):
                    return 'image/png'
                elif file_content.startswith(b'GIF8'):
                    return 'image/gif'
                elif file_content.startswith(b'%PDF'):
                    return 'application/pdf'
                else:
                    return 'application/octet-stream'
        except Exception:
            return 'application/octet-stream'
    
    def _validate_file_type(self, extension: str, mime_type: str) -> Tuple[bool, str]:
        
        
        allowed_extensions = ALLOWED_EXTENSIONS['image'] + ALLOWED_EXTENSIONS['document']
        if extension not in allowed_extensions:
            return False, f"File extension '{extension}' not allowed"
        
        
        all_allowed_types = ALLOWED_IMAGE_TYPES + ALLOWED_DOCUMENT_TYPES
        if mime_type not in all_allowed_types:
            return False, f"File type '{mime_type}' not allowed"
        
        
        if extension in ALLOWED_EXTENSIONS['image'] and mime_type not in ALLOWED_IMAGE_TYPES:
            return False, "File extension doesn't match file content"
        
        if extension in ALLOWED_EXTENSIONS['document'] and mime_type not in ALLOWED_DOCUMENT_TYPES:
            return False, "File extension doesn't match file content"
        
        return True, ""
    
    def _scan_file_content(self, file_content: bytes, extension: str) -> Tuple[bool, str]:
        
        try:
            
            executable_signatures = [
                b'MZ',  
                b'\\x7fELF',  
                b'\\xfe\\xed\\xfa',  
                b'\\xca\\xfe\\xba\\xbe',  
            ]
            
            for signature in executable_signatures:
                if file_content.startswith(signature):
                    return False, "Executable files not allowed"
            
            
            if extension not in ['txt', 'doc', 'docx']:
                script_patterns = [
                    b'<script',
                    b'javascript:',
                    b'vbscript:',
                    b'<?php',
                    b'<%',
                    b'#!/bin/',
                    b'#!/usr/bin/',
                ]
                
                content_lower = file_content.lower()
                for pattern in script_patterns:
                    if pattern in content_lower:
                        return False, "Script content detected in file"
            
           
            archive_signatures = [
                b'PK\\x03\\x04',  
                b'Rar!',  
                b'\\x1f\\x8b',  
            ]
            
            for signature in archive_signatures:
                if file_content.startswith(signature):
                    return False, "Archive files not allowed"
            
            return True, ""
            
        except Exception as e:
            logger.error(f"File content scan error: {str(e)}")
            return False, "File security scan failed"
    
    def save_file(self, file: FileStorage, file_info: Dict[str, Any], 
                  subfolder: str = '') -> Tuple[bool, str, Optional[str]]:
        
        try:
            
            timestamp = int(time.time())
            unique_filename = f"{timestamp}_{file_info['hash'][:12]}.{file_info['extension']}"
            
            
            save_dir = os.path.join(UPLOAD_FOLDER, subfolder) if subfolder else UPLOAD_FOLDER
            os.makedirs(save_dir, exist_ok=True)
            
            file_path = os.path.join(save_dir, unique_filename)
            
            
            file.seek(0)
            file.save(file_path)
            
            
            if not os.path.exists(file_path):
                return False, "File save failed", None
            
            
            if os.path.getsize(file_path) != file_info['size']:
                os.remove(file_path)
                return False, "File corruption detected during save", None
            
            logger.info(f"File saved successfully: {unique_filename}")
            return True, "File saved successfully", file_path
            
        except Exception as e:
            logger.error(f"File save error: {str(e)}")
            return False, "Failed to save file", None
    
    def quarantine_file(self, file: FileStorage, reason: str) -> None:
        
        try:
            timestamp = int(time.time())
            quarantine_name = f"{timestamp}_quarantine_{secure_filename(file.filename)}"
            quarantine_path = os.path.join(QUARANTINE_FOLDER, quarantine_name)
            
            file.seek(0)
            file.save(quarantine_path)
            
            logger.warning(f"File quarantined: {quarantine_name}, Reason: {reason}")
            
        except Exception as e:
            logger.error(f"Failed to quarantine file: {str(e)}")

def validate_file_upload():
    
    def decorator(f):
        from functools import wraps
        from flask import request
        from api.core import create_response
        
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                
                if 'file' not in request.files:
                    return create_response(status=400, message="No file provided")
                
                file = request.files['file']
                
                
                file_handler = SecureFileHandler()
                is_valid, error_msg, file_info = file_handler.validate_file(file)
                
                if not is_valid:
                   
                    if "malicious" in error_msg.lower() or "script" in error_msg.lower():
                        file_handler.quarantine_file(file, error_msg)
                    
                    logger.warning(f"File upload rejected: {error_msg}")
                    return create_response(status=400, message=f"File validation failed: {error_msg}")
                
               
                kwargs['file_info'] = file_info
                kwargs['validated_file'] = file
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"File upload validation error: {str(e)}")
                return create_response(status=500, message="File upload validation failed")
        
        return decorated_function
    return decorator


secure_file_handler = SecureFileHandler()
