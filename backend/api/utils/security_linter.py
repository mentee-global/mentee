import logging
import subprocess
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class SecurityIssue:
    severity: str
    confidence: str
    issue_type: str
    filename: str
    line_number: int
    code: str
    message: str
    test_name: str

class SecurityScanner:
    def __init__(self, project_root: Optional[str] = None):
        self.project_root = Path(project_root) if project_root else Path.cwd()
        self.results = {}
        self.tools_available = self._check_available_tools()

    def _check_available_tools(self) -> Dict[str, bool]:
        tools = {}

        try:
            subprocess.run(['bandit', '--version'], 
                         capture_output=True, check=True)
            tools['bandit'] = True
        except (subprocess.CalledProcessError, FileNotFoundError):
            tools['bandit'] = False

        try:
            subprocess.run(['safety', '--version'], 
                         capture_output=True, check=True)
            tools['safety'] = True
        except (subprocess.CalledProcessError, FileNotFoundError):
            tools['safety'] = False

        try:
            subprocess.run(['semgrep', '--version'], 
                         capture_output=True, check=True)
            tools['semgrep'] = True
        except (subprocess.CalledProcessError, FileNotFoundError):
            tools['semgrep'] = False

        return tools

    def run_bandit_scan(self, target_path: Optional[str] = None) -> List[SecurityIssue]:
        if not self.tools_available.get('bandit', False):
            logger.warning("Bandit is not available. Install with: pip install bandit")
            return []

        target = target_path or str(self.project_root)
        issues = []

        try:
            cmd = [
                'bandit', '-r', target,
                '-f', 'json',
                '--skip', 'B101',
                '--exclude', '*/tests/*,*/venv/*,*/node_modules/*'
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode in [0, 1]:
                data = json.loads(result.stdout)

                for result_item in data.get('results', []):
                    issue = SecurityIssue(
                        severity=result_item.get('issue_severity', 'UNKNOWN'),
                        confidence=result_item.get('issue_confidence', 'UNKNOWN'),
                        issue_type=result_item.get('test_name', 'UNKNOWN'),
                        filename=result_item.get('filename', ''),
                        line_number=result_item.get('line_number', 0),
                        code=result_item.get('code', ''),
                        message=result_item.get('issue_text', ''),
                        test_name=result_item.get('test_id', '')
                    )
                    issues.append(issue)

                logger.info(f"Bandit scan completed. Found {len(issues)} issues.")
            else:
                logger.error(f"Bandit scan failed: {result.stderr}")

        except Exception as e:
            logger.error(f"Error running Bandit scan: {str(e)}")

        return issues

    def run_safety_scan(self) -> List[Dict[str, Any]]:
        if not self.tools_available.get('safety', False):
            logger.warning("Safety is not available. Install with: pip install safety")
            return []

        vulnerabilities = []

        try:
            cmd = ['safety', 'check', '--json']
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                logger.info("Safety scan completed. No vulnerabilities found.")
            else:
                try:
                    vulnerabilities = json.loads(result.stdout)
                    logger.warning(f"Safety scan found {len(vulnerabilities)} vulnerabilities")
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse Safety output: {result.stdout}")

        except Exception as e:
            logger.error(f"Error running Safety scan: {str(e)}")

        return vulnerabilities

    def run_custom_security_checks(self) -> List[Dict[str, Any]]:
        issues = []

        try:
            issues.extend(self._check_hardcoded_secrets())
            issues.extend(self._check_insecure_configurations())
            issues.extend(self._check_security_headers())
            issues.extend(self._check_crypto_usage())

        except Exception as e:
            logger.error(f"Error in custom security checks: {str(e)}")

        return issues

    def _check_hardcoded_secrets(self) -> List[Dict[str, Any]]:
        issues = []

        secret_patterns = [
            (r'api[_-]?key\s*=\s*["\"][^"\"]{20,}["\"]', 'Potential API key'),
            (r'secret[_-]?key\s*=\s*["\"][^"\"]{20,}["\"]', 'Potential secret key'),
            (r'password\s*=\s*["\"][^"\"]{8,}["\"]', 'Potential hardcoded password'),
            (r'token\s*=\s*["\"][^"\"]{20,}["\"]', 'Potential hardcoded token'),
            (r'["\"][A-Za-z0-9]{32,}["\"]', 'Potential hardcoded credential'),
        ]

        import re

        for py_file in self.project_root.rglob('*.py'):
            if 'venv' in str(py_file) or '__pycache__' in str(py_file):
                continue

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                for pattern, description in secret_patterns:
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        line_num = content[:match.start()].count('\n') + 1
                        issues.append({
                            'type': 'hardcoded_secret',
                            'severity': 'HIGH',
                            'file': str(py_file),
                            'line': line_num,
                            'description': description,
                            'code': match.group()
                        })
            except Exception as e:
                logger.debug(f"Could not scan {py_file}: {str(e)}")

        return issues

    def _check_insecure_configurations(self) -> List[Dict[str, Any]]:
        issues = []

        config_patterns = [
            (r'DEBUG\s*=\s*True', 'Debug mode enabled in production'),
            (r'SECRET_KEY\s*=\s*["\"].*["\"]', 'Hardcoded secret key'),
            (r'SSL_DISABLE\s*=\s*True', 'SSL disabled'),
            (r'TESTING\s*=\s*True', 'Testing mode in production'),
        ]

        import re

        for config_file in self.project_root.rglob('*.py'):
            if 'config' in str(config_file).lower():
                try:
                    with open(config_file, 'r', encoding='utf-8') as f:
                        content = f.read()

                    for pattern, description in config_patterns:
                        matches = re.finditer(pattern, content, re.IGNORECASE)
                        for match in matches:
                            line_num = content[:match.start()].count('\n') + 1
                            issues.append({
                                'type': 'insecure_config',
                                'severity': 'MEDIUM',
                                'file': str(config_file),
                                'line': line_num,
                                'description': description,
                                'code': match.group()
                            })
                except Exception as e:
                    logger.debug(f"Could not scan {config_file}: {str(e)}")

        return issues

    def _check_security_headers(self) -> List[Dict[str, Any]]:
        issues = []

        security_headers_found = False

        for py_file in self.project_root.rglob('*.py'):
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                if any(header in content for header in [
                    'X-Frame-Options', 'X-Content-Type-Options', 
                    'X-XSS-Protection', 'Strict-Transport-Security'
                ]):
                    security_headers_found = True
                    break
            except Exception:
                continue

        if not security_headers_found:
            issues.append({
                'type': 'missing_security_headers',
                'severity': 'MEDIUM',
                'file': 'application',
                'line': 0,
                'description': 'Security headers not configured',
                'code': 'Missing security headers configuration'
            })

        return issues

    def _check_crypto_usage(self) -> List[Dict[str, Any]]:
        issues = []

        weak_crypto_patterns = [
            (r'md5\s*\(', 'MD5 hash algorithm is cryptographically weak'),
            (r'sha1\s*\(', 'SHA1 hash algorithm is cryptographically weak'),
            (r'DES\s*\(', 'DES encryption is weak'),
            (r'RC4\s*\(', 'RC4 cipher is weak'),
        ]

        import re

        for py_file in self.project_root.rglob('*.py'):
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                for pattern, description in weak_crypto_patterns:
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        line_num = content[:match.start()].count('\n') + 1
                        issues.append({
                            'type': 'weak_crypto',
                            'severity': 'HIGH',
                            'file': str(py_file),
                            'line': line_num,
                            'description': description,
                            'code': match.group()
                        })
            except Exception:
                continue

        return issues

    def run_comprehensive_scan(self) -> Dict[str, Any]:
        logger.info("Starting comprehensive security scan...")

        results = {
            'timestamp': datetime.now().isoformat(),
            'tools_used': list(self.tools_available.keys()),
            'bandit_issues': [],
            'safety_vulnerabilities': [],
            'custom_issues': [],
            'summary': {}
        }

        if self.tools_available.get('bandit', False):
            bandit_issues = self.run_bandit_scan()
            results['bandit_issues'] = [
                {
                    'severity': issue.severity,
                    'confidence': issue.confidence,
                    'type': issue.issue_type,
                    'file': issue.filename,
                    'line': issue.line_number,
                    'message': issue.message,
                    'code': issue.code
                }
                for issue in bandit_issues
            ]

        if self.tools_available.get('safety', False):
            results['safety_vulnerabilities'] = self.run_safety_scan()

        results['custom_issues'] = self.run_custom_security_checks()

        results['summary'] = self._generate_summary(results)

        logger.info(f"Security scan completed. Found {results['summary']['total_issues']} total issues.")

        return results

    def _generate_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        total_issues = (
            len(results['bandit_issues']) +
            len(results['safety_vulnerabilities']) +
            len(results['custom_issues'])
        )

        severity_counts = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}

        for issue in results['bandit_issues']:
            severity = issue.get('severity', 'UNKNOWN')
            if severity in severity_counts:
                severity_counts[severity] += 1

        for issue in results['custom_issues']:
            severity = issue.get('severity', 'UNKNOWN')
            if severity in severity_counts:
                severity_counts[severity] += 1

        severity_counts['HIGH'] += len(results['safety_vulnerabilities'])

        return {
            'total_issues': total_issues,
            'severity_breakdown': severity_counts,
            'tools_available': self.tools_available,
            'scan_date': datetime.now().isoformat()
        }

    def save_results(self, filename: str = 'security_scan_results.json'):
        if not self.results:
            logger.warning("No scan results to save. Run scan first.")
            return

        try:
            with open(filename, 'w') as f:
                json.dump(self.results, f, indent=2, default=str)
            logger.info(f"Security scan results saved to {filename}")
        except Exception as e:
            logger.error(f"Failed to save results: {str(e)}")

