'use client'

interface PriceChange {
  percentage: number
  timestamp: number
}

interface DetailChartProps {
  priceHistory: PriceChange[]
  currentPrice: number
  showStartPoint?: boolean
}

export default function DetailChart({ priceHistory, currentPrice, showStartPoint = true }: DetailChartProps) {
  const hasEvents = priceHistory.length > 0

  // Reconstruct absolute prices working backwards from currentPrice
  const chartPoints: Array<{ price: number; percentage: number; index: number }> = []

  if (hasEvents) {
    let workingPrice = currentPrice
    const reversed: Array<{ price: number; percentage: number }> = []

    for (let i = priceHistory.length - 1; i >= 0; i--) {
      const event = priceHistory[i]
      reversed.unshift({ price: workingPrice, percentage: event.percentage })
      workingPrice = workingPrice / (1 + event.percentage / 100)
    }

    const startingPrice = workingPrice

    if (showStartPoint) {
      chartPoints.push({ price: startingPrice, percentage: 0, index: 0 })
    }
    reversed.forEach((p, i) => {
      chartPoints.push({ price: p.price, percentage: p.percentage, index: showStartPoint ? i + 1 : i })
    })
  } else {
    chartPoints.push({ price: currentPrice, percentage: 0, index: 0 })
  }

  // Ensure at least two points so the line is visible
  let displayPoints = chartPoints.slice()
  if (displayPoints.length === 1) {
    const only = displayPoints[0]
    const syntheticStart = { price: only.price * 0.985, percentage: 0, index: 0 }
    displayPoints = [syntheticStart, { ...only, index: 1 }]
  }

  // Y-range calculations robust to flat/empty series
  const prices = displayPoints.map(p => p.price)
  const dataMinRaw = prices.length > 0 ? Math.min(...prices) : currentPrice
  const dataMaxRaw = prices.length > 0 ? Math.max(...prices) : currentPrice
  const dataRangeRaw = dataMaxRaw - dataMinRaw
  const buffer = Math.max(dataRangeRaw * 0.15, Math.max(1, currentPrice * 0.005))
  const yMin = (prices.length ? dataMinRaw : currentPrice) - buffer
  const yMax = (prices.length ? dataMaxRaw : currentPrice) + buffer
  const yRange = Math.max(1e-6, yMax - yMin)

  // SVG viewBox dimensions
  const vW = 1000
  const vH = 600
  const leftPad = 10 // No axis labels in SVG - labels are HTML overlays
  const rightPad = 20
  const topPad = 20
  const bottomPad = 20
  const chartW = vW - leftPad - rightPad
  const chartH = vH - topPad - bottomPad

  const toX = (idx: number) => {
    const total = displayPoints.length
    if (total <= 1) return leftPad + chartW / 2
    return leftPad + (idx / (total - 1)) * chartW
  }

  const toY = (price: number) => {
    // Normalize and clamp to [0,1] to avoid drawing outside the viewBox
    const normRaw = (price - yMin) / yRange
    const norm = Math.max(0, Math.min(1, normRaw))
    return topPad + chartH - norm * chartH
  }

  // Build SVG path
  const lineD = displayPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.index)} ${toY(p.price)}`)
    .join(' ')

  const firstP = displayPoints[0]
  const lastP = displayPoints[displayPoints.length - 1]
  const areaD = displayPoints.length >= 2
    ? `${lineD} L ${toX(lastP.index)} ${topPad + chartH} L ${toX(firstP.index)} ${topPad + chartH} Z`
    : ''

  // Y-axis grid lines at 4 levels
  const gridLevels = 5
  const gridValues = Array.from({ length: gridLevels }, (_, i) =>
    yMin + (yRange / (gridLevels - 1)) * i
  ).reverse()

  const lineColor = 'rgb(251, 191, 36)'
  const gradientId = 'detail-chart-gradient'

  return (
    <div className="relative w-full h-full">
      {/* Y-axis price labels as HTML overlay */}
      <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-4 pointer-events-none z-20" style={{ width: '70px' }}>
        {gridValues.map((val, i) => (
          <div key={i} className="text-xs font-bold text-neon-turquoise leading-none bg-dark-bg/60 px-1 rounded">
            €{val.toFixed(2)}
          </div>
        ))}
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${vW} ${vH}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={{ background: 'rgba(100, 50, 150, 0.1)' }}
      >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {gridValues.map((val, i) => (
            <line
              key={i}
              x1={leftPad}
              y1={toY(val)}
              x2={leftPad + chartW}
              y2={toY(val)}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2"
            />
          ))}

          {/* Area fill */}
          {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

          {/* Line */}
          <path
            d={lineD}
            fill="none"
            stroke={lineColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {displayPoints.map((p, i) => {
            const isFirst = i === 0 && showStartPoint
            const cx = toX(p.index)
            const cy = toY(p.price)
            const dotColor = isFirst ? 'white' : lineColor
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="10" fill="rgba(15,23,42,0.9)" stroke={dotColor} strokeWidth="3" />
                <circle cx={cx} cy={cy} r="5" fill={dotColor} />
                <title>{isFirst ? `Start: €${p.price.toFixed(2)}` : `€${p.price.toFixed(2)} (${p.percentage >= 0 ? '+' : ''}${p.percentage.toFixed(1)}%)`}</title>
              </g>
            )
          })}

          {/* Current price label at last point */}
          {displayPoints.length > 0 && (() => {
            const lp = displayPoints[displayPoints.length - 1]
            const cx = toX(lp.index)
            const cy = toY(lp.price)
            return (
              <g>
                <rect x={cx - 70} y={cy - 28} width={140} height={24} rx="4" fill="rgba(251,191,36,0.15)" stroke={lineColor} strokeWidth="1.5" />
                <text x={cx} y={cy - 11} textAnchor="middle" fill={lineColor} fontSize="16" fontWeight="bold">
                  €{lp.price.toFixed(2)}
                </text>
              </g>
            )
          })()}
        </svg>
    </div>
  )
}
