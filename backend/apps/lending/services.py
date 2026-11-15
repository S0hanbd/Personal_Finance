from decimal import Decimal
from django.db import transaction as db_transaction
from django.core.exceptions import ValidationError
from apps.accounts.models import FinancialAccount
from apps.transactions.services import create_transaction
from .models import Person, LoanRecord, LoanSettlement


@db_transaction.atomic
def lend_money(
    *,
    user,
    person_name: str,
    amount: Decimal,
    account: FinancialAccount,
    due_date=None,
    notes: str = "",
    phone: str = "",
    email: str = "",
) -> LoanRecord:
    """Lend money to a person. Creates a 'lending' transaction that deducts the account."""
    if amount <= Decimal('0.00'):
        raise ValidationError({'amount': 'Amount must be greater than zero.'})

    person, _ = Person.objects.get_or_create(
        user=user,
        defaults={
            'name': person_name.strip(),
            'phone': phone,
            'email': email,
        },
    )

    loan = LoanRecord.objects.create(
        user=user,
        person=person,
        loan_type='lent',
        initial_amount=amount,
        remaining_amount=amount,
        due_date=due_date,
        notes=notes,
    )

    tx = create_transaction(
        user=user,
        account=account,
        transaction_type='lending',
        amount=amount,
        transaction_date=due_date or loan.created_at.date(),
        description=f"Lent to {person.name}: {notes}",
    )

    person = Person.objects.select_for_update().get(id=person.id)
    person.total_lent += amount
    person.save(update_fields=['total_lent', 'updated_at'])

    LoanSettlement.objects.create(
        loan=loan,
        transaction=tx,
        amount=amount,
        settlement_date=tx.transaction_date,
        notes=notes,
    )

    return loan


@db_transaction.atomic
def borrow_money(
    *,
    user,
    person_name: str,
    amount: Decimal,
    account: FinancialAccount,
    due_date=None,
    notes: str = "",
    phone: str = "",
    email: str = "",
) -> LoanRecord:
    """Borrow money from a person. Creates a 'borrowing' transaction that adds to the account."""
    if amount <= Decimal('0.00'):
        raise ValidationError({'amount': 'Amount must be greater than zero.'})

    person, _ = Person.objects.get_or_create(
        user=user,
        defaults={
            'name': person_name.strip(),
            'phone': phone,
            'email': email,
        },
    )

    loan = LoanRecord.objects.create(
        user=user,
        person=person,
        loan_type='borrowed',
        initial_amount=amount,
        remaining_amount=amount,
        due_date=due_date,
        notes=notes,
    )

    tx = create_transaction(
        user=user,
        account=account,
        transaction_type='borrowing',
        amount=amount,
        transaction_date=due_date or loan.created_at.date(),
        description=f"Borrowed from {person.name}: {notes}",
    )

    person = Person.objects.select_for_update().get(id=person.id)
    person.total_borrowed += amount
    person.save(update_fields=['total_borrowed', 'updated_at'])

    LoanSettlement.objects.create(
        loan=loan,
        transaction=tx,
        amount=amount,
        settlement_date=tx.transaction_date,
        notes=notes,
    )

    return loan


@db_transaction.atomic
def record_settlement(
    *,
    loan: LoanRecord,
    amount: Decimal,
    account: FinancialAccount,
    settlement_date,
    notes: str = "",
) -> LoanSettlement:
    """Record a partial or full repayment/collection against a loan."""
    if amount <= Decimal('0.00'):
        raise ValidationError({'amount': 'Amount must be greater than zero.'})

    if loan.status == 'settled':
        raise ValueError("Cannot settle an already settled loan.")

    if amount > loan.remaining_amount:
        raise ValueError(
            f"Settlement amount ({amount}) exceeds remaining balance ({loan.remaining_amount})."
        )

    if loan.loan_type == 'lent':
        tx_type = 'loan_collection'
    else:
        tx_type = 'loan_repayment'

    tx = create_transaction(
        user=loan.user,
        account=account,
        transaction_type=tx_type,
        amount=amount,
        transaction_date=settlement_date,
        description=f"Settlement on {loan.person.name}: {notes}",
    )

    loan.remaining_amount -= amount
    if loan.remaining_amount <= Decimal('0.00'):
        loan.remaining_amount = Decimal('0.00')
        loan.status = 'settled'
    loan.save(update_fields=['remaining_amount', 'status', 'updated_at'])

    if loan.loan_type == 'lent':
        person_field = 'total_lent'
    else:
        person_field = 'total_borrowed'

    person = Person.objects.select_for_update().get(id=loan.person.id)
    setattr(person, person_field, max(
        Decimal('0.00'),
        getattr(person, person_field) - amount,
    ))
    person.save(update_fields=[person_field, 'updated_at'])

    settlement = LoanSettlement.objects.create(
        loan=loan,
        transaction=tx,
        amount=amount,
        settlement_date=settlement_date,
        notes=notes,
    )

    return settlement
