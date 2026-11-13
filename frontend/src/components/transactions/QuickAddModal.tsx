import { useState, useEffect, useRef } from 'react'
import { X, Plus, AlertCircle, ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'expense' | 'income' | 'transfer'

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('expense')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState<string>('')
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

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const amountInputRef = useRef<HTMLInputElement>(null)

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

  // Focus on amount input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null)
      setTimeout(() => amountInputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isPending = createTxMutation.isPending || createTransferMutation.isPending

  const handleCreateNewCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    try {
      const created = await createCategoryMutation.mutateAsync(newCategoryName.trim())
      setCategoryId(created.id.toString())
      setNewCategoryName('')
      setShowNewCategory(false)
    } catch {
      setErrorMessage('Could not create category. Please try a different name.')
    }
  }

  const handleCreateNewSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSourceName.trim()) return
    try {
      const created = await createSourceMutation.mutateAsync(newSourceName.trim())
      setIncomeSourceId(created.id.toString())
      setNewSourceName('')
      setShowNewSource(false)
    } catch {
      setErrorMessage('Could not create income source. Please try a different name.')
    }
  }

  const handleCreateNewAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountName.trim()) return
    try {
      const created = await createAccountMutation.mutateAsync({
        name: newAccountName.trim(),
        account_type: newAccountType,
        opening_balance: newAccountBalance || '0.00',
      })
      setAccountId(created.id.toString())
      setNewAccountName('')
      setShowNewAccount(false)
    } catch {
      setErrorMessage('Could not create account. Please check the name and try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than zero.')
      return
    }

    if (!accountId) {
      setErrorMessage('Please select an account.')
      return
    }

    try {
      if (activeTab === 'transfer') {
        if (!destinationAccountId || destinationAccountId === accountId) {
          setErrorMessage('Please choose a different destination account.')
          return
        }
        await createTransferMutation.mutateAsync({
          source_account: parseInt(accountId, 10),
          destination_account: parseInt(destinationAccountId, 10),
          amount: parsedAmount.toFixed(2),
          description: description.trim(),
          transaction_date: transactionDate,
        })
      } else {
        await createTxMutation.mutateAsync({
          account: parseInt(accountId, 10),
          transaction_type: activeTab,
          amount: parsedAmount.toFixed(2),
          category: activeTab === 'expense' && categoryId ? parseInt(categoryId, 10) : null,
          income_source: activeTab === 'income' && incomeSourceId ? parseInt(incomeSourceId, 10) : null,
          description: description.trim(),
          transaction_date: transactionDate,
        })
      }

      // Reset and close on success
      setAmount('')
      setDescription('')
      onClose()
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
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-border p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 id="quick-add-title" className="text-lg font-bold text-foreground">
              Record Transaction
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Quick 3-field personal ledger entry</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-muted p-1 rounded-lg my-4" role="tablist" aria-label="Transaction Type">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'expense'}
            onClick={() => setActiveTab('expense')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all',
              activeTab === 'expense'
                ? 'bg-danger text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <TrendingDown size={14} />
            Expense
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'income'}
            onClick={() => setActiveTab('income')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all',
              activeTab === 'income'
                ? 'bg-success text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <TrendingUp size={14} />
            Income
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'transfer'}
            onClick={() => setActiveTab('transfer')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all',
              activeTab === 'transfer'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ArrowRightLeft size={14} />
            Transfer
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div role="alert" className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2 text-xs text-danger">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Accounts Check */}
        {accounts.length === 0 && !accountsLoading && !showNewAccount && (
          <div className="p-4 mb-4 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning">
            <p className="font-semibold mb-1">No accounts found</p>
            <p className="mb-3">You need at least one financial account (e.g. Cash, Bank) before recording transactions.</p>
            <button
              type="button"
              onClick={() => setShowNewAccount(true)}
              className="px-3 py-1.5 bg-primary text-white rounded font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              + Create First Account
            </button>
          </div>
        )}

        {/* Inline Account Creator */}
        {showNewAccount && (
          <form onSubmit={handleCreateNewAccount} className="p-3 mb-4 bg-muted/60 border border-border rounded-lg space-y-2 text-xs">
            <div className="flex justify-between items-center font-semibold text-foreground">
              <span>Create New Account</span>
              <button type="button" onClick={() => setShowNewAccount(false)} className="text-muted-foreground">Cancel</button>
            </div>
            <div>
              <label className="block mb-0.5">Account Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cash in Hand, Bank, PayCash"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="w-full px-2 py-1.5 border border-input rounded text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-0.5">Type</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value)}
                  className="w-full px-2 py-1.5 border border-input rounded text-xs bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-0.5">Opening Balance (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAccountBalance}
                  onChange={(e) => setNewAccountBalance(e.target.value)}
                  className="w-full px-2 py-1.5 border border-input rounded text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createAccountMutation.isPending}
              className="w-full py-1.5 bg-primary text-white rounded font-medium hover:bg-primary/90"
            >
              {createAccountMutation.isPending ? 'Saving...' : 'Add Account'}
            </button>
          </form>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FIELD 1: Amount (Required) */}
          <div>
            <label htmlFor="tx-amount" className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
              Amount (BDT ৳) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-base font-bold text-muted-foreground">৳</span>
              <input
                ref={amountInputRef}
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-lg font-bold border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* FIELD 2: Category / Source (Required for Expense & Income) */}
          {activeTab === 'expense' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="tx-category" className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Expense Category *
                </label>
                {!showNewCategory && (
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
                  >
                    <Plus size={12} /> New
                  </button>
                )}
              </div>
              {showNewCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewCategory}
                    className="px-3 py-2 bg-primary text-white rounded-md text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="px-2 py-2 text-muted-foreground text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  id="tx-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select Category (Optional / Default)</option>
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
                <label htmlFor="tx-source" className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Income Source *
                </label>
                {!showNewSource && (
                  <button
                    type="button"
                    onClick={() => setShowNewSource(true)}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
                  >
                    <Plus size={12} /> New
                  </button>
                )}
              </div>
              {showNewSource ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New income source..."
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewSource}
                    className="px-3 py-2 bg-primary text-white rounded-md text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewSource(false)}
                    className="px-2 py-2 text-muted-foreground text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  id="tx-source"
                  value={incomeSourceId}
                  onChange={(e) => setIncomeSourceId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select Income Source (Optional / Default)</option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* FIELD 3: Financial Account(s) (Required) */}
          {activeTab === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tx-source-account" className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                  From Account *
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
                      {acc.name} (৳{acc.current_balance})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="tx-dest-account" className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                  To Account *
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
                      {acc.name} (৳{acc.current_balance})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="tx-account" className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Account *
                </label>
                {!showNewAccount && (
                  <button
                    type="button"
                    onClick={() => setShowNewAccount(true)}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
                  >
                    <Plus size={12} /> New Account
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
                    {acc.name} — Balance: ৳{acc.current_balance}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional Fields: Date & Description */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="tx-date" className="block text-xs font-medium text-secondary mb-1">
                Date (Defaults Today)
              </label>
              <input
                id="tx-date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-xs bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="tx-desc" className="block text-xs font-medium text-secondary mb-1">
                Description (Optional)
              </label>
              <input
                id="tx-desc"
                type="text"
                placeholder="Note, grocery item, receipt..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-secondary hover:text-foreground rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || accounts.length === 0}
              className={cn(
                'px-5 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed',
                activeTab === 'expense' && 'bg-danger hover:bg-danger/90',
                activeTab === 'income' && 'bg-success hover:bg-success/90',
                activeTab === 'transfer' && 'bg-primary hover:bg-primary/90'
              )}
            >
              {isPending ? 'Saving...' : activeTab === 'transfer' ? 'Transfer Funds' : `Add ${activeTab === 'expense' ? 'Expense' : 'Income'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

