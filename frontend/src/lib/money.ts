/**
 * CRITICAL: Never use JavaScript native number for financial calculations.
 * All API money values arrive as strings. Process with Decimal only.
 */
import Decimal from 'decimal.js'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

export type MoneyValue = string | Decimal

export function formatMoney(amount: MoneyValue, currency = 'BDT'): string {
  const d = new Decimal(amount)
  const formatted = d.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return currency === 'BDT' ? `৳${formatted}` : formatted
}

export function addMoney(a: MoneyValue, b: MoneyValue): Decimal {
  return new Decimal(a).plus(new Decimal(b))
}

export function subtractMoney(a: MoneyValue, b: MoneyValue): Decimal {
  return new Decimal(a).minus(new Decimal(b))
}

export function parseMoney(value: string): Decimal {
  try {
    const d = new Decimal(value)
    return d.isNaN() ? new Decimal(0) : d
  } catch { return new Decimal(0) }
}

export function sumMoney(amounts: MoneyValue[]): Decimal {
  return amounts.reduce<Decimal>((acc, val) => acc.plus(new Decimal(val)), new Decimal(0))
}
