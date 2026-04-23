'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCurrency } from '@/utils/currency'

interface CryptoCurrency {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  amount: number
  color: string
  icon: string
}

interface CreateOrderModalProps {
  cryptos: CryptoCurrency[]
  onClose: () => void
  onCreateOrder: (crypto: string, amount: number, pricePerUnit: number) => void
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

export default function CreateOrderModal({ cryptos, onClose, onCreateOrder }: CreateOrderModalProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [amount, setAmount] = useState<number>(1)
  const [pricePerUnit, setPricePerUnit] = useState<number>(0)

  const selectedCrypto = cryptos.find(c => c.symbol === selectedSymbol)
  const availableAmount = selectedCrypto?.amount || 0
  const totalPrice = amount * pricePerUnit
  const marketPrice = selectedCrypto?.price || 0
  const priceDifference = marketPrice > 0 ? ((pricePerUnit - marketPrice) / marketPrice) * 100 : 0

  const canCreate = selectedSymbol && amount > 0 && amount <= availableAmount && pricePerUnit > 0

  const handleCreate = () => {
    if (canCreate) {
      onCreateOrder(selectedSymbol, amount, pricePerUnit)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-2xl w-full bg-dark-bg/95 border-2 border-purple-500/50 rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="p-6">
          {/* Header */}
          <h2 className="text-2xl font-bold text-white mb-2">➕ Nieuw Aanbod Plaatsen</h2>
          <p className="text-gray-400 text-sm mb-6">Plaats je crypto te koop voor andere spelers</p>

          {/* Select Crypto */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">Selecteer Crypto</label>
            <div className="grid grid-cols-3 gap-3">
              {cryptos.filter(c => c.amount > 0).map(crypto => {
                const imagePath = getCryptoImagePath(crypto.symbol)
                const isSelected = selectedSymbol === crypto.symbol
                
                return (
                  <button
                    key={crypto.symbol}
                    onClick={() => {
                      setSelectedSymbol(crypto.symbol)
                      setPricePerUnit(crypto.price)
                      setAmount(1)
                    }}
                    className={`p-3 rounded-xl border-2 transition ${
                      isSelected
                        ? 'border-neon-blue shadow-lg shadow-neon-blue/30 bg-neon-blue/10'
                        : 'border-white/10 hover:border-white/20 bg-dark-bg/40'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      {imagePath ? (
                        <img
                          src={imagePath}
                          alt={crypto.name}
                          className="w-16 h-16 object-contain mb-2"
                        />
                      ) : (
                        <span className="text-3xl mb-2">{crypto.icon}</span>
                      )}
                      <div className="text-white font-semibold text-sm">{crypto.symbol}</div>
                      <div className="text-gray-400 text-xs">Bezit: {crypto.amount}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedCrypto && (
            <>
              {/* Amount Slider */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">
                  Aantal: {amount} {selectedSymbol}
                </label>
                <input
                  type="range"
                  min="1"
                  max={availableAmount}
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>{availableAmount}</span>
                </div>
              </div>

              {/* Price Per Unit */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">
                  Prijs per {selectedSymbol}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-3 bg-dark-bg/60 border-2 border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    onClick={() => setPricePerUnit(marketPrice)}
                    className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl text-purple-300 text-sm font-semibold transition-colors"
                  >
                    Marktprijs
                  </button>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-gray-400">Marktprijs: {formatCurrency(marketPrice, currency.symbol)}</span>
                  {priceDifference !== 0 && (
                    <span className={priceDifference > 0 ? 'text-red-400' : 'text-green-400'}>
                      {priceDifference > 0 ? '+' : ''}{priceDifference.toFixed(1)}% vs markt
                    </span>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">Totale Verkoopprijs</p>
                    <p className="text-white font-bold text-2xl">{formatCurrency(totalPrice, currency.symbol)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Je ontvangt</p>
                    <p className="text-neon-gold font-bold text-xl">{formatCurrency(totalPrice, currency.symbol)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl text-white font-bold transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!canCreate}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition-colors ${
                    canCreate
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Aanbod Plaatsen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
