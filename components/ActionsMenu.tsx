'use client'

import { useState, useCallback } from 'react'
import { ShoppingCart, TrendingDown, Gift, Dice5, ArrowLeftRight, ScrollText } from 'lucide-react'
import Header from './Header'
import ScanResult, { ScanEffect } from './ScanResult'

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
  onNavigate: (screen: 'main-menu' | 'buy' | 'sell' | 'market-activity' | 'win' | 'swap' | 'activity') => void
  onApplyScanEffect?: (effect: ScanEffect) => void
  onEndTurnConfirm?: () => void
  actionsDisabled?: boolean
  playerScanActions?: ScanAction[]
  autoScanActions?: ScanAction[]
  turnTimeLeft?: number
}

export default function ActionsMenu({ playerName, playerAvatar, onNavigate, onApplyScanEffect, onEndTurnConfirm, actionsDisabled, playerScanActions = [], autoScanActions = [], turnTimeLeft = 120 }: ActionsMenuProps) {
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
  
  const actionButtons = [
    {
      id: 'kans',
      title: 'Event',
      icon: Dice5,
      // Donker tile met blauwe accent-glow (matcht Markt-tegel vibe)
      tileClasses:
        'from-gray-900/95 via-blue-500/5 to-gray-900/95 border-2 border-blue-500/70 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/30',
      iconClasses:
        'from-blue-500/25 to-cyan-500/25 border border-blue-400/70 ring-1 ring-blue-400/60',
      action: () => setShowScan(true)
    },
    {
      id: 'buy',
      title: 'Kopen',
      icon: ShoppingCart,
      // Groen accent, zoals koop/markt
      tileClasses:
        'from-gray-900/95 via-emerald-500/5 to-gray-900/95 border-2 border-emerald-500/70 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/30',
      iconClasses:
        'from-green-500/25 to-emerald-500/25 border border-emerald-400/70 ring-1 ring-emerald-400/60',
      action: () => onNavigate('buy')
    },
    {
      id: 'sell',
      title: 'Verkopen',
      icon: TrendingDown,
      // Rood accent voor verkopen
      tileClasses:
        'from-gray-900/95 via-rose-500/5 to-gray-900/95 border-2 border-rose-500/70 ring-1 ring-rose-500/40 shadow-lg shadow-rose-500/30',
      iconClasses:
        'from-red-500/25 to-rose-500/25 border border-rose-400/70 ring-1 ring-rose-400/60',
      action: () => onNavigate('sell')
    },
    {
      id: 'win',
      title: 'Win',
      icon: Gift,
      // Goud/oranje accent voor win-gevoel
      tileClasses:
        'from-gray-900/95 via-amber-500/5 to-gray-900/95 border-2 border-amber-400/70 ring-1 ring-amber-400/40 shadow-lg shadow-amber-400/30',
      iconClasses:
        'from-yellow-400/25 to-orange-500/25 border border-amber-300/70 ring-1 ring-amber-300/60',
      action: () => onNavigate('win')
    },
    {
      id: 'swap',
      title: 'Swap',
      icon: ArrowLeftRight,
      // Oranje accent voor swap
      tileClasses:
        'from-gray-900/95 via-orange-500/5 to-gray-900/95 border-2 border-orange-500/70 ring-1 ring-orange-500/40 shadow-lg shadow-orange-500/30',
      iconClasses:
        'from-orange-500/25 to-amber-500/25 border border-orange-400/70 ring-1 ring-orange-400/60',
      action: () => onNavigate('swap')
    },
    {
      id: 'activity',
      title: 'Activiteiten',
      icon: ScrollText,
      // Cyan accent voor activiteiten
      tileClasses:
        'from-gray-900/95 via-cyan-500/5 to-gray-900/95 border-2 border-cyan-500/70 ring-1 ring-cyan-500/40 shadow-lg shadow-cyan-500/30',
      iconClasses:
        'from-cyan-500/25 to-blue-500/25 border border-cyan-400/70 ring-1 ring-cyan-400/60',
      action: () => onNavigate('activity'),
      preview: () => {
        const recentActions = [...playerScanActions, ...autoScanActions]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 3)
        
        if (recentActions.length === 0) {
          return (
            <div className="text-center py-1">
              <span className="text-xs text-white/50">Nog geen acties</span>
            </div>
          )
        }
        
        return (
          <div className="space-y-1">
            {recentActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm">{action.avatar || '👤'}</span>
                  <span className="text-white/90 font-medium truncate max-w-[70px]">{action.player}</span>
                </div>
                <span className="text-white/60 text-[10px] truncate max-w-[90px]">{action.action}</span>
              </div>
            ))}
          </div>
        )
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
            const disabled = !actionsEnabled || !!actionsDisabled
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
                        <Icon className="w-9 h-9 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{button.title}</h3>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ScanResult modal triggered by Kans */}
        {showScan && (
          <ScanResult 
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
            ← Terug naar Menu
          </button>
        </div>
      </div>
    </div>
  )
}
