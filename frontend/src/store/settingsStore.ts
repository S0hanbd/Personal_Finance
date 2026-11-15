import { create } from 'zustand'
import { DASHBOARD_CARDS, SIDEBAR_ITEMS } from '@/types'

interface SettingsState {
  dashboardCards: string[]
  sidebarItems: string[]
  loadSettings: (dashboardCards: string[], sidebarItems: string[]) => void
  updateDashboardCards: (cards: string[]) => void
  updateSidebarItems: (items: string[]) => void
}

const defaultDashboardCards = DASHBOARD_CARDS.map((c) => c.id)
const defaultSidebarItems = SIDEBAR_ITEMS.map((s) => s.id)

export const useSettingsStore = create<SettingsState>()((set) => ({
  dashboardCards: defaultDashboardCards,
  sidebarItems: defaultSidebarItems,
  loadSettings: (dashboardCards, sidebarItems) => {
    set({ dashboardCards, sidebarItems })
  },
  updateDashboardCards: (cards) => {
    set({ dashboardCards: cards })
  },
  updateSidebarItems: (items) => {
    set({ sidebarItems: items })
  },
}))
