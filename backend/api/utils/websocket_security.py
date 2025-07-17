import time
import json
import logging
from functools import wraps
from collections import defaultdict, deque
from typing import Dict, Any, List, Optional, Callable
from flask import request, session
from flask_socketio import disconnect, emit
from api.utils.secure_config import get_config, is_production

logger = logging.getLogger(__name__)

class WebSocketSecurityManager:
    def __init__(self):
        self.config = self._load_config()
        self.rate_limiters = defaultdict(lambda: deque())
        self.blocked_ips = set()
        self.active_connections = {}
        self.message_validators = {}

    def _load_config(self) -> Dict[str, Any]:
        return {
            'max_connections_per_ip': int(get_config('WS_MAX_CONNECTIONS_PER_IP', '10')),
            'max_total_connections': int(get_config('WS_MAX_TOTAL_CONNECTIONS', '1000')),
            'rate_limit_requests': int(get_config('WS_RATE_LIMIT_REQUESTS', '30')),
            'rate_limit_window': int(get_config('WS_RATE_LIMIT_WINDOW', '60')),
            'rate_limit_burst': int(get_config('WS_RATE_LIMIT_BURST', '10')),
            'max_message_size': int(get_config('WS_MAX_MESSAGE_SIZE', '32768')),
            'max_message_rate': int(get_config('WS_MAX_MESSAGE_RATE', '10')),
            'allowed_events': get_config('WS_ALLOWED_EVENTS', '').split(','),
            'allowed_origins': [o.strip() for o in get_config('WS_ALLOWED_ORIGINS', '').split(',') if o.strip()],
            'strict_origin_check': get_config('WS_STRICT_ORIGIN_CHECK', 'true').lower() == 'true',
            'require_auth': get_config('WS_REQUIRE_AUTH', 'true').lower() == 'true',
            'session_timeout': int(get_config('WS_SESSION_TIMEOUT', '3600')),
            'heartbeat_interval': int(get_config('WS_HEARTBEAT_INTERVAL', '30')),
            'log_all_events': get_config('WS_LOG_ALL_EVENTS', 'false').lower() == 'true',
            'security_logging': get_config('WS_SECURITY_LOGGING', 'true').lower() == 'true'
        }

    def validate_origin(self, origin: str) -> bool:
        if not self.config['strict_origin_check']:
            return True
        if not self.config['allowed_origins']:
            if is_production():
                logger.warning("No allowed origins configured in production")
                return False
            else:
                return origin in ['http://localhost:3000', 'http://127.0.0.1:3000', None]
        is_valid = origin in self.config['allowed_origins']
        if not is_valid and self.config['security_logging']:
            logger.warning(f"WebSocket connection from unauthorized origin: {origin}")
        return is_valid

    def check_rate_limit(self, client_ip: str) -> bool:
        now = time.time()
        window_start = now - self.config['rate_limit_window']
        client_requests = self.rate_limiters[client_ip]
        while client_requests and client_requests[0] < window_start:
            client_requests.popleft()
        if len(client_requests) >= self.config['rate_limit_requests']:
            if self.config['security_logging']:
                logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return False
        client_requests.append(now)
        return True

    def validate_message(self, event: str, data: Any) -> bool:
        try:
            message_size = len(json.dumps(data)) if data else 0
            if message_size > self.config['max_message_size']:
                logger.warning(f"WebSocket message too large: {message_size} bytes")
                return False
        except (TypeError, ValueError):
            logger.warning("WebSocket message not JSON serializable")
            return False
        if self.config['allowed_events'] and event not in self.config['allowed_events']:
            logger.warning(f"WebSocket event not allowed: {event}")
            return False
        if event in self.message_validators:
            try:
                return self.message_validators[event](data)
            except Exception as e:
                logger.error(f"Message validation error for event {event}: {e}")
                return False
        return True

    def register_message_validator(self, event: str, validator: Callable[[Any], bool]):
        self.message_validators[event] = validator
        logger.info(f"Registered message validator for event: {event}")

    def track_connection(self, session_id: str, user_id: str = None, client_ip: str = None):
        self.active_connections[session_id] = {
            'user_id': user_id,
            'client_ip': client_ip,
            'connected_at': time.time(),
            'last_activity': time.time(),
            'message_count': 0
        }
        if self.config['security_logging']:
            logger.info(f"WebSocket connection tracked: {session_id} from {client_ip}")

    def update_activity(self, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id]['last_activity'] = time.time()
            self.active_connections[session_id]['message_count'] += 1

    def remove_connection(self, session_id: str):
        if session_id in self.active_connections:
            connection_info = self.active_connections.pop(session_id)
            if self.config['security_logging']:
                duration = time.time() - connection_info['connected_at']
                logger.info(f"WebSocket connection removed: {session_id}, duration: {duration:.2f}s")

    def cleanup_stale_connections(self):
        now = time.time()
        stale_sessions = []
        for session_id, info in self.active_connections.items():
            if now - info['last_activity'] > self.config['session_timeout']:
                stale_sessions.append(session_id)
        for session_id in stale_sessions:
            self.remove_connection(session_id)
            logger.info(f"Removed stale WebSocket session: {session_id}")

    def get_connection_stats(self) -> Dict[str, Any]:
        now = time.time()
        stats = {
            'total_connections': len(self.active_connections),
            'connections_by_ip': defaultdict(int),
            'blocked_ips': len(self.blocked_ips),
            'active_sessions': [],
            'oldest_connection': None,
            'average_session_duration': 0
        }
        total_duration = 0
        oldest_time = float('inf')
        for session_id, info in self.active_connections.items():
            client_ip = info.get('client_ip', 'unknown')
            stats['connections_by_ip'][client_ip] += 1
            connected_at = info['connected_at']
            duration = now - connected_at
            total_duration += duration
            if connected_at < oldest_time:
                oldest_time = connected_at
                stats['oldest_connection'] = {
                    'session_id': session_id,
                    'duration': duration,
                    'client_ip': client_ip
                }
            stats['active_sessions'].append({
                'session_id': session_id,
                'user_id': info.get('user_id'),
                'client_ip': client_ip,
                'duration': duration,
                'message_count': info['message_count']
            })
        if self.active_connections:
            stats['average_session_duration'] = total_duration / len(self.active_connections)
        return stats

    def block_ip(self, ip_address: str, reason: str = "Security violation"):
        self.blocked_ips.add(ip_address)
        logger.warning(f"Blocked IP address {ip_address}: {reason}")

    def is_ip_blocked(self, ip_address: str) -> bool:
        return ip_address in self.blocked_ips

