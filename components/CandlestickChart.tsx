import React, { useId } from 'react'

interface PriceChange {
  percentage: number
  timestamp: number
}

interface CandlestickChartProps {
  priceHistory: PriceChange[]
  maxBars?: number
  currentPercentage?: number
  currentPrice: number // Huidige absolute prijs in EUR
  showStartPoint?: boolean // Toon wit startpunt alleen bij volledige geschiedenis
}

export default function CandlestickChart({ priceHistory, maxBars = 6, currentPercentage = 0, currentPrice, showStartPoint = true }: CandlestickChartProps) {
  // Take last N bars - nu max 6 voor betere duidelijkheid
  const recentHistory = priceHistory.slice(-maxBars)
  
  console.log('📊 CandlestickChart render:', {
    priceHistoryLength: priceHistory.length,
    recentHistoryLength: recentHistory.length,
    recentHistory: recentHistory,
    currentPrice: currentPrice,
    showStartPoint: showStartPoint,
    hasEvents: recentHistory.length > 0
  })
  
  // Show start point even if no events yet
  const hasEvents = recentHistory.length > 0

  // ABSOLUTE PRICES: Work backwards from current price to calculate historical prices
  // Convert percentage changes to absolute EUR values
  const cumulativeHistory = hasEvents ? (() => {
    // Calculate starting price by working backwards from current price
    // If price changed by +5%, then previous price = current / 1.05
    let workingPrice = currentPrice
    const historicalPrices: Array<{percentage: number, price: number, timestamp: number}> = []
    
    // Work backwards through history to calculate each historical price
    for (let i = recentHistory.length - 1; i >= 0; i--) {
      const event = recentHistory[i]
      // Calculate price BEFORE this event
      const priceBeforeEvent = workingPrice / (1 + event.percentage / 100)
      historicalPrices.unshift({
        percentage: event.percentage,
        price: workingPrice, // Price AFTER this event
        timestamp: event.timestamp
      })
      workingPrice = priceBeforeEvent
    }
    
    return historicalPrices
  })() : []
  
  // DYNAMIC SCALING: range gebaseerd op absolute prijzen
  // Calculate starting price (before all events)
  const startingPrice = hasEvents ? (() => {
    let price = currentPrice
    for (let i = recentHistory.length - 1; i >= 0; i--) {
      price = price / (1 + recentHistory[i].percentage / 100)
    }
    return price
  })() : currentPrice
  
  const allValues = hasEvents ? [...cumulativeHistory.map(h => h.price), startingPrice] : [currentPrice]
  const dataMin = Math.min(...allValues)
  const dataMax = Math.max(...allValues)
  
  // Add buffer for better visualization
  const dataRange = dataMax - dataMin
  const buffer = Math.max(dataRange * 0.15, 2) // 15% buffer of minimaal Bloom 2
  
  const fixedMin = dataMin - buffer
  const fixedMax = dataMax + buffer
  const fixedRange = fixedMax - fixedMin
  
  const containerHeight = 48 // Grotere container
  const padding = 3 // Meer padding
  
  // Dynamic spacing: distribute points evenly across full width
  const viewBoxHeight = 64 // Nog grotere hoogte voor betere zichtbaarheid
  const leftPadding = 6 // Kleinere padding zodat chart breder oogt
  const rightPadding = 6 // Kleinere padding zodat chart breder oogt
  const viewBoxWidth = 200 // Fixed width
  
  // Calculate spacing based on number of points to distribute evenly
  // Only include start point in calculation if we're showing it
  const totalPoints = showStartPoint ? cumulativeHistory.length + 1 : cumulativeHistory.length
  const availableWidth = viewBoxWidth - leftPadding - rightPadding
  const spacing = totalPoints > 1 ? availableWidth / (totalPoints - 1) : 0
  
  // Normalize absolute prices to Y coordinates
  const normalizeY = (price: number) => {
    const clamped = Math.max(fixedMin, Math.min(fixedMax, price))
    const normalized = (clamped - fixedMin) / fixedRange
    return viewBoxHeight - padding - (normalized * (viewBoxHeight - 2 * padding))
  }
  
  // Calculate starting point (price before all events)
  const startY = normalizeY(startingPrice)
  
  const startPoint = {
    x: leftPadding,
    y: startY,
    price: startingPrice,
    percentage: 0, // Starting point has no percentage change
    isStartPoint: true
  }
  
  // Calculate points for the line chart - evenly distributed across width
  const eventPoints = cumulativeHistory.map((item, index) => {
    // Distribute evenly across available width
    // Als we geen startpunt tonen, begin bij leftPadding, anders bij index + 1
    const x = showStartPoint ? leftPadding + ((index + 1) * spacing) : leftPadding + (index * spacing)
    const y = normalizeY(item.price)
    return { x, y, price: item.price, percentage: item.percentage, isStartPoint: false }
  })
  
  // Combine start point with event points - alleen als showStartPoint true is
  const points = showStartPoint ? [startPoint, ...eventPoints] : eventPoints
  
  // No 0-line needed for absolute prices - we show the actual price range
  
  // Create angular line path (straight lines between points)
  const createLinePath = () => {
    if (points.length === 0) return ''
    
    let path = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      const curr = points[i]
      // Straight line to next point
      path += ` L ${curr.x} ${curr.y}`
    }
    
    return path
  }
  
  // Create area fill path (line + baseline)
  const createAreaPath = () => {
    if (points.length === 0) return ''
    
    const linePath = createLinePath()
    const lastPoint = points[points.length - 1]
    const firstPoint = points[0]
    
    // Close the path by going to bottom-right, then bottom-left, then back to start
    return `${linePath} L ${lastPoint.x} ${viewBoxHeight} L ${firstPoint.x} ${viewBoxHeight} Z`
  }
  
  // Bolero-style: consistent brand color (neon-gold) regardless of trend
  const lineColor = 'rgb(251, 191, 36)' // neon-gold - matches project theme
  
  const reactId = useId()
  const gradientId = `gradient-${reactId.replace(/:/g, '')}`

  return (
    <div className="h-16 mt-1.5 px-0 relative w-full">
      <svg 
        className="h-full w-full" 
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + (viewBoxHeight - 2 * padding) * (1 - ratio)
          return (
            <line
              key={i}
              x1={leftPadding}
              y1={y}
              x2={viewBoxWidth - rightPadding}
              y2={y}
              stroke="rgba(255,255,255,0.20)"
              strokeWidth="0.5"
            />
          )
        })}
        
        {/* Area fill */}
        <path
          d={createAreaPath()}
          fill={`url(#${gradientId})`}
        />
        
        {/* Line */}
        <path
          d={createLinePath()}
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points - Bolero style: subtle and consistent */}
        {points.map((point, index) => {
          // First point is white (start reference), rest matches line color
          const isFirstPoint = index === 0
          const pointColor = isFirstPoint ? 'rgb(255, 255, 255)' : lineColor
          
          return (
            <g key={index}>
              {/* Outer circle (border) */}
              <circle
                cx={point.x}
                cy={point.y}
                r="2.5"
                fill="rgba(30, 41, 59, 0.9)"
                stroke={pointColor}
                strokeWidth="1.5"
              />
              {/* Inner circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill={pointColor}
              >
                <title>{point.price != null ? (isFirstPoint ? `Start: Bloom ${point.price.toFixed(2)}` : `Bloom ${point.price.toFixed(2)} (${point.percentage >= 0 ? '+' : ''}${point.percentage.toFixed(1)}%)`) : 'Geen data'}</title>
              </circle>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
