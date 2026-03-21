'use client'

import { useEffect, useState, useRef } from 'react'

interface AnimatedNumberProps {
  value: number
  className?: string
  prefix?: string
  suffix?: string
  decimals?: number
  locale?: string
}

export default function AnimatedNumber({ 
  value, 
  className = '', 
  prefix = '', 
  suffix = '',
  decimals = 2,
  locale = 'nl-NL'
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number | null>(null)
  const startValueRef = useRef(value)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    // Skip animation if value hasn't changed significantly
    if (Math.abs(value - displayValue) < 0.01) {
      return
    }

    setIsAnimating(true)
    startValueRef.current = displayValue
    startTimeRef.current = null

    const duration = 600 // Animation duration in ms
    
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation (easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3)

      const currentValue = startValueRef.current + (value - startValueRef.current) * easeProgress
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
        setIsAnimating(false)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value])

  // Format the number with locale
  const formattedValue = displayValue.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  return (
    <span className={`${className} ${isAnimating ? 'transition-all duration-300' : ''}`}>
      {prefix}{formattedValue}{suffix}
    </span>
  )
}
