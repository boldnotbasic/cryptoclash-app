'use client'

import { X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCurrency } from '@/utils/currency'

interface Bid {
  playerId: string
  playerName: string
  playerAvatar: string
  amount: number
  timestamp: number
}

interface BidAcceptanceModalProps {
  crypto: string
  quantity: number
  marketPrice: number
  bids: Bid[]
  onAcceptBid: (bid: Bid) => void
  onReject: () => void
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

export default function BidAcceptanceModal({
  crypto,
  quantity,
  marketPrice,
  bids,
  onAcceptBid,
  onReject
}: BidAcceptanceModalProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()

  const totalMarketValue = marketPrice * quantity
  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount)
  const imagePath = getCryptoImagePath(crypto)

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-2xl w-full bg-dark-bg/95 border-2 border-purple-500/50 rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onReject}
          className="absolute -top-4 -right-4 z-10 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="p-6">
          {/* Header */}
          <h2 className="text-2xl font-bold text-white mb-2">📊 Biedingen Ontvangen</h2>
          <p className="text-gray-400 text-sm mb-6">Kies het bod dat je wilt accepteren</p>

          {/* Crypto Info */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
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
                <div className="text-gray-400">Aantal: {quantity}x</div>
                <div className="text-neon-turquoise text-sm">
                  Marktwaarde: {formatCurrency(totalMarketValue, currency.symbol)}
                </div>
              </div>
            </div>
          </div>

          {/* Bids List */}
          {bids.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😔</div>
              <p className="text-gray-400 text-lg">Geen biedingen ontvangen</p>
              <p className="text-gray-500 text-sm mt-2">Probeer het later opnieuw</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {sortedBids.map((bid, index) => {
                const difference = bid.amount - totalMarketValue
                const differencePercentage = (difference / totalMarketValue) * 100
                const isHighest = index === 0

                return (
                  <button
                    key={bid.playerId}
                    onClick={() => onAcceptBid(bid)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      isHighest
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 hover:border-green-400'
                        : 'bg-dark-bg/60 border-white/10 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{bid.playerAvatar || '👤'}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-bold">{bid.playerName}</span>
                            {isHighest && (
                              <span className="px-2 py-0.5 bg-green-500/30 border border-green-500/50 rounded-full text-green-400 text-xs font-bold">
                                HOOGSTE BOD
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(bid.timestamp).toLocaleTimeString('nl-NL', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-xl">
                          {formatCurrency(bid.amount, currency.symbol)}
                        </div>
                        <div className={`text-sm font-semibold ${
                          differencePercentage >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {differencePercentage >= 0 ? '+' : ''}{differencePercentage.toFixed(1)}% vs markt
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onReject}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl text-white font-bold transition-colors"
            >
              Annuleren
            </button>
            {bids.length === 0 && (
              <button
                onClick={onReject}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold transition-colors"
              >
                Sluiten
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
