from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel
from apps.transactions.models import ExpenseCategory, Transaction


class FinancialObligation(TimeStampedModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('urgent', 'Urgent'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='obligations'
    )
    name = models.CharField(max_length=150)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='obligations'
    )
    due_date = models.DateField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_transaction = models.OneToOneField(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='obligation'
    )
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'financial_obligations'
        ordering = ['due_date', 'priority']

    def __str__(self):
        return f"{self.name} - ৳{self.amount} ({self.status})"
