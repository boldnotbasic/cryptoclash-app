'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'
import { CheckCircle, TrendingUp, TrendingDown, Zap, AlertTriangle, Gift } from 'lucide-react'

interface ScanResultProps {
  onClose: () => void
  onApplyEffect: (effect: ScanEffect) => void
  externalScenario?: ScanEffect  // Optional: use external scenario instead of random
  cryptos?: Array<{symbol: string, name: string, price: number, icon: string}>  // Voor whale alert selectie
  nonForecastDurationMs?: number
  forecastDurationMs?: number
  transitionEase?: string
}

export interface ScanEffect {
  type: 'boost' | 'crash' | 'event' | 'forecast' | 'war' | 'peace'
  cryptoSymbol?: string
  percentage?: number
  message: string
  icon: string
  color: string
  topGainer?: { symbol: string; percentage: number }
  topLoser?: { symbol: string; percentage: number }
  isUndo?: boolean  // Indicates this is an undo/correction action
  headline?: string  // Header text for popup (e.g., "Beurs update" for automatic Bot events)
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

const whaleSymbols = ['DSHP', 'ORX', 'LNTR', 'SIL', 'REX', 'GLX']

// Crypto symbol to full name mapping
const cryptoNames: Record<string, string> = {
  'DSHP': 'DigiSheep',
  'ORX': 'Orex',
  'LNTR': 'Lentra',
  'SIL': 'Silica',
  'REX': 'Rex',
  'GLX': 'Glooma'
}

const scanScenarios: ScanScenarioTemplate[] = [
  {
    type: 'boost',
    cryptoSymbol: 'DSHP',
    minPercentage: -30,
    maxPercentage: 30,
    baseMessage: 'DigiSheep breekt door weerstandsniveau, investeerders optimistisch',
    icon: '🐑',
    color: 'neon-purple'
  },
  {
    type: 'boost',
    cryptoSymbol: 'ORX',
    minPercentage: -30,
    maxPercentage: 30,
    baseMessage: 'Orex partnership aangekondigd, koers schiet omhoog',
    icon: '🐔',
    color: 'neon-gold'
  },
  {
    type: 'crash',
    cryptoSymbol: 'LNTR',
    minPercentage: -30,
    maxPercentage: 30,
    baseMessage: 'Lentra launch gefaald, investeerders verkopen massaal',
    icon: '🌟',
    color: 'neon-blue'
  },
  {
    type: 'boost',
    cryptoSymbol: 'SIL',
    minPercentage: 10,
    maxPercentage: 25,
    baseMessage: 'Silica lanceert revolutionaire AI-chip, beleggers enthousiast',
    icon: '🥚',
    color: 'neon-turquoise'
  },
  {
    type: 'boost',
    cryptoSymbol: 'REX',
    minPercentage: -30,
    maxPercentage: 30,
    baseMessage: 'Rex whale activity gedetecteerd, volume stijgt explosief',
    icon: '💫',
    color: 'neon-purple'
  },
  {
    type: 'crash',
    cryptoSymbol: 'GLX',
    minPercentage: -30,
    maxPercentage: 30,
    baseMessage: 'Glooma security lek ontdekt, paniek op de markt',
    icon: '🎵',
    color: 'neon-gold'
  },
  // Forecast events worden niet via deze template gebruikt - server genereert ze apart
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
  },
  // War and Peace events
  {
    type: 'event',
    minPercentage: 0,
    maxPercentage: 0,
    baseMessage: 'Oorlog uitgebroken! Markt wordt zeer negatief',
    icon: '/oorlog.png',
    color: 'orange-500'
  },
  {
    type: 'event',
    minPercentage: 0,
    maxPercentage: 0,
    baseMessage: 'Vredesakkoord getekend! Markt herstelt zich',
    icon: '/vrede.png',
    color: 'blue-500'
  }
]

