'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface InsiderForecastProps {
  onClose: () => void
  forecastData: {
    items?: Array<{ symbol: string; percentage: number; direction: string; isMarketEvent: boolean; headline?: string }>
    // Legacy support
    topGainer?: { symbol: string; percentage: number }
    topLoser?: { symbol: string; percentage: number }
  }
}

const CRYPTO_IMAGES: Record<string, string> = {
  DSHP: '/dsheep.png',
  DSHEEP: '/dsheep.png',
  ORX: '/orex.png',
  LNTR: '/lentra.png',
  SIL: '/silica.png',
  REX: '/rex.png',
  GLX: '/glooma.png',
  MARKET_BULL: '/Bull-run.png',
  MARKET_BEAR: '/Beurscrash.png'
}

const DISPLAY_NAME: Record<string, string> = {
  DSHP: 'DIGISHEEP',
  DSHEEP: 'DIGISHEEP',
  ORX: 'OREX',
  LNTR: 'LNTR',
  SIL: 'SILICA',
  REX: 'REX',
  GLX: 'GLOOMA'
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
  DSHP: {
    up: [
      'DigiSheep breekt door weerstandsniveau, investeerders optimistisch',
      'DigiSheep nieuwe oogst succesvol, vraag stijgt',
      'Recordoogst DigiSheep, prijzen stijgen',
      'DigiSheep exportdeal gesloten, koers omhoog',
      'Weersomstandigheden ideaal voor DigiSheep productie',
      'DigiSheep kwaliteit verbeterd, vraag explodeert',
      'Nieuwe landbouwtechnologie verhoogt DigiSheep opbrengst',
      'DigiSheep voorraden krap, prijzen stijgen'
    ],
    down: [
      'DigiSheep verliest momentum, traders nemen winst',
      'Strengere wetgeving raakt DigiSheep sector',
      'Slechte cijfers DigiSheep, beleggers verkopen massaal',
      'Tekort aan grondstoffen remt DigiSheep productie',
      'Droogte treft DigiSheep oogst, koers daalt',
      'Veepest uitbraak bedreigt DigiSheep sector',
      'DigiSheep overproductie leidt tot prijsval',
      'Slechte weersomstandigheden schaden DigiSheep oogst'
    ]
  },
  DSHEEP: {
    up: [
      'DigiSheep breekt door weerstandsniveau, investeerders optimistisch',
      'DigiSheep nieuwe oogst succesvol, vraag stijgt',
      'Recordoogst DigiSheep, prijzen stijgen',
      'DigiSheep exportdeal gesloten, koers omhoog',
      'Weersomstandigheden ideaal voor DigiSheep productie',
      'DigiSheep kwaliteit verbeterd, vraag explodeert',
      'Nieuwe landbouwtechnologie verhoogt DigiSheep opbrengst',
      'DigiSheep voorraden krap, prijzen stijgen'
    ],
    down: [
      'DigiSheep verliest momentum, traders nemen winst',
      'Strengere wetgeving raakt DigiSheep sector',
      'Slechte cijfers DigiSheep, beleggers verkopen massaal',
      'Tekort aan grondstoffen remt DigiSheep productie',
      'Droogte treft DigiSheep oogst, koers daalt',
      'Veepest uitbraak bedreigt DigiSheep sector',
      'DigiSheep overproductie leidt tot prijsval',
      'Slechte weersomstandigheden schaden DigiSheep oogst'
    ]
  },
  ORX: {
    up: [
      'Orex partnership aangekondigd, koers schiet omhoog',
      'Orex nieuwe mijnvondst, goudprijs stijgt',
      'Nieuwe goudader ontdekt in Orex mijn',
      'Orex productie stijgt, winstcijfers overtreffen verwachtingen',
      'Mijnbouwtechnologie doorbraak verhoogt Orex efficiëntie',
      'Orex sluit grote leveringscontract, vraag stijgt',
      'Goudprijs stijgt, Orex profiteert',
      'Orex uitbreiding mijnbouwactiviteiten aangekondigd'
    ],
    down: [
      'Orex CEO treedt af, onzekerheid op de markt',
      'Crisis in mijnbouwsector treft Orex hard',
      'Beleggers verkopen Orex massaal na slechte cijfers',
      'Conflict bedreigt Orex toeleveringsketen',
      'Mijnstaking legt Orex productie stil',
      'Mijnongeluk verstoort Orex operaties',
      'Overstroming in Orex mijn, productie daalt',
      'Orex productiekosten stijgen, winstmarges dalen'
    ]
  },
  LNTR: {
    up: [
      'Lentra nieuwe update succesvol, adoptie stijgt',
      'Lentra ruimtemissie geslaagd, vertrouwen groeit',
      'Lentra raketlancering succesvol, koers stijgt',
      'Lentra sluit groot contract voor satellietlanceringen',
      'Doorbraak in Lentra raketbrandstof technologie',
      'Lentra behaalt mijlpaal in ruimtevaart',
      'Lentra satelliet netwerk uitgebreid, vraag stijgt',
      'Lentra ruimtestation project goedgekeurd'
    ],
    down: [
      'Lentra launch gefaald, investeerders verkopen massaal',
      'Strengere wetgeving voor ruimtevaart raakt Lentra',
      'Technische problemen Lentra, koers zakt in',
      'Crisis in ruimtesector, Lentra verliest waarde',
      'Lentra raket explodeert bij lancering',
      'Tekort aan raketbrandstof vertraagt Lentra missies',
      'Lentra satelliet crasht, koers daalt',
      'Lentra ruimtemissies uitgesteld door technische problemen'
    ]
  },
  SIL: {
    up: [
      'Silica lanceert revolutionaire AI-chip, beleggers enthousiast',
      'Silica sluit mega-deal met techgigant voor chiplevering',
      'Doorbraak in kwantumprocessor, Silica koers explodeert',
      'Silica AI-model verslaat concurrentie, vraag naar chips stijgt',
      'Silica chipproductie verhoogd, winstcijfers stijgen',
      'Nieuwe chipfabriek Silica geopend, capaciteit verdubbeld',
      'Silica technologie doorbraak in halfgeleiders',
      'Silica marktaandeel groeit, concurrentie verliest terrein'
    ],
    down: [
      'Chiptekort raakt Silica productielijn, koers zakt in',
      'Nieuwe restricties op AI-chips van Silica',
      'Silica verliest groot contract aan concurrent',
      'Overhitting datacenter legt Silica fabriek stil, paniek op markt',
      'Silica chipfabriek brand, productie verstoord',
      'Silicium tekort remt Silica productie',
      'Silica AI-verbod in meerdere regio\'s, koers daalt',
      'Silica technologie achterhaald door concurrent'
    ]
  },
  REX: {
    up: [
      'Rex whale activity gedetecteerd, volume stijgt explosief',
      'Rex nieuwe reserves ontdekt, koers schiet omhoog',
      'Nieuwe energiebron ontdekt, Rex profiteert',
      'Rex productie stijgt, winstcijfers overtreffen verwachtingen',
      'Akkoord verhoogt Rex prijzen, koers stijgt',
      'Rex sluit grote leveringscontract',
      'Energievraag stijgt, Rex profiteert',
      'Rex uitbreiding productiecapaciteit aangekondigd'
    ],
    down: [
      'Rex regulatie dreigt, beleggers voorzichtig',
      'Strengere wetgeving fossiele brandstoffen raakt Rex',
      'Conflict verstoort Rex toevoer, paniek op markt',
      'Beleggers verkopen Rex massaal na slechte cijfers',
      'Tekort aan brandstof remt Rex productie',
      'Rex pipeline lek, productie verstoord',
      'Energieprijs crash treft Rex hard',
      'Rex productie stilgelegd door technische problemen'
    ]
  },
  GLX: {
    up: [
      'Glooma listing op grote exchange, vraag stijgt',
      'Glooma doorbraak in mutatie-onderzoek, investeerders enthousiast',
      'Glooma wetenschappelijke ontdekking, koers stijgt',
      'Glooma onderzoeksproject succesvol afgerond',
      'Glooma sluit samenwerkingsverband met universiteiten',
      'Glooma innovatie wint prestigieuze prijs',
      'Glooma financiering verdubbeld, groei versnelt',
      'Glooma patent goedgekeurd, koers explodeert'
    ],
    down: [
      'Glooma security lek ontdekt, paniek op de markt',
      'Crisis in mutation sector treft Glooma',
      'Strengere wetgeving bedreigt Glooma projecten',
      'Tekort aan financiering remt Glooma groei',
      'Glooma onderzoek mislukt, investeerders teleurgesteld',
      'Glooma lab brand vernietigt onderzoeksdata',
      'Glooma wetgeving blokkeert belangrijke projecten',
      'Glooma concurrent steelt marktaandeel'
    ]
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

function NewsItem({ symbol, direction, forcedHeadline }: NewsItemProps & { forcedHeadline?: string }) {
  // Use server headline if provided, otherwise fallback to random client headline
  const [frozenHeadline] = useState(() => {
    if (forcedHeadline) return forcedHeadline
    const headlines = NEWS_HEADLINES[symbol]?.[direction]
    return headlines ? pickRandom(headlines) : symbol
  })
  
  const isMarketEvent = symbol === 'MARKET'
  const displayName = isMarketEvent ? 'HELE MARKT' : (DISPLAY_NAME[symbol] ?? symbol)
  const isUp = direction === 'up'
  
  // Get image source - use bull/bear images for market events
  const imageSrc = isMarketEvent 
    ? (isUp ? CRYPTO_IMAGES.MARKET_BULL : CRYPTO_IMAGES.MARKET_BEAR)
    : CRYPTO_IMAGES[symbol]

  return (
    <div className="flex items-center space-x-4 py-4 border-b border-white/10 last:border-0">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={isMarketEvent ? (isUp ? 'Bull Run' : 'Market Crash') : symbol}
          className="w-16 h-16 object-contain flex-shrink-0"
        />
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-base leading-snug">
          &ldquo;{frozenHeadline}&rdquo;
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
  
  // Support new items array or legacy topGainer/topLoser structure
  const items = forecastData.items || [
    { symbol: forecastData.topGainer!.symbol, percentage: forecastData.topGainer!.percentage, direction: forecastData.topGainer!.percentage > 0 ? 'up' : 'down', isMarketEvent: forecastData.topGainer!.symbol === 'MARKET' },
    { symbol: forecastData.topLoser!.symbol, percentage: forecastData.topLoser!.percentage, direction: forecastData.topLoser!.percentage > 0 ? 'up' : 'down', isMarketEvent: forecastData.topLoser!.symbol === 'MARKET' }
  ]

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

        {/* News items - show 2 or 3 items dynamically */}
        <div className="px-5">
          {items.map((item, index) => (
            <NewsItem 
              key={`${item.symbol}-${index}`}
              symbol={item.symbol} 
              direction={item.direction as 'up' | 'down'}
              forcedHeadline={item.headline || undefined}
            />
          ))}
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
