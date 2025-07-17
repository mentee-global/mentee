import pytest
from unittest.mock import patch, MagicMock
from api.utils.require_auth import verify_user, AUTHORIZED, UNAUTHORIZED, ALL_USERS
from api.utils.constants import Account
from firebase_admin.auth import ExpiredIdTokenError, RevokedIdTokenError, InvalidIdTokenError
from firebase_admin.exceptions import InvalidArgumentError


class TestVerifyUser:
    
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_missing_token(self, mock_firebase_auth, mock_request):
        """Test that missing authorization token returns 401"""
        mock_request.headers.get.return_value = None
        
        authorized, response = verify_user(Account.ADMIN)
        
        assert authorized == UNAUTHORIZED
        assert response[1] == 401  # Status code
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_valid_token_admin_access(self, mock_firebase_auth, mock_request):
        """Test admin user accessing admin resource"""
        mock_request.headers.get.return_value = "valid_token"
        mock_firebase_auth.verify_id_token.return_value = {
            "role": Account.ADMIN,
            "uid": "test_user_id"
        }
        
        authorized, response = verify_user(Account.ADMIN)
        
        assert authorized == AUTHORIZED
        assert response is None
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_insufficient_permissions(self, mock_firebase_auth, mock_request):
        """Test user with insufficient permissions returns 403"""
        mock_request.headers.get.return_value = "valid_token"
        mock_firebase_auth.verify_id_token.return_value = {
            "role": Account.MENTEE,
            "uid": "test_user_id"
        }
        
        authorized, response = verify_user(Account.ADMIN)
        
        assert authorized == UNAUTHORIZED
        assert response[1] == 403  # Status code - Forbidden
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_expired_token(self, mock_firebase_auth, mock_request):
        """Test expired token returns 401"""
        mock_request.headers.get.return_value = "expired_token"
        mock_firebase_auth.verify_id_token.side_effect = ExpiredIdTokenError("Token expired")
        
        authorized, response = verify_user(Account.ADMIN)
        
        assert authorized == UNAUTHORIZED
        assert response[1] == 401  # Status code
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_revoked_token(self, mock_firebase_auth, mock_request):
        """Test revoked token returns 401"""
        mock_request.headers.get.return_value = "revoked_token"
        mock_firebase_auth.verify_id_token.side_effect = RevokedIdTokenError("Token revoked")
        
        authorized, response = verify_user(Account.ADMIN)
        
        assert authorized == UNAUTHORIZED
        assert response[1] == 401  # Status code
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_invalid_token_format(self, mock_firebase_auth, mock_request):
        """Test invalid token format returns 401"""
        mock_request.headers.get.return_value = "invalid_token"
        mock_firebase_auth.verify_id_token.side_effect = InvalidArgumentError("Invalid token")
        
        authorized, response = verify_user(Account.ADMIN)
        
        assert authorized == UNAUTHORIZED
        assert response[1] == 401  # Status code
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_all_users_access(self, mock_firebase_auth, mock_request):
        """Test that any authenticated user can access ALL_USERS resources"""
        mock_request.headers.get.return_value = "valid_token"
        mock_firebase_auth.verify_id_token.return_value = {
            "role": Account.MENTEE,
            "uid": "test_user_id"
        }
        
        authorized, response = verify_user(ALL_USERS)
        
        assert authorized == AUTHORIZED
        assert response is None
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_support_bypass_allowed(self, mock_firebase_auth, mock_request):
        """Test SUPPORT role can bypass restrictions when allowed"""
        mock_request.headers.get.return_value = "valid_token"
        mock_firebase_auth.verify_id_token.return_value = {
            "role": Account.SUPPORT,
            "uid": "support_user_id"
        }
        
        authorized, response = verify_user(Account.MENTOR, allow_support_bypass=True)
        
        assert authorized == AUTHORIZED
        assert response is None
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_support_bypass_denied(self, mock_firebase_auth, mock_request):
        """Test SUPPORT role cannot bypass when not allowed"""
        mock_request.headers.get.return_value = "valid_token"
        mock_firebase_auth.verify_id_token.return_value = {
            "role": Account.SUPPORT,
            "uid": "support_user_id"
        }
        
        authorized, response = verify_user(Account.MENTOR, allow_support_bypass=False)
        
        assert authorized == UNAUTHORIZED
        assert response[1] == 403  # Status code - Forbidden
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_missing_role_in_claims(self, mock_firebase_auth, mock_request):
        """Test missing role in token claims returns 403"""
        mock_request.headers.get.return_value = "valid_token"
        mock_firebase_auth.verify_id_token.return_value = {
            "uid": "test_user_id"
            # Missing role field
        }
        
        authorized, response = verify_user(Account.ADMIN)
        
        assert authorized == UNAUTHORIZED
        assert response[1] == 403  # Status code - Forbidden
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_admin_access_to_all(self, mock_firebase_auth, mock_request):
        """Test admin can access any resource"""
        mock_request.headers.get.return_value = "valid_token"
        mock_firebase_auth.verify_id_token.return_value = {
            "role": Account.ADMIN,
            "uid": "admin_user_id"
        }
        
        authorized, response = verify_user(Account.MENTOR)
        
        assert authorized == AUTHORIZED
        assert response is None
        
    @patch('api.utils.require_auth.request')
    @patch('api.utils.require_auth.firebase_admin_auth')
    def test_verify_user_bearer_token_format(self, mock_firebase_auth, mock_request):
        """Test that Bearer prefix is properly stripped"""
        mock_request.headers.get.return_value = "Bearer valid_token"
        mock_firebase_auth.verify_id_token.return_value = {
            "role": Account.ADMIN,
            "uid": "test_user_id"
        }
        
        authorized, response = verify_user(Account.ADMIN)
        
        assert authorized == AUTHORIZED
        assert response is None
        # Verify that verify_id_token was called with the token without Bearer prefix
        mock_firebase_auth.verify_id_token.assert_called_with("valid_token", check_revoked=True)
