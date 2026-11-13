from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from apps.accounts.models import FinancialAccount
from .models import Transaction, AccountTransfer

INCREMENT_TYPES = {'income', 'borrowing', 'loan_collection', 'held_money'}
DECREMENT_TYPES = {'expense', 'lending', 'loan_repayment', 'return_held'}


def get_balance_delta(transaction_type: str, amount: Decimal) -> Decimal:
    """Return the signed change in account balance for a given transaction type."""
    if transaction_type in INCREMENT_TYPES:
        return amount
    elif transaction_type in DECREMENT_TYPES:
        return -amount
    return Decimal('0.00')


@transaction.atomic
def create_transaction(*, user, account: FinancialAccount, transaction_type: str,
                       amount: Decimal, transaction_date, category=None,
                       income_source=None, description: str = "") -> Transaction:
    """Create a transaction and atomically adjust account balance."""
    if amount <= Decimal('0.00'):
        raise ValidationError({'amount': 'Amount must be strictly positive.'})

    if category and category.user != user:
        raise ValidationError({'category': 'Invalid category for this user.'})
    if income_source and income_source.user != user:
        raise ValidationError({'income_source': 'Invalid income source for this user.'})
    if account.user != user:
        raise ValidationError({'account': 'Invalid account for this user.'})

    # Lock account row for update
    acc = FinancialAccount.objects.select_for_update().get(id=account.id)
    delta = get_balance_delta(transaction_type, amount)
    acc.current_balance += delta
    acc.save(update_fields=['current_balance', 'updated_at'])

    tx = Transaction.objects.create(
        user=user,
        account=acc,
        transaction_type=transaction_type,
        amount=amount,
        category=category,
        income_source=income_source,
        description=description,
        transaction_date=transaction_date,
    )
    return tx


@transaction.atomic
def update_transaction(tx: Transaction, **validated_data) -> Transaction:
    """Update a transaction, reversing old balance impact and applying new one."""
    new_amount = validated_data.get('amount', tx.amount)
    new_type = validated_data.get('transaction_type', tx.transaction_type)
    new_account = validated_data.get('account', tx.account)

    if new_amount <= Decimal('0.00'):
        raise ValidationError({'amount': 'Amount must be strictly positive.'})

    old_account = tx.account
    old_delta = get_balance_delta(tx.transaction_type, tx.amount)

    if old_account.id == new_account.id:
        acc = FinancialAccount.objects.select_for_update().get(id=old_account.id)
        # Revert old, apply new
        acc.current_balance -= old_delta
        acc.current_balance += get_balance_delta(new_type, new_amount)
        acc.save(update_fields=['current_balance', 'updated_at'])
    else:
        # Two accounts affected
        first_acc = FinancialAccount.objects.select_for_update().get(id=old_account.id)
        first_acc.current_balance -= old_delta
        first_acc.save(update_fields=['current_balance', 'updated_at'])

        sec_acc = FinancialAccount.objects.select_for_update().get(id=new_account.id)
        sec_acc.current_balance += get_balance_delta(new_type, new_amount)
        sec_acc.save(update_fields=['current_balance', 'updated_at'])

    for field, val in validated_data.items():
        setattr(tx, field, val)
    tx.save()
    return tx


@transaction.atomic
def delete_transaction(tx: Transaction) -> None:
    """Delete a transaction and atomically revert its effect on account balance."""
    acc = FinancialAccount.objects.select_for_update().get(id=tx.account.id)
    delta = get_balance_delta(tx.transaction_type, tx.amount)
    acc.current_balance -= delta
    acc.save(update_fields=['current_balance', 'updated_at'])
    tx.delete()


@transaction.atomic
def create_transfer(*, user, source_account: FinancialAccount,
                    destination_account: FinancialAccount, amount: Decimal,
                    transaction_date, description: str = "") -> AccountTransfer:
    """Create an account transfer moving money atomically between accounts."""
    if source_account.id == destination_account.id:
        raise ValidationError({'destination_account': 'Source and destination accounts must be different.'})
    if amount <= Decimal('0.00'):
        raise ValidationError({'amount': 'Transfer amount must be strictly positive.'})
    if source_account.user != user or destination_account.user != user:
        raise ValidationError({'account': 'Both accounts must belong to the authenticated user.'})

    # Lock in consistent order to prevent deadlocks
    ids = sorted([source_account.id, destination_account.id])
    accounts = {acc.id: acc for acc in FinancialAccount.objects.select_for_update().filter(id__in=ids)}
    src = accounts[source_account.id]
    dst = accounts[destination_account.id]

    src.current_balance -= amount
    dst.current_balance += amount
    src.save(update_fields=['current_balance', 'updated_at'])
    dst.save(update_fields=['current_balance', 'updated_at'])

    transfer = AccountTransfer.objects.create(
        user=user,
        source_account=src,
        destination_account=dst,
        amount=amount,
        description=description,
        transaction_date=transaction_date,
    )
    return transfer


@transaction.atomic
def delete_transfer(transfer: AccountTransfer) -> None:
    """Delete an account transfer and revert balances on both accounts."""
    ids = sorted([transfer.source_account.id, transfer.destination_account.id])
    accounts = {acc.id: acc for acc in FinancialAccount.objects.select_for_update().filter(id__in=ids)}
    src = accounts[transfer.source_account.id]
    dst = accounts[transfer.destination_account.id]

    src.current_balance += transfer.amount
    dst.current_balance -= transfer.amount
    src.save(update_fields=['current_balance', 'updated_at'])
    dst.save(update_fields=['current_balance', 'updated_at'])
    transfer.delete()


@transaction.atomic
def reconcile_account(account: FinancialAccount) -> Decimal:
    """Recalculate account balance from opening balance + ledger entries."""
    acc = FinancialAccount.objects.select_for_update().get(id=account.id)
    balance = acc.opening_balance

    # Transactions
    for tx in Transaction.objects.filter(account=acc):
        balance += get_balance_delta(tx.transaction_type, tx.amount)

    # Transfers In
    for tr in AccountTransfer.objects.filter(destination_account=acc):
        balance += tr.amount

    # Transfers Out
    for tr in AccountTransfer.objects.filter(source_account=acc):
        balance -= tr.amount

    acc.current_balance = balance
    acc.save(update_fields=['current_balance', 'updated_at'])
    return balance

