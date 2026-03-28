'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, Plus, Minus, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCurrency } from '@/utils/currency'
import CandlestickChart from './CandlestickChart'

interface MarketOrder {
  id: string
  playerId: string
  playerName: string
  playerAvatar: string
  type: 'buy' | 'sell'
  crypto: string
  amount: number
  pricePerUnit: number
  totalPrice: number
  timestamp: number
}

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

interface PriceChange {
  percentage: number
  timestamp: number
}

interface MarketplaceProps {
  mode: 'buy' | 'sell'
  onBack: () => void
  playerCash: number
  cryptoPrices: { [key: string]: number }
  orders: MarketOrder[]
  onAcceptOrder: (orderId: string) => void
  onCreateOrder?: (crypto: string, amount: number, pricePerUnit: number) => void
  onRefresh?: () => void
  cryptos?: CryptoCurrency[]
  priceHistory?: Record<string, PriceChange[]>
}

export default function Marketplace({
  mode,
  onBack,
  playerCash,
  cryptoPrices,
  orders,
  onAcceptOrder,
  onCreateOrder,
  onRefresh,
  cryptos = [],
  priceHistory = {}
}: MarketplaceProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [maxQuantity, setMaxQuantity] = useState<number>(10)

  const getCryptoName = (symbol: string) => {
    const names: { [key: string]: string } = {
      DSHEEP: 'DigiSheep',
      NGT: 'Nugget',
      LNTR: 'Lentra',
      OMLT: 'Omelet',
      REX: 'Rex',
      ORLO: 'Orlo'
    }
    return names[symbol] || symbol
  }

  const getCryptoImage = (symbol: string) => {
    const images: { [key: string]: string } = {
      DSHEEP: '/dsheep.png',
      NGT: '/Nugget.png',
      LNTR: '/lentra.png',
      OMLT: '/omlt.png',
      REX: '/rex.png',
      ORLO: '/orlo.png'
    }
    return images[symbol]
  }

  const calculatePriceDiff = (orderPrice: number, marketPrice: number) => {
    const diff = ((orderPrice - marketPrice) / marketPrice) * 100
    return Math.round(diff)
  }

  // Group orders by crypto
  const cryptoSymbols = ['DSHEEP', 'NGT', 'LNTR', 'OMLT', 'REX', 'ORLO']
  const ordersByCrypto = cryptoSymbols.reduce((acc, symbol) => {
    acc[symbol] = orders.filter(o => o.crypto === symbol && o.type === 'sell')
    return acc
  }, {} as { [key: string]: MarketOrder[] })

  // Get crypto data from cryptos array
  const getCryptoData = (symbol: string) => {
    return cryptos.find(c => c.symbol === symbol)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-white/70 hover:text-white transition-colors flex items-center space-x-2"
          >
            <span>←</span>
            <span>Terug</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Marketplace</h1>
            <p className="text-sm text-gray-400">
              {mode === 'buy' ? 'Koop van Spelers' : 'Verkoop aan Spelers'}
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Player Cash */}
        <div className="crypto-card mb-4 p-3">
          <p className="text-gray-300 text-sm">
            💰 Jouw Cash: <span className="text-white font-bold">⚘{playerCash.toLocaleString()}</span>
          </p>
        </div>

        {/* Crypto Selection Grid */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white mb-3">Kies een crypto</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cryptos.map(crypto => {
              const imagePath = getCryptoImage(crypto.symbol)
              const isSelected = selectedSymbol === crypto.symbol
              const cryptoOrders = ordersByCrypto[crypto.symbol] || []
              const hasOrders = cryptoOrders.length > 0

              const isOwned = crypto.amount > 0

              return (
                <button
                  key={crypto.symbol}
                  onClick={() => {
                    setSelectedSymbol(crypto.symbol)
                    setQuantity(1)
                    // Set max quantity to owned amount for sell mode
                    if (mode === 'sell') {
                      setMaxQuantity(crypto.amount > 0 ? crypto.amount : 1)
                    } else {
                      setMaxQuantity(10)
                    }
                  }}
                  className={`p-3 rounded-xl border transition shadow-sm bg-dark-bg/40 text-left ${
                    isSelected
                      ? 'border-2 border-neon-blue shadow-lg shadow-neon-blue/30'
                      : 'border-white/10 hover:border-white/20'
                  } ${!isOwned ? 'opacity-40' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl bg-transparent flex items-center justify-center overflow-visible -mt-7 mb-1">
                      {imagePath ? (
                        <img
                          src={imagePath}
                          alt={crypto.name}
                          width={140}
                          height={140}
                          className="object-contain drop-shadow-[0_0_32px_rgba(0,0,0,1)] scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-4xl">{crypto.icon}</span>
                      )}
                    </div>
                    <div className="w-full mt-auto px-1">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-semibold truncate mr-2">{crypto.name}</div>
                        <div className="text-neon-turquoise font-bold whitespace-nowrap">
                          {formatCurrency(crypto.price, currency.symbol)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="text-gray-400 text-xs">{crypto.symbol}</div>
                        {typeof crypto.change24h === 'number' && (
                          <div
                            className={`text-xs px-1.5 py-0.5 rounded-sm border flex items-center space-x-1 ${
                              crypto.change24h >= 0
                                ? 'text-green-400 border-green-400/30'
                                : 'text-red-400 border-red-400/30'
                            }`}
                          >
                            {crypto.change24h >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {typeof crypto.change24h === 'number' && Math.abs(crypto.change24h) > 0 && (
                        <div
                          className={`text-[9px] font-semibold mt-0.5 flex items-center space-x-1 ${
                            Math.abs(crypto.change24h) > 15
                              ? crypto.change24h > 0
                                ? 'text-green-400'
                                : 'text-red-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {Math.abs(crypto.change24h) > 15 ? (
                            crypto.change24h > 0 ? <>↗️ Sterk stijgend</> : <>↘️ Sterk dalend</>
                          ) : (
                            <>-</>
                          )}
                        </div>
                      )}

                      <CandlestickChart
                        priceHistory={priceHistory[crypto.symbol] || []}
                        maxBars={6}
                        currentPercentage={crypto.change24h || 0}
                        currentPrice={crypto.price}
                        showStartPoint={true}
                      />

                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="crypto-card mb-4">
          <h2 className="text-lg font-semibold text-white mb-3">Aantal</h2>
          <div className="space-y-3">
            <div className="relative w-full h-7">
              {/* Achtergrond-balk exact gecentreerd */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                {/* Gevulde balk op basis van geselecteerde hoeveelheid (effen oranje) */}
                <div
                  className="h-full bg-neon-gold shadow-[0_0_12px_rgba(250,204,21,0.6)] transition-all duration-200"
                  style={{ width: `${((quantity - 1) / (maxQuantity - 1)) * 100}%` }}
                />
              </div>

              {/* Bolletje / handle - iets groter en verticaal gecentreerd */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-neon-gold bg-dark-bg shadow-[0_0_22px_rgba(250,204,21,0.95)] flex items-center justify-center"
                style={{
                  left: `${((quantity - 1) / (maxQuantity - 1)) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="w-4 h-4 rounded-full bg-neon-gold shadow-[0_0_14px_rgba(250,204,21,0.9)]" />
              </div>

              {/* Onzichtbare native range voor interactie */}
              <input
                type="range"
                min={1}
                max={maxQuantity}
                step={1}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 1
                  setQuantity(Math.min(Math.max(v, 1), maxQuantity))
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>

            {/* +/- knoppen met aantal in het midden */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full border border-neon-gold/60 text-neon-gold font-bold text-xl flex items-center justify-center hover:bg-neon-gold/10 active:scale-95 transition-all"
              >−</button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wide text-gray-500">Aantal</span>
                <span className="mt-0.5 w-10 h-10 rounded-full bg-transparent border border-neon-gold/80 text-neon-gold font-bold text-base flex items-center justify-center shadow-[0_0_16px_rgba(250,204,21,0.7)]">
                  {quantity}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                className="w-10 h-10 rounded-full border border-neon-gold/60 text-neon-gold font-bold text-xl flex items-center justify-center hover:bg-neon-gold/10 active:scale-95 transition-all"
              >+</button>
            </div>
          </div>
        </div>

        {/* Summary and Action */}
        <div className="crypto-card">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-300">
              {selectedSymbol ? (
                <div className="flex items-center space-x-3">
                  {getCryptoImage(selectedSymbol) && (
                    <img
                      src={getCryptoImage(selectedSymbol)}
                      alt={selectedSymbol}
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <div>
                    <p className="text-white font-bold">{getCryptoName(selectedSymbol)}</p>
                    <p className="text-sm text-gray-400">{quantity}x @ {formatCurrency(cryptoPrices[selectedSymbol] || 0, currency.symbol)}</p>
                  </div>
                </div>
              ) : (
                <p>Kies een crypto</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Totaal</p>
              <p className="text-white font-bold text-2xl">
                {selectedSymbol
                  ? formatCurrency((cryptoPrices[selectedSymbol] || 0) * quantity, currency.symbol)
                  : formatCurrency(0, currency.symbol)}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-colors"
            >
              Terug
            </button>
            {mode === 'sell' && onCreateOrder ? (
              <button
                onClick={() => {
                  if (selectedSymbol && onCreateOrder) {
                    const selectedCrypto = cryptos.find(c => c.symbol === selectedSymbol)
                    if (selectedCrypto) {
                      // Pass crypto symbol, quantity, and market price
                      onCreateOrder(selectedSymbol, quantity, selectedCrypto.price)
                    }
                  }
                }}
                disabled={!selectedSymbol}
                className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all ${
                  selectedSymbol
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-[0_0_24px_rgba(34,197,94,0.5)]'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Nieuw Aanbod
              </button>
            ) : (
              <button
                disabled={!selectedSymbol}
                className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all ${
                  selectedSymbol
                    ? 'bg-neon-gold hover:bg-neon-gold/90 text-dark-bg shadow-[0_0_24px_rgba(250,204,21,0.5)]'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Valideren
              </button>
            )}
          </div>
        </div>

        {/* Info Tip */}
        <div className="mt-4 crypto-card bg-blue-500/10 border border-blue-500/30 p-3">
          <p className="text-blue-300 text-xs text-center">
            💡 Tip: {mode === 'buy' 
              ? 'Groene prijzen zijn onder marktprijs - goede deals!' 
              : 'Prijs competitief voor snellere verkoop!'}
          </p>
        </div>
      </div>
    </div>
  )
}
