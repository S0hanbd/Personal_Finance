import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, AlertCircle, ArrowRightLeft, TrendingDown, TrendingUp, Calculator, Check } from 'lucide-react'
import Decimal from 'decimal.js'
import {
  useAccounts,
  useExpenseCategories,
  useIncomeSources,
  useCreateTransaction,
  useCreateTransfer,
  useCreateCategory,
  useCreateIncomeSource,
  useCreateAccount,
} from '@/hooks/useFinanceQueries'
import { useCalculatorInput } from '@/hooks/useCalculatorInput'
import { cn } from '@/lib/utils'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'expense' | 'income' | 'transfer'
  initialAccountId?: string
}

export type TabType = 'expense' | 'income' | 'transfer'

const TAB_CONFIG: Record<TabType, { label: string; icon: typeof TrendingDown; color: string; ringColor: string; submitLabel: string }> = {
  expense: { label: 'Expense', icon: TrendingDown, color: 'bg-danger text-white', ringColor: 'ring-danger/40', submitLabel: 'Add expense' },
  income: { label: 'Income', icon: TrendingUp, color: 'bg-success text-white', ringColor: 'ring-success/40', submitLabel: 'Add income' },
  transfer: { label: 'Transfer', icon: ArrowRightLeft, color: 'bg-primary text-white', ringColor: 'ring-primary/40', submitLabel: 'Record transfer' },
}

