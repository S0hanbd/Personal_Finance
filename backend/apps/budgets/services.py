from decimal import Decimal
from datetime import date
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from apps.transactions.models import Transaction
from apps.transactions.services import create_transaction
from .models import MonthlyBudget, PlannedPurchase


def format_decimal(val) -> str:
    if val is None:
        return "0.00"
    return f"{Decimal(str(val)):.2f}"


def calculate_budget_performance(user, year: int, month: int):
    """
    Computes performance for a user's budget in a given year/month.
    Separates variable spending from fixed recurring bills.
    """
    try:
        budget = MonthlyBudget.objects.prefetch_related('category_allocations__category').get(
            user=user,
            year=year,
            month=month
        )
    except MonthlyBudget.DoesNotExist:
        budget = None

    # Base query for all expenses in this period
    expense_txs = Transaction.objects.filter(
        user=user,
        transaction_type='expense',
        transaction_date__year=year,
        transaction_date__month=month
    )

    # Variable expenses (excluding automated recurring bills)
    variable_txs = expense_txs.filter(bill_occurrence__isnull=True)
    fixed_txs = expense_txs.filter(bill_occurrence__isnull=False)

    var_spent_agg = Decimal(str(variable_txs.aggregate(total=Sum('amount'))['total'] or '0.00'))
    fixed_spent_agg = Decimal(str(fixed_txs.aggregate(total=Sum('amount'))['total'] or '0.00'))
    total_spent_agg = var_spent_agg + fixed_spent_agg

    if budget:
        budget_limit = Decimal(str(budget.total_amount))
        remaining = budget_limit - var_spent_agg
        if budget_limit > Decimal('0.00'):
            pct = (var_spent_agg / budget_limit) * Decimal('100.00')
        else:
            pct = Decimal('0.00')

        if pct < Decimal('80.00'):
            status_label = 'normal'
        elif pct <= Decimal('100.00'):
            status_label = 'warning'
        else:
            status_label = 'exceeded'

        # Category breakdowns
        category_stats = []
        allocated_category_ids = set()

        for allocation in budget.category_allocations.all():
            cat = allocation.category
            allocated_category_ids.add(cat.id)
            allocated_amt = Decimal(str(allocation.allocated_amount))

            cat_spent = Decimal(str(variable_txs.filter(category=cat).aggregate(total=Sum('amount'))['total'] or '0.00'))
            cat_remaining = allocated_amt - cat_spent
            cat_pct = (cat_spent / allocated_amt * Decimal('100.00')) if allocated_amt > Decimal('0.00') else Decimal('0.00')

            category_stats.append({
                'category_id': cat.id,
                'category_name': cat.name,
                'allocated_amount': format_decimal(allocated_amt),
                'spent_amount': format_decimal(cat_spent),
                'remaining_amount': format_decimal(cat_remaining),
                'percentage_used': float(round(cat_pct, 1)),
                'status': 'normal' if cat_pct < Decimal('80.00') else ('warning' if cat_pct <= Decimal('100.00') else 'exceeded'),
            })

        # Check for unallocated categories with variable expenses
        unallocated_cats = variable_txs.exclude(category_id__in=allocated_category_ids).values('category__id', 'category__name').annotate(total=Sum('amount'))
        for unalloc in unallocated_cats:
            cat_spent = Decimal(str(unalloc['total'] or '0.00'))
            category_stats.append({
                'category_id': unalloc['category__id'],
                'category_name': unalloc['category__name'] or 'Uncategorized',
                'allocated_amount': '0.00',
                'spent_amount': format_decimal(cat_spent),
                'remaining_amount': format_decimal(-cat_spent),
                'percentage_used': 100.0 if cat_spent > Decimal('0.00') else 0.0,
                'status': 'exceeded' if cat_spent > Decimal('0.00') else 'normal',
            })

        return {
            'has_budget': True,
            'budget_id': budget.id,
            'year': year,
            'month': month,
            'budget_limit': format_decimal(budget_limit),
            'variable_spent': format_decimal(var_spent_agg),
            'fixed_spent': format_decimal(fixed_spent_agg),
            'total_spent': format_decimal(total_spent_agg),
            'remaining_budget': format_decimal(remaining),
            'percentage_used': float(round(pct, 1)),
            'status': status_label,
            'notes': budget.notes,
            'category_breakdowns': category_stats,
        }

    return {
        'has_budget': False,
        'budget_id': None,
        'year': year,
        'month': month,
        'budget_limit': '0.00',
        'variable_spent': format_decimal(var_spent_agg),
        'fixed_spent': format_decimal(fixed_spent_agg),
        'total_spent': format_decimal(total_spent_agg),
        'remaining_budget': format_decimal(-var_spent_agg),
        'percentage_used': 0.0,
        'status': 'unconfigured',
        'notes': '',
        'category_breakdowns': [],
    }


@transaction.atomic
def settle_planned_purchase(
    planned_item: PlannedPurchase,
    account,
    actual_amount: Decimal | None = None,
    payment_date: date | None = None,
    description: str | None = None,
) -> tuple[PlannedPurchase, object]:
    """
    Records an expense transaction for a planned purchase, adjusts account balance,
    and marks the planned purchase as purchased.
    """
    if planned_item.status == 'purchased':
        raise ValueError("This planned purchase has already been completed.")

    amount = actual_amount if actual_amount is not None else Decimal(str(planned_item.estimated_amount))
    tx_date = payment_date or date.today()
    tx_desc = description or f"Planned Purchase: {planned_item.name}"

    tx = create_transaction(
        user=planned_item.user,
        account=account,
        transaction_type='expense',
        amount=amount,
        category=planned_item.category,
        description=tx_desc,
        transaction_date=tx_date,
    )

    planned_item.status = 'purchased'
    planned_item.purchased_transaction = tx
    planned_item.purchased_at = timezone.now()
    planned_item.save(update_fields=['status', 'purchased_transaction', 'purchased_at'])

    return planned_item, tx
