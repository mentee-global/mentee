
import os
import subprocess
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from pathlib import Path
from api.utils.secure_config import get_config, is_production


logger = logging.getLogger(__name__)

class CertificateManager:
    
    
    def __init__(self):
        self.cert_config = self._load_cert_config()
        self.cert_dir = Path(self.cert_config['cert_directory'])
        self.cert_dir.mkdir(parents=True, exist_ok=True)
    
    def _load_cert_config(self) -> Dict[str, Any]:
        
        return {
            'cert_directory': get_config('SSL_CERT_DIR', '/etc/ssl/certs/mentee'),
            'key_directory': get_config('SSL_KEY_DIR', '/etc/ssl/private/mentee'),
            'domain_names': [d.strip() for d in get_config('SSL_DOMAINS', '').split(',') if d.strip()],
            'email': get_config('SSL_EMAIL', ''),
            'provider': get_config('SSL_CERT_PROVIDER', 'letsencrypt'),
            'auto_renew': get_config('SSL_AUTO_RENEW', 'true').lower() == 'true',
            'staging': get_config('SSL_STAGING', 'false').lower() == 'true',
            'key_size': int(get_config('SSL_KEY_SIZE', '2048')),
            'renewal_days': int(get_config('SSL_RENEWAL_DAYS', '30')),
            'validation_method': get_config('SSL_VALIDATION', 'http'),  
            'webroot_path': get_config('SSL_WEBROOT', '/var/www/html/.well-known/acme-challenge')
        }
    
    def generate_self_signed_cert(self, domain: str = 'localhost') -> Dict[str, str]:
        """Generate self-signed certificate for development."""
        logger.info(f"Generating self-signed certificate for {domain}")
        
        cert_path = self.cert_dir / f"{domain}.crt"
        key_path = Path(self.cert_config['key_directory']) / f"{domain}.key"
        
        
        key_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            
            subprocess.run([
                'openssl', 'genrsa', '-out', str(key_path), str(self.cert_config['key_size'])
            ], check=True, capture_output=True)
            
            
            subprocess.run([
                'openssl', 'req', '-new', '-x509', '-key', str(key_path),
                '-out', str(cert_path), '-days', '365',
                '-subj', f'/CN={domain}/O=Mentee Dev/C=US'
            ], check=True, capture_output=True)
            
            
            os.chmod(key_path, 0o600)
            os.chmod(cert_path, 0o644)
            
            logger.info(f"Self-signed certificate generated: {cert_path}")
            
            return {
                'cert_path': str(cert_path),
                'key_path': str(key_path),
                'type': 'self-signed',
                'domain': domain,
                'expires': (datetime.now() + timedelta(days=365)).isoformat()
            }
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to generate self-signed certificate: {e}")
            raise
        except FileNotFoundError:
            logger.error("OpenSSL not found. Please install OpenSSL to generate certificates.")
            raise
    
    def request_letsencrypt_cert(self) -> Dict[str, Any]:
        
        if not self.cert_config['domain_names']:
            raise ValueError("No domain names configured for certificate")
        
        if not self.cert_config['email']:
            raise ValueError("Email address required for Let's Encrypt")
        
        logger.info(f"Requesting Let's Encrypt certificate for domains: {self.cert_config['domain_names']}")
        
        
        cmd = ['certbot', 'certonly', '--non-interactive', '--agree-tos']
        
        
        if self.cert_config['staging']:
            cmd.append('--staging')
            logger.info("Using Let's Encrypt staging environment")
        
        
        cmd.extend(['--email', self.cert_config['email']])
        
        
        for domain in self.cert_config['domain_names']:
            cmd.extend(['-d', domain])
        
        
        if self.cert_config['validation_method'] == 'http':
            cmd.extend(['--webroot', '-w', self.cert_config['webroot_path']])
        elif self.cert_config['validation_method'] == 'dns':
            cmd.append('--manual')
            cmd.append('--preferred-challenges=dns')
        else:
            cmd.append('--standalone')
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            logger.info("Let's Encrypt certificate obtained successfully")
            
            
            primary_domain = self.cert_config['domain_names'][0]
            cert_path = f"/etc/letsencrypt/live/{primary_domain}/fullchain.pem"
            key_path = f"/etc/letsencrypt/live/{primary_domain}/privkey.pem"
            
            return {
                'cert_path': cert_path,
                'key_path': key_path,
                'type': 'letsencrypt',
                'domains': self.cert_config['domain_names'],
                'staging': self.cert_config['staging'],
                'output': result.stdout
            }
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Let's Encrypt certificate request failed: {e.stderr}")
            raise
        except FileNotFoundError:
            logger.error("Certbot not found. Please install Certbot to use Let's Encrypt.")
            raise
    
    def renew_certificates(self) -> Dict[str, Any]:
        
        logger.info("Checking for certificate renewals")
        
        try:
            
            result = subprocess.run([
                'certbot', 'renew', '--dry-run'
            ], check=True, capture_output=True, text=True)
            
            logger.info("Certificate renewal check completed")
            
            
            renewal_result = subprocess.run([
                'certbot', 'renew', '--non-interactive'
            ], check=True, capture_output=True, text=True)
            
            return {
                'success': True,
                'output': renewal_result.stdout,
                'dry_run_output': result.stdout
            }
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Certificate renewal failed: {e.stderr}")
            return {
                'success': False,
                'error': e.stderr,
                'output': e.stdout
            }
    
    def validate_certificate(self, cert_path: str) -> Dict[str, Any]:
        """Validate SSL certificate."""
        validation_result = {
            'valid': False,
            'errors': [],
            'warnings': [],
            'certificate_info': {},
            'expires_in_days': None
        }
        
        if not os.path.exists(cert_path):
            validation_result['errors'].append(f"Certificate file not found: {cert_path}")
            return validation_result
        
        try:
            
            result = subprocess.run([
                'openssl', 'x509', '-in', cert_path, '-text', '-noout'
            ], check=True, capture_output=True, text=True)
            
            cert_text = result.stdout
            
            
            cert_info = self._parse_certificate_info(cert_text)
            validation_result['certificate_info'] = cert_info
            
            
            if 'not_after' in cert_info:
                try:
                    expiry_date = datetime.strptime(cert_info['not_after'], '%b %d %H:%M:%S %Y %Z')
                    days_until_expiry = (expiry_date - datetime.now()).days
                    validation_result['expires_in_days'] = days_until_expiry
                    
                    if days_until_expiry <= 0:
                        validation_result['errors'].append("Certificate has expired")
                    elif days_until_expiry <= self.cert_config['renewal_days']:
                        validation_result['warnings'].append(f"Certificate expires in {days_until_expiry} days")
                    
                except ValueError as e:
                    validation_result['warnings'].append(f"Could not parse expiry date: {e}")
            
            
            if cert_info.get('issuer') == cert_info.get('subject'):
                validation_result['warnings'].append("Certificate is self-signed")
            
            validation_result['valid'] = len(validation_result['errors']) == 0
            
        except subprocess.CalledProcessError as e:
            validation_result['errors'].append(f"Certificate validation failed: {e.stderr}")
        except FileNotFoundError:
            validation_result['errors'].append("OpenSSL not found")
        
        return validation_result
    
    def _parse_certificate_info(self, cert_text: str) -> Dict[str, str]:
        
        info = {}
        
        lines = cert_text.split('\n')
        for line in lines:
            line = line.strip()
            
            if line.startswith('Subject:'):
                info['subject'] = line.replace('Subject:', '').strip()
            elif line.startswith('Issuer:'):
                info['issuer'] = line.replace('Issuer:', '').strip()
            elif 'Not Before:' in line:
                info['not_before'] = line.split('Not Before:')[1].strip()
            elif 'Not After :' in line:
                info['not_after'] = line.split('Not After :')[1].strip()
            elif 'Subject Alternative Name:' in line:
                info['san'] = line.split('Subject Alternative Name:')[1].strip()
        
        return info
    
    def setup_auto_renewal(self) -> bool:
        
        if not self.cert_config['auto_renew']:
            return False
        
        logger.info("Setting up automatic certificate renewal")
        
        
        renewal_script = f"""#!/bin/bash
# Automatic certificate renewal script for Mentee application
certbot renew --non-interactive --quiet
if [ $? -eq 0 ]; then
    # Reload application if renewal was successful
    systemctl reload mentee-app 2>/dev/null || true
    # Or use alternative reload method
    pkill -HUP -f "python.*manage.py" 2>/dev/null || true
fi
"""
        
        script_path = Path('/etc/cron.d/mentee-cert-renewal')
        
        try:
            with open(script_path, 'w') as f:
                f.write(renewal_script)
            
            os.chmod(script_path, 0o755)
            
            
            cron_entry = "0 2,14 * * * root /etc/cron.d/mentee-cert-renewal\n"
            
            with open('/etc/cron.d/mentee-cert-renewal-cron', 'w') as f:
                f.write(cron_entry)
            
            logger.info("Automatic certificate renewal configured")
            return True
            
        except (PermissionError, FileNotFoundError) as e:
            logger.warning(f"Could not setup automatic renewal: {e}")
            return False
    
    def get_certificate_status(self) -> Dict[str, Any]:
        
        status = {
            'certificates': [],
            'auto_renewal_enabled': self.cert_config['auto_renew'],
            'next_renewal_check': None,
            'recommendations': []
        }
        
        
        try:
            result = subprocess.run([
                'certbot', 'certificates'
            ], check=True, capture_output=True, text=True)
            
            
            cert_lines = result.stdout.split('\n')
            for line in cert_lines:
                if 'Certificate Name:' in line:
                    cert_name = line.split(':')[1].strip()
                    
                    
                    cert_path = f"/etc/letsencrypt/live/{cert_name}/fullchain.pem"
                    if os.path.exists(cert_path):
                        validation = self.validate_certificate(cert_path)
                        status['certificates'].append({
                            'name': cert_name,
                            'path': cert_path,
                            'validation': validation,
                            'type': 'letsencrypt'
                        })
        
        except (subprocess.CalledProcessError, FileNotFoundError):
            
            pass
        
        
        for cert_file in self.cert_dir.glob('*.crt'):
            validation = self.validate_certificate(str(cert_file))
            status['certificates'].append({
                'name': cert_file.stem,
                'path': str(cert_file),
                'validation': validation,
                'type': 'self-signed'
            })
        
        
        if not status['certificates']:
            status['recommendations'].append("No SSL certificates found - configure certificates for production")
        
        for cert in status['certificates']:
            if cert['validation']['expires_in_days'] and cert['validation']['expires_in_days'] <= 30:
                status['recommendations'].append(f"Certificate '{cert['name']}' expires soon")
        
        return status


cert_manager = CertificateManager()

def get_or_create_certificate(domain: str = None) -> Dict[str, str]:

    if is_production() and cert_manager.cert_config['domain_names']:
        try:
            
            return cert_manager.request_letsencrypt_cert()
        except Exception as e:
            logger.error(f"Failed to get Let's Encrypt certificate: {e}")
           
            return cert_manager.generate_self_signed_cert(domain or 'localhost')
    else:
       
        return cert_manager.generate_self_signed_cert(domain or 'localhost')

def validate_ssl_setup() -> Dict[str, Any]:
    
    return cert_manager.get_certificate_status()

def setup_certificate_auto_renewal() -> bool:
    
    return cert_manager.setup_auto_renewal()
