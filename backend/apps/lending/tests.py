from datetime import date
from decimal import Decimal
import pytest
from apps.accounts.models import FinancialAccount
from apps.lending.models import Person, LoanSettlement
from apps.lending.services import lend_money, borrow_money, record_settlement


@pytest.fixture
def lending_setup(db, user, auth_client):
    account = FinancialAccount.objects.create(
        user=user,
        name='Main Bank',
        account_type='bank',
        opening_balance=Decimal('50000.00'),
        current_balance=Decimal('50000.00'),
    )
    return {'user': user, 'client': auth_client, 'account': account}


@pytest.mark.django_db
class TestLendingServices:
    def test_lend_money_creates_loan_and_deducts_balance(self, lending_setup):
        user = lending_setup['user']
        account = lending_setup['account']

        loan = lend_money(
            user=user,
            person_name='Rahim',
            amount=Decimal('5000.00'),
            account=account,
            notes='Emergency loan',
        )

        assert loan.loan_type == 'lent'
        assert loan.remaining_amount == Decimal('5000.00')
        assert loan.status == 'active'

        person = Person.objects.get(name='Rahim')
        assert person.total_lent == Decimal('5000.00')

        account.refresh_from_db()
        assert account.current_balance == Decimal('45000.00')

        assert LoanSettlement.objects.filter(loan=loan).count() == 1

    def test_borrow_money_creates_loan_and_adds_balance(self, lending_setup):
        user = lending_setup['user']
        account = lending_setup['account']

        loan = borrow_money(
            user=user,
            person_name='Karim',
            amount=Decimal('3000.00'),
            account=account,
            notes='Personal loan',
        )

        assert loan.loan_type == 'borrowed'
        assert loan.remaining_amount == Decimal('3000.00')

        person = Person.objects.get(name='Karim')
        assert person.total_borrowed == Decimal('3000.00')

        account.refresh_from_db()
        assert account.current_balance == Decimal('53000.00')

    def test_partial_settlement_reduces_remaining(self, lending_setup):
        user = lending_setup['user']
        account = lending_setup['account']

        loan = lend_money(
            user=user,
            person_name='Rahim',
            amount=Decimal('5000.00'),
            account=account,
        )

        settlement = record_settlement(
            loan=loan,
            amount=Decimal('2000.00'),
            account=account,
            settlement_date=date(2026, 11, 15),
        )

        assert settlement.amount == Decimal('2000.00')
        loan.refresh_from_db()
        assert loan.remaining_amount == Decimal('3000.00')
        assert loan.status == 'active'

    def test_full_settlement_auto_sets_status(self, lending_setup):
        user = lending_setup['user']
        account = lending_setup['account']

        loan = lend_money(
            user=user,
            person_name='Rahim',
            amount=Decimal('5000.00'),
            account=account,
        )

        record_settlement(
            loan=loan,
            amount=Decimal('5000.00'),
            account=account,
            settlement_date=date(2026, 11, 15),
        )

        loan.refresh_from_db()
        assert loan.remaining_amount == Decimal('0.00')
        assert loan.status == 'settled'

    def test_cannot_over_settle(self, lending_setup):
        user = lending_setup['user']
        account = lending_setup['account']

        loan = lend_money(
            user=user,
            person_name='Rahim',
            amount=Decimal('5000.00'),
            account=account,
        )

        with pytest.raises(ValueError, match='exceeds remaining'):
            record_settlement(
                loan=loan,
                amount=Decimal('6000.00'),
                account=account,
                settlement_date=date(2026, 11, 15),
            )

    def test_cannot_settle_already_settled_loan(self, lending_setup):
        user = lending_setup['user']
        account = lending_setup['account']

        loan = lend_money(
            user=user,
            person_name='Rahim',
            amount=Decimal('5000.00'),
            account=account,
        )

        record_settlement(
            loan=loan,
            amount=Decimal('5000.00'),
            account=account,
            settlement_date=date(2026, 11, 15),
        )

        with pytest.raises(ValueError, match='already settled'):
            record_settlement(
                loan=loan,
                amount=Decimal('1000.00'),
                account=account,
                settlement_date=date(2026, 11, 16),
            )


@pytest.mark.django_db
class TestLendingAPI:
    def test_lend_money_api(self, lending_setup):
        client = lending_setup['client']
        account = lending_setup['account']

        res = client.post('/api/lending/loans/lend/', {
            'person_name': 'Rahim',
            'amount': '5000.00',
            'account_id': account.id,
            'notes': 'Via API',
        })
        assert res.status_code == 201
        assert res.data['loan_type'] == 'lent'
        assert res.data['remaining_amount'] == '5000.00'

        account.refresh_from_db()
        assert account.current_balance == Decimal('45000.00')

    def test_borrow_money_api(self, lending_setup):
        client = lending_setup['client']
        account = lending_setup['account']

        res = client.post('/api/lending/loans/borrow/', {
            'person_name': 'Karim',
            'amount': '3000.00',
            'account_id': account.id,
        })
        assert res.status_code == 201
        assert res.data['loan_type'] == 'borrowed'

        account.refresh_from_db()
        assert account.current_balance == Decimal('53000.00')

    def test_settle_loan_api(self, lending_setup):
        client = lending_setup['client']
        account = lending_setup['account']

        lend_res = client.post('/api/lending/loans/lend/', {
            'person_name': 'Rahim',
            'amount': '5000.00',
            'account_id': account.id,
        })
        loan_id = lend_res.data['id']

        settle_res = client.post(f'/api/lending/loans/{loan_id}/settle/', {
            'amount': '2000.00',
            'account_id': account.id,
        })
        assert settle_res.status_code == 201
        assert settle_res.data['amount'] == '2000.00'

    def test_summary_api(self, lending_setup):
        client = lending_setup['client']
        account = lending_setup['account']

        client.post('/api/lending/loans/lend/', {
            'person_name': 'Rahim',
            'amount': '5000.00',
            'account_id': account.id,
        })
        client.post('/api/lending/loans/borrow/', {
            'person_name': 'Karim',
            'amount': '3000.00',
            'account_id': account.id,
        })

        res = client.get('/api/lending/people/summary/')
        assert res.status_code == 200
        assert res.data['total_lent'] == '5000.00'
        assert res.data['total_borrowed'] == '3000.00'
        assert res.data['net_position'] == '2000.00'

    def test_people_list_api(self, lending_setup):
        client = lending_setup['client']
        account = lending_setup['account']

        client.post('/api/lending/loans/lend/', {
            'person_name': 'Rahim',
            'amount': '5000.00',
            'account_id': account.id,
        })

        res = client.get('/api/lending/people/')
        assert res.status_code == 200
        assert res.data['count'] == 1
        assert res.data['results'][0]['name'] == 'Rahim'

