'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface InsiderForecastProps {
  onClose: () => void
  forecastData: {
    topGainer: { symbol: string; percentage: number }
    topLoser: { symbol: string; percentage: number }
  }
}

const CRYPTO_IMAGES: Record<string, string> = {
  DSHEEP: '/dsheep.png',
  NGT: '/Nugget.png',
  LNTR: '/lentra.png',
  OMLT: '/omlt.png',
  REX: '/rex.png',
  ORLO: '/orlo.png'
}

const DISPLAY_NAME: Record<string, string> = {
  DSHEEP: 'DIGISHEEP',
  NGT: 'NUGGET',
  LNTR: 'LNTR',
  OMLT: 'OMELET',
  REX: 'REX',
  ORLO: 'ORLO'
}

const MARKET_CRASH_HEADLINES = [
  'Er dreigt een oorlog aan te komen',
  'Door schaarste in grondstoffen dreigen moeilijke tijden',
  'Investeerders verkopen massaal hun aandelen',
  'Nieuwe regelgeving zorgt voor onzekerheid'
]

const BULL_RUN_HEADLINES = [
  'Oorlog lijkt bijna achter de rug',
  'Investeerders stappen massaal in',
  'Crypto wordt officieel geaccepteerd als betaalmiddel'
]

const NEWS_HEADLINES: Record<string, { up: string[]; down: string[] }> = {
  DSHEEP: {
    up: ['Wolproductie explodeert wereldwijd'],
    down: ['Mysterieziekte treft kuddes']
  },
  REX: {
    up: ['Rex CEO koopt massaal eigen tokens'],
    down: ['Rex mining farm stilgelegd door hack']
  },
  ORLO: {
    up: ['Orlo ontdekt nieuwe planeet vol resources'],
    down: ['Signaal van Orlo vloot plots verdwenen']
  },
  LNTR: {
    up: ['Sterke kwartaalcijfers voor Lentra'],
    down: ['Lentra launch mislukt na technische fout']
  },
  NGT: {
    up: ['Goudprijs stijgt naar recordhoogte'],
    down: ['Nieuwe goudvoorraad ontdekt \u2013 aanbod explodeert']
  },
  OMLT: {
    up: ['Eierprijzen schieten omhoog door schaarste'],
    down: ['Massaproductie eieren drukt marktprijs']
  },
  MARKET: {
    up: BULL_RUN_HEADLINES,
    down: MARKET_CRASH_HEADLINES
  }
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface NewsItemProps {
  symbol: string
  direction: 'up' | 'down'
}

function NewsItem({ symbol, direction }: NewsItemProps) {
  const headlines = NEWS_HEADLINES[symbol]?.[direction]
  const headline = headlines ? pickRandom(headlines) : symbol
  const isMarketEvent = symbol === 'MARKET'
  const displayName = isMarketEvent ? 'HELE MARKT' : (DISPLAY_NAME[symbol] ?? symbol)
  const imageSrc = isMarketEvent ? null : CRYPTO_IMAGES[symbol]
  const isUp = direction === 'up'

  return (
    <div className="flex items-center space-x-4 py-4 border-b border-white/10 last:border-0">
      {isMarketEvent ? (
        <div className={`w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-xl ${isUp ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <span className="text-4xl">{isUp ? '📈' : '📉'}</span>
        </div>
      ) : imageSrc ? (
        <img
          src={imageSrc}
          alt={symbol}
          className="w-16 h-16 object-contain flex-shrink-0"
        />
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-base leading-snug">
          &ldquo;{headline}&rdquo;
        </p>
        <p className={`text-sm font-bold mt-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {displayName} {isUp ? 'stijging' : 'daling'} verwacht
        </p>
      </div>
    </div>
  )
}

export default function InsiderForecast({ onClose, forecastData }: InsiderForecastProps) {
  const [progress, setProgress] = useState(100)
  const onCloseRef = useRef(onClose)

  // Keep ref updated
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    let counter = 80 // 80 steps of 0.1 second = 8 seconds
    
    const timer = setInterval(() => {
      counter--
      const newProgress = (counter / 80) * 100
      setProgress(newProgress)
      
      if (counter <= 0) {
        clearInterval(timer)
        onCloseRef.current()
      }
    }, 100)
    
    return () => clearInterval(timer)
  }, []) // Empty deps - stable

  const timeLeft = Math.max(1, Math.ceil((progress / 100) * 8))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gradient-to-br from-dark-bg via-purple-900/20 to-dark-bg rounded-2xl border-2 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.4)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600/20 to-violet-600/20 border-b border-purple-500/30 px-5 py-4">
          <h2 className="text-lg font-bold text-white">🕵️ Insider info</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* News items */}
        <div className="px-5">
          <NewsItem symbol={forecastData.topGainer.symbol} direction="up" />
          <NewsItem symbol={forecastData.topLoser.symbol} direction="down" />
        </div>

        {/* Progress bar - orange and centered (not full width) */}
        <div className="mx-8 mb-2">
          <div className="h-2 bg-gray-800/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="text-purple-400 text-xs text-center py-2">
          ⏱️ Sluit automatisch over {timeLeft} seconden
        </p>

      </div>
    </div>
  )
}
