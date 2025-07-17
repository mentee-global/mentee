
import re
from typing import Dict, Any, List, Union
from bson import ObjectId
from bson.errors import InvalidId
from api.core import logger

class SecureQueryBuilder:
    
    DANGEROUS_OPERATORS = [
        '$where', '$mapReduce', '$accumulator', '$function',
        '$eval', '$expr', '$jsonSchema'
    ]
    
    
    ALLOWED_OPERATORS = [
        '$eq', '$ne', '$gt', '$gte', '$lt', '$lte',
        '$in', '$nin', '$exists', '$type', '$size',
        '$and', '$or', '$not', '$nor'
    ]
    
    def __init__(self):
        pass
    
    def sanitize_query(self, query: Dict[str, Any]) -> Dict[str, Any]:
        
        if not isinstance(query, dict):
            logger.warning(f"Invalid query type: {type(query)}")
            return {}
        
        return self._sanitize_dict(query)
    
    def _sanitize_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
       
        sanitized = {}
        
        for key, value in data.items():
            
            clean_key = self._sanitize_key(key)
            if not clean_key:
                continue
            
           
            clean_value = self._sanitize_value(value)
            if clean_value is not None:
                sanitized[clean_key] = clean_value
        
        return sanitized
    
    def _sanitize_key(self, key: str) -> str:
        
        if not isinstance(key, str):
            logger.warning(f"Non-string key detected: {key}")
            return ""
        
        
        if key in self.DANGEROUS_OPERATORS:
            logger.warning(f"Dangerous operator blocked: {key}")
            return ""
        
        
        if key.startswith('$') and key not in self.ALLOWED_OPERATORS:
            logger.warning(f"Unknown operator blocked: {key}")
            return ""
        
        
        if not key.startswith('$'):
            
            clean_key = re.sub(r'[^a-zA-Z0-9._-]', '', key)
            if clean_key != key:
                logger.warning(f"Field name sanitized: {key} -> {clean_key}")
            return clean_key
        
        return key
    
    def _sanitize_value(self, value: Any) -> Any:
        """Sanitize MongoDB field values."""
        if isinstance(value, str):
            return self._sanitize_string_value(value)
        elif isinstance(value, dict):
            return self._sanitize_dict(value)
        elif isinstance(value, list):
            return [self._sanitize_value(item) for item in value]
        elif isinstance(value, (int, float, bool, type(None))):
            return value
        else:
            
            logger.warning(f"Unknown value type converted to string: {type(value)}")
            return self._sanitize_string_value(str(value))
    
    def _sanitize_string_value(self, value: str) -> str:
        """Sanitize string values to prevent injection."""
        if not isinstance(value, str):
            return str(value)
        
        
        cleaned = re.sub(r'[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f-\\x84\\x86-\\x9f]', '', value)
        
        
        cleaned = re.sub(r'\\b(function|eval|setTimeout|setInterval)\\s*\\(', '', cleaned, flags=re.IGNORECASE)
        
        
        if cleaned.startswith('/') and cleaned.endswith('/'):
            logger.warning(f"Regex pattern detected and sanitized: {cleaned}")
            cleaned = re.escape(cleaned[1:-1]) 
        
        return cleaned
    
    def build_find_query(self, filters: Dict[str, Any] = None, 
                        projection: Dict[str, Any] = None,
                        sort: List[tuple] = None,
                        limit: int = None,
                        skip: int = None) -> Dict[str, Any]:
        
        query_params = {}
        
        
        if filters:
            query_params['filter'] = self.sanitize_query(filters)
        else:
            query_params['filter'] = {}
        
        
        if projection:
            clean_projection = {}
            for field, include in projection.items():
                clean_field = self._sanitize_key(field)
                if clean_field and isinstance(include, (int, bool)):
                    clean_projection[clean_field] = include
            query_params['projection'] = clean_projection
        
        
        if sort:
            clean_sort = []
            for field, direction in sort:
                clean_field = self._sanitize_key(str(field))
                if clean_field and direction in [1, -1, 'asc', 'desc']:
                    clean_sort.append((clean_field, direction))
            query_params['sort'] = clean_sort
        
        
        if limit is not None:
            query_params['limit'] = max(1, min(int(limit), 1000)) 
        
        if skip is not None:
            query_params['skip'] = max(0, int(skip))
        
        return query_params
    
    def validate_object_id(self, id_string: str) -> Union[ObjectId, None]:
       
        try:
            if not isinstance(id_string, str):
                return None
            
            
            if not re.match(r'^[a-fA-F0-9]{24}$', id_string):
                return None
            
            return ObjectId(id_string)
        except (InvalidId, ValueError, TypeError):
            logger.warning(f"Invalid ObjectId format: {id_string}")
            return None
    
    def build_update_query(self, update_data: Dict[str, Any]) -> Dict[str, Any]:
        
        if not isinstance(update_data, dict):
            logger.warning("Invalid update data type")
            return {}
        
        
        allowed_update_ops = ['$set', '$unset', '$inc', '$push', '$pull', '$addToSet']
        
        sanitized_update = {}
        
        for operator, data in update_data.items():
            if operator in allowed_update_ops:
                if isinstance(data, dict):
                    sanitized_update[operator] = self.sanitize_query(data)
                else:
                    logger.warning(f"Invalid data type for {operator}: {type(data)}")
            else:
                logger.warning(f"Unsafe update operator blocked: {operator}")
        
        return sanitized_update


secure_query_builder = SecureQueryBuilder()

def sanitize_query(query: Dict[str, Any]) -> Dict[str, Any]:
    
    return secure_query_builder.sanitize_query(query)

def validate_object_id(id_string: str) -> Union[ObjectId, None]:

    return secure_query_builder.validate_object_id(id_string)

def build_secure_find_query(**kwargs) -> Dict[str, Any]:
    
    return secure_query_builder.build_find_query(**kwargs)