ws_security = WebSocketSecurityManager()

def require_websocket_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if ws_security.config['require_auth']:
            user_id = session.get('user_id')
            if not user_id:
                logger.warning("Unauthenticated WebSocket event attempted")
                emit('error', {'message': 'Authentication required'})
                disconnect()
                return
            ws_security.update_activity(request.sid)
        return f(*args, **kwargs)
    return decorated_function

def validate_websocket_message(event_name: str):
    def decorator(f):
        @wraps(f)
        def decorated_function(data=None, *args, **kwargs):
            client_ip = request.environ.get('REMOTE_ADDR', 'unknown')
            if ws_security.is_ip_blocked(client_ip):
                logger.warning(f"Blocked IP attempted WebSocket connection: {client_ip}")
                disconnect()
                return
            if not ws_security.check_rate_limit(client_ip):
                emit('error', {'message': 'Rate limit exceeded'})
                disconnect()
                return
            if not ws_security.validate_message(event_name, data):
                emit('error', {'message': 'Invalid message format'})
                return
            if ws_security.config['log_all_events']:
                logger.debug(f"WebSocket event: {event_name} from {client_ip}")
            ws_security.update_activity(request.sid)
            return f(data, *args, **kwargs)
        return decorated_function
    return decorator

def websocket_security_check():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.environ.get('REMOTE_ADDR', 'unknown')
            origin = request.headers.get('Origin')
            user_agent = request.headers.get('User-Agent', '')
            if not ws_security.validate_origin(origin):
                logger.warning(f"WebSocket connection from invalid origin: {origin}")
                return False
            if ws_security.is_ip_blocked(client_ip):
                logger.warning(f"Blocked IP attempted WebSocket connection: {client_ip}")
                return False
            stats = ws_security.get_connection_stats()
            if stats['total_connections'] >= ws_security.config['max_total_connections']:
                logger.warning("WebSocket connection limit reached")
                return False
            if stats['connections_by_ip'][client_ip] >= ws_security.config['max_connections_per_ip']:
                logger.warning(f"Connection limit per IP reached: {client_ip}")
                return False
            user_id = session.get('user_id')
            ws_security.track_connection(request.sid, user_id, client_ip)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def configure_socketio_security(socketio):
    @socketio.on('connect')
    @websocket_security_check()
    def handle_connect():
        client_ip = request.environ.get('REMOTE_ADDR', 'unknown')
        logger.info(f"Secure WebSocket connection established from {client_ip}")
        emit('security_ack', {
            'secure': True,
            'session_timeout': ws_security.config['session_timeout'],
            'heartbeat_interval': ws_security.config['heartbeat_interval']
        })

    @socketio.on('disconnect')
    def handle_disconnect():
        ws_security.remove_connection(request.sid)
        logger.info(f"WebSocket connection closed: {request.sid}")

    @socketio.on('heartbeat')
    @require_websocket_auth
    @validate_websocket_message('heartbeat')
    def handle_heartbeat(data):
        emit('heartbeat_ack', {'timestamp': time.time()})

    def cleanup_connections():
        ws_security.cleanup_stale_connections()

    logger.info("SocketIO security configuration applied")
    return socketio

def get_websocket_security_report() -> Dict[str, Any]:
    stats = ws_security.get_connection_stats()
    report = {
        'security_status': 'healthy',
        'connection_stats': stats,
        'security_config': {
            'origin_validation': ws_security.config['strict_origin_check'],
            'authentication_required': ws_security.config['require_auth'],
            'rate_limiting_enabled': True,
            'message_validation_enabled': True
        },
        'rate_limiting': {
            'requests_per_window': ws_security.config['rate_limit_requests'],
            'window_seconds': ws_security.config['rate_limit_window'],
            'active_limiters': len(ws_security.rate_limiters)
        },
        'blocked_ips': list(ws_security.blocked_ips),
        'recommendations': []
    }
    if stats['total_connections'] > ws_security.config['max_total_connections'] * 0.8:
        report['recommendations'].append("Connection count approaching limit")
    if not ws_security.config['allowed_origins'] and is_production():
        report['recommendations'].append("Configure explicit allowed origins for production")
    if len(ws_security.blocked_ips) > 10:
        report['recommendations'].append("High number of blocked IPs - review security logs")
    return report

def register_common_validators():
    def validate_chat_message(data):
        if not isinstance(data, dict):
            return False
        message = data.get('message', '')
        if not isinstance(message, str) or len(message) > 1000:
            return False
        room_id = data.get('room_id')
        if room_id and not isinstance(room_id, str):
            return False
        return True

    def validate_typing_indicator(data):
        if not isinstance(data, dict):
            return False
        return 'room_id' in data and isinstance(data['room_id'], str)

    ws_security.register_message_validator('chat_message', validate_chat_message)
    ws_security.register_message_validator('typing', validate_typing_indicator)
    ws_security.register_message_validator('stop_typing', validate_typing_indicator)

register_common_validators()
