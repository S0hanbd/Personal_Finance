from datetime import date
from decimal import Decimal
import pytest
from apps.accounts.models import FinancialAccount
from apps.transactions.models import ExpenseCategory
from apps.bills.models import RecurringExpense
from apps.bills.services import generate_monthly_occurrences, pay_bill_occurrence


@pytest.fixture
def bill_setup(db, user, auth_client):
    account = FinancialAccount.objects.create(
        user=user,
        name='Main Bank',
        account_type='bank',
        opening_balance=Decimal('20000.00'),
        current_balance=Decimal('20000.00'),
    )
    category = ExpenseCategory.objects.create(user=user, name='Utilities')
    return {'user': user, 'client': auth_client, 'account': account, 'category': category}


@pytest.mark.django_db
class TestBills:
    def test_occurrence_generation_does_not_deduct_balance(self, bill_setup):
        """Principle: Recurring bills do NOT deduct money when generated, only when paid."""
        user = bill_setup['user']
        account = bill_setup['account']
        category = bill_setup['category']

        RecurringExpense.objects.create(
            user=user,
            name='Internet Bill',
            category=category,
            amount=Decimal('1500.00'),
            start_date=date(2026, 1, 1),
            due_day=10,
            preferred_account=account,
        )

        occurrences = generate_monthly_occurrences(user, period='2026-11')
        assert len(occurrences) == 1
        occ = occurrences[0]
        assert occ.amount == Decimal('1500.00')
        assert occ.status in ['unpaid', 'overdue']
        assert occ.paid_transaction is None

        # Verify account balance untouched
        account.refresh_from_db()
        assert account.current_balance == Decimal('20000.00')

    def test_pay_bill_occurrence_deducts_balance_and_creates_tx(self, bill_setup):
        user = bill_setup['user']
        account = bill_setup['account']
        category = bill_setup['category']

        RecurringExpense.objects.create(
            user=user,
            name='Electricity',
            category=category,
            amount=Decimal('2500.00'),
            start_date=date(2026, 1, 1),
            due_day=15,
        )

        occurrences = generate_monthly_occurrences(user, period='2026-11')
        occ = occurrences[0]

        # Pay the occurrence
        paid_occ, tx = pay_bill_occurrence(occ, account=account)

        assert paid_occ.status == 'paid'
        assert paid_occ.paid_transaction_id == tx.id
        assert tx.amount == Decimal('2500.00')
        assert tx.transaction_type == 'expense'

        # Account deducted: 20000 - 2500 = 17500
        account.refresh_from_db()
        assert account.current_balance == Decimal('17500.00')

    def test_cannot_pay_already_paid_bill(self, bill_setup):
        user = bill_setup['user']
        account = bill_setup['account']

        RecurringExpense.objects.create(
            user=user,
            name='House Rent',
            amount=Decimal('8000.00'),
            start_date=date(2026, 1, 1),
            due_day=5,
        )
        occurrences = generate_monthly_occurrences(user, period='2026-11')
        occ = occurrences[0]

        pay_bill_occurrence(occ, account=account)

        # Attempt second payment must raise ValueError
        with pytest.raises(ValueError, match="already been paid"):
            pay_bill_occurrence(occ, account=account)

    def test_api_current_month_endpoint(self, bill_setup):
        client = bill_setup['client']
        account = bill_setup['account']

        # Create bill via API
        res = client.post('/api/bills/rules/', {
            'name': 'Gym Membership',
            'amount': '1200.00',
            'frequency': 'monthly',
            'start_date': '2026-01-01',
            'due_day': 1,
            'preferred_account': account.id,
        })
        assert res.status_code == 201

        # Check current month occurrences
        res = client.get('/api/bills/occurrences/current-month/')
        assert res.status_code == 200
        assert len(res.data['results']) == 1
        assert res.data['unpaid_total'] == '1200.00'

        occ_id = res.data['results'][0]['id']

        # Pay occurrence via API
        pay_res = client.post(f'/api/bills/occurrences/{occ_id}/pay/', {
            'account_id': account.id,
        })
        assert pay_res.status_code == 200
        assert pay_res.data['status'] == 'paid'

        account.refresh_from_db()
        assert account.current_balance == Decimal('18800.00')
