import pytest
from django.contrib.auth import get_user_model

@pytest.fixture
def user(db):
    User = get_user_model()
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def other_user(db):
    User = get_user_model()
    return User.objects.create_user(
        username='otheruser',
        email='other@example.com',
        password='otherpass123'
    )

@pytest.fixture
def other_auth_client(api_client, other_user):
    api_client.force_authenticate(user=other_user)
    return api_client
