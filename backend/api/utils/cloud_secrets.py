
import os
import json
import logging
from typing import Dict, Any, Optional, Union, List
from datetime import datetime, timedelta
from abc import ABC, abstractmethod


try:
    from google.cloud import secretmanager
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False

try:
    import boto3
    from botocore.exceptions import ClientError
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False

try:
    import hvac
    VAULT_AVAILABLE = True
except ImportError:
    VAULT_AVAILABLE = False

try:
    from azure.keyvault.secrets import SecretClient
    from azure.identity import DefaultAzureCredential
    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False

from api.core import logger

class SecretProvider(ABC):
    
    
    @abstractmethod
    def get_secret(self, secret_name: str) -> Optional[str]:
        
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        
        pass
    
    @abstractmethod
    def list_secrets(self) -> List[str]:
        
        pass

class GoogleSecretManagerProvider(SecretProvider):
    
    
    def __init__(self, project_id: Optional[str] = None):
        self.project_id = project_id or os.environ.get('GOOGLE_CLOUD_PROJECT')
        self.client = None
        
        if GOOGLE_AVAILABLE and self.project_id:
            try:
                self.client = secretmanager.SecretManagerServiceClient()
            except Exception as e:
                logger.warning(f"Google Secret Manager initialization failed: {e}")
    
    def get_secret(self, secret_name: str) -> Optional[str]:
        
        if not self.client or not self.project_id:
            return None
        
        try:
            name = f"projects/{self.project_id}/secrets/{secret_name}/versions/latest"
            response = self.client.access_secret_version(request={"name": name})
            return response.payload.data.decode("UTF-8")
        except Exception as e:
            logger.debug(f"Failed to get secret {secret_name} from Google Secret Manager: {e}")
            return None
    
    def is_available(self) -> bool:
        
        return GOOGLE_AVAILABLE and self.client is not None and self.project_id is not None
    
    def list_secrets(self) -> List[str]:
        
        if not self.client or not self.project_id:
            return []
        
        try:
            parent = f"projects/{self.project_id}"
            secrets = self.client.list_secrets(request={"parent": parent})
            return [secret.name.split('/')[-1] for secret in secrets]
        except Exception as e:
            logger.warning(f"Failed to list Google secrets: {e}")
            return []

class AWSSecretsManagerProvider(SecretProvider):
    
    
    def __init__(self, region_name: Optional[str] = None):
        self.region_name = region_name or os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
        self.client = None
        
        if AWS_AVAILABLE:
            try:
                self.client = boto3.client('secretsmanager', region_name=self.region_name)
            except Exception as e:
                logger.warning(f"AWS Secrets Manager initialization failed: {e}")
    
    def get_secret(self, secret_name: str) -> Optional[str]:
        
        if not self.client:
            return None
        
        try:
            response = self.client.get_secret_value(SecretId=secret_name)
            return response['SecretString']
        except ClientError as e:
            logger.debug(f"Failed to get secret {secret_name} from AWS Secrets Manager: {e}")
            return None
        except Exception as e:
            logger.debug(f"Unexpected error getting secret {secret_name}: {e}")
            return None
    
    def is_available(self) -> bool:
        
        return AWS_AVAILABLE and self.client is not None
    
    def list_secrets(self) -> List[str]:
        
        if not self.client:
            return []
        
        try:
            response = self.client.list_secrets()
            return [secret['Name'] for secret in response['SecretList']]
        except Exception as e:
            logger.warning(f"Failed to list AWS secrets: {e}")
            return []

