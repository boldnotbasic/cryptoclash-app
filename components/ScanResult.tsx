'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CheckCircle, TrendingUp, TrendingDown, Zap, AlertTriangle, Gift } from 'lucide-react'

interface ScanResultProps {
  onClose: () => void
  onApplyEffect: (effect: ScanEffect) => void
}

export interface ScanEffect {
  type: 'boost' | 'crash' | 'event'
  cryptoSymbol?: string
  percentage?: number
  message: string
  icon: string
  color: string
}

const scanScenarios: ScanEffect[] = [
  {
    type: 'boost',
    cryptoSymbol: 'DSHEEP',
    percentage: 15,
    message: 'DigiSheep stijgt 15%!',
    icon: '🐑',
    color: 'neon-purple'
  },
  {
    type: 'boost',
    cryptoSymbol: 'NGT',
    percentage: 8,
    message: 'Nugget rally +8%!',
    icon: '🐔',
    color: 'neon-gold'
  },
  {
    type: 'crash',
    cryptoSymbol: 'LNTR',
    percentage: -12,
    message: 'Lentra crash -12%!',
    icon: '🌟',
    color: 'neon-blue'
  },
  {
    type: 'boost',
    cryptoSymbol: 'OMLT',
    percentage: 20,
    message: 'Omlet explodeert +20%!',
    icon: '🥚',
    color: 'neon-turquoise'
  },
  {
    type: 'event',
    message: 'Bull Run! Alle munten +5%!',
    icon: '🚀',
    color: 'neon-gold'
  },
  {
    type: 'boost',
    cryptoSymbol: 'REX',
    percentage: 25,
    message: 'Rex breakthrough +25%!',
    icon: '💫',
    color: 'neon-purple'
  },
  {
    type: 'crash',
    cryptoSymbol: 'ORLO',
    percentage: -8,
    message: 'Orlo dip -8%',
    icon: '🎵',
    color: 'neon-gold'
  },
  {
    type: 'event',
    message: 'Market Crash! Alle munten -10%!',
    icon: '📉',
    color: 'red-500'
  },
  {
    type: 'boost',
    cryptoSymbol: 'DSHEEP',
    percentage: 30,
    message: 'DigiSheep moon shot +30%!',
    icon: '🐑',
    color: 'neon-purple'
  },
  {
    type: 'event',
    message: 'Whale Alert! Random munt +50%!',
    icon: '🐋',
    color: 'neon-turquoise'
  }
]

