'use client'

import { useState } from 'react'
import { ShoppingCart, TrendingDown, ArrowLeftRight, Dice5 } from 'lucide-react'
import Header from './Header'
import ScanResult, { ScanEffect } from './ScanResult'

interface ActionsMenuProps {
  playerName: string
  playerAvatar: string
  onNavigate: (screen: 'main-menu' | 'buy' | 'sell' | 'market-activity' | 'swap') => void
  onApplyScanEffect?: (effect: ScanEffect) => void
}

export default function ActionsMenu({ playerName, playerAvatar, onNavigate, onApplyScanEffect }: ActionsMenuProps) {
  const [showScan, setShowScan] = useState(false)
  const actionButtons = [
    {
      id: 'buy',
      title: 'Kopen',
      icon: ShoppingCart,
      color: 'from-green-500 to-emerald-600',
      description: 'Crypto kopen',
      action: () => onNavigate('buy')
    },
    {
      id: 'sell',
      title: 'Verkopen',
      icon: TrendingDown,
      color: 'from-red-500 to-rose-600',
      description: 'Crypto verkopen',
      action: () => onNavigate('sell')
    },
    {
      id: 'kans',
      title: 'Kans',
      icon: Dice5,
      color: 'from-blue-500 to-cyan-600',
      description: 'Kans effect',
      action: () => setShowScan(true)
    },
    {
      id: 'swap',
      title: 'Swap',
      icon: ArrowLeftRight,
      color: 'from-purple-500 to-pink-600',
      description: 'Crypto wisselen',
      action: () => onNavigate('swap')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header 
          playerName={playerName} 
          playerAvatar={playerAvatar} 
          onLogoClick={() => onNavigate('main-menu')} 
        />

        {/* Page Title */}
        <div className="crypto-card mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Acties</h1>
          <p className="text-gray-400">Kies een actie om uit te voeren</p>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-4">
          {actionButtons.map((button) => {
            const Icon = button.icon
            return (
              <button
                key={button.id}
                onClick={button.action}
                className={`crypto-card bg-gradient-to-br ${button.color} relative overflow-hidden p-0 h-[200px] flex flex-col shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200`}
              >
                {/* Top deel: Icon + Titel */}
                <div className="pt-5 pb-3 flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-white/20 rounded-xl shadow-inner">
                      <Icon className="w-9 h-9 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{button.title}</h3>
                  </div>
                </div>
                {/* Spacer voor ruimte */}
                <div className="flex-1"></div>
                {/* Donker vlak met beschrijving */}
                <div className="bg-gradient-to-t from-dark-bg/90 to-dark-bg/70 backdrop-blur-sm py-2.5 px-4 text-center border-t border-white/5 flex items-center justify-center">
                  <p className="text-white/80 text-sm">{button.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* ScanResult modal triggered by Kans */}
        {showScan && (
          <ScanResult 
            onClose={() => setShowScan(false)}
            onApplyEffect={(effect) => {
              // Kans-effecten mogen enkel de markt beïnvloeden, niet de portfolio
              // Tag met marketOnly zodat client-side portfolio logica dit overslaat
              try { onApplyScanEffect && onApplyScanEffect({ ...(effect as any), marketOnly: true, source: 'kans' } as any) } catch {}
              setShowScan(false)
            }}
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
