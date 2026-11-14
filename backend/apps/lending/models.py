
from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel
from apps.transactions.models import Transaction


class Person(TimeStampedModel):
    """A counterparty — someone the user lends to or borrows from."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lending_people',
    )
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    notes = models.TextField(blank=True)
    total_lent = models.DecimalField(
        max_digits=15, decimal_places=2, default=0
    )
    total_borrowed = models.DecimalField(
        max_digits=15, decimal_places=2, default=0
    )

    class Meta:
        db_table = 'lending_person'
        ordering = ['name']
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name


class LoanRecord(TimeStampedModel):
    """A single loan — money lent to or borrowed from a Person."""

    LOAN_TYPE_CHOICES = [
        ('lent', 'Lent'),
        ('borrowed', 'Borrowed'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('settled', 'Settled'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lending_loans',
    )
    person = models.ForeignKey(
        Person,
        on_delete=models.CASCADE,
        related_name='loans',
    )
    loan_type = models.CharField(max_length=10, choices=LOAN_TYPE_CHOICES)
    initial_amount = models.DecimalField(max_digits=15, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=15, decimal_places=2)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='active'
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'lending_loan_record'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_loan_type_display()} to {self.person.name}: {self.initial_amount}"


class LoanSettlement(TimeStampedModel):
    """A partial or full repayment/collection against a LoanRecord."""

    loan = models.ForeignKey(
        LoanRecord,
        on_delete=models.CASCADE,
        related_name='settlements',
    )
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.PROTECT,
        related_name='loan_settlement',
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    settlement_date = models.DateField()
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'lending_loan_settlement'
        ordering = ['-settlement_date']

    def __str__(self):
        return f"Settlement of {self.amount} on {self.loan.person.name}"
