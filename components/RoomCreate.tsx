'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, BarChart3, Play, ArrowLeft, RefreshCw, Edit3, Shuffle, QrCode, Share } from 'lucide-react'
import { RoomStorage } from '@/utils/roomStorage'

interface RoomCreateProps {
  onStartRoom: (roomId: string) => void
  onBack: () => void
}

export default function RoomCreate({ onStartRoom, onBack }: RoomCreateProps) {
  const [roomId, setRoomId] = useState('')
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [customRoomId, setCustomRoomId] = useState('')
  const [validationError, setValidationError] = useState('')

  // Generate random room ID on component mount
  useEffect(() => {
    generateRoomId()
  }, [])

  const generateRoomId = () => {
    // Generate a 6-character alphanumeric room ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setRoomId(result)
    setIsManualMode(false)
    setValidationError('')
    setCopied(false)
  }

  const toggleMode = () => {
    if (isManualMode) {
      // Switch to random mode
      setIsManualMode(false)
      generateRoomId()
    } else {
      // Switch to manual mode
      setIsManualMode(true)
      setRoomId('')
      setCustomRoomId('')
      setValidationError('')
    }
    setCopied(false)
  }

  const handleCustomRoomIdChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCustomRoomId(upperValue)
    setRoomId(upperValue)
    setValidationError('')
    setCopied(false)
    
    // Validate room ID
    if (upperValue.length < 3) {
      setValidationError('Lobby ID moet minimaal 3 karakters lang zijn')
    } else if (upperValue.length > 10) {
      setValidationError('Lobby ID mag maximaal 10 karakters lang zijn')
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = roomId
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareRoom = async () => {
    const shareableUrl = RoomStorage.getShareableUrl()
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'CryptoClash Lobby',
          text: `Join mijn CryptoClash lobby met ID: ${roomId}`,
          url: shareableUrl
        })
      } else {
        await navigator.clipboard.writeText(shareableUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to share:', err)
    }
  }

  const handleStartRoom = async () => {
    setIsStarting(true)
    
    try {
      // Register room in local storage
      RoomStorage.addRoom(roomId)
      console.log('Room registered:', roomId)
      
      // Simulate room creation delay
      setTimeout(() => {
        onStartRoom(roomId)
      }, 1000)
    } catch (error) {
      console.error('Error creating room:', error)
      setIsStarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-neon-blue/20 rounded-full">
              <BarChart3 className="w-12 h-12 text-neon-blue" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Market Screen</h1>
          <p className="text-gray-400">Maak een nieuwe lobby aan</p>
        </div>

        {/* Lobby ID Card */}
        <div className="crypto-card mb-6">
          <h3 className="text-lg font-bold text-white mb-4 text-center">Jouw Lobby ID</h3>
          
          {/* Mode Toggle */}
          <div className="flex mb-4 bg-dark-bg/30 rounded-lg p-1">
            <button
              onClick={() => {
                setIsManualMode(false)
                if (isManualMode) {
                  // Generate new random ID when switching from manual to random
                  generateRoomId()
                }
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                !isManualMode 
                  ? 'bg-neon-gold text-dark-bg shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              <span>Random</span>
            </button>
            <button
              onClick={() => {
                setIsManualMode(true)
                setRoomId('')
                setCustomRoomId('')
                setValidationError('')
                setCopied(false)
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                isManualMode 
                  ? 'bg-neon-gold text-dark-bg shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Manueel</span>
            </button>
          </div>

          {/* Room ID Display/Input */}
          {isManualMode ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voer je eigen lobby ID in
              </label>
              <input
                type="text"
                value={customRoomId}
                onChange={(e) => handleCustomRoomIdChange(e.target.value)}
                placeholder="Bijv. MIJNLOBBY"
                className="w-full p-4 bg-dark-bg border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-gold focus:outline-none text-center text-2xl font-bold tracking-wider"
                maxLength={10}
              />
              {validationError && (
                <p className="text-red-400 text-sm mt-2 text-center">{validationError}</p>
              )}
            </div>
          ) : (
            <div className="bg-dark-bg/50 rounded-lg p-6 mb-4 text-center">
              <div className="text-4xl font-bold text-neon-gold tracking-wider mb-2">
                {roomId || 'XXXXXX'}
              </div>
              <p className="text-gray-400 text-sm">Automatisch gegenereerde ID</p>
            </div>
          )}

          {/* Current Lobby ID Display */}
          {roomId && (
            <div className="bg-neon-gold/10 border border-neon-gold/30 rounded-lg p-4 mb-4 text-center">
              <p className="text-neon-gold text-sm font-medium mb-1">Huidige Lobby ID:</p>
              <p className="text-2xl font-bold text-white tracking-wider">{roomId}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={copyToClipboard}
              disabled={!roomId || !!validationError}
              className="flex items-center justify-center space-x-1 bg-neon-turquoise/20 hover:bg-neon-turquoise/30 border border-neon-turquoise/50 text-neon-turquoise font-semibold py-3 px-2 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-xs">Gekopieerd!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-xs">Kopieer</span>
                </>
              )}
            </button>

            <button
              onClick={shareRoom}
              disabled={!roomId || !!validationError}
              className="flex items-center justify-center space-x-1 bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/50 text-neon-purple font-semibold py-3 px-2 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share className="w-4 h-4" />
              <span className="text-xs">Deel Lobby ID</span>
            </button>

            <button
              onClick={isManualMode ? toggleMode : generateRoomId}
              className="flex items-center justify-center space-x-1 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 font-semibold py-3 px-2 rounded-lg transition-all duration-300 hover:scale-105"
            >
              {isManualMode ? (
                <>
                  <Shuffle className="w-4 h-4" />
                  <span className="text-xs">Random</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs">Nieuwe</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="crypto-card mb-6">
          <h3 className="text-lg font-bold text-white mb-3">📋 Instructies</h3>
          <div className="space-y-3 text-gray-300 text-sm">
            <div className="flex items-start space-x-3">
              <span className="text-neon-gold font-bold">1.</span>
              <p>Deel de lobby ID {roomId && <span className="font-bold text-neon-gold">{roomId}</span>} met andere spelers</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-neon-gold font-bold">2.</span>
              <p>Laat spelers de ID invoeren om te joinen</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-neon-gold font-bold">3.</span>
              <p>Klik op "Start Lobby" wanneer iedereen klaar is</p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartRoom}
          disabled={isStarting || !roomId || !!validationError}
          className="w-full bg-gradient-to-r from-neon-blue to-neon-turquoise text-white font-bold py-4 px-6 rounded-lg shadow-neon-blue transition-all duration-300 hover:shadow-neon-turquoise hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 mb-4"
        >
          {isStarting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Lobby starten...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Start Lobby</span>
            </>
          )}
        </button>

        {/* Back Button */}
        <button
          onClick={onBack}
          disabled={isStarting}
          className="w-full py-3 px-6 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug</span>
        </button>

        {/* Tips */}
        <div className="mt-6 p-4 bg-neon-gold/10 border border-neon-gold/30 rounded-lg">
          <h4 className="text-neon-gold font-semibold text-sm mb-2">💡 Tips</h4>
          <div className="space-y-1 text-gray-300 text-xs">
            <p>• Zorg dat alle spelers de ID hebben voordat je start</p>
            <p>• Je kunt een nieuwe ID genereren als de huidige niet werkt</p>
            <p>• Spelers kunnen joinen zolang de lobby nog niet gestart is</p>
          </div>
        </div>
      </div>
    </div>
  )
}
