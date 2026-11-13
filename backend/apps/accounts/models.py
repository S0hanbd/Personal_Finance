from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel

ACCOUNT_TYPES = [
    ('cash', 'Cash'),
    ('bank', 'Bank'),
    ('mobile_banking', 'Mobile Banking'),
    ('other', 'Other'),
]

class FinancialAccount(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='cash')
    currency = models.CharField(max_length=3, default='BDT')
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=[('active','Active'),('archived','Archived')], default='active')

    class Meta:
        db_table = 'financial_accounts'
        unique_together = ['user', 'name']
        ordering = ['name']
        indexes = [models.Index(fields=['user', 'status'])]

    def __str__(self):
        return f"{self.name} ({self.user})"
