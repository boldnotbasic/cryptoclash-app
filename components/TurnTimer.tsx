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

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-full transform scale-110" />
      
      {/* Timer container - kleiner gemaakt */}
      <div className={`relative w-36 h-36 ${isWarning ? 'animate-pulse' : ''}`}>
        {/* Progress circle on the outside */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-linear ${
              isWarning ? 'text-red-500' : 'text-neon-purple'
            }`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Timer text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${
            isWarning ? 'text-red-400' : 'text-white'
          }`}>
            {timeLeft}
          </span>
          <span className="text-xs text-gray-400 mt-1">sec</span>
        </div>
      </div>
    </div>
  )
}
