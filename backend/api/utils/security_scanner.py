
import os
import re
import json
from pathlib import Path
from typing import Dict, List, Any, Set
from api.utils.secret_manager import secret_manager
from api.core import logger

class SecurityScanner:
    
    
    
    SCANNABLE_EXTENSIONS = {'.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.yaml', '.yml', '.env'}
    
   
    SKIP_DIRECTORIES = {
        '__pycache__', '.git', 'node_modules', '.venv', 'venv', 
        'build', 'dist', '.pytest_cache', 'coverage', '.coverage'
    }
    
    
    SKIP_FILES = {
        'secret_manager.py',
        'security_scanner.py',
        'test_secrets.py',
    }
    
    
    SAFE_PATTERNS = [
        r'test[_-]?(key|secret|token)',
        r'example[_-]?(key|secret|token)',
        r'dummy[_-]?(key|secret|token)',
        r'placeholder[_-]?(key|secret|token)',
        r'your[_-]?(key|secret|token)',
        r'insert[_-]?(key|secret|token)',
        r'<(key|secret|token)>',
        r'\{(key|secret|token)\}',
        r'\$(key|secret|token)',
    ]
    
    def __init__(self, root_path: str = '.'):
        self.root_path = Path(root_path).resolve()
        self.scan_results = {
            'hardcoded_secrets': [],
            'security_issues': [],
            'environment_issues': [],
            'file_permission_issues': [],
            'total_files_scanned': 0,
            'scan_summary': {}
        }
    
    def run_full_scan(self) -> Dict[str, Any]:
        
        logger.info("Starting comprehensive security scan...")
        
        
        self._scan_for_secrets()
        
        
        self._check_environment_security()
        
       
        self._check_file_permissions()
        
        
        self._check_git_security()
        
        
        self._generate_scan_summary()
        
        logger.info(f"Security scan completed. Scanned {self.scan_results['total_files_scanned']} files.")
        
        return self.scan_results
    
    def _scan_for_secrets(self) -> None:
        
        logger.info("Scanning for hardcoded secrets...")
        
        for file_path in self._get_scannable_files():
            try:
                findings = secret_manager.scan_code_for_secrets(str(file_path))
                
                if findings['potential_secrets'] or findings['hardcoded_patterns']:
                    
                    filtered_secrets = self._filter_safe_secrets(findings['potential_secrets'])
                    filtered_patterns = self._filter_safe_patterns(findings['hardcoded_patterns'])
                    
                    if filtered_secrets or filtered_patterns:
                        self.scan_results['hardcoded_secrets'].append({
                            'file': str(file_path.relative_to(self.root_path)),
                            'secrets': filtered_secrets,
                            'patterns': filtered_patterns
                        })
                
                self.scan_results['total_files_scanned'] += 1
                
            except Exception as e:
                logger.error(f"Error scanning {file_path}: {str(e)}")
    
    def _check_environment_security(self) -> None:
        
        logger.info("Checking environment security...")
        
        issues = []
        
       
        env_file = self.root_path / '.env'
        if env_file.exists():
            issues.append({
                'type': 'env_file_present',
                'severity': 'high',
                'message': '.env file found in repository - should be in .gitignore',
                'file': str(env_file.relative_to(self.root_path))
            })
        
        
        gitignore_file = self.root_path / '.gitignore'
        if gitignore_file.exists():
            with open(gitignore_file, 'r') as f:
                gitignore_content = f.read()
                
                required_ignores = ['.env', '*.env', 'firebase_service_key.json', '*.key', '*.pem']
                for ignore_pattern in required_ignores:
                    if ignore_pattern not in gitignore_content:
                        issues.append({
                            'type': 'missing_gitignore_entry',
                            'severity': 'medium',
                            'message': f"'{ignore_pattern}' should be in .gitignore",
                            'pattern': ignore_pattern
                        })
        else:
            issues.append({
                'type': 'missing_gitignore',
                'severity': 'high',
                'message': '.gitignore file not found - sensitive files may be committed'
            })
        
        
        secret_files = [
            'firebase_service_key.json',
            'google-credentials.json',
            'aws-credentials.json',
            'private.key',
            'certificate.pem'
        ]
        
        for secret_file in secret_files:
            file_path = self.root_path / secret_file
            if file_path.exists():
                issues.append({
                    'type': 'secret_file_present',
                    'severity': 'critical',
                    'message': f"Secret file '{secret_file}' found in repository",
                    'file': str(file_path.relative_to(self.root_path))
                })
        
        self.scan_results['environment_issues'] = issues
    
    def _check_file_permissions(self) -> None:
        
        logger.info("Checking file permissions...")
        
        issues = []
        
        
        for file_path in self.root_path.rglob('*'):
            if file_path.is_file() and not self._should_skip_path(file_path):
                try:
                    
                    if hasattr(os, 'stat'):
                        file_stat = file_path.stat()
                       
                        if file_stat.st_mode & 0o004:  
                            if self._file_might_contain_secrets(file_path):
                                issues.append({
                                    'type': 'permissive_secret_file',
                                    'severity': 'medium',
                                    'message': f"File with potential secrets is world-readable",
                                    'file': str(file_path.relative_to(self.root_path)),
                                    'permissions': oct(file_stat.st_mode)
                                })
                except Exception:
                    pass  
        
        self.scan_results['file_permission_issues'] = issues
    
    def _check_git_security(self) -> None:
        
        logger.info("Checking git security...")
        
        issues = []
        
       
        git_dir = self.root_path / '.git'
        if git_dir.exists():
           
            git_config_file = git_dir / 'config'
            if git_config_file.exists():
                try:
                    with open(git_config_file, 'r') as f:
                        git_config = f.read()
                        
                        
                        url_pattern = r'url\s*=\s*https?://([^:]+):([^@]+)@'
                        if re.search(url_pattern, git_config):
                            issues.append({
                                'type': 'git_credentials_in_url',
                                'severity': 'high',
                                'message': 'Git remote URL contains embedded credentials'
                            })
                
                except Exception as e:
                    logger.warning(f"Could not read git config: {str(e)}")
        
        self.scan_results['security_issues'].extend(issues)
    
    def _get_scannable_files(self) -> List[Path]:
        
        scannable_files = []
        
        for file_path in self.root_path.rglob('*'):
            if (file_path.is_file() and 
                file_path.suffix in self.SCANNABLE_EXTENSIONS and
                not self._should_skip_path(file_path)):
                scannable_files.append(file_path)
        
        return scannable_files
    
    def _should_skip_path(self, path: Path) -> bool:
        
        for part in path.parts:
            if part in self.SKIP_DIRECTORIES:
                return True
        
        
        if path.name in self.SKIP_FILES:
            return True
        
        return False
    
    def _filter_safe_secrets(self, secrets: List[Dict]) -> List[Dict]:
        
        filtered = []
        
        for secret in secrets:
            is_safe = False
            for safe_pattern in self.SAFE_PATTERNS:
                if re.search(safe_pattern, secret['context'], re.IGNORECASE):
                    is_safe = True
                    break
            
            if not is_safe:
                filtered.append(secret)
        
        return filtered
    
    def _filter_safe_patterns(self, patterns: List[Dict]) -> List[Dict]:
       
        filtered = []
        
        for pattern in patterns:
            is_safe = False
            for safe_pattern in self.SAFE_PATTERNS:
                if re.search(safe_pattern, pattern['content'], re.IGNORECASE):
                    is_safe = True
                    break
            
            if not is_safe:
                filtered.append(pattern)
        
        return filtered
    
    def _file_might_contain_secrets(self, file_path: Path) -> bool:
       
        sensitive_names = ['config', 'secret', 'key', 'credential', 'env', 'private']
        sensitive_extensions = {'.env', '.key', '.pem', '.json', '.yaml', '.yml'}
        
        
        filename_lower = file_path.name.lower()
        if any(name in filename_lower for name in sensitive_names):
            return True
        
        
        if file_path.suffix in sensitive_extensions:
            return True
        
        return False
    
    def _generate_scan_summary(self) -> None:
        
        summary = {
            'total_files_scanned': self.scan_results['total_files_scanned'],
            'hardcoded_secrets_found': len(self.scan_results['hardcoded_secrets']),
            'environment_issues_found': len(self.scan_results['environment_issues']),
            'security_issues_found': len(self.scan_results['security_issues']),
            'file_permission_issues_found': len(self.scan_results['file_permission_issues']),
            'critical_issues': 0,
            'high_issues': 0,
            'medium_issues': 0,
            'low_issues': 0
        }
        
        
        all_issues = (
            self.scan_results['environment_issues'] + 
            self.scan_results['security_issues'] + 
            self.scan_results['file_permission_issues']
        )
        
        for issue in all_issues:
            severity = issue.get('severity', 'low')
            summary[f'{severity}_issues'] += 1
        
        summary['total_issues'] = summary['critical_issues'] + summary['high_issues'] + summary['medium_issues'] + summary['low_issues']
        summary['scan_status'] = 'clean' if summary['total_issues'] == 0 else 'issues_found'
        
        self.scan_results['scan_summary'] = summary
    
    def generate_report(self) -> str:
        
        summary = self.scan_results['scan_summary']
        
        report = f"""
=== SECURITY SCAN REPORT ===

Scan Summary:
- Files Scanned: {summary['total_files_scanned']}
- Total Issues: {summary['total_issues']}
- Critical: {summary['critical_issues']}
- High: {summary['high_issues']}
- Medium: {summary['medium_issues']}
- Low: {summary['low_issues']}

Status: {summary['scan_status'].upper()}

"""
        
        if self.scan_results['hardcoded_secrets']:
            report += "\n🔐 HARDCODED SECRETS DETECTED:\n"
            for item in self.scan_results['hardcoded_secrets']:
                report += f"  File: {item['file']}\n"
                for secret in item['secrets']:
                    report += f"    Line {secret['line']}: {secret['context']}\n"
        
        if self.scan_results['environment_issues']:
            report += "\n⚠️ ENVIRONMENT ISSUES:\n"
            for issue in self.scan_results['environment_issues']:
                report += f"  [{issue['severity'].upper()}] {issue['message']}\n"
        
        if self.scan_results['security_issues']:
            report += "\n🚨 SECURITY ISSUES:\n"
            for issue in self.scan_results['security_issues']:
                report += f"  [{issue['severity'].upper()}] {issue['message']}\n"
        
        if summary['scan_status'] == 'clean':
            report += "\n✅ No security issues detected!\n"
        
        return report


security_scanner = SecurityScanner()

def run_security_scan() -> Dict[str, Any]:
    
    return security_scanner.run_full_scan()

def scan_for_secrets_only() -> List[Dict[str, Any]]:
    
    scanner = SecurityScanner()
    scanner._scan_for_secrets()
    return scanner.scan_results['hardcoded_secrets']
