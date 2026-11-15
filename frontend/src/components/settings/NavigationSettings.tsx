import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, Check, AlertCircle } from 'lucide-react'
import { useUserSettings, useUpdateSettings } from '@/hooks/useSettingsQueries'
import { useSettingsStore } from '@/store/settingsStore'
import { SIDEBAR_ITEMS } from '@/types'

export function NavigationSettings() {
  const { data: settings, isLoading } = useUserSettings()
  const updateSettings = useUpdateSettings()
  const { sidebarItems, updateSidebarItems } = useSettingsStore()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Sync from API on load
  useEffect(() => {
    if (settings) {
      updateSidebarItems(settings.sidebar_items)
    }
  }, [settings, updateSidebarItems])

  const toggleItem = (itemId: string) => {
    const newItems = sidebarItems.includes(itemId)
      ? sidebarItems.filter((i) => i !== itemId)
      : [...sidebarItems, itemId]
    updateSidebarItems(newItems)
  }

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const index = sidebarItems.indexOf(itemId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === sidebarItems.length - 1) return

    const newItems = [...sidebarItems]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]]
    updateSidebarItems(newItems)
  }

  const handleSave = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    updateSettings.mutate({ sidebar_items: sidebarItems }, {
      onSuccess: () => {
        setSuccessMessage('Navigation settings saved.')
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
        {SIDEBAR_ITEMS.map((item) => (
          <div key={item.id} className="h-10 bg-muted rounded" />
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
        Toggle visibility and reorder sidebar navigation items.
      </p>

      <div className="space-y-2">
        {SIDEBAR_ITEMS.map((item) => {
          const isChecked = sidebarItems.includes(item.id)
          const index = sidebarItems.indexOf(item.id)
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border"
            >
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                {/* Reorder buttons — only show if visible */}
                {isChecked && (
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 min-w-[24px] min-h-[24px]"
                      aria-label={`Move ${item.label} up`}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, 'down')}
                      disabled={index === sidebarItems.length - 1}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 min-w-[24px] min-h-[24px]"
                      aria-label={`Move ${item.label} down`}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}
                {/* Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isChecked}
                  onClick={() => toggleItem(item.id)}
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
              </div>
            </div>
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
