import { useState, useCallback, useRef } from 'react'
import Decimal from 'decimal.js'

/**
 * Safely evaluate a simple arithmetic expression (e.g. "20+40-5*3").
 * Supports +, -, *, /, parentheses, and decimal numbers.
 * Returns null if the expression is not a valid arithmetic string.
 */
function evaluateExpression(expr: string): string | null {
  const trimmed = expr.trim()
  if (!trimmed) return null

  // Quick check: only allow digits, operators, parentheses, dots, spaces
  if (!/^[0-9+\-*/().\s]+$/.test(trimmed)) return null

  // If it's just a plain number, return it as-is
  if (/^\d+(\.\d+)?$/.test(trimmed)) return trimmed

  try {
    // Use Decimal for precise arithmetic via a safe tokenizer
    // Build a safe evaluation using Function constructor with only math ops
    const sanitized = trimmed
      .replace(/\s+/g, '')
      .replace(/(\d+\.?\d*)\s*\(\s*/g, '$1*(') // implicit multiplication: 2(3) -> 2*(3)
      .replace(/\)\s*\(/g, ')*(') // (2)(3) -> (2)*(3)
      .replace(/\)\s*(\d)/g, ')*$1') // (2)3 -> (2)*3

    // Final safety check after sanitization
    if (!/^[0-9+\-*/().]+$/.test(sanitized)) return null

    // Use a safe math evaluator that only handles basic arithmetic
    const result = safeEval(sanitized)
    if (result === null || isNaN(result) || !isFinite(result)) return null

    // Format to 2 decimal places using Decimal for precision
    const d = new Decimal(result)
    return d.toFixed(2)
  } catch {
    return null
  }
}

/**
 * Safe arithmetic evaluator using a recursive descent parser.
 * Only supports +, -, *, /, parentheses, and numbers.
 * No access to any external functions or variables.
 */
function safeEval(expr: string): number | null {
  let pos = 0

  function peek(): string | undefined {
    return expr[pos]
  }

  function consume(ch: string): boolean {
    if (peek() === ch) {
      pos++
      return true
    }
    return false
  }

  function parseExpression(): number {
    let result = parseTerm()

    while (peek() === '+' || peek() === '-') {
      const op = expr[pos++]
      const right = parseTerm()
      result = op === '+' ? result + right : result - right
    }

    return result
  }

  function parseTerm(): number {
    let result = parseFactor()

    while (peek() === '*' || peek() === '/') {
      const op = expr[pos++]
      const right = parseFactor()
      if (op === '/' && right === 0) throw new Error('Division by zero')
      result = op === '*' ? result * right : result / right
    }

    return result
  }

  function parseFactor(): number {
    // Handle unary minus/plus
    if (consume('-')) return -parseFactor()
    if (consume('+')) return parseFactor()

    // Handle parentheses
    if (consume('(')) {
      const result = parseExpression()
      consume(')') // consume closing paren
      return result
    }

    // Parse number
    const start = pos
    while (pos < expr.length && (/[0-9.]/.test(expr[pos]))) {
      pos++
    }

    if (pos === start) throw new Error('Unexpected character')

    const numStr = expr.slice(start, pos)
    const num = parseFloat(numStr)
    if (isNaN(num)) throw new Error('Invalid number')
    return num
  }

  const result = parseExpression()

  // Ensure entire string was consumed
  if (pos < expr.length) throw new Error('Unexpected trailing characters')

  return result
}

interface UseCalculatorInputOptions {
  /** Initial value of the input */
  initialValue?: string
  /** Callback when the evaluated (resolved) value changes */
  onEvaluated?: (value: string) => void
}

/**
 * Hook that enables inline calculator expressions in money input fields.
 *
 * Users can type "20+40+50" and the field will show a live preview of "110.00".
 * On blur (or Enter), the expression is resolved to the evaluated value.
 *
 * Returns:
 * - displayValue: The current text shown in the input (expression or evaluated result)
 * - evaluatedValue: The resolved numeric value (empty string if current input is an unevaluated expression)
 * - handleChange: onChange handler for the input
 * - handleBlur: onBlur handler that resolves expressions
 * - isExpression: Whether the current input is an unresolved expression
 * - previewValue: The live calculated preview (for showing below the input)
 */
export function useCalculatorInput({
  initialValue = '',
  onEvaluated,
}: UseCalculatorInputOptions = {}) {
  const [displayValue, setDisplayValue] = useState(initialValue)
  const [isExpression, setIsExpression] = useState(false)
  const prevInitialRef = useRef(initialValue)

  // Sync with external initialValue changes
  if (prevInitialRef.current !== initialValue && !displayValue) {
    prevInitialRef.current = initialValue
    setDisplayValue(initialValue)
    setIsExpression(false)
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setDisplayValue(raw)

    // Live preview: try to evaluate as the user types
    const result = evaluateExpression(raw)
    const wasExpression = isExpression
    setIsExpression(result !== null && !/^\d+(\.\d+)?$/.test(raw.trim()))

    // If evaluation result changed meaningfully, notify
    if (result !== null && !wasExpression) {
      // Don't call onEvaluated during typing for plain numbers
    }
  }, [isExpression])

  const previewValue = evaluateExpression(displayValue)

  const handleBlur = useCallback(() => {
    const result = evaluateExpression(displayValue)
    if (result !== null && isExpression) {
      setDisplayValue(result)
      setIsExpression(false)
      onEvaluated?.(result)
    }
  }, [displayValue, isExpression, onEvaluated])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const result = evaluateExpression(displayValue)
      if (result !== null && isExpression) {
        setDisplayValue(result)
        setIsExpression(false)
        onEvaluated?.(result)
      }
    }
  }, [displayValue, isExpression, onEvaluated])

  const reset = useCallback(() => {
    setDisplayValue('')
    setIsExpression(false)
  }, [])

  const setValue = useCallback((val: string) => {
    setDisplayValue(val)
    setIsExpression(false)
  }, [])

  // The value to submit — only return a clean number, not an expression
  const evaluatedValue = isExpression ? '' : displayValue

  return {
    displayValue,
    evaluatedValue,
    isExpression,
    previewValue,
    handleChange,
    handleBlur,
    handleKeyDown,
    reset,
    setValue,
  }
}

export { evaluateExpression }
