from decimal import Decimal
from datetime import date
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import FinancialAccount
from apps.transactions.models import ExpenseCategory
from apps.bills.models import RecurringExpense, RecurringExpenseOccurrence
from apps.bills.services import pay_bill_occurrence
from .models import MonthlyBudget, BudgetCategory, PlannedPurchase
from .services import calculate_budget_performance, settle_planned_purchase

User = get_user_model()


class BudgetTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='budgetuser',
            email='budget@test.com',
            password='Password123!'
        )
        self.account = FinancialAccount.objects.create(
            user=self.user,
            name='Checking Account',
            account_type='bank',
            current_balance=Decimal('50000.00'),
            currency='BDT'
        )
        self.food_cat = ExpenseCategory.objects.create(
            user=self.user,
            name='Food & Dining'
        )
        self.bills_cat = ExpenseCategory.objects.create(
            user=self.user,
            name='Utilities'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_calculate_budget_performance_normal_and_exceeded(self):
        # Create budget for current month with 10,000 limit
        today = date.today()
        budget = MonthlyBudget.objects.create(
            user=self.user,
            year=today.year,
            month=today.month,
            total_amount=Decimal('10000.00')
        )
        BudgetCategory.objects.create(
            budget=budget,
            category=self.food_cat,
            allocated_amount=Decimal('6000.00')
        )

        # 1. No expenses yet -> 0% used, normal status
        perf = calculate_budget_performance(self.user, today.year, today.month)
        self.assertTrue(perf['has_budget'])
        self.assertEqual(perf['budget_limit'], '10000.00')
        self.assertEqual(perf['variable_spent'], '0.00')
        self.assertEqual(perf['status'], 'normal')
        self.assertEqual(perf['percentage_used'], 0.0)

        # 2. Add variable expense 8,500 -> 85% used, warning status
        from apps.transactions.services import create_transaction
        create_transaction(
            user=self.user,
            account=self.account,
            transaction_type='expense',
            amount=Decimal('8500.00'),
            category=self.food_cat,
            description='Groceries bulk',
            transaction_date=today,
        )

        perf = calculate_budget_performance(self.user, today.year, today.month)
        self.assertEqual(perf['variable_spent'], '8500.00')
        self.assertEqual(perf['status'], 'warning')
        self.assertEqual(perf['percentage_used'], 85.0)

        # 3. Add more expense to exceed limit (total 10,500)
        create_transaction(
            user=self.user,
            account=self.account,
            transaction_type='expense',
            amount=Decimal('2000.00'),
            category=self.food_cat,
            description='Dinner out',
            transaction_date=today,
        )

        perf = calculate_budget_performance(self.user, today.year, today.month)
        self.assertEqual(perf['variable_spent'], '10500.00')
        self.assertEqual(perf['status'], 'exceeded')
        self.assertEqual(perf['percentage_used'], 105.0)

    def test_recurring_bill_occurrence_excluded_from_variable_budget(self):
        today = date.today()
        MonthlyBudget.objects.create(
            user=self.user,
            year=today.year,
            month=today.month,
            total_amount=Decimal('10000.00')
        )

        # Pay a recurring bill of 3,000
        bill = RecurringExpense.objects.create(
            user=self.user,
            name='Electricity Bill',
            amount=Decimal('3000.00'),
            frequency='monthly',
            start_date=today,
            due_day=today.day,
            preferred_account=self.account
        )
        occurrence = RecurringExpenseOccurrence.objects.create(
            recurring_expense=bill,
            period=f"{today.year:04d}-{today.month:02d}",
            due_date=today,
            amount=Decimal('3000.00'),
            status='unpaid'
        )
        pay_bill_occurrence(occurrence, account=self.account, payment_date=today)

        # Add variable expense of 1,000
        from apps.transactions.services import create_transaction
        create_transaction(
            user=self.user,
            account=self.account,
            transaction_type='expense',
            amount=Decimal('1000.00'),
            category=self.food_cat,
            description='Lunch',
            transaction_date=today,
        )

        perf = calculate_budget_performance(self.user, today.year, today.month)
        # Variable spent should only be 1,000, fixed spent should be 3,000, total spent 4,000
        self.assertEqual(perf['variable_spent'], '1000.00')
        self.assertEqual(perf['fixed_spent'], '3000.00')
        self.assertEqual(perf['total_spent'], '4000.00')
        self.assertEqual(perf['remaining_budget'], '9000.00')

    def test_settle_planned_purchase_lifecycle(self):
        planned = PlannedPurchase.objects.create(
            user=self.user,
            name='Ergonomic Chair',
            estimated_amount=Decimal('15000.00'),
            category=self.food_cat,
            priority='high',
            status='ready'
        )

        initial_balance = self.account.current_balance
        settle_planned_purchase(planned, account=self.account)

        planned.refresh_from_db()
        self.account.refresh_from_db()

        self.assertEqual(planned.status, 'purchased')
        self.assertIsNotNone(planned.purchased_transaction)
        self.assertIsNotNone(planned.purchased_at)
        self.assertEqual(self.account.current_balance, initial_balance - Decimal('15000.00'))

        # Second settlement must fail
        with self.assertRaises(ValueError):
            settle_planned_purchase(planned, account=self.account)

    def test_api_performance_endpoint(self):
        today = date.today()
        response = self.client.get(f'/api/budgets/monthly/performance/?year={today.year}&month={today.month}')
        self.assertEqual(response.status_code, 200)
        self.assertIn('variable_spent', response.data)
        self.assertIn('status', response.data)
