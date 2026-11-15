import { useState, useEffect } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { useUserSettings, useUpdateSettings } from '@/hooks/useSettingsQueries'
import { useSettingsStore } from '@/store/settingsStore'
import { DASHBOARD_CARDS } from '@/types'

export function DashboardSettings() {
  const { data: settings, isLoading } = useUserSettings()
  const updateSettings = useUpdateSettings()
  const { dashboardCards, updateDashboardCards } = useSettingsStore()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Sync from API on load
  useEffect(() => {
    if (settings) {
      updateDashboardCards(settings.dashboard_cards)
    }
  }, [settings, updateDashboardCards])

  const toggleCard = (cardId: string) => {
    const newCards = dashboardCards.includes(cardId)
      ? dashboardCards.filter((c) => c !== cardId)
      : [...dashboardCards, cardId]
    updateDashboardCards(newCards)
  }

  const handleSave = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    updateSettings.mutate({ dashboard_cards: dashboardCards }, {
      onSuccess: () => {
        setSuccessMessage('Dashboard settings saved.')
        setTimeout(() => setSuccessMessage(null), 3000)
      },
      onError: () => {
        setErrorMessage('Failed to save settings.')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {DASHBOARD_CARDS.map((card) => (
          <div key={card.id} className="h-10 bg-muted rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {errorMessage && (
        <div role="alert" className="p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2 text-sm text-danger">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div role="status" className="p-3 bg-success/10 border border-success/30 rounded-lg flex items-start gap-2 text-sm text-success">
          <Check size={16} className="shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Toggle which cards appear on your dashboard.
      </p>

      <div className="space-y-2">
        {DASHBOARD_CARDS.map((card) => {
          const isChecked = dashboardCards.includes(card.id)
          return (
            <label
              key={card.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
            >
              <span className="text-sm font-medium text-foreground">{card.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                onClick={() => toggleCard(card.id)}
                className={
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors min-h-[24px] min-w-[24px]' +
                  (isChecked ? ' bg-primary' : ' bg-muted')
                }
              >
                <span
                  className={
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' +
                    (isChecked ? 'translate-x-4' : 'translate-x-0.5')
                  }
                />
              </button>
            </label>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 min-h-[24px]"
        >
          {updateSettings.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
