'use client'

import React, { useMemo, useState } from 'react'
import Header from './Header'
import { CreditCard } from 'lucide-react'

type Crypto = {
  id: string
  name: string
  symbol: string
  price: number
  amount: number
  color: string
  icon: string
  change24h?: number
}

interface BuyCryptoProps {
  playerName: string
  playerAvatar: string
  cryptos: Crypto[]
  cashBalance: number
  onBack: () => void
  onConfirmBuy: (symbol: string, quantity: number) => void
}

export default function BuyCrypto({ playerName, playerAvatar, cryptos, cashBalance, onBack, onConfirmBuy }: BuyCryptoProps) {
  const getCryptoImagePath = (symbol: string): string | null => {
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
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)

  const selected = useMemo(() => cryptos.find(c => c.symbol === selectedSymbol) || null, [cryptos, selectedSymbol])
  const totalCost = useMemo(() => selected ? Math.round(selected.price * quantity * 100) / 100 : 0, [selected, quantity])
  const canAfford = selected ? cashBalance >= totalCost : false

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header playerName={playerName} playerAvatar={playerAvatar} onLogoClick={onBack} />

        <div className="crypto-card mb-4">
          <h1 className="text-2xl font-bold text-white">Kopen</h1>
          <p className="text-gray-400 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-neon-turquoise" />
            Saldo: €{cashBalance.toFixed(2)}
          </p>
        </div>

        {/* Cryptolijst */}
        <div className="crypto-card mb-4">
          <h2 className="text-lg font-semibold text-white mb-3">Kies een crypto</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cryptos.map(c => {
              const imagePath = getCryptoImagePath(c.symbol)
              const affordable = cashBalance >= (c.price * quantity)
              const isSelected = selectedSymbol === c.symbol
              return (
                <button
                  key={c.symbol}
                  onClick={() => setSelectedSymbol(c.symbol)}
                  className={`p-3 rounded-xl border transition shadow-sm hover:shadow-md bg-dark-bg/40 text-left ${isSelected ? 'border-neon-blue' : 'border-white/10 hover:border-white/20'} ${!affordable ? 'opacity-40' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden mb-3">
                      {imagePath ? (
                        <img src={imagePath} alt={c.name} width={96} height={96} className="object-contain" loading="lazy" />
                      ) : (
                        <span className="text-3xl">{c.icon}</span>
                      )}
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-semibold truncate mr-2">{c.name}</div>
                        <div className="text-neon-turquoise font-bold whitespace-nowrap">€{c.price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-gray-400 text-xs">{c.symbol}</div>
                        {typeof c.change24h === 'number' && (
                          <div className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${c.change24h >= 0 ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
                            {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Aantal */}
        <div className="crypto-card mb-4">
          <h2 className="text-lg font-semibold text-white mb-3">Aantal</h2>
          <div>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full accent-neon-blue"
            />
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>1</span>
              <span className="text-white font-semibold px-2 py-0.5 rounded bg-white/10">{quantity}</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Overzicht */}
        <div className="crypto-card">
          <div className="flex items-center justify-between">
            <div className="text-gray-300">
              {selected ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                    <img src={getCryptoImagePath(selected.symbol) || ''} alt={selected.name} width={36} height={36} className="object-contain" />
                  </div>
                  <div>
                    <div><span className="text-white font-semibold">{selected.name}</span> × {quantity}</div>
                    <div className="text-sm text-gray-400">Prijs per stuk: €{selected.price.toFixed(2)}</div>
                  </div>
                </div>
              ) : (
                <div>Kies een crypto</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">Totaal</div>
              <div className="text-white font-bold text-xl">€{totalCost.toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={onBack} className="flex-1 crypto-card bg-gray-600/20 hover:bg-gray-600/30 text-gray-200 py-2 rounded-lg">Terug</button>
            <button
              disabled={!selected || !canAfford}
              onClick={() => selected && onConfirmBuy(selected.symbol, quantity)}
              className={`flex-1 py-2 rounded-lg font-semibold ${(!selected || !canAfford) ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
            >
              Valideren
            </button>
          </div>

          {!canAfford && selected && (
            <div className="text-red-400 text-sm mt-2">Onvoldoende saldo</div>
          )}
        </div>
      </div>
    </div>
  )
}