class HashiCorpVaultProvider(SecretProvider):
    
    
    def __init__(self, vault_url: Optional[str] = None, vault_token: Optional[str] = None):
        self.vault_url = vault_url or os.environ.get('VAULT_ADDR')
        self.vault_token = vault_token or os.environ.get('VAULT_TOKEN')
        self.client = None
        
        if VAULT_AVAILABLE and self.vault_url and self.vault_token:
            try:
                self.client = hvac.Client(url=self.vault_url, token=self.vault_token)
                if not self.client.is_authenticated():
                    self.client = None
                    logger.warning("HashiCorp Vault authentication failed")
            except Exception as e:
                logger.warning(f"HashiCorp Vault initialization failed: {e}")
    
    def get_secret(self, secret_name: str, mount_point: str = 'secret') -> Optional[str]:
        
        if not self.client:
            return None
        
        try:
            response = self.client.secrets.kv.v2.read_secret_version(
                path=secret_name, mount_point=mount_point
            )
            return response['data']['data'].get('value')
        except Exception as e:
            logger.debug(f"Failed to get secret {secret_name} from Vault: {e}")
            return None
    
    def is_available(self) -> bool:
        
        return VAULT_AVAILABLE and self.client is not None
    
    def list_secrets(self) -> List[str]:
        
        if not self.client:
            return []
        
        try:
            response = self.client.secrets.kv.v2.list_secrets(path='', mount_point='secret')
            return response['data']['keys']
        except Exception as e:
            logger.warning(f"Failed to list Vault secrets: {e}")
            return []

class AzureKeyVaultProvider(SecretProvider):
    
    
    def __init__(self, vault_url: Optional[str] = None):
        self.vault_url = vault_url or os.environ.get('AZURE_KEY_VAULT_URL')
        self.client = None
        
        if AZURE_AVAILABLE and self.vault_url:
            try:
                credential = DefaultAzureCredential()
                self.client = SecretClient(vault_url=self.vault_url, credential=credential)
            except Exception as e:
                logger.warning(f"Azure Key Vault initialization failed: {e}")
    
    def get_secret(self, secret_name: str) -> Optional[str]:
        
        if not self.client:
            return None
        
        try:
            secret = self.client.get_secret(secret_name)
            return secret.value
        except Exception as e:
            logger.debug(f"Failed to get secret {secret_name} from Azure Key Vault: {e}")
            return None
    
    def is_available(self) -> bool:
        
        return AZURE_AVAILABLE and self.client is not None
    
    def list_secrets(self) -> List[str]:
        
        if not self.client:
            return []
        
        try:
            secrets = self.client.list_properties_of_secrets()
            return [secret.name for secret in secrets]
        except Exception as e:
            logger.warning(f"Failed to list Azure secrets: {e}")
            return []

class EnvironmentProvider(SecretProvider):
    
    
    def get_secret(self, secret_name: str) -> Optional[str]:
        
        return os.environ.get(secret_name)
    
    def is_available(self) -> bool:
        
        return True
    
    def list_secrets(self) -> List[str]:
        
        secret_keywords = ['key', 'secret', 'token', 'password', 'credential', 'auth']
        env_vars = []
        
        for key in os.environ.keys():
            if any(keyword in key.lower() for keyword in secret_keywords):
                env_vars.append(key)
        
        return env_vars

