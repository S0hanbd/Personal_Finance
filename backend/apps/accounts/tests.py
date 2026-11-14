import pytest
from django.urls import reverse
from decimal import Decimal
from .models import FinancialAccount


@pytest.mark.django_db
class TestAccounts:
    def test_create_account_sets_current_balance(self, auth_client):
        url = reverse('account-list')
        response = auth_client.post(url, {'name': 'Cash', 'account_type': 'cash', 'opening_balance': '2500.00'})
        assert response.status_code == 201
        assert response.data['current_balance'] == '2500.00'

    def test_list_returns_only_own_accounts(self, auth_client, user, other_user):
        FinancialAccount.objects.create(user=user, name='Cash', opening_balance=Decimal('1000.00'), current_balance=Decimal('1000.00'))
        FinancialAccount.objects.create(user=other_user, name='Other Cash', opening_balance=Decimal('5000.00'), current_balance=Decimal('5000.00'))
        response = auth_client.get(reverse('account-list'))
        assert response.status_code == 200
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['name'] == 'Cash'
