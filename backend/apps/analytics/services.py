from datetime import date, datetime
from decimal import Decimal
from typing import Any

from django.db import models as db_models
from django.db.models.functions import ExtractMonth, ExtractWeek, ExtractYear
from django.utils import timezone

from apps.transactions.models import Transaction
from apps.budgets.models import MonthlyBudget, BudgetCategory


def _parse_date(value: Any | None) -> date | None:
    """Parse a date from a string or return None."""
    if value is None:
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    # Try parsing ISO format string
    try:
        return date.fromisoformat(str(value))
    except (ValueError, TypeError):
        return None


def _default_start_date() -> date:
    """Default start date: 30 days ago."""
    return timezone.now().date().replace(day=1) - timezone.timedelta(days=29)


def _default_end_date() -> date:
    """Default end date: today."""
    return timezone.now().date()


def get_monthly_income_expense(
    user,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    """Return monthly income and expense totals grouped by year-month.

    Each item: {month: '2026-01', income: '1000.00', expense: '800.00', net: '200.00'}
    """
    if start_date is None:
        start_date = _default_start_date()
    if end_date is None:
        end_date = _default_end_date()

    qs = Transaction.objects.filter(
        user=user,
        transaction_date__gte=start_date,
        transaction_date__lte=end_date,
        transaction_type__in=['income', 'expense'],
    )

    # Group by year-month using database-agnostic functions
    results = qs.annotate(
        year=ExtractYear('transaction_date'),
        month_num=ExtractMonth('transaction_date'),
    ).values('year', 'month_num').annotate(
        income=db_models.Sum(
            db_models.Case(
                db_models.When(transaction_type='income', then='amount'),
                default=Decimal('0'),
                output_field=db_models.DecimalField(max_digits=15, decimal_places=2),
            )
        ),
        expense=db_models.Sum(
            db_models.Case(
                db_models.When(transaction_type='expense', then='amount'),
                default=Decimal('0'),
                output_field=db_models.DecimalField(max_digits=15, decimal_places=2),
            )
        ),
    ).order_by('year', 'month_num')

    # Fill in missing months
    data: dict[str, dict[str, Any]] = {}
    for row in results:
        ym = f"{row['year']}-{row['month_num']:02d}"
        income = row['income'] or Decimal('0')
        expense = row['expense'] or Decimal('0')
        data[ym] = {
            'month': ym,
            'income': str(income.quantize(Decimal('0.01'))),
            'expense': str(expense.quantize(Decimal('0.01'))),
            'net': str((income - expense).quantize(Decimal('0.01'))),
        }

    # Generate all months in range
    current = start_date.replace(day=1)
    while current <= end_date.replace(day=1):
        ym = current.strftime('%Y-%m')
        if ym not in data:
            data[ym] = {
                'month': ym,
                'income': '0.00',
                'expense': '0.00',
                'net': '0.00',
            }
        # Next month
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)

    return sorted(data.values(), key=lambda x: x['month'])


