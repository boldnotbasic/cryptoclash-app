'use client'

import { useState } from 'react'
import { ArrowLeft, Home, SkipForward } from 'lucide-react'

interface HeaderProps {
  playerName: string
  playerAvatar: string
  onLogoClick?: () => void
  onEndTurnConfirm?: () => void
  actionsDisabled?: boolean
  turnTimeLeft?: number
}

export default function Header({ playerName, playerAvatar, onLogoClick, onEndTurnConfirm, actionsDisabled, turnTimeLeft = 60 }: HeaderProps) {
  const [isEndTurnModalOpen, setIsEndTurnModalOpen] = useState(false)

  return (
    <div className="mb-4 space-y-4">
      <div className="flex items-center justify-between p-4 crypto-card bg-gradient-to-r from-neon-purple/10 to-neon-blue/10">
        {/* Logo Links */}
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onLogoClick}
        >
          <img
            src="/cryptoclash-logo-horizontal.png"
            alt="CryptoClash"
            className="h-10 md:h-10"
          />
        </div>
        
        {/* User Info Rechts */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-xl font-bold text-white">{playerName}</p>
          </div>
          <span className="text-3xl">{playerAvatar}</span>
        </div>
      </div>

      {/* Navigatie knoppen onder header - zelfde gap als tegels */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => {
            console.log('🔙 Terug knop geklikt')
            if (onLogoClick) {
              onLogoClick()
            }
          }}
          className="crypto-card flex items-center justify-center py-3 bg-dark-bg/80 hover:bg-dark-bg/90 text-base font-semibold text-white gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug</span>
        </button>

        <button
          type="button"
          onClick={actionsDisabled ? undefined : () => {
            console.log('⏭️ Einde beurt knop geklikt')
            setIsEndTurnModalOpen(true)
          }}
          className={`crypto-card flex items-center justify-center py-3 text-base font-semibold text-white gap-2 transition-all ${
            actionsDisabled
              ? 'bg-dark-bg/60 opacity-40 pointer-events-none'
              : turnTimeLeft <= 10
              ? 'bg-red-600/80 hover:bg-red-600/90 animate-pulse'
              : 'bg-dark-bg/80 hover:bg-dark-bg/90'
          }`}
        >
          <SkipForward className="w-4 h-4" />
          <span>Einde beurt</span>
        </button>
      </div>

      {isEndTurnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-dark-bg/95 border border-white/10 rounded-lg p-5 w-80">
            <h3 className="text-white font-bold text-lg mb-2 text-center">Je bent klaar?</h3>
            <p className="text-gray-300 text-sm mb-4 text-center">
              Wil je deze beurt afronden en terugkeren naar het hoofdscherm?
            </p>
            <div className="flex items-center justify-between space-x-3">
              <button
                className="flex-1 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition"
                onClick={() => setIsEndTurnModalOpen(false)}
              >
                Annuleren
              </button>
              <button
                className="flex-1 py-2 rounded-md bg-neon-gold text-black font-semibold hover:opacity-90 transition"
                onClick={() => {
                  if (onEndTurnConfirm) {
                    onEndTurnConfirm()
                  }
                  setIsEndTurnModalOpen(false)
                }}
              >
                Bevestigen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
