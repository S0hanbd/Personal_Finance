import { useState, useEffect } from 'react'
import { User, Lock, LayoutGrid, Navigation } from 'lucide-react'
import { useUserSettings } from '@/hooks/useSettingsQueries'
import { useSettingsStore } from '@/store/settingsStore'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { PasswordSettings } from '@/components/settings/PasswordSettings'
import { DashboardSettings } from '@/components/settings/DashboardSettings'
import { NavigationSettings } from '@/components/settings/NavigationSettings'

type TabType = 'profile' | 'password' | 'dashboard' | 'navigation'

const TABS: { id: TabType; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'navigation', label: 'Navigation', icon: Navigation },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const { data: settings } = useUserSettings()
  const { loadSettings } = useSettingsStore()

  // Load settings into store on first fetch
  useEffect(() => {
    if (settings) {
      loadSettings(settings.dashboard_cards, settings.sidebar_items)
    }
  }, [settings, loadSettings])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-navy">Settings</h2>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors min-h-[24px] ' +
                (isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted')
              }
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'profile' && <ProfileSettings />}
        {activeTab === 'password' && <PasswordSettings />}
        {activeTab === 'dashboard' && <DashboardSettings />}
        {activeTab === 'navigation' && <NavigationSettings />}
      </div>
    </div>
  )
}

