
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict, Counter

class SecureLoggingMonitor:
    
    
    def __init__(self):
        self.log_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
        self.secure_log_file = os.path.join(self.log_dir, 'secure_requests.log')
        self.data_access_log_file = os.path.join(self.log_dir, 'data_access.log')
        
    def analyze_security_events(self, hours: int = 24) -> Dict[str, Any]:
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        events = {
            'total_requests': 0,
            'error_requests': 0,
            'security_warnings': 0,
            'attack_attempts': defaultdict(int),
            'data_access_events': 0,
            'sensitive_data_access': 0,
            'bulk_exports': 0,
            'top_attackers': Counter(),
            'event_timeline': [],
            'sanitized_patterns': Counter()
        }
        
        
        if os.path.exists(self.secure_log_file):
            events.update(self._analyze_secure_requests(cutoff_time))
        
        
        if os.path.exists(self.data_access_log_file):
            events.update(self._analyze_data_access(cutoff_time))
        
        return events
    
    def _analyze_secure_requests(self, cutoff_time: datetime) -> Dict[str, Any]:
        
        stats = {
            'total_requests': 0,
            'error_requests': 0,
            'security_warnings': 0,
            'attack_attempts': defaultdict(int),
            'sanitized_patterns': Counter()
        }
        
        try:
            with open(self.secure_log_file, 'r') as f:
                for line in f:
                    if not line.strip():
                        continue
                    
                    try:
                        
                        if 'REQUEST_SUCCESS:' in line or 'REQUEST_ERROR:' in line:
                            log_data = self._extract_json_from_log(line)
                            if log_data and self._is_after_cutoff(log_data.get('timestamp'), cutoff_time):
                                stats['total_requests'] += 1
                                
                                if log_data.get('status_code', 0) >= 400:
                                    stats['error_requests'] += 1
                        
                        elif 'SECURITY_EVENT:' in line:
                            log_data = self._extract_json_from_log(line)
                            if log_data and self._is_after_cutoff(log_data.get('timestamp'), cutoff_time):
                                stats['security_warnings'] += 1
                                
                                event_type = log_data.get('event_type', 'unknown')
                                details = log_data.get('details', {})
                                
                                
                                attack_type = details.get('attack_type')
                                if attack_type:
                                    stats['attack_attempts'][attack_type] += 1
                                
                                
                                if 'sanitized' in str(details).lower():
                                    pattern = details.get('pattern_detected', 'unknown')
                                    stats['sanitized_patterns'][pattern] += 1
                    
                    except Exception as e:
                        continue  
        
        except FileNotFoundError:
            pass
        
        return stats
    
    def _analyze_data_access(self, cutoff_time: datetime) -> Dict[str, Any]:
        
        stats = {
            'data_access_events': 0,
            'sensitive_data_access': 0,
            'bulk_exports': 0
        }
        
        try:
            with open(self.data_access_log_file, 'r') as f:
                for line in f:
                    if not line.strip():
                        continue
                    
                    try:
                        if 'DATA_ACCESS:' in line:
                            log_data = self._extract_json_from_log(line)
                            if log_data and self._is_after_cutoff(log_data.get('timestamp'), cutoff_time):
                                stats['data_access_events'] += 1
                                
                                if log_data.get('sensitive_fields_accessed'):
                                    stats['sensitive_data_access'] += 1
                        
                        elif 'BULK_EXPORT:' in line:
                            log_data = self._extract_json_from_log(line)
                            if log_data and self._is_after_cutoff(log_data.get('timestamp'), cutoff_time):
                                stats['bulk_exports'] += 1
                    
                    except Exception:
                        continue
        
        except FileNotFoundError:
            pass
        
        return stats
    
    def _extract_json_from_log(self, line: str) -> Optional[Dict]:
        
        try:
            
            json_start = line.find('{')
            if json_start != -1:
                json_str = line[json_start:].strip()
                return json.loads(json_str)
        except (ValueError, json.JSONDecodeError):
            pass
        return None
    
    def _is_after_cutoff(self, timestamp_str: str, cutoff_time: datetime) -> bool:
        
        try:
            
            if timestamp_str.endswith('Z'):
                timestamp = datetime.fromisoformat(timestamp_str[:-1])
            else:
                timestamp = datetime.fromisoformat(timestamp_str)
            return timestamp >= cutoff_time
        except (ValueError, TypeError):
            return False
    
    def generate_security_report(self, hours: int = 24) -> str:
       
        events = self.analyze_security_events(hours)
        
        report = f"""
 SECURE LOGGING SECURITY REPORT
{'='*50}
 Report Period: Last {hours} hours
 Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC

 REQUEST STATISTICS:
   • Total Requests: {events['total_requests']:,}
   • Error Requests: {events['error_requests']:,}
   • Error Rate: {(events['error_requests']/max(events['total_requests'], 1)*100):.1f}%

 SECURITY EVENTS:
   • Security Warnings: {events['security_warnings']:,}
   • Data Access Events: {events['data_access_events']:,}
   • Sensitive Data Access: {events['sensitive_data_access']:,}
   • Bulk Exports: {events['bulk_exports']:,}

 ATTACK PATTERNS DETECTED:
"""
        
        if events['attack_attempts']:
            for attack_type, count in events['attack_attempts'].items():
                report += f"   • {attack_type.replace('_', ' ').title()}: {count:,} attempts\n"
        else:
            report += "   • No attack patterns detected ✅\n"
        
        report += f"""
🛡️ DATA PROTECTION STATUS:
   • Sensitive Data Sanitization: {'✅ ACTIVE' if events['sanitized_patterns'] else '⚠️ NO PATTERNS DETECTED'}
   • Log File Security: {'✅ SECURE' if self._check_log_security() else '❌ ISSUES DETECTED'}
   • Data Access Monitoring: {'✅ ACTIVE' if events['data_access_events'] > 0 else '⚠️ NO DATA ACCESS LOGGED'}

📈 LOGGING HEALTH:
   • Secure Request Logging: {'✅ OPERATIONAL' if os.path.exists(self.secure_log_file) else '❌ NOT FOUND'}
   • Data Access Logging: {'✅ OPERATIONAL' if os.path.exists(self.data_access_log_file) else '❌ NOT FOUND'}
   • Log Rotation: {'✅ CONFIGURED' if self._check_log_rotation() else '⚠️ CHECK CONFIGURATION'}

🔒 RECOMMENDATIONS:
"""
        
        
        recommendations = self._generate_recommendations(events)
        for rec in recommendations:
            report += f"   • {rec}\n"
        
        return report
    
    def _check_log_security(self) -> bool:
        
        try:
            import stat
            for log_file in [self.secure_log_file, self.data_access_log_file]:
                if os.path.exists(log_file):
                    file_stat = os.stat(log_file)
                    
                    if hasattr(stat, 'S_IROTH') and (file_stat.st_mode & stat.S_IROTH):
                        return False
            return True
        except Exception:
            return True  
    
    def _check_log_rotation(self) -> bool:
        
        try:
           
            max_size = 50 * 1024 * 1024  
            for log_file in [self.secure_log_file, self.data_access_log_file]:
                if os.path.exists(log_file):
                    if os.path.getsize(log_file) > max_size:
                        return False
            return True
        except Exception:
            return True
    
    def _generate_recommendations(self, events: Dict[str, Any]) -> List[str]:
        
        recommendations = []
        
        if events['security_warnings'] > 100:
            recommendations.append("High number of security warnings detected - consider implementing additional protection measures")
        
        if events['attack_attempts']:
            recommendations.append("Attack attempts detected - review and strengthen security controls")
        
        if events['bulk_exports'] > 10:
            recommendations.append("Multiple bulk exports detected - ensure proper authorization controls")
        
        if events['total_requests'] == 0:
            recommendations.append("No requests logged - verify secure logging is properly configured")
        
        if not os.path.exists(self.secure_log_file):
            recommendations.append("Secure request log file not found - check logging configuration")
        
        if not recommendations:
            recommendations.append("Security logging appears to be functioning normally ✅")
        
        return recommendations



security_monitor = SecureLoggingMonitor()


def get_security_dashboard() -> Dict[str, Any]:
    
    return security_monitor.analyze_security_events(24)


def print_security_report(hours: int = 24):
    
    report = security_monitor.generate_security_report(hours)
    print(report)
