'use client'

import { useState, useEffect } from 'react'
import { Clock, Play, TrendingUp, ArrowLeft, Crown, Copy, Check } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface HostSetupProps {
  onStartRoom: (roomId: string, volatility: string, gameDuration: number, startingCash: number) => void
  onBack: () => void
  playerName?: string
  playerAvatar?: string
}

export default function HostSetup({ onStartRoom, onBack, playerName, playerAvatar }: HostSetupProps) {
  const { createRoom, room, error, connected, clearError, socket } = useSocket()
  const [roomId, setRoomId] = useState('123')
  const [gameDuration, setGameDuration] = useState(1)
  const [volatility, setVolatility] = useState('medium')
  const [startingCash, setStartingCash] = useState(1000)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState(1) // 1: Room ID, 2: Settings
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  const currentYear = new Date().getFullYear()

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
      const hostAvatar = playerAvatar || '🤡'
      console.log('🏠 Creating room:', roomId, 'with host:', hostName)
      setIsCreatingRoom(true)
      
      if (connected) {
        // Create room via Socket.io - navigation happens in useEffect when room is created
        const settings = { volatility, gameDuration, startingCash }
        createRoom(roomId, hostName, hostAvatar, settings)
        
        // Fallback timeout in case Socket.io doesn't respond
        setTimeout(() => {
          if (isCreatingRoom) {
            console.log('🔄 Socket.io timeout, using fallback navigation')
            setIsCreatingRoom(false)
            onStartRoom(roomId, volatility, gameDuration, startingCash)
          }
        }, 5000)
      } else {
        // Direct navigation if not connected
        console.log('🔄 No Socket.io connection, using direct navigation')
        setTimeout(() => {
          setIsCreatingRoom(false)
          onStartRoom(roomId, volatility, gameDuration, startingCash)
        }, 1000)
      }
    }
  }

  const presetDurations = [
    { years: 1, label: '1 Jaar', description: 'Snel spel' },
    { years: 2, label: '2 Jaar', description: 'Gemiddeld spel' },
    { years: 3, label: '3 Jaar', description: 'Lang spel' },
    { years: 5, label: '5 Jaar', description: 'Uitgebreid spel' }
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
              <span>Terug</span>
            </button>
            <div></div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center space-x-3">
              <Crown className="w-8 h-8 text-neon-blue" />
              <span>Host Setup</span>
            </h1>
            <p className="text-gray-400">Configureer je spel instellingen</p>
            <div className="mt-4 flex items-center justify-center space-x-2 text-neon-gold">
              <span className="text-2xl">👑</span>
              <span className="font-semibold">Host</span>
            </div>
          </div>

          {/* Lobby ID Card */}
          <div className="crypto-card mb-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Jouw Lobby ID</h3>
            
            <div className="bg-dark-bg/50 rounded-lg p-8 mb-6 text-center">
              <div className="text-5xl font-bold text-neon-gold tracking-wider mb-4">
                {roomId}
              </div>
              <p className="text-gray-400">Test Lobby ID - Deel met je spelers</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center space-x-2 bg-neon-turquoise/20 hover:bg-neon-turquoise/30 border border-neon-turquoise/50 text-neon-turquoise font-semibold py-3 px-4 rounded-lg transition-all duration-300"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Gekopieerd!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Kopieer ID</span>
                  </>
                )}
              </button>

              <button
                disabled
                className="flex items-center justify-center space-x-2 bg-gray-600/10 border border-gray-600/30 text-gray-500 font-semibold py-3 px-4 rounded-lg cursor-not-allowed"
              >
                <span>Test Modus</span>
              </button>
            </div>

            <div className="bg-neon-blue/10 border border-neon-blue/30 rounded-lg p-4">
              <h4 className="text-neon-blue font-semibold text-sm mb-2">📋 Test Modus</h4>
              <div className="space-y-1 text-gray-300 text-sm">
                <p>• Lobby ID is vast ingesteld op "123" voor testen</p>
                <p>• Spelers kunnen joinen via de "Spelen" optie met lobby ID "123"</p>
                <p>• Ga door naar de volgende stap om het spel in te stellen</p>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!roomId}
            className="w-full bg-gradient-to-r from-neon-blue to-neon-turquoise text-white font-bold py-4 px-6 rounded-lg shadow-neon-blue transition-all duration-300 hover:shadow-neon-turquoise hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xl"
          >
            <span>Volgende: Spel Instellingen</span>
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
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center space-x-3">
              <Crown className="w-8 h-8 text-neon-blue" />
              <span>Host Setup</span>
            </h1>
            <p className="text-gray-400">Spel Instellingen</p>
            <div className="mt-2 flex items-center justify-center space-x-2 text-neon-gold">
              <span className="text-xl">👑</span>
              <span className="font-semibold">Host</span>
            </div>
          </div>
          
          <div></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Connection Status */}
          <div className="crypto-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Server Status</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className={`text-sm font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? 'Verbonden' : 'Niet verbonden'}
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
                  💡 Probeer opnieuw - je wordt automatisch toegevoegd aan de bestaande kamer
                </p>
              )}
              {error.includes('Er is al een host') && (
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-center">
                  <p className="text-yellow-300 text-sm font-semibold">💡 Wat kun je doen?</p>
                  <div className="text-yellow-200 text-xs mt-2 space-y-1">
                    <p>• Kies "Spelen" in plaats van "Hosting"</p>
                    <p>• Join als speler met de room ID</p>
                    <p>• Wacht tot de huidige host het spel start</p>
                  </div>
                  <button
                    onClick={onBack}
                    className="mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-lg text-sm font-semibold transition-colors"
                  >
                    🎮 Ga naar "Spelen"
                  </button>
                </div>
              )}
              
              {/* Host Takeover Info */}
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded text-center">
                <p className="text-green-300 text-sm font-semibold">🔄 Host Takeover</p>
                <div className="text-green-200 text-xs mt-2 space-y-1">
                  <p>• Als er een "Test Host" is, wordt deze automatisch vervangen</p>
                  <p>• Je wordt dan de enige echte host van de kamer</p>
                  <p>• Alle spelers en instellingen blijven behouden</p>
                </div>
              </div>
            </div>
          )}

          {/* Lobby ID Display */}
          <div className="crypto-card text-center">
            <h3 className="text-lg font-bold text-white mb-4">Lobby ID: <span className="text-neon-gold">{roomId}</span></h3>
          </div>

          {/* Market Volatility Selection */}
          <div className="crypto-card">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="w-6 h-6 text-neon-turquoise" />
              <h2 className="text-2xl font-bold text-white">Beursschommelingen</h2>
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
                <div className="text-2xl mb-2">📈</div>
                <div className="text-lg font-bold mb-1">Weinig</div>
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
                <div className="text-2xl mb-2">📊</div>
                <div className="text-lg font-bold mb-1">Medium</div>
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
                <div className="text-2xl mb-2">🚀</div>
                <div className="text-lg font-bold mb-1">Hard</div>
                <div className="text-sm opacity-80">+3% / -3%</div>
              </button>
            </div>
          </div>

          {/* Game Duration Selection */}
          <div className="crypto-card">
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="w-6 h-6 text-neon-turquoise" />
              <h2 className="text-2xl font-bold text-white">Spel Duur</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-white font-semibold min-w-[100px]">Jaren:</label>
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

          {/* Starting Cash Selection */}
          <div className="crypto-card">
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-2xl">💰</span>
              <h2 className="text-2xl font-bold text-white">Startgeld</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-white font-semibold min-w-[100px]">Bedrag:</label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="100"
                  value={startingCash}
                  onChange={(e) => setStartingCash(parseInt(e.target.value))}
                  className="flex-1 p-3 bg-dark-bg border-2 border-neon-gold rounded-lg text-white font-bold text-xl focus:border-neon-turquoise focus:outline-none"
                />
                <span className="text-neon-gold font-bold text-xl">€</span>
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
                    <div className="font-bold text-lg">€{amount.toLocaleString()}</div>
                    <div className="text-sm opacity-80">
                      {amount === 500 ? 'Starter' : 
                       amount === 1000 ? 'Standaard' :
                       amount === 2500 ? 'Comfortabel' : 'Rijk'}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="bg-neon-gold/10 border border-neon-gold/30 rounded-lg p-4">
                <p className="text-neon-gold font-semibold text-sm mb-2">💡 Startgeld Info</p>
                <div className="space-y-1 text-gray-300 text-sm">
                  <p>• Elke speler begint met hetzelfde bedrag op hun bankrekening</p>
                  <p>• Dit geld kan gebruikt worden om crypto's te kopen via QR scans</p>
                  <p>• Hogere bedragen maken het spel makkelijker voor beginners</p>
                </div>
              </div>
            </div>
          </div>

          {/* Game Summary */}
          <div className="crypto-card bg-dark-bg/50 border border-neon-blue/40">
            <div className="flex items-center space-x-3 mb-4">
              <Play className="w-6 h-6 text-neon-gold" />
              <h3 className="text-xl font-bold text-white">Spel Overzicht</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
              <div>
                <p className="text-gray-400 text-sm">Lobby ID</p>
                <p className="text-2xl font-bold text-neon-blue">{roomId}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Start Jaar</p>
                <p className="text-2xl font-bold text-neon-turquoise">{currentYear}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Spel Duur</p>
                <p className="text-2xl font-bold text-neon-gold">{gameDuration} jaar</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Startgeld</p>
                <p className="text-2xl font-bold text-neon-gold">€{startingCash.toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Volatiliteit</p>
                <p className="text-2xl font-bold text-neon-purple">
                  {volatility === 'low' ? '📈' : 
                   volatility === 'medium' ? '📊' :
                   volatility === 'high' ? '🚀' : '📊'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-dark-bg/50 rounded-lg">
              <p className="text-center text-gray-300">
                🎯 <strong>Doel:</strong> Bouw de grootste crypto portefeuille op in {gameDuration} jaar!
              </p>
              <p className="text-center text-gray-400 text-sm mt-2">
                Alleen echte spelers kunnen joinen. Start het spel wanneer alle gewenste spelers klaar zijn in de lobby.
              </p>
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
                <span>Lobby Maken...</span>
              </>
            ) : !connected ? (
              <>
                <span className="text-yellow-300">⚠️ Offline Modus - Klik om door te gaan</span>
              </>
            ) : (
              <>
                <Crown className="w-6 h-6" />
                <span>Maak Lobby & Ga naar Lobby</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
