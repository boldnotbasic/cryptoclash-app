'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { CheckCircle, TrendingUp, TrendingDown, Zap, AlertTriangle, Gift } from 'lucide-react'

interface ScanResultProps {
  onClose: () => void
  onApplyEffect: (effect: ScanEffect) => void
  externalScenario?: ScanEffect  // Optional: use external scenario instead of random
}

export interface ScanEffect {
  type: 'boost' | 'crash' | 'event' | 'forecast'
  cryptoSymbol?: string
  percentage?: number
  message: string
  icon: string
  color: string
  topGainer?: { symbol: string; percentage: number }
  topLoser?: { symbol: string; percentage: number }
}

interface ScanScenarioTemplate {
  type: ScanEffect['type']
  cryptoSymbol?: string
  minPercentage?: number
  maxPercentage?: number
  baseMessage: string
  icon: string
  color: string
}

const whaleSymbols = ['DSHEEP', 'NGT', 'LNTR', 'OMLT', 'REX', 'ORLO']

const scanScenarios: ScanScenarioTemplate[] = [
  {
    type: 'boost',
    cryptoSymbol: 'DSHEEP',
    minPercentage: -30,
    maxPercentage: 30,
    baseMessage: 'DigiSheep stijgt {PERCENTAGE}!',
    icon: '🐑',
    color: 'neon-purple'
  },
  {
    type: 'boost',
    cryptoSymbol: 'NGT',
    minPercentage: -30,
    maxPercentage: 30,
    baseMessage: 'Nugget rally {PERCENTAGE}!',
    icon: '🐔',
    color: 'neon-gold'
  },
  {
    type: 'crash',
    cryptoSymbol: 'LNTR',
    minPercentage: -30,
    maxPercentage: 30,
    baseMessage: 'Lentra crash {PERCENTAGE}!',
    icon: '🌟',
    color: 'neon-blue'
  },
  {
    type: 'boost',
    cryptoSymbol: 'OMLT',
    minPercentage: 10,
    maxPercentage: 25,
    baseMessage: 'Omlet beweegt {PERCENTAGE}!',
    icon: '🥚',
    color: 'neon-turquoise'
  },
  {
    type: 'boost',
    cryptoSymbol: 'REX',
    minPercentage: -30,
    maxPercentage: 30,
    baseMessage: 'Rex move {PERCENTAGE}!',
    icon: '💫',
    color: 'neon-purple'
  },
  {
    type: 'crash',
    cryptoSymbol: 'ORLO',
    minPercentage: -30,
    maxPercentage: 30,
    baseMessage: 'Orlo dip {PERCENTAGE}',
    icon: '🎵',
    color: 'neon-gold'
  },
  {
    type: 'event',
    minPercentage: 5,
    maxPercentage: 5,
    baseMessage: 'Bull Run! Alle munten {PERCENTAGE}!',
    icon: '�',
    color: 'neon-gold'
  },
  {
    type: 'event',
    minPercentage: -10,
    maxPercentage: -10,
    baseMessage: 'Market Crash! Alle munten {PERCENTAGE}!',
    icon: '�',
    color: 'red-500'
  },
  {
    type: 'event',
    minPercentage: 50,
    maxPercentage: 50,
    baseMessage: 'Whale Alert! {SYMBOL} {PERCENTAGE}!',
    icon: '🐋',
    color: 'neon-turquoise'
  },
  // Forecast event 3x voor hogere kans (3/12 = 25%)
  {
    type: 'forecast',
    minPercentage: 0,
    maxPercentage: 0,
    baseMessage: 'Market Forecast',
    icon: '🔮',
    color: 'neon-purple'
  },
  {
    type: 'forecast',
    minPercentage: 0,
    maxPercentage: 0,
    baseMessage: 'Market Forecast',
    icon: '🔮',
    color: 'neon-purple'
  },
  {
    type: 'forecast',
    minPercentage: 0,
    maxPercentage: 0,
    baseMessage: 'Market Forecast',
    icon: '🔮',
    color: 'neon-purple'
  }
]

