from django.contrib.auth.models import AbstractUser
from django.db import models


DEFAULT_DASHBOARD_CARDS = [
    'total_balance', 'monthly_income', 'monthly_expenses',
    'unpaid_bills', 'remaining_after_bills', 'future_obligations',
    'budget_remaining',
]

DEFAULT_SIDEBAR_ITEMS = [
    'dashboard', 'transactions', 'accounts', 'bills', 'budget',
    'planned_spending', 'obligations', 'people', 'analytics',
    'projects', 'settings',
]


class User(AbstractUser):
    timezone = models.CharField(max_length=50, default='Asia/Dhaka')
    default_currency = models.CharField(max_length=3, default='BDT')
    first_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email or self.username


class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_settings')
    dashboard_cards = models.JSONField(default=list, blank=True)
    sidebar_items = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'user_settings'

    def __str__(self):
        return f'{self.user.username} settings'
