'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TrendingUp, TrendingDown, Check } from 'lucide-react'

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

interface WhaleChoiceProps {
  cryptos: CryptoCurrency[]
  onSelectCrypto: (symbol: string, direction: 'up' | 'down') => void
}

export default function WhaleChoice({ cryptos, onSelectCrypto }: WhaleChoiceProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null)
  const [selectedDirection, setSelectedDirection] = useState<'up' | 'down' | null>(null)
  const getCryptoImagePath = (symbol: string) => {
    const imageMap: { [key: string]: string } = {
      'DSHEEP': '/dsheep.png',
      'NGT': '/Nugget.png',
      'LNTR': '/lentra.png',
      'OMLT': '/omlt.png',
      'REX': '/rex.png',
      'ORLO': '/orlo.png'
    }
    return imageMap[symbol] || null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/Whala-alert.png"
              alt="Whale Alert"
              width={120}
              height={120}
              className="object-contain drop-shadow-[0_8px_30px_rgba(139,92,246,0.6)]"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">🐋 Whale Alert!</h1>
          <p className="text-xl text-gray-300">
            {!selectedCrypto ? (
              <>Kies welke crypto wordt beïnvloed</>
            ) : !selectedDirection ? (
              <>Kies richting voor <span className="text-neon-gold font-bold">{selectedCrypto}</span></>
            ) : (
              <>Bevestig je keuze</>
            )}
          </p>
        </div>

        {/* Step 1: Crypto Selection */}
        {!selectedCrypto && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cryptos.map((crypto) => {
              const imgPath = getCryptoImagePath(crypto.symbol)
              
              return (
                <button
                  key={crypto.id}
                  onClick={() => setSelectedCrypto(crypto.symbol)}
                  className="crypto-card hover:scale-105 transition-all duration-300 hover:shadow-neon-purple group cursor-pointer border-2 border-transparent hover:border-neon-purple/50 p-6"
                >
                  <div className="flex flex-col items-center space-y-3">
                    {imgPath && (
                      <div className="relative w-16 h-16">
                        <Image
                          src={imgPath}
                          alt={crypto.symbol}
                          width={64}
                          height={64}
                          className="object-contain group-hover:scale-110 transition-transform"
                        />
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white mb-1">{crypto.symbol}</h3>
                      <p className="text-xs text-gray-400 mb-1">{crypto.name}</p>
                      <p className="text-sm font-semibold text-white">
                        ⚘{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Step 2: Direction Selection */}
        {selectedCrypto && !selectedDirection && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Stijgen Button */}
              <button
                onClick={() => setSelectedDirection('up')}
                className="crypto-card hover:scale-105 transition-all duration-300 hover:shadow-green-500 group cursor-pointer border-2 border-transparent hover:border-green-500/50 p-8"
              >
                <div className="flex flex-col items-center space-y-4">
                  <TrendingUp className="w-16 h-16 text-green-400 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-bold text-white">Stijgen</h3>
                  <div className="flex items-center space-x-2 bg-green-500/20 px-4 py-2 rounded-full">
                    <span className="text-green-400 font-bold text-xl">+50%</span>
                  </div>
                </div>
              </button>

              {/* Dalen Button */}
              <button
                onClick={() => setSelectedDirection('down')}
                className="crypto-card hover:scale-105 transition-all duration-300 hover:shadow-red-500 group cursor-pointer border-2 border-transparent hover:border-red-500/50 p-8"
              >
                <div className="flex flex-col items-center space-y-4">
                  <TrendingDown className="w-16 h-16 text-red-400 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-bold text-white">Dalen</h3>
                  <div className="flex items-center space-x-2 bg-red-500/20 px-4 py-2 rounded-full">
                    <span className="text-red-400 font-bold text-xl">-50%</span>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setSelectedCrypto(null)}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Terug naar crypto selectie
            </button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {selectedCrypto && selectedDirection && (
          <div className="space-y-6">
            <div className="crypto-card p-8 border-2 border-neon-purple">
              <div className="flex flex-col items-center space-y-6">
                {/* Selected Crypto */}
                <div className="relative w-24 h-24">
                  <Image
                    src={getCryptoImagePath(selectedCrypto) || ''}
                    alt={selectedCrypto}
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                </div>
                
                <h3 className="text-3xl font-bold text-white">{selectedCrypto}</h3>
                
                {/* Direction Indicator */}
                <div className={`flex items-center space-x-3 px-6 py-3 rounded-full ${
                  selectedDirection === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {selectedDirection === 'up' ? (
                    <>
                      <TrendingUp className="w-8 h-8 text-green-400" />
                      <span className="text-green-400 font-bold text-2xl">+50%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-8 h-8 text-red-400" />
                      <span className="text-red-400 font-bold text-2xl">-50%</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedDirection(null)}
                className="py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
              >
                Terug
              </button>
              
              <button
                onClick={() => onSelectCrypto(selectedCrypto, selectedDirection)}
                className="py-4 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <Check className="w-5 h-5" />
                <span>Bevestigen</span>
              </button>
            </div>
          </div>
        )}

        {/* Info Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Een whale heeft de markt beïnvloed! Kies strategisch welke crypto wordt beïnvloed en in welke richting.
          </p>
        </div>
      </div>
    </div>
  )
}
