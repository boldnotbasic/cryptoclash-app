'use client'

import { useState, useEffect } from 'react'
import { ChartLine, CalendarClock, Zap, Wallet, Trophy, ArrowLeft, Crown, Copy, Check, Coins, DiamondPercent, SlidersHorizontal } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCurrency } from '@/utils/currency'

interface HostSetupProps {
  onStartRoom: (roomId: string, volatility: string, gameDuration: number, startingCash: number) => void
  onBack: () => void
  playerName?: string
  playerAvatar?: string
  lobbyCode?: string
}

export default function HostSetup({ onStartRoom, onBack, playerName, playerAvatar, lobbyCode }: HostSetupProps) {
  const { t, language } = useLanguage()
  const { currency } = useCurrency()
  const { createRoom, room, error, connected, clearError, socket } = useSocket()
  const [roomId, setRoomId] = useState(lobbyCode || '123')
  const [gameDuration, setGameDuration] = useState(1)
  const [volatility, setVolatility] = useState('medium')
  const [startingCash, setStartingCash] = useState(1000)
  const [marketStartMode, setMarketStartMode] = useState<'zero' | 'random'>('zero')
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState(1) // 1: Room ID, 2: Settings
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  const currentYear = new Date().getFullYear()

  // Update roomId when lobbyCode prop changes (async loading from Supabase)
  useEffect(() => {
    if (lobbyCode && lobbyCode !== roomId) {
      console.log('🔄 Updating roomId from lobbyCode:', lobbyCode)
      setRoomId(lobbyCode)
    }
  }, [lobbyCode])

  // Handle successful room creation
  useEffect(() => {
    console.log('🔍 Room state changed:', room)
    if (room && room.hostId) {
      console.log('🏠 Room created/joined successfully, navigating to lobby')
      setIsCreatingRoom(false)
      // Clear any previous errors
      if (error) {
        console.log('🔄 Clearing previous error after successful join')
      }
      onStartRoom(roomId, volatility, gameDuration, startingCash)
    }
  }, [room, roomId, volatility, gameDuration, startingCash, onStartRoom, error])

  // Handle error state
  useEffect(() => {
    if (error) {
      console.error('🔥 Host setup error:', error)
      // Show error for 10 seconds then clear
      const timer = setTimeout(() => {
        clearError()
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // Handle connection status
  useEffect(() => {
    console.log('🔍 Connection status:', connected)
  }, [connected])

  // Generate random lobby ID (disabled - using static 123)
  const generateRoomId = () => {
    setRoomId('123')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleNext = () => {
    if (step === 1) {
      console.log('🔍 Checking if room 123 already has a host...')
      
      // Check if room already exists and has a host
      if (connected && socket) {
        console.log('📤 Requesting room status check...')
        // Emit a check to see if there's already a host
        socket.emit('host:checkRoom', { roomCode: roomId })
        
        // Listen for response
        const handleRoomCheck = (response: { hasHost: boolean, hostName?: string, allowTakeover?: boolean }) => {
          console.log('📥 Room check response:', response)
          
          if (response.hasHost && !response.allowTakeover) {
            console.log(`❌ Room already has real host: ${response.hostName}`)
            // Show error instead of proceeding
            // The error will be set via the socket event
          } else {
            if (response.allowTakeover) {
              console.log(`🔄 Test host found - takeover allowed, proceeding to settings`)
            } else {
              console.log('✅ No host found, proceeding to settings')
            }
            setStep(2)
          }
          
          // Remove listener after use
          socket.off('host:roomCheckResponse', handleRoomCheck)
        }
        
        socket.on('host:roomCheckResponse', handleRoomCheck)
        
        // Fallback timeout
        setTimeout(() => {
          socket.off('host:roomCheckResponse', handleRoomCheck)
          console.log('⏰ Room check timeout, proceeding anyway')
          setStep(2)
        }, 3000)
        
      } else {
        // If not connected, just proceed
        console.log('🔄 Not connected, proceeding to settings')
        setStep(2)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (gameDuration >= 1 && gameDuration <= 10 && roomId) {
      const hostName = playerName || 'Host'
      const hostAvatar = playerAvatar || '👑'
      const finalRoomId = roomId.trim().toUpperCase()
      if (finalRoomId !== roomId) {
        setRoomId(finalRoomId)
      }
      console.log('🏠 Creating room:', finalRoomId, 'with host:', hostName)
      setIsCreatingRoom(true)
      
      if (connected) {
        // Create room via Socket.io - navigation happens in useEffect when room is created
        const settings = { volatility, gameDuration, startingCash, marketStartMode, language }
        createRoom(finalRoomId, hostName, hostAvatar, settings)
        
        // Fallback timeout in case Socket.io doesn't respond
        setTimeout(() => {
          if (isCreatingRoom) {
            console.log('🔄 Socket.io timeout, using fallback navigation')
            setIsCreatingRoom(false)
            onStartRoom(finalRoomId, volatility, gameDuration, startingCash)
          }
        }, 5000)
      } else {
        // Direct navigation if not connected
        console.log('🔄 No Socket.io connection, using direct navigation')
        setTimeout(() => {
          setIsCreatingRoom(false)
          onStartRoom(finalRoomId, volatility, gameDuration, startingCash)
        }, 1000)
      }
    }
  }

  const presetDurations = [
    { years: 1, label: t('hostSetup.year1'), description: t('hostSetup.yearFast') },
    { years: 2, label: t('hostSetup.year2'), description: t('hostSetup.yearMedium') },
    { years: 3, label: t('hostSetup.year3'), description: t('hostSetup.yearLong') },
    { years: 5, label: t('hostSetup.year5'), description: t('hostSetup.yearExtended') }
  ]

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('common.back')}</span>
            </button>
            <div></div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center space-x-3">
              <Crown className="w-8 h-8 text-neon-blue" />
              <span>{t('hostSetup.title')}</span>
            </h1>
            <p className="text-gray-400">{t('hostSetup.configureGame')}</p>

          </div>

          {/* Lobby ID Card */}
          <div className="crypto-card mb-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">{t('hostSetup.yourLobbyId')}</h3>
            
            <div className="bg-dark-bg/50 rounded-lg p-8 mb-6 text-center">
              <div className="text-5xl font-bold text-neon-gold tracking-wider mb-4">
                {roomId}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center space-x-2 bg-neon-turquoise/20 hover:bg-neon-turquoise/30 border border-neon-turquoise/50 text-neon-turquoise font-semibold py-3 px-4 rounded-lg transition-all duration-300"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>{t('common.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>{t('hostSetup.copyId')}</span>
                  </>
                )}
              </button>

              <button
                disabled
                className="flex items-center justify-center space-x-2 bg-gray-600/10 border border-gray-600/30 text-gray-500 font-semibold py-3 px-4 rounded-lg cursor-not-allowed"
              >
                <span>{t('hostSetup.testMode')}</span>
              </button>
            </div>


          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!roomId}
            className="w-full bg-gradient-to-r from-neon-blue to-neon-turquoise text-white font-bold py-4 px-6 rounded-lg shadow-neon-blue transition-all duration-300 hover:shadow-neon-turquoise hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xl"
          >
            <span>{t('hostSetup.nextSettings')}</span>
            <ArrowLeft className="w-6 h-6 rotate-180" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setStep(1)}
            className="p-3 rounded-lg bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-center space-x-3">
            <SlidersHorizontal className="w-7 h-7 text-neon-blue" />
            <h1 className="text-3xl font-bold text-white">
              Spel Instellingen
            </h1>
          </div>

          <div></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Connection Status */}
          <div className="crypto-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{t('hostSetup.serverStatus')}</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className={`text-sm font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? t('common.connected') : t('common.disconnected')}
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 font-semibold text-center">❌ {error}</p>
              {error.includes('bestaat al') && (
                <p className="text-yellow-300 text-sm text-center mt-2">
                  {t('hostSetup.errorRetry')}
                </p>
              )}
              {error.includes('Er is al een host') && (
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-center">
                  <p className="text-yellow-300 text-sm font-semibold">{t('hostSetup.errorAlreadyHostTitle')}</p>
                  <div className="text-yellow-200 text-xs mt-2 space-y-1">
                    <p>• {t('hostSetup.errorBullet1')}</p>
                    <p>• {t('hostSetup.errorBullet2')}</p>
                    <p>• {t('hostSetup.errorBullet3')}</p>
                  </div>
                  <button
                    onClick={onBack}
                    className="mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {t('hostSetup.errorGoPlay')}
                  </button>
                </div>
              )}
              
              {/* Host Takeover Info */}
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded text-center">
                <p className="text-green-300 text-sm font-semibold">{t('hostSetup.hostTakeover')}</p>
                <div className="text-green-200 text-xs mt-2 space-y-1">
                  <p>• {t('hostSetup.hostTakeoverInfo1')}</p>
                  <p>• {t('hostSetup.hostTakeoverInfo2')}</p>
                  <p>• {t('hostSetup.hostTakeoverInfo3')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Lobby ID Display */}
          <div className="crypto-card text-center">
            <h3 className="text-lg font-bold text-white mb-4">{t('hostSetup.lobbyId')}: <span className="text-neon-gold">{roomId}</span></h3>
          </div>

          {/* Market Volatility Selection */}
          <div className="crypto-card">
            <div className="flex items-center space-x-3 mb-6">
              <ChartLine className="w-6 h-6 text-neon-turquoise" />
              <h2 className="text-2xl font-bold text-white">{t('hostSetup.volatility')}</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setVolatility('low')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  volatility === 'low'
                    ? 'border-neon-gold bg-neon-gold/20 text-neon-gold'
                    : 'border-gray-500/50 hover:border-gray-400 text-gray-400 hover:text-gray-300 bg-gray-600/10'
                }`}
              >
                <div className="text-lg font-bold mb-1">{t('hostSetup.volatilityLow')}</div>
                <div className="text-sm opacity-80">+1% / -1%</div>
              </button>
              
              <button
                type="button"
                onClick={() => setVolatility('medium')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  volatility === 'medium'
                    ? 'border-neon-gold bg-neon-gold/20 text-neon-gold'
                    : 'border-gray-500/50 hover:border-gray-400 text-gray-400 hover:text-gray-300 bg-gray-600/10'
                }`}
              >

                <div className="text-lg font-bold mb-1">{t('hostSetup.volatilityMedium')}</div>
                <div className="text-sm opacity-80">+2% / -2%</div>
              </button>
              
              <button
                type="button"
                onClick={() => setVolatility('high')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  volatility === 'high'
                    ? 'border-neon-gold bg-neon-gold/20 text-neon-gold'
                    : 'border-gray-500/50 hover:border-gray-400 text-gray-400 hover:text-gray-300 bg-gray-600/10'
                }`}
              >

                <div className="text-lg font-bold mb-1">{t('hostSetup.volatilityHigh')}</div>
                <div className="text-sm opacity-80">+3% / -3%</div>
              </button>
            </div>
          </div>

          {/* Game Duration Selection */}
          <div className="crypto-card">
            <div className="flex items-center space-x-3 mb-6">
              <CalendarClock className="w-6 h-6 text-neon-turquoise" />
              <h2 className="text-2xl font-bold text-white">{t('hostSetup.gameDuration')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-white font-semibold min-w-[100px]">{t('hostSetup.years')}</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={gameDuration}
                  onChange={(e) => setGameDuration(parseInt(e.target.value))}
                  className="flex-1 p-3 bg-dark-bg border-2 border-neon-turquoise rounded-lg text-white font-bold text-xl focus:border-neon-gold focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presetDurations.map((preset) => (
                  <button
                    key={preset.years}
                    type="button"
                    onClick={() => setGameDuration(preset.years)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      gameDuration === preset.years
                        ? 'border-neon-turquoise bg-neon-turquoise/20 text-neon-turquoise'
                        : 'border-gray-500/50 hover:border-gray-400 text-gray-400 hover:text-gray-300 bg-gray-600/10'
                    }`}
                  >
                    <div className="font-bold text-lg">{preset.label}</div>
                    <div className="text-sm opacity-80">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Market Start Mode Selection */}
          <div className="crypto-card">
            <div className="flex items-center space-x-3 mb-6">
              <DiamondPercent className="w-6 h-6 text-neon-turquoise" />
              <h2 className="text-2xl font-bold text-white">{t('hostSetup.marketStartMode')}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                type="button"
                onClick={() => setMarketStartMode('zero')}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-center ${
                  marketStartMode === 'zero'
                    ? 'border-neon-turquoise bg-neon-turquoise/20 text-neon-turquoise'
                    : 'border-gray-500/50 hover:border-gray-400 text-gray-400 hover:text-gray-300 bg-gray-600/10'
                }`}
              >

                <div className="text-xl font-bold mb-2">{t('hostSetup.zeroStart')}</div>
                <div className="text-sm opacity-80 leading-relaxed">
                  {t('hostSetup.zeroStartDesc')}<br/>
                  <span className="text-xs">{t('hostSetup.zeroStartSub')}</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setMarketStartMode('random')}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-center ${
                  marketStartMode === 'random'
                    ? 'border-neon-purple bg-neon-purple/20 text-neon-purple'
                    : 'border-gray-500/50 hover:border-gray-400 text-gray-400 hover:text-gray-300 bg-gray-600/10'
                }`}
              >
                <div className="text-xl font-bold mb-2">{t('hostSetup.randomStart')}</div>
                <div className="text-sm opacity-80 leading-relaxed">
                  {t('hostSetup.randomStartDesc')}<br/>
                  <span className="text-xs">{t('hostSetup.randomStartSub')}</span>
                </div>
              </button>
            </div>
            
            <div className={`border rounded-lg p-4 ${
              marketStartMode === 'zero' 
                ? 'bg-neon-turquoise/10 border-neon-turquoise/30' 
                : 'bg-neon-purple/10 border-neon-purple/30'
            }`}>
              <p className={`font-semibold text-sm mb-2 ${
                marketStartMode === 'zero' ? 'text-neon-turquoise' : 'text-neon-purple'
              }`}>
                💡 {marketStartMode === 'zero' ? t('hostSetup.zeroStartInfo') : t('hostSetup.randomStartInfo')}
              </p>
              <div className="space-y-1 text-gray-300 text-sm">
                {marketStartMode === 'zero' ? (
                  <>
                    <p>• {t('hostSetup.zeroStartBullet1')}</p>
                    <p>• {t('hostSetup.zeroStartBullet2')}</p>
                    <p>• {t('hostSetup.zeroStartBullet3')}</p>
                  </>
                ) : (
                  <>
                    <p>• {t('hostSetup.randomStartBullet1')}</p>
                    <p>• {t('hostSetup.randomStartBullet2')}</p>
                    <p>• {t('hostSetup.randomStartBullet3')}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Starting Cash Selection */}
          <div className="crypto-card">
            <div className="flex items-center space-x-3 mb-6">
              <Coins className="w-6 h-6 text-neon-turquoise" />
              <h2 className="text-2xl font-bold text-white">{t('hostSetup.startingCash')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-white font-semibold min-w-[100px]">{t('hostSetup.amount')}</label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="100"
                  value={startingCash}
                  onChange={(e) => setStartingCash(parseInt(e.target.value))}
                  className="flex-1 p-3 bg-dark-bg border-2 border-neon-gold rounded-lg text-white font-bold text-xl focus:border-neon-turquoise focus:outline-none"
                />
                <span className="text-neon-gold font-bold text-xl">⚘</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[500, 1000, 2500, 5000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setStartingCash(amount)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      startingCash === amount
                        ? 'border-neon-gold bg-neon-gold/20 text-neon-gold'
                        : 'border-gray-500/50 hover:border-gray-400 text-gray-400 hover:text-gray-300 bg-gray-600/10'
                    }`}
                  >
                    <div className="font-bold text-lg">⚘{amount.toLocaleString()}</div>
                    <div className="text-sm opacity-80">
                      {amount === 500 ? t('hostSetup.cashStarter') : 
                       amount === 1000 ? t('hostSetup.cashStandard') :
                       amount === 2500 ? t('hostSetup.cashComfortable') : t('hostSetup.cashRich')}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="bg-neon-gold/10 border border-neon-gold/30 rounded-lg p-4">
                <p className="text-neon-gold font-semibold text-sm mb-2">{t('hostSetup.cashInfoTitle')}</p>
                <div className="space-y-1 text-gray-300 text-sm">
                  <p>• {t('hostSetup.cashInfo1')}</p>
                  <p>• {t('hostSetup.cashInfo2')}</p>
                  <p>• {t('hostSetup.cashInfo3')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Game Summary */}
          <div className="crypto-card bg-dark-bg/50 border border-neon-blue/40">
            <div className="flex items-center space-x-3 mb-4">
              <Trophy className="w-6 h-6 text-neon-gold" />
              <h3 className="text-xl font-bold text-white">{t('hostSetup.gameSummary')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
              <div>
                <p className="text-gray-400 text-sm">{t('hostSetup.lobbyId')}</p>
                <p className="text-2xl font-bold text-neon-blue">{roomId}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">{t('hostSetup.startYear')}</p>
                <p className="text-2xl font-bold text-neon-turquoise">{currentYear}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">{t('hostSetup.gameDurationLabel')}</p>
                <p className="text-2xl font-bold text-neon-gold">{gameDuration} jaar</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">{t('hostSetup.startingCashLabel')}</p>
                <p className="text-2xl font-bold text-neon-gold">⚘{startingCash.toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">{t('hostSetup.volatilityLabel')}</p>
                <p className="text-2xl font-bold text-neon-purple">
                  {volatility === 'low'
                    ? t('hostSetup.volatilityLowFull')
                    : volatility === 'medium'
                      ? t('hostSetup.volatilityMediumFull')
                      : volatility === 'high'
                        ? t('hostSetup.volatilityHighFull')
                        : t('hostSetup.volatilityMediumFull')}
                </p>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            type="submit"
            disabled={isCreatingRoom}
            className="w-full bg-gradient-to-r from-neon-blue to-neon-turquoise text-white font-bold py-4 px-6 rounded-lg shadow-neon-blue transition-all duration-300 hover:shadow-neon-turquoise hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 text-xl"
          >
            {isCreatingRoom ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('hostSetup.creatingLobby')}</span>
              </>
            ) : !connected ? (
              <>
                <span className="text-yellow-300">{t('hostSetup.offlineMode')}</span>
              </>
            ) : (
              <>
                <Crown className="w-6 h-6" />
                <span>{t('hostSetup.createLobby')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
