"""Reports tests — CSV export and PDF generation."""

from datetime import date
from decimal import Decimal
import pytest

from apps.accounts.models import FinancialAccount
from apps.transactions.models import Transaction, ExpenseCategory, IncomeSource
from apps.budgets.models import MonthlyBudget, BudgetCategory
from apps.projects.models import Project, ProjectItem
from apps.reports.services import (
    export_transactions_csv,
    generate_monthly_report,
    generate_budget_report,
    generate_project_report,
)


@pytest.fixture
def report_setup(db, user, auth_client):
    """Create account, categories, and transactions for testing."""
    account = FinancialAccount.objects.create(
        user=user,
        name='Main Bank',
        account_type='bank',
        opening_balance=Decimal('50000.00'),
        current_balance=Decimal('50000.00'),
    )
    category_food = ExpenseCategory.objects.create(user=user, name='Food')
    category_transport = ExpenseCategory.objects.create(user=user, name='Transport')
    income_salary = IncomeSource.objects.create(user=user, name='Salary')

    # Create transactions in November 2026
    Transaction.objects.create(
        user=user, account=account, transaction_type='income',
        amount=Decimal('30000.00'), income_source=income_salary,
        transaction_date=date(2026, 11, 1),
    )
    Transaction.objects.create(
        user=user, account=account, transaction_type='expense',
        amount=Decimal('5000.00'), category=category_food,
        transaction_date=date(2026, 11, 5),
    )
    Transaction.objects.create(
        user=user, account=account, transaction_type='expense',
        amount=Decimal('2000.00'), category=category_transport,
        transaction_date=date(2026, 11, 10),
    )

    return {
        'user': user,
        'client': auth_client,
        'account': account,
        'category_food': category_food,
        'category_transport': category_transport,
        'income_salary': income_salary,
    }


@pytest.mark.django_db
class TestCSVExport:
    def test_export_returns_csv_with_headers(self, report_setup):
        csv_data = export_transactions_csv(report_setup['user'])
        lines = csv_data.strip().split('\n')
        # First line should be headers
        assert 'Date' in lines[0]
        assert 'Type' in lines[0]
        assert 'Amount' in lines[0]

    def test_export_includes_all_transactions(self, report_setup):
        csv_data = export_transactions_csv(report_setup['user'])
        lines = csv_data.strip().split('\n')
        # Header + 3 transactions
        assert len(lines) == 4

    def test_export_filters_by_date_range(self, report_setup):
        # Add a transaction in December
        Transaction.objects.create(
            user=report_setup['user'],
            account=report_setup['account'],
            transaction_type='expense',
            amount=Decimal('1000.00'),
            category=report_setup['category_food'],
            transaction_date=date(2026, 12, 1),
        )
        csv_data = export_transactions_csv(
            report_setup['user'],
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 30),
        )
        lines = csv_data.strip().split('\n')
        # Header + 3 November transactions
        assert len(lines) == 4

    def test_export_filters_by_type(self, report_setup):
        csv_data = export_transactions_csv(
            report_setup['user'],
            transaction_type='expense',
        )
        lines = csv_data.strip().split('\n')
        # Header + 2 expense transactions
        assert len(lines) == 3

    def test_empty_export_returns_headers_only(self, db, user):
        csv_data = export_transactions_csv(user)
        lines = csv_data.strip().split('\n')
        assert len(lines) == 1
        assert 'Date' in lines[0]


@pytest.mark.django_db
class TestMonthlyReport:
    def test_generate_monthly_report_returns_pdf(self, report_setup):
        pdf_data = generate_monthly_report(report_setup['user'], 2026, 11)
        assert isinstance(pdf_data, bytes)
        # PDF files start with %PDF
        assert pdf_data.startswith(b'%PDF')

    def test_monthly_report_with_data(self, report_setup):
        """Report with transactions should generate valid PDF."""
        pdf_data = generate_monthly_report(report_setup['user'], 2026, 11)
        assert isinstance(pdf_data, bytes)
        assert pdf_data.startswith(b'%PDF')
        # PDF should have substantial content (more than empty report)
        assert len(pdf_data) > 500

    def test_monthly_report_empty_period(self, db, user):
        """Report with no transactions should still generate."""
        pdf_data = generate_monthly_report(user, 2026, 11)
        assert isinstance(pdf_data, bytes)
        assert pdf_data.startswith(b'%PDF')


