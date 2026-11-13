import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestTransactions:
    def test_list_requires_auth(self, api_client):
        response = api_client.get(reverse('transaction-list'))
        assert response.status_code == 401

    def test_list_authenticated(self, auth_client):
        response = auth_client.get(reverse('transaction-list'))
        assert response.status_code == 200
