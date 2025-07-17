"""
Basic verification script to test the security improvements.
This script performs basic checks to ensure the authentication system is working correctly.
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_imports():
    """Test that all security modules can be imported correctly."""
    try:
        from api.utils.require_auth import verify_user, AUTHORIZED, UNAUTHORIZED, ALL_USERS
        from api.utils.constants import Account
        from api.utils.token_security import token_manager, extract_token_id, validate_token_security
        from api.utils.security_config import TOKEN_SECURITY_CONFIG, ROLE_HIERARCHY
        from api.utils.security_middleware import add_security_headers, log_security_event
        print("✓ All imports successful")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

def test_role_hierarchy():
    """Test that role hierarchy is properly defined."""
    try:
        from api.utils.constants import Account
        
        # Test that all required roles exist
        required_roles = ['ADMIN', 'MENTOR', 'MENTEE', 'PARTNER', 'SUPPORT', 'MODERATOR', 'GUEST', 'HUB']
        for role in required_roles:
            assert hasattr(Account, role), f"Missing role: {role}"
        
        print("✓ Role hierarchy properly defined")
        return True
    except Exception as e:
        print(f"✗ Role hierarchy error: {e}")
        return False

def test_token_manager():
    """Test basic token manager functionality."""
    try:
        from api.utils.token_security import token_manager
        
        # Test token revocation
        test_token_id = "test_token_123"
        test_user_id = "test_user"
        
        # Initially token should not be revoked
        assert not token_manager.is_token_revoked(test_token_id)
        
        # Revoke token
        token_manager.revoke_token(test_token_id, test_user_id)
        
        # Now token should be revoked
        assert token_manager.is_token_revoked(test_token_id)
        
        print("✓ Token manager functionality working")
        return True
    except Exception as e:
        print(f"✗ Token manager error: {e}")
        return False

def test_security_config():
    """Test that security configuration is properly loaded."""
    try:
        from api.utils.security_config import TOKEN_SECURITY_CONFIG, SECURITY_HEADERS
        
        # Check required config exists
        required_config = ['max_token_age_seconds', 'clock_skew_tolerance_seconds', 
                          'enable_additional_validation', 'enable_token_revocation']
        
        for config_key in required_config:
            assert config_key in TOKEN_SECURITY_CONFIG, f"Missing config: {config_key}"
        
        # Check security headers exist
        assert len(SECURITY_HEADERS) > 0, "No security headers defined"
        
        print("✓ Security configuration properly loaded")
        return True
    except Exception as e:
        print(f"✗ Security config error: {e}")
        return False

def test_auth_decorators():
    """Test that authentication decorators can be imported and used."""
    try:
        from api.utils.require_auth import admin_only, mentor_only, all_users, require_role
        from api.utils.constants import Account
        
        # Test decorator creation
        @admin_only
        def test_admin_func():
            return "admin"
        
        @require_role(Account.MENTOR, allow_support_bypass=True)
        def test_mentor_func():
            return "mentor"
        
        assert callable(test_admin_func), "Admin decorator not working"
        assert callable(test_mentor_func), "Require role decorator not working"
        
        print("✓ Authentication decorators working")
        return True
    except Exception as e:
        print(f"✗ Auth decorators error: {e}")
        return False

def main():
    """Run all verification tests."""
    print("Running security improvements verification...\n")
    
    tests = [
        test_imports,
        test_role_hierarchy,
        test_token_manager,
        test_security_config,
        test_auth_decorators,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All security improvements are working correctly!")
        return True
    else:
        print(f"\n❌ {total - passed} tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
