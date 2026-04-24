"use client"

import { useState } from 'react'
import Header from './Header'
import SpinWheel from './SpinWheel'
import { useLanguage } from '@/contexts/LanguageContext'

interface CryptoCurrency {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  amount: number
  color: string
  icon: string
  volume: number
  marketCap: number
}

interface WinProps {
  playerName: string
  playerAvatar: string
  cryptos: CryptoCurrency[]
  onNavigate: (screen: string) => void
  onWinCrypto: (cryptoSymbol: string) => void
  onWinCash: () => void
  onWinGoldHen: () => void
  priceHistory?: Record<string, any>
}

export default function Win({
  playerName,
  playerAvatar,
  cryptos,
  onNavigate,
  onWinCrypto,
  onWinCash,
  onWinGoldHen,
}: WinProps) {
  const { t } = useLanguage()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleWinCrypto = (symbol: string) => {
    onWinCrypto(symbol)
    const coin = cryptos.find(c => c.symbol === symbol)
    setSuccessMessage(`${t('win.youWon')} 1 ${coin?.name || symbol}!`)
  }

  const handleWinCash = () => {
    onWinCash()
    setSuccessMessage(t('win.youWonCash500'))
  }

  const handleWinGoldHen = () => {
    onWinGoldHen()
    setSuccessMessage(t('win.youWonGoldHen'))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header
          playerName={playerName}
          playerAvatar={playerAvatar}
          onLogoClick={() => onNavigate('actions-menu')}
        />
      </div>

      {/* Success message after winning */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="crypto-card bg-dark-bg/95 border border-neon-gold/40 max-w-xs w-full text-center p-6">
            <h3 className="text-xl font-bold text-white mb-2">{t('win.congratulations')}</h3>
            <p className="text-gray-300 mb-4">{successMessage}</p>
            <button
              type="button"
              onClick={() => {
                setSuccessMessage(null)
                onNavigate('main-menu')
              }}
              className="w-full py-2 rounded-lg bg-neon-gold text-black font-semibold hover:opacity-90 transition"
            >
              {t('common.ok')}
            </button>
          </div>
        </div>
      )}

      {/* Spin Wheel - altijd direct zichtbaar */}
      {!successMessage && (
        <SpinWheel
          cryptos={cryptos}
          onClose={() => onNavigate('actions-menu')}
          onWinCrypto={handleWinCrypto}
          onWinCash={handleWinCash}
          onWinGoldHen={handleWinGoldHen}
        />
      )}
    </div>
  )
}
