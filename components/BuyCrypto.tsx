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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const selected = useMemo(() => cryptos.find(c => c.symbol === selectedSymbol) || null, [cryptos, selectedSymbol])
  const totalCost = useMemo(() => selected ? Math.round(selected.price * quantity * 100) / 100 : 0, [selected, quantity])
  const canAfford = useMemo(() => selected ? cashBalance >= totalCost : false, [selected, totalCost, cashBalance])

  const handleValidateBuy = () => {
    if (!selected || !canAfford) return
    onConfirmBuy(selected.symbol, quantity)
    setSuccessMessage(`Je hebt ${quantity} ${selected.name} gekocht!`)
  }

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
                    {/* Crypto figure uit de tegel laten komen */}
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl bg-transparent flex items-center justify-center overflow-visible -mt-7 mb-1">
                      {imagePath ? (
                        <img src={imagePath} alt={c.name} width={140} height={140} className="object-contain drop-shadow-[0_0_32px_rgba(0,0,0,1)] scale-105" loading="lazy" />
                      ) : (
                        <span className="text-4xl">{c.icon}</span>
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
          <div className="space-y-3">
            {/* Custom slider met gevulde balk en groter bolletje voor mobile */}
            <div className="relative w-full h-7">
              {/* Achtergrond-balk exact gecentreerd */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                {/* Gevulde balk op basis van geselecteerde hoeveelheid (effen oranje) */}
                <div
                  className="h-full bg-neon-gold shadow-[0_0_12px_rgba(250,204,21,0.6)] transition-all duration-200"
                  style={{ width: `${((quantity - 1) / 49) * 100}%` }}
                />
              </div>

              {/* Bolletje / handle - iets groter en verticaal gecentreerd */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-neon-gold bg-dark-bg shadow-[0_0_22px_rgba(250,204,21,0.95)] flex items-center justify-center"
                style={{
                  left: `${((quantity - 1) / 49) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="w-4 h-4 rounded-full bg-neon-gold shadow-[0_0_14px_rgba(250,204,21,0.9)]" />
              </div>

              {/* Onzichtbare native range voor interactie */}
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 1
                  setQuantity(Math.min(Math.max(v, 1), 50))
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Labels onder slider met duidelijk geselecteerd aantal */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>1</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wide text-gray-500">Geselecteerd</span>
                <span className="mt-0.5 w-9 h-9 rounded-full bg-transparent border border-neon-gold/80 text-neon-gold font-bold text-base flex items-center justify-center shadow-[0_0_16px_rgba(250,204,21,0.7)]">
                  {quantity}
                </span>
              </div>
              <span>50</span>
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
              onClick={handleValidateBuy}
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

      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="crypto-card bg-dark-bg/95 border border-neon-gold/40 max-w-xs w-full text-center p-6">
            <h3 className="text-xl font-bold text-white mb-2">Aankoop bevestigd</h3>
            <p className="text-gray-300 mb-4">{successMessage}</p>
            <button
              type="button"
              onClick={() => {
                setSuccessMessage(null)
                onBack()
              }}
              className="w-full py-2 rounded-lg bg-neon-gold text-black font-semibold hover:opacity-90 transition"
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
