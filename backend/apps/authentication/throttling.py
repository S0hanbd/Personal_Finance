from rest_framework.throttling import ScopedRateThrottle


class LoginThrottle(ScopedRateThrottle):
    """Rate limit for login endpoint to prevent brute-force attacks."""
    scope = 'auth_login'


class RegisterThrottle(ScopedRateThrottle):
    """Rate limit for registration endpoint."""
    scope = 'auth_register'
