
from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel


class Project(TimeStampedModel):
    """A project for planning and tracking expenses."""

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='active'
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ProjectItem(TimeStampedModel):
    """A planning item within a project — e.g., 'Cement', 'Labor'."""

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='items',
    )
    name = models.CharField(max_length=200)
    estimated_amount = models.DecimalField(
        max_digits=15, decimal_places=2, default=0
    )
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'projects_item'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.name} ({self.estimated_amount})"
