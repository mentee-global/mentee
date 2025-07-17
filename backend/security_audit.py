#!/usr/bin/env python3
"""
Security audit script for the mentee application.
Run this script to check for security vulnerabilities and hardcoded secrets.
"""

import sys
import os
import argparse
import json
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from api.utils.security_scanner import run_security_scan, scan_for_secrets_only
from api.utils.secret_manager import secret_manager
from api.core import logger

def main():
    """Main function for security audit script."""
    parser = argparse.ArgumentParser(description='Security audit tool for mentee application')
    parser.add_argument(
        '--scan-type', 
        choices=['full', 'secrets', 'environment'],
        default='full',
        help='Type of scan to perform (default: full)'
    )
    parser.add_argument(
        '--output-format',
        choices=['text', 'json'],
        default='text',
        help='Output format (default: text)'
    )
    parser.add_argument(
        '--output-file',
        help='Save results to file'
    )
    parser.add_argument(
        '--fail-on-issues',
        action='store_true',
        help='Exit with non-zero code if issues are found'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Verbose output'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel('DEBUG')
    
    print("🔒 Starting Security Audit...")
    print(f"Scan Type: {args.scan_type}")
    print(f"Output Format: {args.output_format}")
    print("-" * 50)
    
    try:
        if args.scan_type == 'full':
            results = run_security_scan()
        elif args.scan_type == 'secrets':
            results = {'hardcoded_secrets': scan_for_secrets_only()}
        elif args.scan_type == 'environment':
            env_validation = secret_manager.validate_environment_setup()
            results = {'environment_validation': env_validation}
        
        # Generate output
        if args.output_format == 'json':
            output = json.dumps(results, indent=2)
        else:
            if args.scan_type == 'full':
                from api.utils.security_scanner import security_scanner
                output = security_scanner.generate_report()
            elif args.scan_type == 'secrets':
                output = generate_secrets_report(results['hardcoded_secrets'])
            elif args.scan_type == 'environment':
                output = generate_environment_report(results['environment_validation'])
        
        # Output results
        if args.output_file:
            with open(args.output_file, 'w') as f:
                f.write(output)
            print(f"Results saved to: {args.output_file}")
        else:
            print(output)
        
        # Check if we should fail on issues
        if args.fail_on_issues:
            if args.scan_type == 'full':
                summary = results.get('scan_summary', {})
                if summary.get('total_issues', 0) > 0:
                    print("\n❌ Security issues detected - failing build")
                    sys.exit(1)
            elif args.scan_type == 'secrets':
                if results['hardcoded_secrets']:
                    print("\n❌ Hardcoded secrets detected - failing build")
                    sys.exit(1)
            elif args.scan_type == 'environment':
                env_status = results['environment_validation'].get('status', 'error')
                if env_status == 'error':
                    print("\n❌ Environment validation failed - failing build")
                    sys.exit(1)
        
        print("\n✅ Security audit completed successfully")
        
    except Exception as e:
        print(f"\n❌ Security audit failed: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

def generate_secrets_report(hardcoded_secrets):
    """Generate a report for hardcoded secrets scan."""
    if not hardcoded_secrets:
        return "✅ No hardcoded secrets detected!"
    
    report = "🔐 HARDCODED SECRETS DETECTED:\n\n"
    for item in hardcoded_secrets:
        report += f"File: {item['file']}\n"
        for secret in item['secrets']:
            report += f"  Line {secret['line']}: {secret['context']}\n"
        report += "\n"
    
    return report

def generate_environment_report(env_validation):
    """Generate a report for environment validation."""
    status = env_validation.get('status', 'unknown')
    report = f"Environment Validation Status: {status.upper()}\n\n"
    
    if env_validation.get('errors'):
        report += "❌ ERRORS:\n"
        for error in env_validation['errors']:
            report += f"  - {error}\n"
        report += "\n"
    
    if env_validation.get('warnings'):
        report += "⚠️ WARNINGS:\n"
        for warning in env_validation['warnings']:
            report += f"  - {warning}\n"
        report += "\n"
    
    if env_validation.get('recommendations'):
        report += "💡 RECOMMENDATIONS:\n"
        for rec in env_validation['recommendations']:
            report += f"  - {rec}\n"
        report += "\n"
    
    if status == 'success':
        report += "✅ Environment configuration is secure!\n"
    
    return report

if __name__ == '__main__':
    main()
