from datetime import date
from decimal import Decimal
import pytest

from apps.accounts.models import FinancialAccount
from apps.transactions.models import Transaction, ExpenseCategory, IncomeSource
from apps.budgets.models import MonthlyBudget, BudgetCategory
from apps.analytics.services import (
    get_monthly_income_expense,
    get_spending_by_category,
    get_spending_trends,
    get_account_balance_history,
    get_top_categories,
    get_budget_vs_actual,
)


@pytest.fixture
def analytics_setup(db, user, auth_client):
    account = FinancialAccount.objects.create(
        user=user,
        name='Main Bank',
        account_type='bank',
        opening_balance=Decimal('10000.00'),
        current_balance=Decimal('10000.00'),
    )
    food = ExpenseCategory.objects.create(user=user, name='Food')
    transport = ExpenseCategory.objects.create(user=user, name='Transport')
    salary = IncomeSource.objects.create(user=user, name='Salary')
    return {
        'user': user,
        'client': auth_client,
        'account': account,
        'food': food,
        'transport': transport,
        'salary': salary,
    }


def _create_tx(setup, tx_type, amount, cat=None, source=None, d=None):
    """Helper to create a transaction."""
    return Transaction.objects.create(
        user=setup['user'],
        account=setup['account'],
        transaction_type=tx_type,
        amount=amount,
        category=cat,
        income_source=source,
        transaction_date=d or date(2026, 11, 1),
    )


@pytest.mark.django_db
class TestMonthlyIncomeExpense:
    def test_aggregates_monthly_totals(self, analytics_setup):
        _create_tx(analytics_setup, 'income', Decimal('5000'), source=analytics_setup['salary'], d=date(2026, 10, 5))
        _create_tx(analytics_setup, 'income', Decimal('5000'), source=analytics_setup['salary'], d=date(2026, 11, 5))
        _create_tx(analytics_setup, 'expense', Decimal('2000'), cat=analytics_setup['food'], d=date(2026, 10, 10))
        _create_tx(analytics_setup, 'expense', Decimal('1500'), cat=analytics_setup['transport'], d=date(2026, 11, 10))

        result = get_monthly_income_expense(
            analytics_setup['user'],
            start_date=date(2026, 10, 1),
            end_date=date(2026, 11, 30),
        )
        assert len(result) == 2
        oct_data = [r for r in result if r['month'] == '2026-10'][0]
        assert oct_data['income'] == '5000.00'
        assert oct_data['expense'] == '2000.00'
        assert oct_data['net'] == '3000.00'

        nov_data = [r for r in result if r['month'] == '2026-11'][0]
        assert nov_data['income'] == '5000.00'
        assert nov_data['expense'] == '1500.00'

    def test_empty_period_returns_empty(self, analytics_setup):
        result = get_monthly_income_expense(
            analytics_setup['user'],
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 31),
        )
        # Returns months with zero values
        assert len(result) >= 1
        assert result[0]['income'] == '0.00'
        assert result[0]['expense'] == '0.00'


@pytest.mark.django_db
class TestSpendingByCategory:
    def test_groups_by_category(self, analytics_setup):
        _create_tx(analytics_setup, 'expense', Decimal('300'), cat=analytics_setup['food'], d=date(2026, 11, 1))
        _create_tx(analytics_setup, 'expense', Decimal('200'), cat=analytics_setup['food'], d=date(2026, 11, 5))
        _create_tx(analytics_setup, 'expense', Decimal('100'), cat=analytics_setup['transport'], d=date(2026, 11, 10))

        result = get_spending_by_category(
            analytics_setup['user'],
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
        )
        assert len(result) == 2
        food = [r for r in result if r['category'] == 'Food'][0]
        assert food['amount'] == '500.00'
        transport = [r for r in result if r['category'] == 'Transport'][0]
        assert transport['amount'] == '100.00'

    def test_uncategorized(self, analytics_setup):
        _create_tx(analytics_setup, 'expense', Decimal('50'), d=date(2026, 11, 1))

        result = get_spending_by_category(
            analytics_setup['user'],
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
        )
        assert len(result) == 1
        assert result[0]['category'] == 'Uncategorized'


@pytest.mark.django_db
class TestSpendingTrends:
    def test_daily_granularity(self, analytics_setup):
        _create_tx(analytics_setup, 'expense', Decimal('100'), cat=analytics_setup['food'], d=date(2026, 11, 1))
        _create_tx(analytics_setup, 'expense', Decimal('200'), cat=analytics_setup['food'], d=date(2026, 11, 3))

        result = get_spending_trends(
            analytics_setup['user'],
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 5),
            granularity='daily',
        )
        assert len(result) == 5  # fills gaps
        assert result[0]['date'] == '2026-11-01'
        assert result[0]['amount'] == '100.00'
        assert result[2]['amount'] == '200.00'  # Nov 3
        assert result[1]['amount'] == '0.00'  # Nov 2 gap filled

    def test_weekly_granularity(self, analytics_setup):
        _create_tx(analytics_setup, 'expense', Decimal('100'), cat=analytics_setup['food'], d=date(2026, 11, 1))
        _create_tx(analytics_setup, 'expense', Decimal('200'), cat=analytics_setup['food'], d=date(2026, 11, 8))

        result = get_spending_trends(
            analytics_setup['user'],
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
            granularity='weekly',
        )
        assert len(result) >= 1
        # Results grouped by week
        for item in result:
            assert 'W' in item['date']