export default function ScanResult({ onClose, onApplyEffect }: ScanResultProps) {
  const [currentScenario, setCurrentScenario] = useState<ScanEffect | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    console.log('ScanResult component mounted')
    // Select random scenario
    const randomScenario = scanScenarios[Math.floor(Math.random() * scanScenarios.length)]
    console.log('Selected scenario:', randomScenario)
    setCurrentScenario(randomScenario)
    
    // Play audio based on effect type (after user interaction)
    const playAudio = async () => {
      try {
        const isPositive = (randomScenario.percentage && randomScenario.percentage > 0) || 
                          randomScenario.message.includes('Bull Run') || 
                          randomScenario.message.includes('stijgt') ||
                          randomScenario.message.includes('+')
        
        if (isPositive) {
          // Success sound - higher pitched beep
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          
          // Resume audio context if suspended (browser autoplay policy)
          if (audioContext.state === 'suspended') {
            await audioContext.resume()
          }
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
        } else {
          // Failure sound - lower pitched descending tone
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          
          // Resume audio context if suspended (browser autoplay policy)
          if (audioContext.state === 'suspended') {
            await audioContext.resume()
          }
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.4)
          oscillator.type = 'sawtooth'
          
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.4)
        }
      } catch (error) {
        console.log('Audio not supported:', error)
      }
    }
    
    // Show animation
    setTimeout(async () => {
      console.log('Setting visible to true')
      setIsVisible(true)
      await playAudio()
    }, 100)
    
    // Auto close after 3 seconds
    const timer = setTimeout(() => {
      console.log('Auto-closing scan result')
      setIsVisible(false)
      setTimeout(() => {
        console.log('Applying effect and closing')
        onApplyEffect(randomScenario)
        onClose()
      }, 300)
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose, onApplyEffect])

  if (!currentScenario) return null

  const getCryptoImagePath = (symbol?: string) => {
    if (!symbol) return null
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

  const getBackgroundColor = () => {
    switch (currentScenario.color) {
      case 'neon-purple': return 'from-purple-600/20 to-purple-800/20'
      case 'neon-blue': return 'from-blue-600/20 to-blue-800/20'
      case 'neon-turquoise': return 'from-cyan-600/20 to-cyan-800/20'
      case 'neon-gold': return 'from-yellow-600/20 to-yellow-800/20'
      case 'red-500': return 'from-red-600/20 to-red-800/20'
      default: return 'from-purple-600/20 to-blue-600/20'
    }
  }

  const getTextColor = () => {
    switch (currentScenario.color) {
      case 'neon-purple': return 'text-neon-purple'
      case 'neon-blue': return 'text-neon-blue'
      case 'neon-turquoise': return 'text-neon-turquoise'
      case 'neon-gold': return 'text-neon-gold'
      case 'red-500': return 'text-red-400'
      default: return 'text-neon-purple'
    }
  }

  const getBorderColor = () => {
    switch (currentScenario.color) {
      case 'neon-purple': return 'border-neon-purple shadow-neon-purple'
      case 'neon-blue': return 'border-neon-blue shadow-neon-blue'
      case 'neon-turquoise': return 'border-neon-turquoise shadow-neon-turquoise'
      case 'neon-gold': return 'border-neon-gold shadow-neon-gold'
      case 'red-500': return 'border-red-500 shadow-red-500'
      default: return 'border-neon-purple shadow-neon-purple'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`transform transition-all duration-500 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        <div className={`crypto-card ${getBorderColor()} bg-gradient-to-br ${getBackgroundColor()} max-w-md w-full text-center p-8`}>
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">Scan Gelukt!</h2>
          </div>

          {/* Crypto Icon */}
          <div className="mb-6">
            <div className="text-8xl mb-4 flex items-center justify-center">
              {(() => {
                const imagePath = getCryptoImagePath(currentScenario.cryptoSymbol)
                if (!imagePath) {
                  return <span>{currentScenario.icon}</span>
                }
                return (
                  <Image
                    src={imagePath}
                    alt={currentScenario.cryptoSymbol || 'Crypto'}
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                )
              })()}
            </div>
            {currentScenario.cryptoSymbol && (
              <div className="text-lg text-gray-400 mb-2">{currentScenario.cryptoSymbol}</div>
            )}
          </div>

          {/* Effect Message */}
          <div className="mb-6">
            <h3 className={`text-3xl font-bold ${getTextColor()} mb-2`}>
              {currentScenario.message}
            </h3>
            
            {currentScenario.percentage && (
              <div className="flex items-center justify-center space-x-2">
                {currentScenario.percentage > 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                )}
                <span className={`text-2xl font-bold ${
                  currentScenario.percentage > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {currentScenario.percentage > 0 ? '+' : ''}{currentScenario.percentage}%
                </span>
              </div>
            )}
          </div>

          {/* Effect Type Badge */}
          <div className="mb-6">
            {currentScenario.type === 'boost' && (
              <div className="inline-flex items-center space-x-2 bg-green-500/20 px-4 py-2 rounded-full">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-semibold">BOOST</span>
              </div>
            )}
            {currentScenario.type === 'crash' && (
              <div className="inline-flex items-center space-x-2 bg-red-500/20 px-4 py-2 rounded-full">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-semibold">CRASH</span>
              </div>
            )}
            {currentScenario.type === 'event' && (
              <div className="inline-flex items-center space-x-2 bg-yellow-500/20 px-4 py-2 rounded-full">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">EVENT</span>
              </div>
            )}
          </div>

          {/* Auto-close indicator */}
          <div className="text-gray-400 text-sm">
            <div className="w-full bg-gray-700 rounded-full h-1 mb-2">
              <div 
                className="bg-neon-gold h-1 rounded-full transition-all duration-5000 ease-linear"
                style={{ width: isVisible ? '0%' : '100%' }}
              ></div>
            </div>
            Wordt automatisch toegepast...
          </div>

          {/* Manual close button */}
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => {
                onApplyEffect(currentScenario)
                onClose()
              }, 300)
            }}
            className="mt-4 text-gray-400 hover:text-white transition-colors text-sm underline"
          >
            Nu toepassen
          </button>
        </div>
      </div>
    </div>
  )
}
