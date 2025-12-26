'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

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

interface SpinWheelProps {
  cryptos: CryptoCurrency[]
  onClose: () => void
  onWinCrypto: (symbol: string) => void
}

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

export default function SpinWheel({ cryptos, onClose, onWinCrypto }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [wonCrypto, setWonCrypto] = useState<CryptoCurrency | null>(null)
  const wheelRef = useRef<HTMLDivElement>(null)

  const topCryptos = cryptos.slice(0, 6)
  const segmentAngle = 360 / topCryptos.length

  const handleSpin = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setWonCrypto(null)

    // Pick a random winning segment first
    const randomSegment = Math.floor(Math.random() * topCryptos.length)
    const winner = topCryptos[randomSegment]
    
    // Calculate angle to land on that segment
    // Pointer is at top (0°), segments start from top and go clockwise
    const fullRotations = 5 + Math.floor(Math.random() * 4)
    const targetAngle = randomSegment * segmentAngle
    const finalAngle = fullRotations * 360 + targetAngle

    console.log('🎯 Spin Debug:')
    console.log('  Random segment index:', randomSegment)
    console.log('  Winner:', winner.symbol, winner.name)
    console.log('  Target angle:', targetAngle)
    console.log('  Final angle:', finalAngle)

    setRotation(finalAngle)

    // After spin completes, show winner
    setTimeout(() => {
      setWonCrypto(winner)
      setIsSpinning(false)

      // Auto-apply after 2 seconds
      setTimeout(() => {
        onWinCrypto(winner.symbol)
        onClose()
      }, 2000)
    }, 4000) // 4 second spin duration
  }

  // Project-themed gradient colors (darker, more subtle)
  const colors = [
    'from-purple-900/80 via-purple-700/60 to-purple-900/80',
    'from-blue-900/80 via-blue-700/60 to-blue-900/80',
    'from-cyan-900/80 via-cyan-700/60 to-cyan-900/80',
    'from-pink-900/80 via-pink-700/60 to-pink-900/80',
    'from-indigo-900/80 via-indigo-700/60 to-indigo-900/80',
    'from-violet-900/80 via-violet-700/60 to-violet-900/80',
  ]

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-2xl w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
          disabled={isSpinning}
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-white mb-2">🎡 Spin the Wheel!</h2>
          <p className="text-gray-300">Draai het rad en win een crypto!</p>
        </div>

        {/* Wheel Container */}
        <div className="relative w-full aspect-square max-w-md mx-auto mb-8">
          {/* Pointer at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-neon-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
          </div>

          {/* Wheel - perfectly circular with overflow hidden */}
          <div
            ref={wheelRef}
            className="relative w-full h-full rounded-full shadow-2xl transition-transform duration-[4000ms] ease-out overflow-hidden border-4 border-neon-gold/30"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionTimingFunction: isSpinning ? 'cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'ease-out'
            }}
          >
            {/* Wheel segments */}
            {topCryptos.map((crypto, index) => {
              const angle = index * segmentAngle
              const imagePath = getCryptoImagePath(crypto.symbol)
              
              return (
                <div
                  key={crypto.symbol}
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((segmentAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((segmentAngle * Math.PI) / 180)}%)`
                  }}
                >
                  <div className={`w-full h-full bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center`}>
                    <div 
                      className="flex flex-col items-center absolute"
                      style={{ 
                        transform: `rotate(${segmentAngle / 2}deg)`,
                        top: '25%',
                        left: '50%',
                        marginLeft: '-24px'
                      }}
                    >
                      {imagePath ? (
                        <img
                          src={imagePath}
                          alt={crypto.name}
                          className="w-12 h-12 object-contain drop-shadow-lg"
                        />
                      ) : (
                        <span className="text-3xl">{crypto.icon}</span>
                      )}
                      <span className="text-white font-bold text-xs mt-1 drop-shadow-lg">{crypto.symbol}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Center circle */}
            <div className="absolute inset-0 m-auto w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-4 border-neon-gold shadow-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <div className="text-center">
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`px-12 py-4 rounded-xl font-bold text-xl transition-all ${
              isSpinning
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-neon-purple to-neon-pink hover:scale-105 active:scale-95'
            } text-white shadow-lg`}
          >
            {isSpinning ? 'Draaien...' : 'SPIN!'}
          </button>
        </div>

        {/* Winner announcement */}
        {wonCrypto && (
          <div className="mt-6 p-6 bg-gradient-to-r from-neon-gold/20 to-neon-purple/20 border-2 border-neon-gold rounded-xl text-center animate-fadeIn">
            <h3 className="text-2xl font-bold text-neon-gold mb-2">🎉 Gefeliciteerd!</h3>
            <p className="text-white text-lg">
              Je hebt <span className="font-bold text-neon-gold">{wonCrypto.name}</span> gewonnen!
            </p>
            <p className="text-gray-300 text-sm mt-2">Wordt automatisch toegevoegd...</p>
          </div>
        )}
      </div>
    </div>
  )
}
