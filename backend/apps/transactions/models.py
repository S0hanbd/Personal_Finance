from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel

TRANSACTION_TYPES = [
    ('income', 'Income'),
    ('expense', 'Expense'),
    ('transfer', 'Transfer'),
    ('lending', 'Lending'),
    ('borrowing', 'Borrowing'),
    ('loan_repayment', 'Loan Repayment'),
    ('loan_collection', 'Loan Collection'),
    ('held_money', 'Held Money'),
    ('return_held', 'Return Held Money'),
]

STATUS = [('active', 'Active'), ('archived', 'Archived')]


class IncomeSource(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='income_sources')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default='active')

    class Meta:
        db_table = 'income_sources'
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name


class ExpenseCategory(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expense_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default='active')

    class Meta:
        db_table = 'expense_categories'
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name


class Transaction(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey('accounts.FinancialAccount', on_delete=models.PROTECT, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    category = models.ForeignKey(ExpenseCategory, null=True, blank=True, on_delete=models.SET_NULL)
    income_source = models.ForeignKey(IncomeSource, null=True, blank=True, on_delete=models.SET_NULL)
    description = models.TextField(blank=True)
    transaction_date = models.DateField()

    class Meta:
        db_table = 'transactions'
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'transaction_date']),
            models.Index(fields=['user', 'transaction_type']),
            models.Index(fields=['account', 'transaction_date']),
        ]

    def __str__(self):
        return f"{self.transaction_type} {self.amount} on {self.transaction_date}"


class AccountTransfer(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transfers')
    source_account = models.ForeignKey('accounts.FinancialAccount', related_name='transfers_out', on_delete=models.PROTECT)
    destination_account = models.ForeignKey('accounts.FinancialAccount', related_name='transfers_in', on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField(blank=True)
    transaction_date = models.DateField()

    class Meta:
        db_table = 'account_transfers'
        ordering = ['-transaction_date']
