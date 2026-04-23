'use client'

import { useState, useEffect } from 'react'
import { X, Clock } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCurrency } from '@/utils/currency'

interface BiddingPopupProps {
  sellerName: string
  sellerAvatar: string
  crypto: string
  amount: number
  marketPrice: number
  playerCash: number
  onSubmitBid: (bidAmount: number) => void
  onClose: () => void
  duration?: number
}

const getCryptoImagePath = (symbol: string): string | null => {
  switch (symbol) {
    case 'DSHP':
      case 'DSHEEP': return '/dsheep.png'
    case 'LNTR': return '/lentra.png'
    case 'SIL': return '/silica.png'
    case 'GLX': return '/glooma.png'
    case 'REX': return '/rex.png'
    case 'ORX': return '/orex.png'
    default: return null
  }
}

export default function BiddingPopup({
  sellerName,
  sellerAvatar,
  crypto,
  amount,
  marketPrice,
  playerCash,
  onSubmitBid,
  onClose,
  duration = 10
}: BiddingPopupProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [timeLeft, setTimeLeft] = useState(duration)
  const [bidAmount, setBidAmount] = useState<string>('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!submitted) {
            onClose()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [submitted, onClose])

  const handleSubmit = () => {
    const bid = parseFloat(bidAmount)
    if (bid > 0) {
      onSubmitBid(bid)
      setSubmitted(true)
    }
  }

  const totalBid = parseFloat(bidAmount) || 0
  const totalMarketValue = marketPrice * amount
  const difference = totalBid - totalMarketValue
  const differencePercentage = totalMarketValue > 0 ? (difference / totalMarketValue) * 100 : 0
  const exceedsCash = totalBid > playerCash

  const imagePath = getCryptoImagePath(crypto)

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="relative max-w-md w-full bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/20">
        {/* Timer Ring */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center border-4 border-dark-bg shadow-lg shadow-purple-500/50">
          <div className="text-center">
            <Clock className="w-6 h-6 text-white mx-auto mb-0.5" />
            <div className="text-white font-bold text-sm">{timeLeft}s</div>
          </div>
        </div>

        <div className="p-6 pt-12">
          {!submitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">🔔 Nieuw Aanbod!</h2>
                <p className="text-gray-300 text-sm">
                  {sellerName} {sellerAvatar} wil verkopen
                </p>
              </div>

              {/* Crypto Info */}
              <div className="bg-dark-bg/60 rounded-xl p-4 mb-4 border border-white/10">
                <div className="flex items-center space-x-4">
                  {imagePath && (
                    <img
                      src={imagePath}
                      alt={crypto}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-white font-bold text-lg">{crypto}</div>
                    <div className="text-gray-400 text-sm">Aantal: {amount}x</div>
                    <div className="text-neon-turquoise text-sm">
                      Marktprijs: {formatCurrency(marketPrice, currency.symbol)} per stuk
                    </div>
                  </div>
                </div>
              </div>

              {/* Bid Input */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white font-semibold">
                    Jouw Bod (totaal voor {amount}x)
                  </label>
                  <span className="text-sm text-gray-400">
                    💰 Beschikbaar: {formatCurrency(playerCash, currency.symbol)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={playerCash}
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Bijv. ${formatCurrency(totalMarketValue, currency.symbol)}`}
                    className={`w-full px-4 py-3 bg-dark-bg/60 border-2 rounded-xl text-white font-bold text-lg focus:outline-none placeholder:text-gray-500 ${
                      exceedsCash ? 'border-red-500' : 'border-purple-500/30 focus:border-purple-500'
                    }`}
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {currency.symbol}
                  </div>
                </div>
                {exceedsCash && (
                  <div className="mt-2 text-xs text-red-400 flex items-center">
                    ⚠️ Je hebt niet genoeg cash voor dit bod
                  </div>
                )}
                {totalBid > 0 && !exceedsCash && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Marktwaarde: {formatCurrency(totalMarketValue, currency.symbol)}
                    </span>
                    <span className={differencePercentage >= 0 ? 'text-red-400' : 'text-green-400'}>
                      {differencePercentage >= 0 ? '+' : ''}{differencePercentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl text-white font-bold transition-colors"
                >
                  Sla over
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!bidAmount || parseFloat(bidAmount) <= 0 || exceedsCash}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold transition-colors ${
                    bidAmount && parseFloat(bidAmount) > 0 && !exceedsCash
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  💰 Plaats Bod
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirmation */}
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">✅</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Bod Geplaatst!</h3>
                <p className="text-gray-300 mb-4">
                  Je bod van {formatCurrency(parseFloat(bidAmount), currency.symbol)} is verzonden
                </p>
                <p className="text-sm text-gray-400">
                  Wachten op beslissing van {sellerName}...
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
