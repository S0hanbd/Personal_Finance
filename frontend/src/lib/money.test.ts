import { describe, it, expect } from 'vitest'
import { formatMoney, addMoney, subtractMoney, parseMoney, sumMoney } from './money'
import Decimal from 'decimal.js'

describe('money utilities (decimal.js precision)', () => {
  it('formats BDT currency correctly with symbol and commas', () => {
    expect(formatMoney('15000.50')).toBe('৳15,000.50')
    expect(formatMoney(new Decimal('2500'))).toBe('৳2,500.00')
  })

  it('performs exact addition without floating-point errors', () => {
    // 0.1 + 0.2 in native JS is 0.30000000000000004
    const result = addMoney('0.10', '0.20')
    expect(result.toString()).toBe('0.3')
    expect(result.toFixed(2)).toBe('0.30')
  })

  it('performs exact subtraction without floating-point errors', () => {
    const result = subtractMoney('100.00', '25.50')
    expect(result.toFixed(2)).toBe('74.50')
  })

  it('parses string values safely and handles invalid input', () => {
    expect(parseMoney('1234.56').toFixed(2)).toBe('1234.56')
    expect(parseMoney('invalid').toString()).toBe('0')
  })

  it('sums arrays of money values safely', () => {
    const total = sumMoney(['2500.00', '10000.00', '1500.00'])
    expect(total.toFixed(2)).toBe('14000.00')
  })
})

