'use client'

import { useState, useCallback } from 'react'
import { ShoppingCart, Gift, ArrowLeftRight, ScrollText, Rocket, Banknote, ArrowUpRight, Eye } from 'lucide-react'
import Header from './Header'
import EventPopup, { ScanEffect } from './EventPopup'
import { useLanguage } from '@/contexts/LanguageContext'

interface ScanAction {
  id: string
  timestamp: number
  player: string
  action: string
  effect: string
  avatar?: string
}

interface ActionsMenuProps {
  playerName: string
  playerAvatar: string
  onNavigate: (screen: string) => void
  onApplyScanEffect?: (effect: any) => void
  onTriggerEvent?: () => void
  onEndTurnConfirm?: () => void
  actionsDisabled?: boolean
  playerScanActions?: any[]
  autoScanActions?: any[]
  turnTimeLeft?: number
  onShowInsider?: () => void
  insiderUsed?: boolean
}

export default function ActionsMenu({ playerName, playerAvatar, onNavigate, onApplyScanEffect, onEndTurnConfirm, onTriggerEvent, actionsDisabled, playerScanActions = [], autoScanActions = [], turnTimeLeft = 120, onShowInsider, insiderUsed = false }: ActionsMenuProps) {
  const { t } = useLanguage()
  const [showScan, setShowScan] = useState(false)
  const [actionsEnabled, setActionsEnabled] = useState(true)
  
  // Memoize the handler to prevent re-creating on every render
  const handleKansEffect = useCallback((effect: ScanEffect) => {
    console.log('🎲 Kans effect applied:', effect)
    
    // Forecast events are informational only - don't apply to market
    if (effect.type === 'forecast') {
      console.log('🔮 Forecast event - informational only, no market changes')
      return
    }
    
    // Kans-effecten mogen enkel de markt beïnvloeden, niet de portfolio
    // Tag met marketOnly zodat client-side portfolio logica dit overslaat
    if (onApplyScanEffect) {
      onApplyScanEffect({ ...(effect as any), marketOnly: true, source: 'kans' } as any)
    }
    // Don't call setShowScan(false) here - ScanResult component handles onClose itself
  }, [onApplyScanEffect])
  
  const actionButtons: Array<{
    id: string
    title: string
    icon: any
    tileClasses: string
    iconClasses: string
    action: () => void
    preview?: () => JSX.Element
  }> = [
    {
      id: 'kans',
      title: t('actionsMenu.event'),
      icon: Rocket,
      // Donker tile met blauwe accent-glow (matcht Markt-tegel vibe)
      tileClasses:
        'from-gray-900/95 via-blue-500/5 to-gray-900/95 border-2 border-blue-500/70 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/30',
      iconClasses:
        'from-blue-500/25 to-cyan-500/25 border border-blue-400/70 ring-1 ring-blue-400/60',
      action: () => {
        // Trigger event via server instead of showing local ScanResult
        if (onTriggerEvent) {
          console.log('🎲 Triggering event via server')
          onTriggerEvent()
        } else {
          // Fallback to old behavior
          setShowScan(true)
        }
      }
    },
    {
      id: 'win',
      title: t('actionsMenu.win'),
      icon: Gift,
      // Goud/oranje accent voor win-gevoel
      tileClasses:
        'from-gray-900/95 via-amber-500/5 to-gray-900/95 border-2 border-amber-400/70 ring-1 ring-amber-400/40 shadow-lg shadow-amber-400/30',
      iconClasses:
        'from-yellow-400/25 to-orange-500/25 border border-amber-300/70 ring-1 ring-amber-300/60',
      action: () => onNavigate('win')
    },
    {
      id: 'sell',
      title: t('actionsMenu.sell'),
      icon: Banknote,
      // Rood accent voor verkopen
      tileClasses:
        'from-gray-900/95 via-rose-500/5 to-gray-900/95 border-2 border-rose-500/70 ring-1 ring-rose-500/40 shadow-lg shadow-rose-500/30',
      iconClasses:
        'from-red-500/25 to-rose-500/25 border border-rose-400/70 ring-1 ring-rose-400/60',
      action: () => onNavigate('sell')
    },
    {
      id: 'buy',
      title: t('actionsMenu.buy'),
      icon: ShoppingCart,
      // Groen accent, zoals koop/markt
      tileClasses:
        'from-gray-900/95 via-emerald-500/5 to-gray-900/95 border-2 border-emerald-500/70 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/30',
      iconClasses:
        'from-green-500/25 to-emerald-500/25 border border-emerald-400/70 ring-1 ring-emerald-400/60',
      action: () => onNavigate('buy')
    },
    {
      id: 'swap',
      title: t('actionsMenu.swap'),
      icon: ArrowLeftRight,
      // Oranje accent voor swap
      tileClasses:
        'from-gray-900/95 via-orange-500/5 to-gray-900/95 border-2 border-orange-500/70 ring-1 ring-orange-500/40 shadow-lg shadow-orange-500/30',
      iconClasses:
        'from-orange-500/25 to-amber-500/25 border border-orange-400/70 ring-1 ring-orange-400/60',
      action: () => onNavigate('swap')
    },
    {
      id: 'insider',
      title: t('actionsMenu.insider'),
      icon: Eye,
      // Purple/violet accent voor insider info
      tileClasses:
        'from-gray-900/95 via-purple-500/5 to-gray-900/95 border-2 border-purple-500/70 ring-1 ring-purple-500/40 shadow-lg shadow-purple-500/30',
      iconClasses:
        'from-purple-500/25 to-violet-500/25 border border-purple-400/70 ring-1 ring-purple-400/60',
      action: () => {
        console.log('🕵️ Insider button clicked!')
        if (onShowInsider) {
          console.log('✅ Calling onShowInsider')
          onShowInsider()
        } else {
          console.error('❌ onShowInsider is not defined!')
        }
      }
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header 
          playerName={playerName} 
          playerAvatar={playerAvatar} 
          onLogoClick={() => onNavigate('main-menu')} 
          actionsDisabled={actionsDisabled}
          turnTimeLeft={turnTimeLeft}
          onEndTurnConfirm={() => {
            if (onEndTurnConfirm) {
              onEndTurnConfirm()
            }
            setActionsEnabled(false)
          }}
        />
        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-4">
          {actionButtons.map((button) => {
            const Icon = button.icon
            const isInsiderButton = button.id === 'insider'
            const isEventButton = button.id === 'kans'
            // Event and Insider are ALWAYS clickable (not turn-restricted)
            // Only buy/sell/swap/win are disabled when it's not your turn
            const isAlwaysEnabled = isEventButton || isInsiderButton
            const disabled = isAlwaysEnabled 
              ? (isInsiderButton && insiderUsed) // Insider only disabled if already used
              : (!actionsEnabled || !!actionsDisabled)
            return (
              <button
                key={button.id}
                onClick={disabled ? undefined : button.action}
                className={`crypto-card bg-gradient-to-br ${
                  button.tileClasses
                } relative overflow-hidden p-0 h-[200px] flex flex-col transition-all duration-200 ${
                  disabled ? 'opacity-40 pointer-events-none' : 'hover:shadow-xl hover:scale-105'
                }`}
              >
                {/* Content gecentreerd: Icon + Titel */}
                {button.preview ? (
                  <>
                    {/* Top deel: Icon + Titel */}
                    <div className="pt-5 pb-3 flex items-center justify-center">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 bg-gradient-to-br ${button.iconClasses} rounded-xl flex-shrink-0 shadow-inner`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight">{button.title}</h3>
                      </div>
                    </div>
                    {/* Spacer */}
                    <div className="flex-1"></div>
                    {/* Donker vlak met preview */}
                    <div className="bg-gradient-to-t from-dark-bg/90 to-dark-bg/70 backdrop-blur-sm py-2.5 px-3 border-t border-white/5">
                      {button.preview()}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`p-3 bg-gradient-to-br ${button.iconClasses} rounded-xl shadow-inner`}
                      >
                        {button.id === 'sell' ? (
                          <span className="relative inline-block">
                            <Banknote className="w-9 h-9 text-white" />
                          </span>
                        ) : (
                          <Icon className="w-9 h-9 text-white" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{button.title}</h3>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* EventPopup modal triggered by Kans */}
        {showScan && (
          <EventPopup 
            onClose={() => setShowScan(false)}
            onApplyEffect={handleKansEffect}
          />
        )}

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => onNavigate('main-menu')}
            className="w-full crypto-card bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 font-semibold py-3 px-4 rounded-lg hover:scale-105 transition-transform"
          >
            {t('actionsMenu.backToMenu')}
          </button>
        </div>
      </div>
    </div>
  )
}
