import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestAuth:
    def test_register_returns_201(self, api_client):
        url = reverse('auth-register')
        data = {'username': 'newuser', 'email': 'new@example.com', 'password': 'securepass123'}
        response = api_client.post(url, data)
        assert response.status_code == 201
        assert 'access' in response.data

    def test_login_valid_credentials_returns_tokens(self, api_client, user):
        url = reverse('auth-login')
        response = api_client.post(url, {'username': 'testuser', 'password': 'testpass123'})
        assert response.status_code == 200
        assert 'access' in response.data

    def test_protected_endpoint_returns_401_without_token(self, api_client):
        url = reverse('auth-me')
        response = api_client.get(url)
        assert response.status_code == 401