@pytest.mark.django_db
class TestBudgetReport:
    def test_generate_budget_report_returns_pdf(self, report_setup):
        user = report_setup['user']
        # Create budget
        budget = MonthlyBudget.objects.create(
            user=user, year=2026, month=11, total_amount=Decimal('10000.00'),
        )
        BudgetCategory.objects.create(
            budget=budget, category=report_setup['category_food'],
            allocated_amount=Decimal('6000.00'),
        )
        BudgetCategory.objects.create(
            budget=budget, category=report_setup['category_transport'],
            allocated_amount=Decimal('4000.00'),
        )

        pdf_data = generate_budget_report(user, 2026, 11)
        assert isinstance(pdf_data, bytes)
        assert pdf_data.startswith(b'%PDF')

    def test_budget_report_no_budget(self, report_setup):
        """Report with no budget should show message."""
        pdf_data = generate_budget_report(report_setup['user'], 2026, 11)
        assert isinstance(pdf_data, bytes)
        assert pdf_data.startswith(b'%PDF')


@pytest.mark.django_db
class TestProjectReport:
    def test_generate_project_report_returns_pdf(self, report_setup):
        user = report_setup['user']
        project = Project.objects.create(
            user=user, name='Test Project', status='active',
        )
        item = ProjectItem.objects.create(
            project=project, name='Materials', estimated_amount=Decimal('5000.00'),
        )
        # Tag a transaction to the project item
        Transaction.objects.filter(
            user=user, category=report_setup['category_food']
        ).update(project_item=item)

        pdf_data = generate_project_report(user, project.id)
        assert isinstance(pdf_data, bytes)
        assert pdf_data.startswith(b'%PDF')

    def test_project_report_not_found(self, db, user):
        """Report for non-existent project should raise ValueError."""
        with pytest.raises(ValueError, match='Project not found'):
            generate_project_report(user, 999)


@pytest.mark.django_db
class TestReportsAPI:
    def test_csv_export_endpoint(self, report_setup):
        client = report_setup['client']
        res = client.get('/api/reports/export_csv/')
        assert res.status_code == 200
        assert 'text/csv' in res['Content-Type']

    def test_monthly_report_endpoint(self, report_setup):
        client = report_setup['client']
        res = client.get('/api/reports/monthly_report/?year=2026&month=11')
        assert res.status_code == 200
        assert 'application/pdf' in res['Content-Type']

    def test_monthly_report_missing_params(self, report_setup):
        client = report_setup['client']
        res = client.get('/api/reports/monthly_report/')
        assert res.status_code == 400

    def test_budget_report_endpoint(self, report_setup):
        user = report_setup['user']
        client = report_setup['client']
        budget = MonthlyBudget.objects.create(
            user=user, year=2026, month=11, total_amount=Decimal('10000.00'),
        )
        BudgetCategory.objects.create(
            budget=budget, category=report_setup['category_food'],
            allocated_amount=Decimal('6000.00'),
        )
        res = client.get('/api/reports/budget_report/?year=2026&month=11')
        assert res.status_code == 200
        assert 'application/pdf' in res['Content-Type']

    def test_project_report_endpoint(self, report_setup):
        user = report_setup['user']
        client = report_setup['client']
        project = Project.objects.create(
            user=user, name='Test Project', status='active',
        )
        ProjectItem.objects.create(
            project=project, name='Materials', estimated_amount=Decimal('5000.00'),
        )
        res = client.get(f'/api/reports/project_report/?project_id={project.id}')
        assert res.status_code == 200
        assert 'application/pdf' in res['Content-Type']

    def test_project_report_not_found(self, report_setup):
        client = report_setup['client']
        res = client.get('/api/reports/project_report/?project_id=999')
        assert res.status_code == 404

    def test_unauthenticated_access_denied(self, api_client):
        res = api_client.get('/api/reports/export_csv/')
        assert res.status_code == 401
