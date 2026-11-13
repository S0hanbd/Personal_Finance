from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel
from apps.transactions.models import ExpenseCategory, Transaction


class MonthlyBudget(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='monthly_budgets'
    )
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField()  # 1 to 12
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'monthly_budgets'
        ordering = ['-year', '-month']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'year', 'month'],
                name='unique_user_monthly_budget'
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.year}/{self.month:02d}: {self.total_amount}"


class BudgetCategory(TimeStampedModel):
    budget = models.ForeignKey(
        MonthlyBudget,
        on_delete=models.CASCADE,
        related_name='category_allocations'
    )
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.CASCADE,
        related_name='budget_allocations'
    )
    allocated_amount = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        db_table = 'budget_categories'
        ordering = ['category__name']
        constraints = [
            models.UniqueConstraint(
                fields=['budget', 'category'],
                name='unique_budget_category_allocation'
            )
        ]

    def __str__(self):
        return f"{self.budget} - {self.category.name}: {self.allocated_amount}"


class PlannedPurchase(TimeStampedModel):
    PRIORITY_CHOICES = [
        ('urgent', 'Urgent'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('saving', 'Saving'),
        ('ready', 'Ready to Buy'),
        ('purchased', 'Purchased'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='planned_purchases'
    )
    name = models.CharField(max_length=150)
    estimated_amount = models.DecimalField(max_digits=15, decimal_places=2)
    target_date = models.DateField(null=True, blank=True)
    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='planned_purchases'
    )
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='planned')
    notes = models.TextField(blank=True)
    purchased_transaction = models.ForeignKey(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='planned_purchases'
    )
    purchased_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'planned_purchases'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.status}) - {self.estimated_amount}"
