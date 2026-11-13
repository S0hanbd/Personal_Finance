from datetime import date
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.transactions.services import create_transaction
from .models import FinancialObligation


@transaction.atomic
def pay_obligation(
    obligation: FinancialObligation,
    account,
    payment_date: date | None = None,
    description: str | None = None,
) -> tuple[FinancialObligation, object]:
    """
    Records an expense transaction deducting from the chosen account and marks
    the future obligation as paid.
    """
    if obligation.status == 'paid':
        raise ValueError("This obligation has already been paid.")

    tx_date = payment_date or date.today()
    tx_description = description or f"Obligation Payment: {obligation.name}"

    tx = create_transaction(
        user=obligation.user,
        account=account,
        transaction_type='expense',
        amount=Decimal(str(obligation.amount)),
        category=obligation.category,
        description=tx_description,
        transaction_date=tx_date,
    )

    obligation.status = 'paid'
    obligation.paid_transaction = tx
    obligation.paid_at = timezone.now()
    obligation.save(update_fields=['status', 'paid_transaction', 'paid_at'])

    return obligation, tx