def get_spending_by_category(
    user,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    """Return expense totals grouped by category.

    Each item: {category: 'Food', amount: '500.00'}
    """
    if start_date is None:
        start_date = _default_start_date()
    if end_date is None:
        end_date = _default_end_date()

    qs = Transaction.objects.filter(
        user=user,
        transaction_date__gte=start_date,
        transaction_date__lte=end_date,
        transaction_type='expense',
    )

    results = qs.values('category__name').annotate(
        total=db_models.Sum('amount')
    ).order_by('-total')

    return [
        {
            'category': row['category__name'] or 'Uncategorized',
            'amount': str((row['total'] or Decimal('0')).quantize(Decimal('0.01'))),
        }
        for row in results
    ]


def get_spending_trends(
    user,
    start_date: date | None = None,
    end_date: date | None = None,
    granularity: str | None = None,
) -> list[dict[str, Any]]:
    """Return daily or weekly spending trends.

    Auto-selects granularity: daily for <=90 days, weekly for >90 days.
    Each item: {date: '2026-01-01', amount: '150.00'}
    """
    if start_date is None:
        start_date = _default_start_date()
    if end_date is None:
        end_date = _default_end_date()

    days = (end_date - start_date).days
    if granularity is None:
        granularity = 'daily' if days <= 90 else 'weekly'

    qs = Transaction.objects.filter(
        user=user,
        transaction_date__gte=start_date,
        transaction_date__lte=end_date,
        transaction_type='expense',
    )

    if granularity == 'weekly':
        # Group by ISO week using database-agnostic functions
        results = qs.annotate(
            year=ExtractYear('transaction_date'),
            week=ExtractWeek('transaction_date'),
        ).values('year', 'week').annotate(
            total=db_models.Sum('amount')
        ).order_by('year', 'week')

        return [
            {
                'date': f"{row['year']}-W{row['week']:02d}",
                'amount': str((row['total'] or Decimal('0')).quantize(Decimal('0.01'))),
            }
            for row in results
        ]
    else:
        # Daily
        results = qs.values('transaction_date').annotate(
            total=db_models.Sum('amount')
        ).order_by('transaction_date')

        # Fill in missing days
        date_set = set()
        data: dict[str, dict[str, Any]] = {}
        for row in results:
            d = row['transaction_date']
            if isinstance(d, date):
                key = d.isoformat()
            else:
                key = str(d)
            date_set.add(key)
            data[key] = {
                'date': key,
                'amount': str((row['total'] or Decimal('0')).quantize(Decimal('0.01'))),
            }

        # Fill gaps
        current = start_date
        while current <= end_date:
            key = current.isoformat()
            if key not in data:
                data[key] = {
                    'date': key,
                    'amount': '0.00',
                }
            current += timezone.timedelta(days=1)

        return sorted(data.values(), key=lambda x: x['date'])


def get_account_balance_history(
    user,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    """Return daily balance snapshots per account.

    Each item: {date: '2026-01-01', account_id: 1, account_name: 'Main', balance: '5000.00'}
    Computes running balance from opening_balance + all transactions up to that date.
    """
    if start_date is None:
        start_date = _default_start_date()
    if end_date is None:
        end_date = _default_end_date()

    # Limit to 1 year max
    if (end_date - start_date).days > 365:
        start_date = end_date - timezone.timedelta(days=365)

    from apps.accounts.models import FinancialAccount

    accounts = FinancialAccount.objects.filter(user=user, status='active')

    results = []
    for account in accounts:
        # Get all transactions for this account in range
        txs = Transaction.objects.filter(
            account=account,
            transaction_date__gte=start_date,
            transaction_date__lte=end_date,
        ).values('transaction_date', 'transaction_type', 'amount').order_by('transaction_date')

        # Calculate opening balance at start_date
        # Need to sum all transactions BEFORE start_date
        pre_balance = account.opening_balance

        # Add transactions before start_date
        pre_txs = Transaction.objects.filter(
            account=account,
            transaction_date__lt=start_date,
        )
        for tx_type, total in pre_txs.values('transaction_type').annotate(total=db_models.Sum('amount')):
            if tx_type in ['income', 'borrowing', 'loan_collection']:
                pre_balance += total or Decimal('0')
            elif tx_type in ['expense', 'lending', 'loan_repayment']:
                pre_balance -= total or Decimal('0')

        # Build daily snapshots
        balance = pre_balance
        tx_by_date: dict[date, list[dict]] = {}
        for tx in txs:
            d = tx['transaction_date']
            if isinstance(d, datetime):
                d = d.date()
            tx_by_date.setdefault(d, []).append(tx)

        current = start_date
        while current <= end_date:
            if current in tx_by_date:
                for tx in tx_by_date[current]:
                    tx_type = tx['transaction_type']
                    amount = tx['amount'] or Decimal('0')
                    if tx_type in ['income', 'borrowing', 'loan_collection']:
                        balance += amount
                    elif tx_type in ['expense', 'lending', 'loan_repayment']:
                        balance -= amount

            results.append({
                'date': current.isoformat(),
                'account_id': account.id,
                'account_name': account.name,
                'balance': str(balance.quantize(Decimal('0.01'))),
            })
            current += timezone.timedelta(days=1)

    return results


def get_top_categories(
    user,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Return top N categories by total spend.

    Each item: {category: 'Food', amount: '1500.00', rank: 1}
    """
    if start_date is None:
        start_date = _default_start_date()
    if end_date is None:
        end_date = _default_end_date()

    qs = Transaction.objects.filter(
        user=user,
        transaction_date__gte=start_date,
        transaction_date__lte=end_date,
        transaction_type='expense',
    )

    results = qs.values('category__name').annotate(
        total=db_models.Sum('amount')
    ).order_by('-total')[:limit]

    return [
        {
            'category': row['category__name'] or 'Uncategorized',
            'amount': str((row['total'] or Decimal('0')).quantize(Decimal('0.01'))),
            'rank': idx + 1,
        }
        for idx, row in enumerate(results)
    ]


def get_budget_vs_actual(
    user,
    year: int | None = None,
    month: int | None = None,
) -> dict[str, Any]:
    """Return budget allocations vs actual spending per category.

    Returns: {
        'budget_total': '10000.00',
        'actual_total': '7500.00',
        'categories': [{category: 'Food', allocated: '3000.00', actual: '2500.00', variance: '500.00'}, ...]
    }
    """
    now = timezone.now()
    if year is None:
        year = now.year
    if month is None:
        month = now.month

    # Get budget
    try:
        budget = MonthlyBudget.objects.get(user=user, year=year, month=month)
    except MonthlyBudget.DoesNotExist:
        return {
            'budget_total': '0.00',
            'actual_total': '0.00',
            'categories': [],
            'has_budget': False,
        }

    # Get category allocations
    allocations = BudgetCategory.objects.filter(
        budget=budget
    ).select_related('category').values(
        'category__name',
        'allocated_amount',
    )

    # Get actual spending for the month
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1) - timezone.timedelta(days=1)
    else:
        end = date(year, month + 1, 1) - timezone.timedelta(days=1)

    actuals = Transaction.objects.filter(
        user=user,
        transaction_date__gte=start,
        transaction_date__lte=end,
        transaction_type='expense',
    ).values('category__name').annotate(
        total=db_models.Sum('amount')
    )

    actual_map = {row['category__name']: row['total'] or Decimal('0') for row in actuals}

    categories = []
    for alloc in allocations:
        cat_name = alloc['category__name']
        allocated = alloc['allocated_amount'] or Decimal('0')
        actual = actual_map.get(cat_name, Decimal('0'))
        variance = allocated - actual
        categories.append({
            'category': cat_name,
            'allocated': str(allocated.quantize(Decimal('0.01'))),
            'actual': str(actual.quantize(Decimal('0.01'))),
            'variance': str(variance.quantize(Decimal('0.01'))),
        })

    # Include categories with actual spending but no allocation
    for cat_name, actual in actual_map.items():
        if not any(c['category'] == cat_name for c in categories):
            categories.append({
                'category': cat_name,
                'allocated': '0.00',
                'actual': str(actual.quantize(Decimal('0.01'))),
                'variance': str((-actual).quantize(Decimal('0.01'))),
            })

    budget_total = budget.total_amount or Decimal('0')
    actual_total = sum(
        Decimal(c['actual']) for c in categories
    )

    return {
        'budget_total': str(budget_total.quantize(Decimal('0.01'))),
        'actual_total': str(actual_total.quantize(Decimal('0.01'))),
        'categories': categories,
        'has_budget': True,
    }
