"use client"

import { useEffect, useState, useRef } from 'react'

interface TurnTimerProps {
  isMyTurn: boolean
  onTimeExpired: () => void
  turnDuration?: number // in seconds, default 60
  gameStartTime?: number // timestamp when game started
  onTimeUpdate?: (timeLeft: number) => void // callback to share time with parent
}

export default function TurnTimer({ 
  isMyTurn, 
  onTimeExpired,
  turnDuration = 60,
  gameStartTime,
  onTimeUpdate
}: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(turnDuration)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    // Reset timer when turn changes to MY turn
    if (isMyTurn) {
      console.log('⏰ Timer reset - MY turn started!')
      setTimeLeft(turnDuration)
      setIsExpired(false)
    }
  }, [isMyTurn, turnDuration])

  useEffect(() => {
    if (!isMyTurn || isExpired) return

    console.log('⏰ Starting timer interval')
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1
        console.log(`⏰ Timer tick: ${newTime}s remaining`)
        
        // Notify parent of time update
        if (onTimeUpdate) {
          onTimeUpdate(newTime)
        }
        
        if (newTime <= 0) {
          console.log('⏰ ========== TIMER EXPIRED ==========')
          console.log('⏰ Calling onTimeExpired callback...')
          setIsExpired(true)
          onTimeExpired()
          console.log('⏰ onTimeExpired callback completed')
          console.log('⏰ ====================================')
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => {
      console.log('⏰ Cleaning up timer interval')
      clearInterval(interval)
    }
  }, [isMyTurn, isExpired, onTimeExpired, onTimeUpdate])

  // Don't show timer if it's not my turn
  if (!isMyTurn) return null

  const percentage = (timeLeft / turnDuration) * 100
  const isWarning = timeLeft <= 10
  const radius = 64 // Increased to reach inner edge (72 - 8 strokeWidth = 64)
  const circumference = 2 * Math.PI * radius
  // Reversed: start from full circle and decrease
  const strokeDashoffset = circumference * (1 - percentage / 100)

  const smallRadius = 40
  const smallCircumference = 2 * Math.PI * smallRadius
  const smallStrokeDashoffset = smallCircumference * (1 - percentage / 100)

  return (
    <div className="fixed left-2 sm:left-6 top-1/2 transform -translate-y-1/2 z-30">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-full transform scale-110" />
      
      {/* Timer container - responsive size */}
      <div className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 ${isWarning ? 'animate-pulse' : ''}`}>
        {/* Progress circle on the outside */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r={smallRadius}
            stroke="currentColor"
            strokeWidth="5"
            fill="none"
            strokeDasharray={smallCircumference}
            strokeDashoffset={smallStrokeDashoffset}
            className={`transition-all duration-1000 ease-linear ${
              isWarning ? 'text-red-500' : 'text-neon-purple'
            }`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Timer text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl sm:text-2xl md:text-3xl font-bold ${
            isWarning ? 'text-red-400' : 'text-white'
          }`}>
            {timeLeft}
          </span>
          <span className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 uppercase tracking-wide">sec</span>
        </div>
      </div>
    </div>
  )
}
