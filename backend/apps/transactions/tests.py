from decimal import Decimal
import pytest
from django.urls import reverse
from apps.accounts.models import FinancialAccount
from apps.transactions.models import IncomeSource, ExpenseCategory


@pytest.mark.django_db
class TestTransactionsAndLedgerScenarios:
    def test_list_requires_auth(self, api_client):
        response = api_client.get(reverse('transaction-list'))
        assert response.status_code == 401

    def test_scenario_1_initial_balances(self, auth_client, user):
        """Scenario 1: Cash: Tk 2,500, Bank: Tk 10,000, PayCash: Tk 1,500. Total: Tk 14,000."""
        url = reverse('account-list')
        auth_client.post(url, {'name': 'Cash', 'account_type': 'cash', 'opening_balance': '2500.00'})
        auth_client.post(url, {'name': 'Bank', 'account_type': 'bank', 'opening_balance': '10000.00'})
        auth_client.post(url, {'name': 'PayCash', 'account_type': 'mobile_banking', 'opening_balance': '1500.00'})

        accounts = FinancialAccount.objects.filter(user=user)
        total = sum(acc.current_balance for acc in accounts)
        assert total == Decimal('14000.00')

    def test_scenario_2_income_recording(self, auth_client, user):
        """Scenario 2: Receive Tk 5,000 from tuition into Cash.
        Expected: Cash becomes Tk 7,500; Total becomes Tk 19,000.
        """
        cash = FinancialAccount.objects.create(
            user=user, name='Cash', account_type='cash',
            opening_balance=Decimal('2500.00'), current_balance=Decimal('2500.00')
        )
        FinancialAccount.objects.create(
            user=user, name='Bank', account_type='bank',
            opening_balance=Decimal('10000.00'), current_balance=Decimal('10000.00')
        )
        FinancialAccount.objects.create(
            user=user, name='PayCash', account_type='mobile_banking',
            opening_balance=Decimal('1500.00'), current_balance=Decimal('1500.00')
        )

        tuition = IncomeSource.objects.create(user=user, name='Private tuition')

        res = auth_client.post(reverse('transaction-list'), {
            'account': cash.id,
            'transaction_type': 'income',
            'amount': '5000.00',
            'income_source': tuition.id,
            'transaction_date': '2026-11-13',
            'description': 'Tuition payment for November',
        })
        assert res.status_code == 201

        cash.refresh_from_db()
        assert cash.current_balance == Decimal('7500.00')

        total = sum(acc.current_balance for acc in FinancialAccount.objects.filter(user=user))
        assert total == Decimal('19000.00')

    def test_scenario_3_account_transfer(self, auth_client, user):
        """Scenario 3: Transfer Tk 3,000 from Bank to Cash.
        Expected: Bank: Tk 7,000, Cash: Tk 10,500, Total balance unchanged.
        """
        cash = FinancialAccount.objects.create(
            user=user, name='Cash', account_type='cash',
            opening_balance=Decimal('7500.00'), current_balance=Decimal('7500.00')
        )
        bank = FinancialAccount.objects.create(
            user=user, name='Bank', account_type='bank',
            opening_balance=Decimal('10000.00'), current_balance=Decimal('10000.00')
        )

        res = auth_client.post(reverse('transfer-list'), {
            'source_account': bank.id,
            'destination_account': cash.id,
            'amount': '3000.00',
            'transaction_date': '2026-11-13',
            'description': 'ATM withdrawal',
        })
        assert res.status_code == 201

        cash.refresh_from_db()
        bank.refresh_from_db()
        assert bank.current_balance == Decimal('7000.00')
        assert cash.current_balance == Decimal('10500.00')
        assert (cash.current_balance + bank.current_balance) == Decimal('17500.00')

    def test_expense_and_deletion_balance_rollback(self, auth_client, user):
        """Expense of Tk 1,000 from Cash decreases Cash to Tk 9,500.
        Deleting the expense rolls back Cash to Tk 10,500.
        """
        cash = FinancialAccount.objects.create(
            user=user, name='Cash', account_type='cash',
            opening_balance=Decimal('10500.00'), current_balance=Decimal('10500.00')
        )
        food = ExpenseCategory.objects.create(user=user, name='Food')

        # Create expense
        res = auth_client.post(reverse('transaction-list'), {
            'account': cash.id,
            'transaction_type': 'expense',
            'amount': '1000.00',
            'category': food.id,
            'transaction_date': '2026-11-13',
        })
        assert res.status_code == 201
        tx_id = res.data['id']

        cash.refresh_from_db()
        assert cash.current_balance == Decimal('9500.00')

        # Delete expense
        del_res = auth_client.delete(reverse('transaction-detail', kwargs={'pk': tx_id}))
        assert del_res.status_code == 204

        cash.refresh_from_db()
        assert cash.current_balance == Decimal('10500.00')

    def test_reconcile_account_endpoint(self, auth_client, user):
        """Account reconcile calculates current_balance strictly from opening + ledger."""
        cash = FinancialAccount.objects.create(
            user=user, name='Cash', account_type='cash',
            opening_balance=Decimal('1000.00'), current_balance=Decimal('1000.00')
        )
        # Create an income of 500
        auth_client.post(reverse('transaction-list'), {
            'account': cash.id,
            'transaction_type': 'income',
            'amount': '500.00',
            'transaction_date': '2026-11-13',
        })
        cash.refresh_from_db()
        assert cash.current_balance == Decimal('1500.00')

        # Artificially desync cached balance
        FinancialAccount.objects.filter(id=cash.id).update(current_balance=Decimal('9999.00'))

        # Call reconcile
        reconcile_url = reverse('account-reconcile', kwargs={'pk': cash.id})
        res = auth_client.post(reconcile_url)
        assert res.status_code == 200
        assert res.data['current_balance'] == '1500.00'

        cash.refresh_from_db()
        assert cash.current_balance == Decimal('1500.00')

    def test_transaction_filtering(self, auth_client, user):
        """Test filtering by account, type, and search description."""
        cash = FinancialAccount.objects.create(
            user=user, name='Cash', current_balance=Decimal('1000.00')
        )
        bank = FinancialAccount.objects.create(
            user=user, name='Bank', current_balance=Decimal('1000.00')
        )
        auth_client.post(reverse('transaction-list'), {
            'account': cash.id, 'transaction_type': 'income',
            'amount': '200.00', 'transaction_date': '2026-11-10', 'description': 'Freelance'
        })
        auth_client.post(reverse('transaction-list'), {
            'account': bank.id, 'transaction_type': 'expense',
            'amount': '50.00', 'transaction_date': '2026-11-12', 'description': 'Coffee'
        })

        # Filter by account=cash
        res = auth_client.get(reverse('transaction-list'), {'account': cash.id})
        assert res.status_code == 200
        assert len(res.data['results']) == 1
        assert res.data['results'][0]['description'] == 'Freelance'

        # Filter by search=Coffee
        res_search = auth_client.get(reverse('transaction-list'), {'search': 'Coffee'})
        assert res_search.status_code == 200
        assert len(res_search.data['results']) == 1
        assert res_search.data['results'][0]['description'] == 'Coffee'

    def test_list_returns_only_own_transactions(self, auth_client, user, other_user):
        """User A should not see User B's transactions."""
        cash = FinancialAccount.objects.create(
            user=user, name='Cash', current_balance=Decimal('1000.00')
        )
        other_cash = FinancialAccount.objects.create(
            user=other_user, name='Other Cash', current_balance=Decimal('5000.00')
        )
        auth_client.post(reverse('transaction-list'), {
            'account': cash.id, 'transaction_type': 'income',
            'amount': '200.00', 'transaction_date': '2026-11-10',
        })
        from apps.transactions.models import Transaction
        Transaction.objects.create(
            user=other_user, account=other_cash, transaction_type='expense',
            amount=Decimal('50.00'), transaction_date='2026-11-12',
        )
        res = auth_client.get(reverse('transaction-list'))
        assert res.status_code == 200
        assert len(res.data['results']) == 1
        assert res.data['results'][0]['amount'] == '200.00'
