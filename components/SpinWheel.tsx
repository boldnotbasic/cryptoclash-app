'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

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
  onWinCash?: () => void
  onWinGoldHen?: () => void
}

type PrizeType = 'crypto' | 'cash' | 'goldhen'
interface Prize {
  type: PrizeType
  label: string
  symbol?: string
  imagePath: string | null
  icon?: string
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

export default function SpinWheel({ cryptos, onClose, onWinCrypto, onWinCash, onWinGoldHen }: SpinWheelProps) {
  const { t } = useLanguage()
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [wonPrize, setWonPrize] = useState<Prize | null>(null)

  // Build unified prizes array: 6 cryptos + cash + goudhaantje = 8 segments
  const topCryptos = cryptos.slice(0, 6)
  const prizes: Prize[] = [
    ...topCryptos.map(c => ({
      type: 'crypto' as PrizeType,
      label: c.name,
      symbol: c.symbol,
      imagePath: getCryptoImagePath(c.symbol),
      icon: c.icon
    })),
    { type: 'cash' as PrizeType, label: '⚘500 Cash', imagePath: '/wincash.png' },
    { type: 'goldhen' as PrizeType, label: '⚘1000 Goudhaantje', imagePath: '/goudhaantje.png' },
  ]

  const segmentAngle = 360 / prizes.length

  const handleSpin = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setWonPrize(null)

    const randomSegment = Math.floor(Math.random() * prizes.length)
    const winner = prizes[randomSegment]

    const fullRotations = 5 + Math.floor(Math.random() * 4)
    const segmentCenterAngle = randomSegment * segmentAngle + segmentAngle / 2
    const targetRotation = -segmentCenterAngle
    const finalAngle = fullRotations * 360 + targetRotation

    setRotation(finalAngle)

    setTimeout(() => {
      setWonPrize(winner)
      setIsSpinning(false)

      setTimeout(() => {
        if (winner.type === 'crypto' && winner.symbol) {
          onWinCrypto(winner.symbol)
        } else if (winner.type === 'cash') {
          onWinCash?.()
        } else if (winner.type === 'goldhen') {
          onWinGoldHen?.()
        }
        onClose()
      }, 2000)
    }, 4000)
  }

  const segmentColors = [
    '#581c87', '#4c1d95', '#581c87', '#4c1d95',
    '#581c87', '#4c1d95', '#1e3a5f', '#7c2d12',
  ]

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

  const getImagePosition = (index: number) => {
    const angle = index * segmentAngle + segmentAngle / 2
    const rad = (angle - 90) * Math.PI / 180
    const distance = 120
    const x = 200 + distance * Math.cos(rad)
    const y = 200 + distance * Math.sin(rad)
    const imageRotation = angle + 180
    return { x, y, imageRotation }
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
          <h2 className="text-4xl font-bold text-white mb-2">🎡 {t('spinWheel.title')}</h2>
          <p className="text-gray-300">{t('spinWheel.subtitle')}</p>
        </div>

        {/* Wheel Container */}
        <div className="relative w-full aspect-square max-w-md mx-auto mb-8">
          {/* Pointer at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-neon-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
          </div>

          {/* SVG Wheel */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full transition-transform duration-[4000ms] ease-out drop-shadow-2xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionTimingFunction: isSpinning ? 'cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'ease-out'
            }}
          >
            {prizes.map((prize, index) => (
              <path
                key={index}
                d={getSegmentPath(index)}
                fill={segmentColors[index % segmentColors.length]}
                stroke="#d4af37"
                strokeWidth="2"
                opacity="0.95"
              />
            ))}

            <circle cx="200" cy="200" r="200" fill="none" stroke="#d4af37" strokeWidth="4" opacity="0.5" />

            {prizes.map((prize, index) => {
              const pos = getImagePosition(index)
              return (
                <g key={`img-${index}`} transform={`rotate(${pos.imageRotation} ${pos.x} ${pos.y})`}>
                  {prize.imagePath ? (
                    <image
                      href={prize.imagePath}
                      x={pos.x - 28}
                      y={pos.y - 28}
                      width="56"
                      height="56"
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
                    />
                  ) : (
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="36">
                      {prize.icon}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Spin Button */}
        <div className="w-full">
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`w-full px-12 py-4 rounded-xl font-bold text-xl transition-all ${
              isSpinning
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-neon-purple to-neon-pink hover:scale-105 active:scale-95'
            } text-white shadow-lg`}
          >
            {isSpinning ? t('spinWheel.spinning') : t('spinWheel.spin')}
          </button>
        </div>

        {/* Winner announcement */}
        {wonPrize && (
          <div className="mt-6 p-6 bg-gradient-to-r from-neon-gold/20 to-neon-purple/20 border-2 border-neon-gold rounded-xl text-center animate-fadeIn">
            <h3 className="text-2xl font-bold text-neon-gold mb-2">🎉 {t('spinWheel.congratulations')}</h3>
            <p className="text-white text-lg">
              {t('spinWheel.youWon')} <span className="font-bold text-neon-gold">{wonPrize.label}</span>!
            </p>
            <p className="text-gray-300 text-sm mt-2">{t('spinWheel.autoAdding')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