export function QuickAddModal({
  isOpen,
  onClose,
  initialTab = 'expense',
  initialAccountId,
}: QuickAddModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const amountInput = useCalculatorInput()
  const [accountId, setAccountId] = useState<string>(initialAccountId ?? '')
  const [destinationAccountId, setDestinationAccountId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [incomeSourceId, setIncomeSourceId] = useState<string>('')
  const [description, setDescription] = useState('')
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0])

  // Inline creation states
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewSource, setShowNewSource] = useState(false)
  const [newSourceName, setNewSourceName] = useState('')
  const [showNewAccount, setShowNewAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState('cash')
  const [newAccountBalance, setNewAccountBalance] = useState('0.00')
  const [creationError, setCreationError] = useState<string | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDivElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const newCategoryInputRef = useRef<HTMLInputElement>(null)
  const newSourceInputRef = useRef<HTMLInputElement>(null)
  const newAccountNameInputRef = useRef<HTMLInputElement>(null)

  const { data: accounts = [], isLoading: accountsLoading } = useAccounts()
  const { data: categories = [] } = useExpenseCategories()
  const { data: sources = [] } = useIncomeSources()

  const createTxMutation = useCreateTransaction()
  const createTransferMutation = useCreateTransfer()
  const createCategoryMutation = useCreateCategory()
  const createSourceMutation = useCreateIncomeSource()
  const createAccountMutation = useCreateAccount()

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id.toString())
    }
    if (accounts.length > 1 && !destinationAccountId) {
      setDestinationAccountId(accounts[1].id.toString())
    }
  }, [accounts, accountId, destinationAccountId])

  // Reset and focus when dialog opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null)
      setSuccessMessage(null)
      setCreationError(null)
      if (initialTab) setActiveTab(initialTab)
      if (initialAccountId) setAccountId(initialAccountId)
      amountInput.reset()
      setDescription('')
      setCategoryId('')
      setIncomeSourceId('')
      setNewCategoryName('')
      setNewSourceName('')
      setNewAccountName('')
      setNewAccountBalance('0.00')
      setShowNewCategory(false)
      setShowNewSource(false)
      setShowNewAccount(false)
      setTransactionDate(new Date().toISOString().split('T')[0])
      setTimeout(() => amountInputRef.current?.focus(), 50)
    }
  }, [isOpen, initialTab, initialAccountId])

  // Escape key + focus trap
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // --- Category creation ---
  const priorCategoryIdRef = useRef(categoryId)

  // --- Income source creation ---
  const priorSourceIdRef = useRef(incomeSourceId)

  // --- Account creation ---
  const priorAccountIdRef = useRef(accountId)

  if (!isOpen) return null

  const isPending = createTxMutation.isPending || createTransferMutation.isPending

  const handleCreateNewCategory = useCallback(async () => {
    setCreationError(null)
    const name = newCategoryName.trim()
    if (!name) {
      setCreationError('Category name is required.')
      newCategoryInputRef.current?.focus()
      return
    }
    try {
      const created = await createCategoryMutation.mutateAsync(name)
      setCategoryId(created.id.toString())
      setNewCategoryName('')
      setShowNewCategory(false)
      setCreationError(null)
    } catch {
      setCreationError('Could not create category. Please try a different name.')
    }
  }, [newCategoryName, createCategoryMutation])

  const handleCancelCategory = useCallback(() => {
    setCategoryId(priorCategoryIdRef.current)
    setNewCategoryName('')
    setShowNewCategory(false)
    setCreationError(null)
  }, [])

  // --- Income source creation ---
  const handleCreateNewSource = useCallback(async () => {
    setCreationError(null)
    const name = newSourceName.trim()
    if (!name) {
      setCreationError('Source name is required.')
      newSourceInputRef.current?.focus()
      return
    }
    try {
      const created = await createSourceMutation.mutateAsync(name)
      setIncomeSourceId(created.id.toString())
      setNewSourceName('')
      setShowNewSource(false)
      setCreationError(null)
    } catch {
      setCreationError('Could not create income source. Please try a different name.')
    }
  }, [newSourceName, createSourceMutation])

  const handleCancelSource = useCallback(() => {
    setIncomeSourceId(priorSourceIdRef.current)
    setNewSourceName('')
    setShowNewSource(false)
    setCreationError(null)
  }, [])

  // --- Account creation ---
  const handleCreateNewAccount = useCallback(async () => {
    setCreationError(null)
    const name = newAccountName.trim()
    if (!name) {
      setCreationError('Account name is required.')
      newAccountNameInputRef.current?.focus()
      return
    }
    try {
      const created = await createAccountMutation.mutateAsync({
        name,
        account_type: newAccountType,
        opening_balance: newAccountBalance || '0.00',
      })
      setAccountId(created.id.toString())
      setNewAccountName('')
      setNewAccountBalance('0.00')
      setShowNewAccount(false)
      setCreationError(null)
    } catch {
      setCreationError('Could not create account. Please check the name and try again.')
    }
  }, [newAccountName, newAccountType, newAccountBalance, createAccountMutation])

  const handleCancelAccount = useCallback(() => {
    setAccountId(priorAccountIdRef.current)
    setNewAccountName('')
    setNewAccountBalance('0.00')
    setShowNewAccount(false)
    setCreationError(null)
  }, [])

  // --- Main submit ---
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    // Guard against duplicate submissions
    if (isPending) return

    // Resolve any pending expression before submitting
    const finalAmount = amountInput.isExpression
      ? (amountInput.previewValue ?? amountInput.displayValue)
      : amountInput.displayValue

    // Use Decimal for validation — no parseFloat
    const amountDecimal = new Decimal(finalAmount)
    if (amountDecimal.isNaN() || amountDecimal.lte(0)) {
      setErrorMessage('Please enter a valid amount greater than zero.')
      return
    }

    if (!accountId) {
      setErrorMessage('Please select an account.')
      return
    }

    try {
      const amountStr = amountDecimal.toFixed(2)

      if (activeTab === 'transfer') {
        if (!destinationAccountId || destinationAccountId === accountId) {
          setErrorMessage('Please choose a different destination account.')
          return
        }
        await createTransferMutation.mutateAsync({
          source_account: parseInt(accountId, 10),
          destination_account: parseInt(destinationAccountId, 10),
          amount: amountStr,
          description: description.trim(),
          transaction_date: transactionDate,
        })
        setSuccessMessage(`Transferred ৳${amountStr} successfully.`)
      } else {
        await createTxMutation.mutateAsync({
          account: parseInt(accountId, 10),
          transaction_type: activeTab,
          amount: amountStr,
          category: activeTab === 'expense' && categoryId ? parseInt(categoryId, 10) : null,
          income_source: activeTab === 'income' && incomeSourceId ? parseInt(incomeSourceId, 10) : null,
          description: description.trim(),
          transaction_date: transactionDate,
        })
        const typeLabel = activeTab === 'expense' ? 'Expense' : 'Income'
        setSuccessMessage(`${typeLabel} of ৳${amountStr} saved.`)
      }

      // Reset and close on success
      setTimeout(() => {
        amountInput.reset()
        setDescription('')
        onClose()
      }, 600)
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: Record<string, string[]> } }
      if (errorObj?.response?.data) {
        const details = Object.entries(errorObj.response.data)
          .map(([key, msgs]) => `${key}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ')
        setErrorMessage(`Failed to save: ${details}`)
      } else {
        setErrorMessage('Failed to save transaction. Please check your network and inputs.')
      }
    }
  }, [isPending, amountInput, accountId, destinationAccountId, activeTab, categoryId, incomeSourceId, description, transactionDate, createTransferMutation, createTxMutation, onClose])

  // Format balance for display
  const formatBalance = (bal: string) => {
    try {
      return new Decimal(bal).toFixed(2)
    } catch {
      return bal
    }
  }

  // Format preview total
  const formatPreview = (val: string) => {
    try {
      return new Decimal(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    } catch {
      return val
    }
  }

  const tabConfig = TAB_CONFIG[activeTab]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-border p-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 id="quick-add-title" className="text-lg font-bold text-foreground">
            Record transaction
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 min-w-[24px] min-h-[24px] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction type selector */}
        <fieldset className="mt-4 mb-2">
          <legend className="sr-only">Transaction type</legend>
          <div className="flex bg-muted p-1 rounded-lg" role="radiogroup" aria-label="Transaction type">
            {(['expense', 'income', 'transfer'] as TabType[]).map((tab) => {
              const config = TAB_CONFIG[tab]
              const Icon = config.icon
              const isSelected = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all min-h-[24px]',
                    isSelected
                      ? `${config.color} shadow-sm`
                      : 'text-foreground hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  <Icon size={14} />
                  {config.label}
                  {isSelected && <Check size={12} />}
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Error Alert */}
        {errorMessage && (
          <div role="alert" className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2 text-sm text-danger">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div role="status" className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg flex items-start gap-2 text-sm text-success">
            <Check size={16} className="shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Creation error */}
        {creationError && (
          <div role="alert" className="mb-2 p-2 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning">
            {creationError}
          </div>
        )}

        {/* No accounts warning */}
        {accounts.length === 0 && !accountsLoading && !showNewAccount && (
          <div className="p-4 mb-4 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
            <p className="font-semibold mb-1">No accounts found</p>
            <p className="mb-3">Create at least one account before recording transactions.</p>
            <button
              type="button"
              onClick={() => setShowNewAccount(true)}
              className="px-3 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[24px]"
            >
              Create first account
            </button>
          </div>
        )}

        {/* Inline Account Creator */}
        {showNewAccount && (
          <div className="p-3 mb-4 bg-muted/60 border border-border rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Create New Account</span>
              <button
                type="button"
                onClick={handleCancelAccount}
                className="text-xs text-muted-foreground hover:text-foreground min-w-[24px] min-h-[24px]"
              >
                Cancel account
              </button>
            </div>
            <div>
              <label htmlFor="new-account-name" className="block text-xs font-medium text-foreground mb-0.5">
                Account name
              </label>
              <input
                id="new-account-name"
                ref={newAccountNameInputRef}
                type="text"
                required
                placeholder="e.g. Cash, Bank, bKash"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateNewAccount()
                  }
                }}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="new-account-type" className="block text-xs font-medium text-foreground mb-0.5">
                  Type
                </label>
                <select
                  id="new-account-type"
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="new-account-balance" className="block text-xs font-medium text-foreground mb-0.5">
                  Starting balance (BDT)
                </label>
                <input
                  id="new-account-balance"
                  type="text"
                  inputMode="decimal"
                  value={newAccountBalance}
                  onChange={(e) => setNewAccountBalance(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateNewAccount}
                disabled={createAccountMutation.isPending}
                className="flex-1 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 min-h-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {createAccountMutation.isPending ? 'Saving...' : 'Add account'}
              </button>
              <button
                type="button"
                onClick={handleCancelAccount}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted min-h-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label htmlFor="tx-amount" className="block text-sm font-medium text-foreground mb-1">
              Amount (BDT)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-base font-bold text-muted-foreground">৳</span>
              <button
                type="button"
                aria-label="Open calculator"
                className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground rounded min-w-[24px] min-h-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                tabIndex={-1}
              >
                <Calculator size={16} />
              </button>
              <input
                ref={amountInputRef}
                id="tx-amount"
                type="text"
                inputMode="decimal"
                required
                placeholder=""
                value={amountInput.displayValue}
                onChange={amountInput.handleChange}
                onBlur={amountInput.handleBlur}
                onKeyDown={amountInput.handleKeyDown}
                className={cn(
                  'w-full pl-8 pr-10 py-2.5 text-lg font-bold border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  amountInput.isExpression && 'border-primary/50 ring-1 ring-primary/20'
                )}
              />
            </div>
            {amountInput.isExpression && amountInput.previewValue && (
              <p className="mt-1 text-sm font-medium text-primary" role="status" aria-live="polite">
                Total ৳{formatPreview(amountInput.previewValue)}
              </p>
            )}
            {!amountInput.isExpression && !amountInput.displayValue && (
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a number or expression (e.g. 20+40+50)
              </p>
            )}
          </div>

          {/* Category / Source */}
          {activeTab === 'expense' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="tx-category" className="text-sm font-medium text-foreground">
                  Category (optional)
                </label>
                {!showNewCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      priorCategoryIdRef.current = categoryId
                      setShowNewCategory(true)
                      setTimeout(() => newCategoryInputRef.current?.focus(), 50)
                    }}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 min-h-[24px]"
                  >
                    <Plus size={12} /> New
                  </button>
                )}
              </div>
              {showNewCategory ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={newCategoryInputRef}
                      type="text"
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCreateNewCategory()
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewCategory}
                      disabled={createCategoryMutation.isPending}
                      className="px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-50 min-h-[24px] min-w-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Add category
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelCategory}
                      className="px-2 py-2 text-muted-foreground text-xs hover:text-foreground min-h-[24px] min-w-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Cancel category
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  id="tx-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {activeTab === 'income' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="tx-source" className="text-sm font-medium text-foreground">
                  Income source (optional)
                </label>
                {!showNewSource && (
                  <button
                    type="button"
                    onClick={() => {
                      priorSourceIdRef.current = incomeSourceId
                      setShowNewSource(true)
                      setTimeout(() => newSourceInputRef.current?.focus(), 50)
                    }}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 min-h-[24px]"
                  >
                    <Plus size={12} /> New
                  </button>
                )}
              </div>
              {showNewSource ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={newSourceInputRef}
                      type="text"
                      placeholder="Source name"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCreateNewSource()
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewSource}
                      disabled={createSourceMutation.isPending}
                      className="px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary/90 disabled:opacity-50 min-h-[24px] min-w-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Add category
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSource}
                      className="px-2 py-2 text-muted-foreground text-xs hover:text-foreground min-h-[24px] min-w-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Cancel category
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  id="tx-source"
                  value={incomeSourceId}
                  onChange={(e) => setIncomeSourceId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No source</option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Account(s) */}
          {activeTab === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tx-source-account" className="block text-sm font-medium text-foreground mb-1">
                  From account
                </label>
                <select
                  id="tx-source-account"
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (৳{formatBalance(acc.current_balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="tx-dest-account" className="block text-sm font-medium text-foreground mb-1">
                  To account
                </label>
                <select
                  id="tx-dest-account"
                  required
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} disabled={acc.id.toString() === accountId}>
                      {acc.name} (৳{formatBalance(acc.current_balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="tx-account" className="text-sm font-medium text-foreground">
                  {activeTab === 'expense' ? 'Paid from' : 'Received into'}
                </label>
                {!showNewAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      priorAccountIdRef.current = accountId
                      setShowNewAccount(true)
                      setTimeout(() => newAccountNameInputRef.current?.focus(), 50)
                    }}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 min-h-[24px]"
                  >
                    <Plus size={12} /> New
                  </button>
                )}
              </div>
              <select
                id="tx-account"
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — ৳{formatBalance(acc.current_balance)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Note — stacked on narrow screens */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 @sm:grid-cols-2" style={{ minWidth: 0 }}>
            <div className="min-w-0">
              <label htmlFor="tx-date" className="block text-sm font-medium text-foreground mb-1">
                Transaction date
              </label>
              <input
                id="tx-date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="tx-desc" className="block text-sm font-medium text-foreground mb-1">
                Note (optional)
              </label>
              <input
                id="tx-desc"
                type="text"
                placeholder="What was this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-md min-h-[24px] min-w-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || accounts.length === 0}
              className={cn(
                'px-5 py-2.5 text-sm font-medium text-white rounded-md shadow-sm transition-all min-h-[24px] min-w-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed',
                activeTab === 'expense' && 'bg-danger hover:bg-danger/90',
                activeTab === 'income' && 'bg-success hover:bg-success/90',
                activeTab === 'transfer' && 'bg-primary hover:bg-primary/90'
              )}
            >
              {isPending ? 'Saving...' : tabConfig.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

