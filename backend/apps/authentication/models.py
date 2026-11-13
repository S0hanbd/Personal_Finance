from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    timezone = models.CharField(max_length=50, default='Asia/Dhaka')
    default_currency = models.CharField(max_length=3, default='BDT')

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email or self.username