export default function EventPopup({ onClose, onApplyEffect, externalScenario, cryptos, nonForecastDurationMs, forecastDurationMs, transitionEase }: ScanResultProps) {
  const { t } = useLanguage()
  const [currentScenario, setCurrentScenario] = useState<ScanEffect | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [progressStarted, setProgressStarted] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(6) // Timer for forecast
  const initializedRef = useRef(false)
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasClosedRef = useRef(false)
  const scenarioIdRef = useRef(0) // Unique ID for each popup instance
  

  // Simulate next 10 events to calculate top gainer and loser
  const simulateFutureEvents = (numEvents: number = 10): { topGainer: { symbol: string; percentage: number }; topLoser: { symbol: string; percentage: number } } => {
    const cryptoChanges: Record<string, number> = {
      DSHP: 0,
      ORX: 0,
      LNTR: 0,
      SIL: 0,
      REX: 0,
      GLX: 0
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
    let topGainer = { symbol: 'DSHP', percentage: cryptoChanges.DSHP }
    let topLoser = { symbol: 'DSHP', percentage: cryptoChanges.DSHP }

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
      // Voor coin-scenario's: gebruik de news headline as-is (geen percentage in de message)
      // Message is already the news headline from baseMessage
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
    // React 18 StrictMode runt effects twee keer in dev; zorg dat we maar één keer initialiseren
    if (initializedRef.current) return
    initializedRef.current = true
    
    // CRITICAL: Reset all state and increment scenario ID for new popup
    scenarioIdRef.current += 1
    const currentScenarioId = scenarioIdRef.current
    console.log(`🆕 New EventPopup instance #${currentScenarioId}`)
    
    // Reset all state
    setIsVisible(false)
    setProgressStarted(false)
    setRemainingSeconds(6)
    hasClosedRef.current = false
    
    // Clear any existing timers from previous popup
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
      autoCloseTimerRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    
    console.log('EventPopup effect triggered')
    console.log('External scenario provided:', externalScenario)
    console.log('🔮 Forecast data check in EventPopup:', {
      type: externalScenario?.type,
      hasTopGainer: !!externalScenario?.topGainer,
      hasTopLoser: !!externalScenario?.topLoser,
      topGainer: externalScenario?.topGainer,
      topLoser: externalScenario?.topLoser
    })
    
    // CRITICAL: Always use externalScenario if provided (for forecast data!)
    // Only generate random if no external scenario
    const scenario = externalScenario || (() => {
      console.log('⚠️ No external scenario - generating random')
      const randomTemplate = scanScenarios[Math.floor(Math.random() * scanScenarios.length)]
      return buildScenarioFromTemplate(randomTemplate)
    })()
    
    console.log('Selected scenario:', scenario)
    console.log('🔮 Final scenario forecast data:', {
      hasTopGainer: !!scenario.topGainer,
      hasTopLoser: !!scenario.topLoser,
      topGainer: scenario.topGainer,
      topLoser: scenario.topLoser
    })
    
    setCurrentScenario(scenario)

    // Show animation
    setTimeout(() => {
      console.log(`Setting visible to true for scenario #${currentScenarioId}`)
      setIsVisible(true)
      // Start progress bar after fade-in completes
      setTimeout(() => {
        setProgressStarted(true)
      }, 500)
    }, 100)
    
    // CRITICAL: Reset initializedRef on unmount so popup works on next mount
    return () => {
      console.log('🧹 EventPopup unmounting - resetting initializedRef')
      initializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Separate effect for auto-close timer that depends on currentScenario being set
  useEffect(() => {
    if (!currentScenario || hasClosedRef.current) return
    
    const currentScenarioId = scenarioIdRef.current
    console.log(`🕒 Starting auto-close timer for scenario #${currentScenarioId}:`, currentScenario.message)
    
    // Clear any existing timers
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
      autoCloseTimerRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    
    // All events: minimum 6 seconds display time
    const defaultNonForecast = 6000
    const defaultForecast = 6000
    const displayTime = currentScenario.type === 'forecast' 
      ? (typeof forecastDurationMs === 'number' ? forecastDurationMs : defaultForecast)
      : (typeof nonForecastDurationMs === 'number' ? nonForecastDurationMs : defaultNonForecast)
    
    // Start countdown for forecast - same total time as other events (6600ms)
    if (currentScenario.type === 'forecast') {
      // Wait for fade-in + delay before starting countdown (600ms)
      setTimeout(() => {
        // Check if this is still the current scenario
        if (scenarioIdRef.current !== currentScenarioId) {
          console.log(`⚠️ Scenario #${currentScenarioId} is outdated, skipping countdown`)
          return
        }
        
        setRemainingSeconds(6)
        let countdownValue = 6
        countdownIntervalRef.current = setInterval(() => {
          // Check if this is still the current scenario
          if (scenarioIdRef.current !== currentScenarioId) {
            console.log(`⚠️ Scenario #${currentScenarioId} is outdated, clearing interval`)
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
              countdownIntervalRef.current = null
            }
            return
          }
          
          countdownValue -= 1
          setRemainingSeconds(countdownValue)
          
          // When countdown reaches 0, close the popup
          if (countdownValue <= 0) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
              countdownIntervalRef.current = null
            }
            
            if (!hasClosedRef.current && scenarioIdRef.current === currentScenarioId) {
              console.log(`🔥 Timer reached 0 - CLOSING forecast popup #${currentScenarioId}`)
              hasClosedRef.current = true
              setIsVisible(false)
              
              setTimeout(() => {
                console.log('🔥 APPLYING EFFECT and closing')
                onApplyEffect(currentScenario)
                onClose()
              }, 300)
            }
          }
        }, 1000)
      }, 600) // 100ms fade-in + 500ms delay
    } else {
      // For non-forecast events, close AFTER progress bar is completely empty
      // 100ms fade-in + 500ms delay + 6000ms progress + 300ms buffer = 6900ms
      autoCloseTimerRef.current = setTimeout(() => {
        // Check if this is still the current scenario
        if (scenarioIdRef.current !== currentScenarioId) {
          console.log(`⚠️ Scenario #${currentScenarioId} is outdated, skipping auto-close`)
          return
        }
        
        if (hasClosedRef.current) {
          console.log('⚠️ Already closed, skipping')
          return
        }
        
        console.log(`🔥 FORCE CLOSING scan result #${currentScenarioId} NOW`)
        hasClosedRef.current = true
        setIsVisible(false)
        
        setTimeout(() => {
          console.log('🔥 APPLYING EFFECT and closing')
          onApplyEffect(currentScenario)
          onClose()
        }, 300)
      }, 6900) // Wait for progress bar to be completely empty
    }

    // Cleanup: only clear timers on unmount, not on re-render
    return () => {
      console.log('🧹 Component unmounting, clearing timers')
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current)
        autoCloseTimerRef.current = null
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [currentScenario])

  if (!currentScenario) return null

  // Normalize legacy data coming from server/client: ORLO -> GLX, Orlo -> Glooma
  const normalizedSymbol = (currentScenario.cryptoSymbol === 'ORLO' ? 'GLX' : currentScenario.cryptoSymbol)
  const normalizedHeadline = typeof (currentScenario as any).headline === 'string'
    ? (currentScenario as any).headline.replace(/\bOrlo\b/g, 'Glooma').replace(/\bORLO\b/g, 'GLX')
    : (currentScenario as any).headline
  const normalizedMessage = typeof currentScenario.message === 'string'
    ? currentScenario.message.replace(/\bOrlo\b/g, 'Glooma').replace(/\bORLO\b/g, 'GLX')
    : currentScenario.message

  const getCryptoImagePath = (symbol?: string) => {
    if (!symbol) return null
    switch (symbol) {
      case 'DSHP': return '/dsheep.png'
      case 'DSHEEP': return '/dsheep.png'
      case 'ORX': return '/orex.png'
      case 'LNTR': return '/lentra.png'
      case 'SIL': return '/silica.png'
      case 'REX': return '/rex.png'
      case 'GLX': return '/glooma.png'
      case 'ORX': return '/orex.png'
      default: return null
    }
  }

  // Custom images for event-scenario's (Bull Run, Bear Market, Whale Alert)
  // Gebruikt jouw bestaande files in /public:
  //  - /Bull-run.png
  //  - /Beurscrash.png
  //  - /Whala-alert.png
  // Bulletproof war/peace detection: check BOTH type AND message content
  const isWarEvent = currentScenario.type === 'war' || 
    currentScenario.message?.includes('Oorlog uitgebroken') || 
    (currentScenario as any).headline?.includes('Oorlog uitgebroken')
  const isPeaceEvent = currentScenario.type === 'peace' || 
    currentScenario.message?.includes('Vredesakkoord getekend') || 
    (currentScenario as any).headline?.includes('Vredesakkoord getekend')

  const getEventImagePath = () => {
    if (isWarEvent) return '/oorlog.png'
    if (isPeaceEvent) return '/vrede.png'
    if (currentScenario.type === 'forecast') return '/forecast.png'
    if (currentScenario.type !== 'event') return null
    const msg = currentScenario.message || ''
    if (msg.includes('Bull Run')) return '/Bull-run.png'
    if (msg.includes('Bear Market') || msg.includes('Market Crash')) return '/Beurscrash.png'
    if (msg.includes('Whale Alert')) return '/Whala-alert.png'
    return null
  }

  const getBackgroundColor = () => {
    // War/Peace override: always use correct colors
    if (isWarEvent) return 'from-red-600/20 to-red-800/20'
    if (isPeaceEvent) return 'from-green-600/20 to-green-800/20'
    
    // Use percentage to determine color: green for positive, red for negative
    if (currentScenario.percentage !== undefined && currentScenario.percentage !== null) {
      if (currentScenario.percentage > 0) {
        return 'from-green-600/20 to-green-800/20'
      } else if (currentScenario.percentage < 0) {
        return 'from-red-600/20 to-red-800/20'
      }
    }
    
    // Fallback to scenario color for events without percentage
    switch (currentScenario.color) {
      case 'neon-purple': return 'from-purple-600/20 to-purple-800/20'
      case 'neon-blue': return 'from-blue-600/20 to-blue-800/20'
      case 'neon-turquoise': return 'from-cyan-600/20 to-cyan-800/20'
      case 'neon-gold': return 'from-yellow-600/20 to-yellow-800/20'
      case 'red-500': return 'from-red-600/20 to-red-800/20'
      case 'green-500': return 'from-green-600/20 to-green-800/20'
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
    // War/Peace override: always use correct colors
    if (isWarEvent) return 'border-red-500 shadow-red-500'
    if (isPeaceEvent) return 'border-green-500 shadow-green-500'
    
    // Use percentage to determine color: green for positive, red for negative
    if (currentScenario.percentage !== undefined && currentScenario.percentage !== null) {
      if (currentScenario.percentage > 0) {
        return 'border-green-500 shadow-green-500'
      } else if (currentScenario.percentage < 0) {
        return 'border-red-500 shadow-red-500'
      }
    }
    
    // Fallback to scenario color for events without percentage
    switch (currentScenario.color) {
      case 'neon-purple': return 'border-neon-purple shadow-neon-purple'
      case 'neon-blue': return 'border-neon-blue shadow-neon-blue'
      case 'neon-turquoise': return 'border-neon-turquoise shadow-neon-turquoise'
      case 'neon-gold': return 'border-neon-gold shadow-neon-gold'
      case 'red-500': return 'border-red-500 shadow-red-500'
      case 'green-500': return 'border-green-500 shadow-green-500'
      default: return 'border-neon-purple shadow-neon-purple'
    }
  }

  // Compute progress duration and easing for progress bar and transitions
  const defaultNonForecast = 6000
  const defaultForecast = 6000
  const progressMs = currentScenario.type === 'forecast'
    ? (typeof forecastDurationMs === 'number' ? forecastDurationMs : defaultForecast)
    : (typeof nonForecastDurationMs === 'number' ? nonForecastDurationMs : defaultNonForecast)

  return (
    <div 
      className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >     
      <div 
        className={`transform transition-all duration-500 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`crypto-card ${getBorderColor()} bg-gradient-to-br ${getBackgroundColor()} w-96 text-center p-8 relative`}>

          {/* CORRECTIE Header - alleen tonen bij undo acties */}
          {currentScenario.isUndo && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500/90 px-6 py-2 rounded-full border-2 border-orange-400 shadow-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="text-white font-bold text-sm tracking-wider">CORRECTIE</span>
              </div>
            </div>
          )}
          
          {/* BEURS UPDATE Header - toon bij automatische Bot events */}
          {!currentScenario.isUndo && (currentScenario as any).headline === 'Beurs update' && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500/90 px-6 py-2 rounded-full border-2 border-purple-400 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm tracking-wider">MARKT UPDATE</span>
              </div>
            </div>
          )}

          {/* Crypto Icon */}
          <div className="mb-6">
            <div className="text-8xl mb-4 flex items-center justify-center">
              {(() => {
                // Eerst: custom event image (Bull Run / Market Crash / Whale Alert / War / Peace / Forecast)
                const eventImage = getEventImagePath()
                if (eventImage) {
                  return (
                    <Image                               
                      src={eventImage}
                      alt={currentScenario.message}
                      width={180}
                      height={180}
                      className="object-contain"
                      priority
                      quality={85}
                    />
                  )
                }

                // Anders: normale crypto image op basis van symbool
                const imagePath = getCryptoImagePath(normalizedSymbol)
                if (imagePath) {
                  return (
                    <Image
                      src={imagePath}
                      alt={normalizedSymbol || 'Crypto'}
                      width={180}
                      height={180}
                      className="object-contain"
                      priority
                      quality={85}
                    />
                  )
                }

                // Fallback: emoji/icon uit scenario
                return <span>{currentScenario.icon}</span>
              })()}
            </div>
            {normalizedSymbol && currentScenario.type !== 'forecast' && (
              <div className="text-lg text-gray-400 mb-2">{normalizedSymbol}</div>
            )}
          </div>

          {/* News Description - Show for non-forecast crypto events */}
          {currentScenario.type !== 'forecast' && currentScenario.type !== 'event' && !isWarEvent && !isPeaceEvent && (
            <div className="mb-6 px-2">
              <p className="text-sm text-white font-semibold leading-relaxed break-words">
                {(normalizedHeadline as any) === 'Beurs update' ? (
                  <span className="text-gray-400"></span>
                ) : normalizedHeadline && normalizedHeadline !== 'Beurs update' ? (
                  <>&ldquo;{normalizedHeadline}&rdquo;</>
                ) : (
                  <>&ldquo;{normalizedMessage}&rdquo;</>
                )}
              </p>
            </div>
          )}

          {/* Effect Message - Show for Forecast, Market-wide events, War and Peace */}
          <div className="mb-6">
            {/* Show message for forecast, market-wide events, war and peace */}
            {(currentScenario.type === 'forecast' || currentScenario.type === 'event' || isWarEvent || isPeaceEvent) && (
              <div className="flex items-center justify-center">
                <h3 className={`text-3xl font-bold uppercase ${
                  isWarEvent
                    ? 'text-red-400'
                    : isPeaceEvent
                      ? 'text-green-400'
                      : currentScenario.message.includes('Bear Market') || 
                        currentScenario.message.includes('Market Crash')
                          ? 'text-white'
                          : currentScenario.message.includes('Bull Run')
                            ? 'text-white'
                            : getTextColor()
                }`}>
                  {isWarEvent ? 'OORLOG UITGEBROKEN' :
                   isPeaceEvent ? 'VREDESAKKOORD GETEKEND' :
                   normalizedMessage.includes('Bull Run') ? 'Bull Run' : 
                   normalizedMessage.includes('Bear Market') ? 'Bear Market' :
                   normalizedMessage.includes('Market Crash') ? 'Bear Market' :
                   normalizedMessage}
                </h3>
              </div>
            )}
            
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
                            loading="lazy"
                            quality={80}
                          />
                        ) : (
                          <span className="text-2xl">📈</span>
                        )
                      })()}
                      <div className="text-left">
                        <div className="text-white font-bold">{cryptoNames[currentScenario.topGainer.symbol] || currentScenario.topGainer.symbol}</div>
                        <div className="text-xs text-gray-400">{t('events.upcomingGainer')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-xl font-bold text-green-400">
                        {currentScenario.topGainer.percentage > 0 ? '+' : ''}{currentScenario.topGainer.percentage.toFixed(1)}%
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
                            loading="lazy"
                            quality={80}
                          />
                        ) : (
                          <span className="text-2xl">📉</span>
                        )
                      })()}
                      <div className="text-left">
                        <div className="text-white font-bold">{cryptoNames[currentScenario.topLoser.symbol] || currentScenario.topLoser.symbol}</div>
                        <div className="text-xs text-gray-400">{t('events.upcomingLoser')}</div>
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

            {/* Regular percentage display for non-forecast events - EXCLUDE whale alerts, war, and peace */}
            {currentScenario.type !== 'forecast' && !isWarEvent && !isPeaceEvent && !!currentScenario.percentage && !currentScenario.message.includes('Whale Alert') && (
              <div className="flex flex-col items-center justify-center mt-2">
                <div className="flex items-center space-x-3">
                  {currentScenario.percentage > 0 ? (
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  )}
                  <span className={`text-4xl font-bold ${
                    currentScenario.percentage > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {currentScenario.percentage > 0 ? '+' : ''}{currentScenario.percentage}%
                  </span>
                </div>
                {/* Show "Alle munten" for Bull Run and Bear Market */}
                {(currentScenario.message.includes('Bull Run') || currentScenario.message.includes('Bear Market') || currentScenario.message.includes('Market Crash')) && (
                  <div className="text-lg text-gray-300 mt-2">{t('events.allCoins')}</div>
                )}
              </div>
            )}
          </div>



          {/* Auto-close indicator with timer */}
          {(
            <div className="w-full flex items-center gap-3">
              {/* Timer for forecast - positioned next to progress bar */}
              {currentScenario.type === 'forecast' && (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neon-purple/20 border-2 border-neon-purple flex-shrink-0">
                  <span className="text-lg font-bold text-neon-purple">{remainingSeconds}</span>
                </div>
              )}
              
              {/* Progress bar */}
              <div className="flex-1">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-neon-gold h-1 rounded-full"
                    style={{
                      width: progressStarted ? '0%' : '100%',
                      transition: progressStarted ? `width ${progressMs}ms ease-out` : 'none'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
