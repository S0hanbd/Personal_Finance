from decimal import Decimal
import pytest

from apps.projects.models import Project, ProjectItem
from apps.accounts.models import FinancialAccount
from apps.transactions.models import Transaction, ExpenseCategory


@pytest.fixture
def project_setup(db, user, auth_client):
    account = FinancialAccount.objects.create(
        user=user,
        name='Main Bank',
        account_type='bank',
        opening_balance=Decimal('10000.00'),
        current_balance=Decimal('10000.00'),
    )
    category = ExpenseCategory.objects.create(user=user, name='Construction')
    return {
        'user': user,
        'client': auth_client,
        'account': account,
        'category': category,
    }


@pytest.mark.django_db
class TestProjectCRUD:
    def test_create_project(self, project_setup):
        client = project_setup['client']
        res = client.post('/api/projects/', {
            'name': 'House Renovation',
            'description': 'Renovate the kitchen',
            'status': 'active',
        })
        assert res.status_code == 201
        assert res.data['name'] == 'House Renovation'
        assert Project.objects.filter(name='House Renovation').exists()

    def test_list_projects(self, project_setup):
        user = project_setup['user']
        Project.objects.create(user=user, name='Project A')
        Project.objects.create(user=user, name='Project B')
        # Another user's project should not appear
        from django.contrib.auth import get_user_model
        other = get_user_model().objects.create_user(username='other', password='pass')
        Project.objects.create(user=other, name='Other Project')

        client = project_setup['client']
        res = client.get('/api/projects/')
        assert res.status_code == 200
        # DRF router may paginate — check results key if present
        data = res.data.get('results', res.data)
        assert len(data) == 2

    def test_update_project(self, project_setup):
        user = project_setup['user']
        project = Project.objects.create(user=user, name='Old Name')
        client = project_setup['client']
        res = client.put(f'/api/projects/{project.id}/', {
            'name': 'New Name',
            'status': 'completed',
        })
        assert res.status_code == 200
        assert res.data['name'] == 'New Name'
        assert res.data['status'] == 'completed'

    def test_delete_project(self, project_setup):
        user = project_setup['user']
        project = Project.objects.create(user=user, name='Delete Me')
        client = project_setup['client']
        res = client.delete(f'/api/projects/{project.id}/')
        assert res.status_code == 204
        assert not Project.objects.filter(id=project.id).exists()


@pytest.mark.django_db
class TestProjectItemCRUD:
    def test_create_item(self, project_setup):
        user = project_setup['user']
        project = Project.objects.create(user=user, name='Test Project')
        client = project_setup['client']
        res = client.post(f'/api/projects/{project.id}/items/', {
            'name': 'Cement',
            'estimated_amount': '500.00',
        })
        assert res.status_code == 201
        assert res.data['name'] == 'Cement'
        assert res.data['estimated_amount'] == '500.00'

    def test_update_item(self, project_setup):
        user = project_setup['user']
        project = Project.objects.create(user=user, name='Test Project')
        item = ProjectItem.objects.create(project=project, name='Cement', estimated_amount=Decimal('500'))
        client = project_setup['client']
        res = client.put(f'/api/projects/{project.id}/items/{item.id}/', {
            'name': 'Cement Bags',
            'estimated_amount': '750.00',
        })
        assert res.status_code == 200
        assert res.data['name'] == 'Cement Bags'

    def test_delete_item_sets_transaction_null(self, project_setup):
        user = project_setup['user']
        account = project_setup['account']
        project = Project.objects.create(user=user, name='Test Project')
        item = ProjectItem.objects.create(project=project, name='Cement', estimated_amount=Decimal('500'))
        tx = Transaction.objects.create(
            user=user, account=account, transaction_type='expense',
            amount=Decimal('100'), transaction_date='2026-01-01',
            project_item=item,
        )
        assert tx.project_item_id == item.id
        item.delete()
        tx.refresh_from_db()
        assert tx.project_item_id is None


@pytest.mark.django_db
class TestTotalEstimated:
    def test_project_total_estimated(self, project_setup):
        user = project_setup['user']
        project = Project.objects.create(user=user, name='Test Project')
        ProjectItem.objects.create(project=project, name='Cement', estimated_amount=Decimal('500'))
        ProjectItem.objects.create(project=project, name='Labor', estimated_amount=Decimal('1500'))

        client = project_setup['client']
        res = client.get(f'/api/projects/{project.id}/')
        assert res.status_code == 200
        assert res.data['total_estimated'] == '2000.00'


@pytest.mark.django_db
class TestActualSpent:
    def test_actual_spent_from_tagged_transactions(self, project_setup):
        user = project_setup['user']
        account = project_setup['account']
        project = Project.objects.create(user=user, name='Test Project')
        item = ProjectItem.objects.create(project=project, name='Cement', estimated_amount=Decimal('500'))
        Transaction.objects.create(
            user=user, account=account, transaction_type='expense',
            amount=Decimal('200'), transaction_date='2026-01-01',
            project_item=item,
        )
        Transaction.objects.create(
            user=user, account=account, transaction_type='expense',
            amount=Decimal('150'), transaction_date='2026-01-05',
            project_item=item,
        )

        client = project_setup['client']
        res = client.get(f'/api/projects/{project.id}/items/{item.id}/')
        assert res.status_code == 200
        assert res.data['actual_spent'] == '350.00'
        assert res.data['remaining'] == '150.00'

    def test_over_spend_detection(self, project_setup):
        user = project_setup['user']
        account = project_setup['account']
        project = Project.objects.create(user=user, name='Test Project')
        item = ProjectItem.objects.create(project=project, name='Cement', estimated_amount=Decimal('500'))
        Transaction.objects.create(
            user=user, account=account, transaction_type='expense',
            amount=Decimal('600'), transaction_date='2026-01-01',
            project_item=item,
        )

        client = project_setup['client']
        res = client.get(f'/api/projects/{project.id}/items/{item.id}/')
        assert res.status_code == 200
        assert res.data['actual_spent'] == '600.00'
        assert res.data['remaining'] == '-100.00'
        assert res.data['percent_spent'] > 100


@pytest.mark.django_db
class TestProjectDetail:
    def test_detail_with_nested_items(self, project_setup):
        user = project_setup['user']
        project = Project.objects.create(user=user, name='Test Project')
        ProjectItem.objects.create(project=project, name='Cement', estimated_amount=Decimal('500'))
        ProjectItem.objects.create(project=project, name='Labor', estimated_amount=Decimal('1500'))

        client = project_setup['client']
        res = client.get(f'/api/projects/{project.id}/')
        assert res.status_code == 200
        assert len(res.data['items']) == 2
        assert res.data['total_estimated'] == '2000.00'
        assert 'total_spent' in res.data
        assert 'remaining' in res.data
        assert 'percent_complete' in res.data


@pytest.mark.django_db
class TestAPISummary:
    def test_summary_endpoint(self, project_setup):
        user = project_setup['user']
        project = Project.objects.create(user=user, name='Test Project')
        ProjectItem.objects.create(project=project, name='Cement', estimated_amount=Decimal('1000'))

        client = project_setup['client']
        res = client.get('/api/projects/summary/')
        assert res.status_code == 200
        assert res.data['total_estimated'] == '1000.00'
        assert res.data['project_count'] == 1

    def test_unauthenticated_returns_401(self, api_client):
        res = api_client.get('/api/projects/')
        assert res.status_code in [401, 403]

