'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCurrency } from '@/utils/currency'

interface Bid {
  playerName: string
  playerAvatar?: string
  amount: number
}

interface OfferWatchViewProps {
  sellerName?: string
  sellerAvatar?: string
  crypto: string
  quantity: number
  marketPrice: number
  bids?: Bid[]
  duration?: number
  readOnly?: boolean
}

const getCryptoImage = (symbol: string): string | null => {
  switch (symbol) {
    case 'DSHEEP': return '/dsheep.png'
    case 'LNTR': return '/lentra.png'
    case 'OMLT': return '/omlt.png'
    case 'ORLO': return '/orlo.png'
    case 'REX': return '/rex.png'
    case 'NGT': return '/Nugget.png'
    default: return null
  }
}

export default function OfferWatchView({
  sellerName,
  sellerAvatar,
  crypto,
  quantity,
  marketPrice,
  bids = [],
  duration = 10,
  readOnly = false
}: OfferWatchViewProps) {
  const { currency } = useCurrency()
  const [timeLeft, setTimeLeft] = useState(duration)
  const imagePath = getCryptoImage(crypto)
  const totalValue = marketPrice * quantity
  const progressPct = ((duration - timeLeft) / duration) * 100

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="relative max-w-md w-full bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/20">

        {/* Timer badge */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center border-4 border-dark-bg shadow-lg shadow-purple-500/50">
          <div className="text-center">
            <Clock className="w-5 h-5 text-white mx-auto" />
            <div className="text-white font-bold text-sm leading-none">{timeLeft}s</div>
          </div>
        </div>

        <div className="p-6 pt-12">
          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-white mb-1">⏳ Biedingen Ontvangen</h2>
            {sellerName && (
              <p className="text-gray-400 text-sm">{sellerName} {sellerAvatar} wil verkopen</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Wachten op biedingen... ({timeLeft}s resterend)</p>
          </div>

          {/* Crypto info */}
          <div className="bg-dark-bg/60 rounded-xl p-4 mb-4 border border-white/10">
            <div className="flex items-center space-x-4">
              {imagePath && (
                <img src={imagePath} alt={crypto} className="w-14 h-14 object-contain" />
              )}
              <div>
                <div className="text-white font-bold text-lg">{crypto}</div>
                <div className="text-gray-400 text-sm">Aantal: {quantity}x</div>
                <div className="text-neon-turquoise text-sm">
                  Marktwaarde: {formatCurrency(totalValue, currency.symbol)}
                </div>
              </div>
            </div>
          </div>

          {/* Bids or waiting */}
          {bids.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">⏳</div>
              <p className="text-gray-400 text-sm">Wachten op biedingen...</p>
              <p className="text-gray-500 text-xs mt-1">
                {readOnly
                  ? 'Spelers kunnen nu bieden'
                  : 'Je kunt de biedingen accepteren wanneer de tijd voorbij is'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-semibold">{bids.length} bod(den) ontvangen</p>
              {bids.map((bid, i) => (
                <div
                  key={i}
                  className="bg-dark-bg/40 rounded-lg p-3 border border-white/10 flex justify-between items-center"
                >
                  <span className="text-white text-sm">
                    {bid.playerAvatar} {bid.playerName}
                  </span>
                  <span className="text-neon-green font-bold text-sm">
                    {formatCurrency(bid.amount, currency.symbol)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800/50 rounded-b-2xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-violet-600 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
