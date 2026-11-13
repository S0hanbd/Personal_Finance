from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel
from apps.transactions.models import ExpenseCategory, Transaction
from apps.accounts.models import FinancialAccount


class RecurringExpense(TimeStampedModel):
    FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('archived', 'Archived'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recurring_expenses'
    )
    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recurring_expenses'
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    start_date = models.DateField()
    due_day = models.PositiveSmallIntegerField(default=1)  # Day of month (1-31)
    preferred_account = models.ForeignKey(
        FinancialAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='preferred_recurring_expenses'
    )
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        db_table = 'recurring_expenses'
        ordering = ['due_day', 'name']

    def __str__(self):
        return f"{self.name} - ৳{self.amount} ({self.frequency})"


class RecurringExpenseOccurrence(TimeStampedModel):
    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('skipped', 'Skipped'),
    ]

    recurring_expense = models.ForeignKey(
        RecurringExpense,
        on_delete=models.CASCADE,
        related_name='occurrences'
    )
    period = models.CharField(max_length=7)  # YYYY-MM e.g. "2026-11"
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    paid_transaction = models.OneToOneField(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bill_occurrence'
    )
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'recurring_expense_occurrences'
        ordering = ['due_date']
        constraints = [
            models.UniqueConstraint(
                fields=['recurring_expense', 'period'],
                name='unique_occurrence_per_period'
            )
        ]

    def __str__(self):
        return f"{self.recurring_expense.name} [{self.period}] - {self.status}"