class CloudSecretManager:

    def __init__(self):
        self.providers: List[SecretProvider] = []
        self.secret_cache: Dict[str, Any] = {}
        self.cache_ttl = timedelta(minutes=15)  # Cache secrets for 15 minutes
        self._initialize_providers()
    
    def _initialize_providers(self):
  
        google_provider = GoogleSecretManagerProvider()
        if google_provider.is_available():
            self.providers.append(google_provider)
            logger.info("Google Secret Manager provider initialized")
        
        
        aws_provider = AWSSecretsManagerProvider()
        if aws_provider.is_available():
            self.providers.append(aws_provider)
            logger.info("AWS Secrets Manager provider initialized")
        
        
        azure_provider = AzureKeyVaultProvider()
        if azure_provider.is_available():
            self.providers.append(azure_provider)
            logger.info("Azure Key Vault provider initialized")
        
        
        vault_provider = HashiCorpVaultProvider()
        if vault_provider.is_available():
            self.providers.append(vault_provider)
            logger.info("HashiCorp Vault provider initialized")
        
        
        self.providers.append(EnvironmentProvider())
        logger.info("Environment variable provider initialized")
        
        logger.info(f"Initialized {len(self.providers)} secret providers")
    
    def get_secret(self, secret_name: str, use_cache: bool = True) -> Optional[str]:

        if use_cache and secret_name in self.secret_cache:
            cache_entry = self.secret_cache[secret_name]
            if datetime.now() - cache_entry['timestamp'] < self.cache_ttl:
                return cache_entry['value']
        
        
        for provider in self.providers:
            try:
                secret_value = provider.get_secret(secret_name)
                if secret_value is not None:
                    
                    self.secret_cache[secret_name] = {
                        'value': secret_value,
                        'timestamp': datetime.now(),
                        'provider': provider.__class__.__name__
                    }
                    
                    logger.debug(f"Secret '{secret_name}' retrieved from {provider.__class__.__name__}")
                    return secret_value
            except Exception as e:
                logger.warning(f"Provider {provider.__class__.__name__} failed for secret '{secret_name}': {e}")
                continue
        
        logger.warning(f"Secret '{secret_name}' not found in any provider")
        return None
    
    def get_secret_info(self, secret_name: str) -> Dict[str, Any]:
        
        if secret_name in self.secret_cache:
            cache_entry = self.secret_cache[secret_name]
            return {
                'secret_name': secret_name,
                'provider': cache_entry['provider'],
                'cached': True,
                'timestamp': cache_entry['timestamp'].isoformat(),
                'age_minutes': (datetime.now() - cache_entry['timestamp']).total_seconds() / 60
            }
        
        
        for provider in self.providers:
            try:
                if provider.get_secret(secret_name) is not None:
                    return {
                        'secret_name': secret_name,
                        'provider': provider.__class__.__name__,
                        'cached': False,
                        'available': True
                    }
            except Exception:
                continue
        
        return {
            'secret_name': secret_name,
            'provider': None,
            'cached': False,
            'available': False
        }
    
    def refresh_secret(self, secret_name: str) -> Optional[str]:
        
        if secret_name in self.secret_cache:
            del self.secret_cache[secret_name]
        
        return self.get_secret(secret_name, use_cache=False)
    
    def clear_cache(self):
        
        self.secret_cache.clear()
        logger.info("Secret cache cleared")
    
    def get_provider_status(self) -> Dict[str, Any]:
        
        status = {}
        
        for provider in self.providers:
            provider_name = provider.__class__.__name__
            try:
                is_available = provider.is_available()
                secret_count = len(provider.list_secrets()) if is_available else 0
                
                status[provider_name] = {
                    'available': is_available,
                    'secret_count': secret_count,
                    'status': 'healthy' if is_available else 'unavailable'
                }
            except Exception as e:
                status[provider_name] = {
                    'available': False,
                    'secret_count': 0,
                    'status': 'error',
                    'error': str(e)
                }
        
        return status
    
    def validate_secrets(self, required_secrets: List[str]) -> Dict[str, Any]:

        results = {
            'valid': True,
            'missing_secrets': [],
            'available_secrets': [],
            'provider_summary': {}
        }
        
        for secret_name in required_secrets:
            secret_info = self.get_secret_info(secret_name)
            
            if secret_info['available']:
                results['available_secrets'].append(secret_info)
            else:
                results['missing_secrets'].append(secret_name)
                results['valid'] = False
        
        
        results['provider_summary'] = self.get_provider_status()
        
        return results
    
    def rotate_secret(self, secret_name: str, new_value: str) -> bool:

        logger.warning(f"Secret rotation for '{secret_name}' requested but not implemented")

        return self.refresh_secret(secret_name) is not None


cloud_secret_manager = CloudSecretManager()

def get_cloud_secret(secret_name: str, default: Optional[str] = None) -> Optional[str]:

    value = cloud_secret_manager.get_secret(secret_name)
    return value if value is not None else default

def validate_cloud_secrets(required_secrets: List[str]) -> bool:

    validation = cloud_secret_manager.validate_secrets(required_secrets)
    
    if not validation['valid']:
        logger.error(f"Missing required secrets: {validation['missing_secrets']}")
        return False
    
    logger.info(f"All {len(required_secrets)} required secrets are available")
    return True

def get_secret_provider_status() -> Dict[str, Any]:
    
    return cloud_secret_manager.get_provider_status()