@pytest.mark.django_db
class TestAccountBalanceHistory:
    def test_daily_snapshots(self, analytics_setup):
        _create_tx(analytics_setup, 'income', Decimal('1000'), source=analytics_setup['salary'], d=date(2026, 11, 1))
        _create_tx(analytics_setup, 'expense', Decimal('200'), cat=analytics_setup['food'], d=date(2026, 11, 2))

        result = get_account_balance_history(
            analytics_setup['user'],
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 3),
        )
        # 3 days * 1 account = 3 snapshots
        assert len(result) == 3
        # Nov 1: opening 10000 + income 1000 = 11000
        nov1 = [r for r in result if r['date'] == '2026-11-01'][0]
        assert nov1['balance'] == '11000.00'
        # Nov 2: 11000 - 200 = 10800
        nov2 = [r for r in result if r['date'] == '2026-11-02'][0]
        assert nov2['balance'] == '10800.00'


@pytest.mark.django_db
class TestTopCategories:
    def test_returns_top_n(self, analytics_setup):
        _create_tx(analytics_setup, 'expense', Decimal('500'), cat=analytics_setup['food'], d=date(2026, 11, 1))
        _create_tx(analytics_setup, 'expense', Decimal('300'), cat=analytics_setup['transport'], d=date(2026, 11, 2))

        result = get_top_categories(
            analytics_setup['user'],
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
            limit=5,
        )
        assert len(result) == 2
        assert result[0]['category'] == 'Food'
        assert result[0]['rank'] == 1
        assert result[1]['category'] == 'Transport'
        assert result[1]['rank'] == 2


@pytest.mark.django_db
class TestBudgetVsActual:
    def test_with_budget(self, analytics_setup):
        user = analytics_setup['user']
        budget = MonthlyBudget.objects.create(
            user=user,
            year=2026,
            month=11,
            total_amount=Decimal('5000.00'),
        )
        BudgetCategory.objects.create(
            budget=budget,
            category=analytics_setup['food'],
            allocated_amount=Decimal('2000.00'),
        )
        BudgetCategory.objects.create(
            budget=budget,
            category=analytics_setup['transport'],
            allocated_amount=Decimal('1000.00'),
        )
        _create_tx(analytics_setup, 'expense', Decimal('1500'), cat=analytics_setup['food'], d=date(2026, 11, 5))

        result = get_budget_vs_actual(user, year=2026, month=11)
        assert result['has_budget'] is True
        assert result['budget_total'] == '5000.00'
        food = [c for c in result['categories'] if c['category'] == 'Food'][0]
        assert food['allocated'] == '2000.00'
        assert food['actual'] == '1500.00'
        assert food['variance'] == '500.00'

    def test_no_budget(self, analytics_setup):
        result = get_budget_vs_actual(analytics_setup['user'], year=2026, month=11)
        assert result['has_budget'] is False
        assert result['categories'] == []


@pytest.mark.django_db
class TestAPIEndpoints:
    def test_monthly_trend_endpoint(self, analytics_setup):
        client = analytics_setup['client']
        res = client.get('/api/analytics/monthly_trend/')
        assert res.status_code == 200
        assert isinstance(res.data, list)

    def test_category_breakdown_endpoint(self, analytics_setup):
        client = analytics_setup['client']
        res = client.get('/api/analytics/category_breakdown/')
        assert res.status_code == 200
        assert isinstance(res.data, list)

    def test_spending_trends_endpoint(self, analytics_setup):
        client = analytics_setup['client']
        res = client.get('/api/analytics/spending_trends/')
        assert res.status_code == 200
        assert isinstance(res.data, list)

    def test_balance_history_endpoint(self, analytics_setup):
        client = analytics_setup['client']
        res = client.get('/api/analytics/balance_history/')
        assert res.status_code == 200
        assert isinstance(res.data, list)

    def test_top_categories_endpoint(self, analytics_setup):
        client = analytics_setup['client']
        res = client.get('/api/analytics/top_categories/')
        assert res.status_code == 200
        assert isinstance(res.data, list)

    def test_budget_vs_actual_endpoint(self, analytics_setup):
        client = analytics_setup['client']
        res = client.get('/api/analytics/budget_vs_actual/')
        assert res.status_code == 200
        assert 'has_budget' in res.data

    def test_unauthenticated_returns_401(self, api_client):
        res = api_client.get('/api/analytics/monthly_trend/')
        assert res.status_code in [401, 403]