def install_security_tools():
    tools = [
        ('bandit', 'bandit[toml]'),
        ('safety', 'safety'),
    ]

    for tool_name, package_name in tools:
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', package_name], 
                         check=True, capture_output=True)
            logger.info(f"Successfully installed {tool_name}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install {tool_name}: {e}")

def create_bandit_config():
    config_content = """
[bandit]
exclude_dirs = ["tests", "venv", "node_modules", "__pycache__"]
skips = ["B101"]

[bandit.assert_used]
exclude = ["*_test.py", "test_*.py"]
"""

    try:
        with open('.bandit', 'w') as f:
            f.write(config_content)
        logger.info("Created .bandit configuration file")
    except Exception as e:
        logger.error(f"Failed to create Bandit config: {str(e)}")

def setup_pre_commit_hooks():
    pre_commit_config = """
repos:
  - repo: https://github.com/PyCQA/bandit
    rev: '1.7.5'
    hooks:
      - id: bandit
        args: ['-c', '.bandit']

  - repo: https://github.com/gitpython-developers/GitPython
    rev: '3.1.31'
    hooks:
      - id: safety
"""

    try:
        with open('.pre-commit-config.yaml', 'w') as f:
            f.write(pre_commit_config)
        logger.info("Created pre-commit configuration")

        subprocess.run(['pre-commit', 'install'], check=True, capture_output=True)
        logger.info("Installed pre-commit hooks")
    except Exception as e:
        logger.error(f"Failed to setup pre-commit hooks: {str(e)}")

def main():
    scanner = SecurityScanner()

    results = scanner.run_comprehensive_scan()
    scanner.results = results

    scanner.save_results()

    summary = results['summary']
    print(f"\n🛡️ Security Scan Summary:")
    print(f"Total Issues: {summary['total_issues']}")
    print(f"High Severity: {summary['severity_breakdown']['HIGH']}")
    print(f"Medium Severity: {summary['severity_breakdown']['MEDIUM']}")
    print(f"Low Severity: {summary['severity_breakdown']['LOW']}")

    if summary['severity_breakdown']['HIGH'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
