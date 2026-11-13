from datetime import date
from decimal import Decimal
import pytest
from apps.accounts.models import FinancialAccount
from apps.transactions.models import ExpenseCategory
from apps.obligations.models import FinancialObligation
from apps.obligations.services import pay_obligation


@pytest.fixture
def obligation_setup(db, user, auth_client):
    account = FinancialAccount.objects.create(
        user=user,
        name='Main Bank',
        account_type='bank',
        opening_balance=Decimal('50000.00'),
        current_balance=Decimal('50000.00'),
    )
    category = ExpenseCategory.objects.create(user=user, name='Education')
    return {'user': user, 'client': auth_client, 'account': account, 'category': category}


@pytest.mark.django_db
class TestObligations:
    def test_create_and_pay_obligation(self, obligation_setup):
        user = obligation_setup['user']
        account = obligation_setup['account']
        category = obligation_setup['category']

        obligation = FinancialObligation.objects.create(
            user=user,
            name='University Semester Fee',
            amount=Decimal('18000.00'),
            category=category,
            due_date=date(2026, 12, 1),
            priority='high',
        )

        assert obligation.status == 'pending'
        assert obligation.paid_transaction is None

        # Pay obligation
        paid_ob, tx = pay_obligation(obligation, account=account)

        assert paid_ob.status == 'paid'
        assert paid_ob.paid_transaction_id == tx.id
        assert tx.amount == Decimal('18000.00')
        assert tx.transaction_type == 'expense'

        # Account deducted: 50000 - 18000 = 32000
        account.refresh_from_db()
        assert account.current_balance == Decimal('32000.00')

    def test_cannot_pay_already_paid_obligation(self, obligation_setup):
        user = obligation_setup['user']
        account = obligation_setup['account']

        obligation = FinancialObligation.objects.create(
            user=user,
            name='Laptop Repair',
            amount=Decimal('3500.00'),
            due_date=date(2026, 11, 20),
        )

        pay_obligation(obligation, account=account)

        with pytest.raises(ValueError, match="already been paid"):
            pay_obligation(obligation, account=account)

    def test_api_obligation_crud_and_summary(self, obligation_setup):
        client = obligation_setup['client']
        account = obligation_setup['account']

        # Create obligation via API
        res = client.post('/api/obligations/', {
            'name': 'Annual Insurance',
            'amount': '6000.00',
            'due_date': '2026-12-15',
            'priority': 'urgent',
        })
        assert res.status_code == 201
        ob_id = res.data['id']

        # Summary endpoint
        summary_res = client.get('/api/obligations/summary/')
        assert summary_res.status_code == 200
        assert summary_res.data['total_pending'] == '6000.00'
        assert summary_res.data['pending_count'] == 1

        # Pay via API
        pay_res = client.post(f'/api/obligations/{ob_id}/pay/', {
            'account_id': account.id,
        })
        assert pay_res.status_code == 200
        assert pay_res.data['status'] == 'paid'

        account.refresh_from_db()
        assert account.current_balance == Decimal('44000.00')