export default function ScanResult({ onClose, onApplyEffect, externalScenario }: ScanResultProps) {
  const [currentScenario, setCurrentScenario] = useState<ScanEffect | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const initializedRef = useRef(false)
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasClosedRef = useRef(false)

  // Simulate next 10 events to calculate top gainer and loser
  const simulateFutureEvents = (numEvents: number = 10): { topGainer: { symbol: string; percentage: number }; topLoser: { symbol: string; percentage: number } } => {
    const cryptoChanges: Record<string, number> = {
      DSHEEP: 0,
      NGT: 0,
      LNTR: 0,
      OMLT: 0,
      REX: 0,
      ORLO: 0
    }

    // Simulate 10 future events
    for (let i = 0; i < numEvents; i++) {
      // Pick random scenario (excluding forecast itself)
      const availableScenarios = scanScenarios.filter(s => s.type !== 'forecast')
      const randomTemplate = availableScenarios[Math.floor(Math.random() * availableScenarios.length)]
      
      // Calculate percentage
      let percentage = 0
      if (typeof randomTemplate.minPercentage === 'number' && typeof randomTemplate.maxPercentage === 'number') {
        const raw = randomTemplate.minPercentage + Math.random() * (randomTemplate.maxPercentage - randomTemplate.minPercentage)
        percentage = Math.round(raw * 10) / 10
      }

      // Apply to crypto(s)
      if (randomTemplate.type === 'event') {
        // Apply to all cryptos
        Object.keys(cryptoChanges).forEach(symbol => {
          cryptoChanges[symbol] += percentage
        })
      } else if (randomTemplate.cryptoSymbol) {
        // Apply to specific crypto
        cryptoChanges[randomTemplate.cryptoSymbol] += percentage
      }
    }

    // Find top gainer and loser
    let topGainer = { symbol: 'DSHEEP', percentage: cryptoChanges.DSHEEP }
    let topLoser = { symbol: 'DSHEEP', percentage: cryptoChanges.DSHEEP }

    Object.entries(cryptoChanges).forEach(([symbol, change]) => {
      if (change > topGainer.percentage) {
        topGainer = { symbol, percentage: change }
      }
      if (change < topLoser.percentage) {
        topLoser = { symbol, percentage: change }
      }
    })

    return { topGainer, topLoser }
  }

  const buildScenarioFromTemplate = (template: ScanScenarioTemplate): ScanEffect => {
    let percentage: number | undefined = undefined
    if (typeof template.minPercentage === 'number' && typeof template.maxPercentage === 'number') {
      const raw = template.minPercentage + Math.random() * (template.maxPercentage - template.minPercentage)
      percentage = Math.round(raw * 10) / 10
    }

    let message = template.baseMessage
    let topGainer: { symbol: string; percentage: number } | undefined
    let topLoser: { symbol: string; percentage: number } | undefined

    // Handle forecast type
    if (template.type === 'forecast') {
      const forecast = simulateFutureEvents(10)
      topGainer = forecast.topGainer
      topLoser = forecast.topLoser
      message = 'Market Forecast'
    } else if (template.type === 'event') {
      // Events blijven hun percentage in de titel tonen
      if (message.includes('{PERCENTAGE}')) {
        message = message
          .replace('{PERCENTAGE}', '')
          .replace(/\s+(!|\?|\.)/g, '$1')
          .replace(/\s{2,}/g, ' ')
          .trim()
      }
    } else {
      // Voor coin-scenario's: geen percentage in de titel en werkwoord normaliseren naar stijgt/daalt
      if (percentage !== undefined) {
        const isPositive = percentage > 0
        // vervang verschillende werkwoorden naar stijgt/daalt
        message = message.replace(/\b(stijgt|daalt|beweegt|rally|crash|move|dip)\b/gi, isPositive ? 'stijgt' : 'daalt')
      }
      // verwijder placeholder en opschonen van extra spaties/teken
      if (message.includes('{PERCENTAGE}')) {
        message = message
          .replace('{PERCENTAGE}', '')
          .replace(/\s+(!|\?|\.)/g, '$1')
          .replace(/\s{2,}/g, ' ')
          .trim()
      }
    }

    let cryptoSymbol = template.cryptoSymbol
    if (message.includes('{SYMBOL}')) {
      if (!cryptoSymbol) {
        cryptoSymbol = whaleSymbols[Math.floor(Math.random() * whaleSymbols.length)]
      }
      message = message.replace('{SYMBOL}', cryptoSymbol)
    }

    return {
      type: template.type,
      cryptoSymbol,
      percentage,
      message,
      icon: template.icon,
      color: template.color,
      topGainer,
      topLoser
    }
  }

  useEffect(() => {
    // React 18 StrictMode runt effects twee keer in dev; zorg dat we
    // maar één keer een scenario kiezen en audio afspelen.
    if (initializedRef.current) return
    initializedRef.current = true
    console.log('ScanResult component mounted')
    
    // Use external scenario if provided, otherwise generate random
    const scenario = externalScenario || (() => {
      const randomTemplate = scanScenarios[Math.floor(Math.random() * scanScenarios.length)]
      return buildScenarioFromTemplate(randomTemplate)
    })()
    
    console.log('Selected scenario:', scenario)
    setCurrentScenario(scenario)

    // Play audio based on effect type (after user interaction)
    const playAudio = async () => {
      try {
        // Bepaal expliciet of dit een stijging (succes-geluid) of daling (fail-geluid) is
        const msg = (scenario.message || '').toLowerCase()
        let isPositive = false

        if (scenario.type === 'forecast') {
          // Forecast is always positive (informative)
          isPositive = true
        } else if (typeof scenario.percentage === 'number') {
          // Percentage bekend: >0 = stijging, <0 = daling
          isPositive = scenario.percentage > 0
        } else {
          // Geen expliciet percentage: leid af uit tekst / event naam
          if (
            msg.includes('bull run') ||
            msg.includes('whale alert') ||
            msg.includes('+') ||
            msg.includes('stijgt') ||
            msg.includes('omhoog')
          ) {
            isPositive = true
          }
          // Market Crash / daalt blijven standaard negatief (isPositive blijft false)
        }

        if (isPositive) {
          // Gebruik jouw eigen succes-geluid uit /public
          const audio = new Audio('/chime_success.wav')
          audio.volume = 0.9
          try {
            await audio.play()
          } catch (err) {
            console.warn('Failed to play success sound', err)
          }
        } else {
          // Gebruik jouw eigen fail-geluid uit /public
          const audio = new Audio('/fail_sound.wav')
          audio.volume = 0.9
          try {
            await audio.play()
          } catch (err) {
            console.warn('Failed to play fail sound', err)
          }
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
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Separate effect for auto-close timer that depends on currentScenario being set
  useEffect(() => {
    if (!currentScenario || hasClosedRef.current) return
    
    console.log('🕒 Starting auto-close timer for scenario:', currentScenario.message)
    
    // Clear any existing timer
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
    }
    
    autoCloseTimerRef.current = setTimeout(() => {
      if (hasClosedRef.current) {
        console.log('⚠️ Already closed, skipping')
        return
      }
      
      console.log('🔥 FORCE CLOSING scan result NOW')
      hasClosedRef.current = true
      setIsVisible(false)
      
      setTimeout(() => {
        console.log('🔥 APPLYING EFFECT and closing')
        onApplyEffect(currentScenario)
        onClose()
      }, 300)
    }, 3100) // 100ms fade-in + 3000ms display time

    // Cleanup: only clear timer on unmount, not on re-render
    return () => {
      console.log('🧹 Component unmounting, clearing timer')
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current)
        autoCloseTimerRef.current = null
      }
    }
  }, [currentScenario])

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

  // Custom images for event-scenario's (Bull Run, Market Crash, Whale Alert)
  // Gebruikt jouw bestaande files in /public:
  //  - /Bull-run.png
  //  - /Beurscrash.png
  //  - /Whala-alert.png
  const getEventImagePath = () => {
    if (currentScenario.type !== 'event') return null
    const msg = currentScenario.message || ''
    if (msg.includes('Bull Run')) return '/Bull-run.png'
    if (msg.includes('Market Crash')) return '/Beurscrash.png'
    if (msg.includes('Whale Alert')) return '/Whala-alert.png'
    return null
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

          {/* Crypto Icon */}
          <div className="mb-6">
            <div className="text-8xl mb-4 flex items-center justify-center">
              {(() => {
                // Special handling for forecast: show crystal ball icon
                if (currentScenario.type === 'forecast') {
                  return <span>{currentScenario.icon}</span>
                }

                // Eerst: custom event image (Bull Run / Market Crash / Whale Alert)
                const eventImage = getEventImagePath()
                if (eventImage) {
                  return (
                    <Image                               
                      src={eventImage}
                      alt={currentScenario.message}
                      width={180}
                      height={180}
                      className="object-contain"
                    />
                  )
                }

                // Anders: normale crypto image op basis van symbool
                const imagePath = getCryptoImagePath(currentScenario.cryptoSymbol)
                if (imagePath) {
                  return (
                    <Image
                      src={imagePath}
                      alt={currentScenario.cryptoSymbol || 'Crypto'}
                      width={180}
                      height={180}
                      className="object-contain"
                    />
                  )
                }

                // Fallback: emoji/icon uit scenario
                return <span>{currentScenario.icon}</span>
              })()}
            </div>
            {currentScenario.cryptoSymbol && currentScenario.type !== 'forecast' && (
              <div className="text-lg text-gray-400 mb-2">{currentScenario.cryptoSymbol}</div>
            )}
          </div>

          {/* Effect Message */}
          <div className="mb-6">
            <h3 className={`text-3xl font-bold ${getTextColor()} mb-2`}>
              {currentScenario.message}
            </h3>
            
            {/* Forecast: Show top gainer and loser */}
            {currentScenario.type === 'forecast' && currentScenario.topGainer && currentScenario.topLoser && (
              <div className="mt-4 space-y-3">
                {/* Top Gainer */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const imagePath = getCryptoImagePath(currentScenario.topGainer!.symbol)
                        return imagePath ? (
                          <Image
                            src={imagePath}
                            alt={currentScenario.topGainer!.symbol}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-2xl">📈</span>
                        )
                      })()}
                      <div className="text-left">
                        <div className="text-white font-bold">{currentScenario.topGainer.symbol}</div>
                        <div className="text-xs text-gray-400">Sterkste Stijger</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-xl font-bold text-green-400">
                        +{currentScenario.topGainer.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Loser */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const imagePath = getCryptoImagePath(currentScenario.topLoser!.symbol)
                        return imagePath ? (
                          <Image
                            src={imagePath}
                            alt={currentScenario.topLoser!.symbol}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-2xl">📉</span>
                        )
                      })()}
                      <div className="text-left">
                        <div className="text-white font-bold">{currentScenario.topLoser.symbol}</div>
                        <div className="text-xs text-gray-400">Sterkste Daler</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <span className="text-xl font-bold text-red-400">
                        {currentScenario.topLoser.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regular percentage display for non-forecast events */}
            {currentScenario.type !== 'forecast' && currentScenario.percentage && (
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
        </div>
      </div>
    </div>
  )
}
