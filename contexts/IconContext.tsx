'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface IconConfig {
  avatars: {
    list: string[]
  }
  events: Record<string, string>
  cryptos: Record<string, string>
  ui: Record<string, string>
  lucideIcons: Record<string, string>
}

const DEFAULT_ICONS: IconConfig = {
  avatars: {
    list: ['🤡','🚀','💎','⚡️','💀','🦊','🦄','🌝','👾','👽','👻','🦁','🐲','🦉','🦅','🦈','🐙','🤯','😎','🤠']
  },
  events: {
    bullRun: '🐂',
    bearMarket: '🐻',
    whaleAlert: '🐋',
    forecast: '🔮',
    boost: '📈',
    crash: '📉'
  },
  cryptos: {
    DSHEEP: '/dsheep.png',
    ORX: '🪙',
    LNTR: '💡',
    SIL: '🤖',
    REX: '🦖',
    GLX: '�'
  },
  ui: {
    host: '👑',
    player: '👤',
    start: '▶️',
    newRoom: '🔄',
    settings: '⚙️',
    leaderboard: '🏆',
    wallet: '💼',
    cash: '💵',
    buy: '🛒',
    sell: '💸',
    scan: '📷',
    dice: '🎲',
    market: '📊',
    timer: '⏱️',
    music: '🎵',
    ranking: '🏅',
    profit: '✅',
    loss: '❌'
  },
  lucideIcons: {
    startGame: 'Play',
    newRoom: 'RefreshCw',
    back: 'ArrowLeft',
    close: 'X',
    settings: 'Settings',
    check: 'Check',
    trendUp: 'TrendingUp',
    trendDown: 'TrendingDown',
    barChart: 'BarChart3',
    trophy: 'Trophy',
    wallet: 'Wallet',
    zap: 'Zap',
    globe: 'Globe',
    save: 'Save',
    edit: 'Pencil',
    copy: 'Copy',
    qrCode: 'QrCode',
    music: 'Music',
    musicOff: 'VolumeX',
    timer: 'Timer',
    users: 'Users',
    chevronDown: 'ChevronDown',
    chevronRight: 'ChevronRight',
    alertCircle: 'AlertCircle',
    info: 'Info',
    star: 'Star',
    dice: 'Dices'
  }
}

interface IconContextType {
  icons: IconConfig
  reloadIcons: () => Promise<void>
}

const IconContext = createContext<IconContextType | null>(null)

const LS_KEY = 'cryptoclash_icons_config'

function loadFromStorage(): IconConfig | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.avatars) return parsed as IconConfig
  } catch {}
  return null
}

function saveToStorage(config: IconConfig) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(config))
  } catch {}
}

export function IconProvider({ children }: { children: React.ReactNode }) {
  const [icons, setIcons] = useState<IconConfig>(() => {
    if (typeof window !== 'undefined') {
      return loadFromStorage() ?? DEFAULT_ICONS
    }
    return DEFAULT_ICONS
  })

  const reloadIcons = useCallback(async () => {
    try {
      const res = await fetch('/api/icons', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data && data.avatars) {
          setIcons(data)
          saveToStorage(data)
        }
      }
    } catch {
      console.warn('Could not load icons config, using defaults')
    }
  }, [])

  useEffect(() => {
    reloadIcons()
  }, [reloadIcons])

  return (
    <IconContext.Provider value={{ icons, reloadIcons }}>
      {children}
    </IconContext.Provider>
  )
}

export function useIcons() {
  const ctx = useContext(IconContext)
  if (!ctx) throw new Error('useIcons must be used within IconProvider')
  return ctx
}
