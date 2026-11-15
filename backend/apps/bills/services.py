import calendar
from datetime import date
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.transactions.services import create_transaction
from .models import RecurringExpense, RecurringExpenseOccurrence


def get_current_period() -> str:
    today = date.today()
    return f"{today.year:04d}-{today.month:02d}"


def calculate_due_date(year: int, month: int, due_day: int) -> date:
    _, max_days = calendar.monthrange(year, month)
    clamped_day = min(due_day, max_days)
    return date(year, month, clamped_day)


@transaction.atomic
def generate_monthly_occurrences(user, period: str | None = None) -> list[RecurringExpenseOccurrence]:
    """
    Ensures that for a given user and target month (YYYY-MM), all active recurring bills
    have an occurrence. Also marks overdue items.
    """
    if not period:
        period = get_current_period()

    year_str, month_str = period.split('-')
    year, month = int(year_str), int(month_str)

    # Active bills whose start_date is not in the future of this period
    bills = RecurringExpense.objects.filter(
        user=user,
        status='active',
        start_date__lte=calculate_due_date(year, month, 28)
    )

    created_or_found = []
    today = date.today()

    for bill in bills:
        due_date = calculate_due_date(year, month, bill.due_day)

        occurrence, created = RecurringExpenseOccurrence.objects.get_or_create(
            recurring_expense=bill,
            period=period,
            defaults={
                'due_date': due_date,
                'amount': bill.amount,
                'status': 'unpaid' if due_date >= today else 'overdue',
            }
        )

        # If it was already there and unpaid but passed due_date, update to overdue
        if not created and occurrence.status == 'unpaid' and occurrence.due_date < today:
            occurrence.status = 'overdue'
            occurrence.save(update_fields=['status'])

        created_or_found.append(occurrence)

    return created_or_found


@transaction.atomic
def pay_bill_occurrence(
    occurrence: RecurringExpenseOccurrence,
    account,
    payment_date: date | None = None,
    description: str | None = None,
) -> tuple[RecurringExpenseOccurrence, object]:
    """
    Records an actual expense transaction for a recurring bill occurrence,
    deducts from the chosen account balance via ledger service, and updates
    occurrence status to 'paid'.
    """
    if occurrence.status == 'paid':
        raise ValueError("This bill occurrence has already been paid.")

    bill = occurrence.recurring_expense
    tx_date = payment_date or date.today()
    tx_description = description or f"Bill Payment: {bill.name} ({occurrence.period})"

    # Create transaction via atomic ledger service
    tx = create_transaction(
        user=bill.user,
        account=account,
        transaction_type='expense',
        amount=Decimal(str(occurrence.amount)),
        category=bill.category,
        description=tx_description,
        transaction_date=tx_date,
    )

    occurrence.status = 'paid'
    occurrence.paid_transaction = tx
    occurrence.paid_at = timezone.now()
    occurrence.save(update_fields=['status', 'paid_transaction', 'paid_at'])

    return occurrence, tx
