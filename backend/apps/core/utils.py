"""
Decimal money utilities.
CRITICAL: Never use Python float for financial calculations. Always use Decimal.
"""
from decimal import Decimal, ROUND_HALF_UP


def to_decimal(value) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def add_money(a, b) -> Decimal:
    return to_decimal(a) + to_decimal(b)


def subtract_money(a, b) -> Decimal:
    return to_decimal(a) - to_decimal(b)


def round_money(value) -> Decimal:
    return to_decimal(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
