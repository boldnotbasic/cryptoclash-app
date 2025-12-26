'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'

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

  const topCryptos = cryptos.slice(0, 6)
  const segmentAngle = 360 / topCryptos.length

  const handleSpin = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setWonCrypto(null)

    // Pick a random winning segment
    const randomSegment = Math.floor(Math.random() * topCryptos.length)
    const winner = topCryptos[randomSegment]
    
    // Pointer is at TOP (0° in our SVG, which is -90° in standard math)
    // Segments start at 0° (right side in standard math, top in our SVG because we offset by -90)
    // To land in CENTER of segment: rotate wheel so segment center points UP
    const fullRotations = 5 + Math.floor(Math.random() * 4)
    
    // Segment center angle in our coordinate system (starting from top, going clockwise)
    const segmentCenterAngle = randomSegment * segmentAngle + segmentAngle / 2
    
    // We need to rotate the wheel so this angle points to 0° (top/pointer)
    // Negative because wheel rotates clockwise
    const targetRotation = -segmentCenterAngle
    const finalAngle = fullRotations * 360 + targetRotation

    console.log('🎯 Spin Debug:')
    console.log('  Random segment index:', randomSegment)
    console.log('  Winner:', winner.symbol, winner.name)
    console.log('  Segment angle:', segmentAngle)
    console.log('  Segment center angle:', segmentCenterAngle)
    console.log('  Target rotation:', targetRotation)
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
    }, 4000)
  }

  // SVG gradient definitions matching "Spin the Wheel" tile style
  // Tile uses: from-purple-600/20 to-pink-600/20
  const gradients = [
    { id: 'grad1', from: '#7c3aed', via: '#a855f7', to: '#6b21a8' }, // purple gradient
    { id: 'grad2', from: '#3b82f6', via: '#60a5fa', to: '#1e40af' }, // blue gradient
    { id: 'grad3', from: '#06b6d4', via: '#22d3ee', to: '#0e7490' }, // cyan gradient
    { id: 'grad4', from: '#ec4899', via: '#f472b6', to: '#be185d' }, // pink gradient
    { id: 'grad5', from: '#6366f1', via: '#818cf8', to: '#4338ca' }, // indigo gradient
    { id: 'grad6', from: '#8b5cf6', via: '#a78bfa', to: '#6d28d9' }, // violet gradient
  ]

  // Calculate path for each segment
  const getSegmentPath = (index: number) => {
    const startAngle = index * segmentAngle
    const endAngle = startAngle + segmentAngle
    
    const startRad = (startAngle - 90) * Math.PI / 180
    const endRad = (endAngle - 90) * Math.PI / 180
    
    const x1 = 200 + 200 * Math.cos(startRad)
    const y1 = 200 + 200 * Math.sin(startRad)
    const x2 = 200 + 200 * Math.cos(endRad)
    const y2 = 200 + 200 * Math.sin(endRad)
    
    const largeArc = segmentAngle > 180 ? 1 : 0
    
    return `M 200 200 L ${x1} ${y1} A 200 200 0 ${largeArc} 1 ${x2} ${y2} Z`
  }

  // Calculate position for crypto image in segment
  const getImagePosition = (index: number) => {
    // Angle of segment center (starting from top, going clockwise)
    const angle = index * segmentAngle + segmentAngle / 2
    // Convert to radians (subtract 90 to start from top instead of right)
    const rad = (angle - 90) * Math.PI / 180
    const distance = 120 // Distance from center
    
    const x = 200 + distance * Math.cos(rad)
    const y = 200 + distance * Math.sin(rad)
    
    // NO ROTATION - images stay upright so feet naturally point toward center
    // When positioned radially, upright images automatically have feet pointing inward
    
    return { x, y, angle }
  }

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

          {/* SVG Wheel - TRUE CIRCLE */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full transition-transform duration-[4000ms] ease-out drop-shadow-2xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionTimingFunction: isSpinning ? 'cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'ease-out'
            }}
          >
            {/* Define gradients */}
            <defs>
              {gradients.map((grad) => (
                <linearGradient key={grad.id} id={grad.id} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={grad.from} />
                  <stop offset="50%" stopColor={grad.via} />
                  <stop offset="100%" stopColor={grad.to} />
                </linearGradient>
              ))}
            </defs>

            {/* Draw segments */}
            {topCryptos.map((crypto, index) => {
              const path = getSegmentPath(index)
              const gradient = gradients[index % gradients.length]
              
              return (
                <path
                  key={crypto.symbol}
                  d={path}
                  fill={`url(#${gradient.id})`}
                  stroke="#d4af37"
                  strokeWidth="2"
                  opacity="0.95"
                />
              )
            })}

            {/* Outer circle border */}
            <circle
              cx="200"
              cy="200"
              r="200"
              fill="none"
              stroke="#d4af37"
              strokeWidth="4"
              opacity="0.5"
            />

            {/* Place crypto images - upright so feet point toward center */}
            {topCryptos.map((crypto, index) => {
              const pos = getImagePosition(index)
              const imagePath = getCryptoImagePath(crypto.symbol)
              
              return (
                <g key={`img-${crypto.symbol}`}>
                  {imagePath ? (
                    <image
                      href={imagePath}
                      x={pos.x - 30}
                      y={pos.y - 30}
                      width="60"
                      height="60"
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
                    />
                  ) : (
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="40"
                    >
                      {crypto.icon}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
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
