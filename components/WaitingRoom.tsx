'use client'

import { useState, useEffect } from 'react'
import { Users, Play, Copy, Check, RefreshCw, Crown, UserPlus, Share, QrCode, GripVertical } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface Player {
  id: string
  name: string
  avatar: string
  joinedAt: number
}

interface WaitingRoomProps {
  roomId: string
  onStartGame: () => void
  onBack: () => void
  isHost?: boolean
  playerName?: string
  playerAvatar?: string
}

export default function WaitingRoom({ roomId, onStartGame, onBack, isHost = false, playerName, playerAvatar }: WaitingRoomProps) {
  const { socket, connected, room, error, startGame, clearError, joinRoom } = useSocket()
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastTestMessage, setLastTestMessage] = useState<string | null>(null)
  const [testFeedback, setTestFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Update time every second to show live status
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  
  // Convert room players to array format, with fallback for offline mode
  const [playerOrder, setPlayerOrder] = useState<string[]>([])
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null)
  
  const players: Player[] = room ? Object.entries(room.players).map(([socketId, player]) => ({
    id: socketId,
    name: player.name,
    avatar: player.avatar,
    joinedAt: player.joinedAt
  })) : [
    // Fallback players for offline mode
    {
      id: 'offline-player',
      name: playerName || 'Speler',
      avatar: playerAvatar || '👤',
      joinedAt: Date.now()
    }
  ]
  
  // Initialize / sync player order when room players or order change
  useEffect(() => {
    if (!room || !room.players || Object.keys(room.players).length === 0) return

    const currentPlayerIds = Object.keys(room.players).filter(id => !room.players[id].isHost)

    // 🔁 For NIET-host clients: altijd server-volgorde volgen
    if (!isHost) {
      if (room.playerOrder && Array.isArray(room.playerOrder)) {
        const validServerOrder = room.playerOrder.filter(id => currentPlayerIds.includes(id))
        const newPlayers = currentPlayerIds.filter(id => !room.playerOrder!.includes(id))
        const finalOrder = [...validServerOrder, ...newPlayers]
        setPlayerOrder(finalOrder)
      } else {
        setPlayerOrder(currentPlayerIds)
      }
      return
    }

    // 👑 Host: lokale drag-volgorde is leidend, maar blijf spelers join/leave bijwerken
    if (playerOrder.length === 0) {
      if (room.playerOrder && Array.isArray(room.playerOrder)) {
        const validServerOrder = room.playerOrder.filter(id => currentPlayerIds.includes(id))
        const newPlayers = currentPlayerIds.filter(id => !room.playerOrder!.includes(id))
        const finalOrder = [...validServerOrder, ...newPlayers]
        setPlayerOrder(finalOrder)
      } else {
        setPlayerOrder(currentPlayerIds)
      }
    } else {
      const newPlayers = currentPlayerIds.filter(id => !playerOrder.includes(id))
      if (newPlayers.length > 0) {
        setPlayerOrder(prev => [...prev, ...newPlayers])
      }

      const validPlayers = playerOrder.filter(id => currentPlayerIds.includes(id))
      if (validPlayers.length !== playerOrder.length) {
        setPlayerOrder(validPlayers)
      }
    }
  }, [room, isHost])
  
  // Get ordered players (non-hosts only)
  const orderedPlayers = playerOrder
    .map(id => players.find(p => p.id === id))
    .filter(Boolean) as Player[]
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    if (!isHost) return
    setDraggedPlayer(playerId)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    if (!isHost) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  
  const handleDrop = (e: React.DragEvent, targetPlayerId: string) => {
    if (!isHost || !draggedPlayer) return
    e.preventDefault()
    
    const newOrder = [...playerOrder]
    const draggedIndex = newOrder.indexOf(draggedPlayer)
    const targetIndex = newOrder.indexOf(targetPlayerId)
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedPlayer)
      setPlayerOrder(newOrder)
      
      // Send updated order to server
      if (socket && roomId) {
        socket.emit('room:updatePlayerOrder', {
          roomCode: roomId,
          playerOrder: newOrder
        })
      }
    }
    
    setDraggedPlayer(null)
  }
  
  const handleDragEnd = () => {
    setDraggedPlayer(null)
  }

  // Debug: Log when players change
  useEffect(() => {
    console.log('👥 ===  PLAYERS UPDATED ===')
    console.log('👥 Total players:', players.length)
    players.forEach(p => {
      console.log(`  - ${p.avatar} ${p.name} (${p.id.substring(0, 8)}...)`)
    })
    console.log('👥 === END PLAYERS ===')
  }, [players.length])

  // Generate shareable URL
  useEffect(() => {
    const baseUrl = window.location.origin + window.location.pathname
    setShareUrl(`${baseUrl}?rooms=${roomId}`)
  }, [roomId])

  // Soft auto-rejoin in case socket is connected but room data is missing
  useEffect(() => {
    if (!connected) return
    if (room) return
    if (!roomId || !playerName || !playerAvatar) return

    console.log('🔁 WaitingRoom: connected but no room data, attempting soft rejoin', {
      roomId,
      playerName,
      playerAvatar
    })

    try {
      joinRoom(roomId, playerName, playerAvatar)
    } catch (e) {
      console.warn('⚠️ WaitingRoom soft rejoin failed', e)
    }
  }, [connected, room, roomId, playerName, playerAvatar, joinRoom])

  // Handle successful room creation and game start
  useEffect(() => {
    if (room && room.hostId) {
      console.log('🏠 Room data updated:', room)
      
      // Reset loading state if game was started
      if (room.started && isStarting) {
        console.log('🎮 Game started detected - resetting loading state')
        setIsStarting(false)
      }
    }
  }, [room, isStarting])

  // Listen for game started event to show loading for players
  useEffect(() => {
    if (socket) {
      const handleGameStarted = () => {
        console.log('🎮 Game started event received in WaitingRoom')
        console.log('🎮 Is host:', isHost)
        
        // Let page.tsx handle the navigation - just reset loading state
        console.log('⚡ Game started - page.tsx will handle navigation')
        setIsStarting(false)
      }

      socket.on('game:started', handleGameStarted)

      return () => {
        socket.off('game:started', handleGameStarted)
      }
    }
  }, [socket, isHost, onStartGame])

  // Backup handler for room.started (in case socket event doesn't fire)
  useEffect(() => {
    if (room?.started) {
      console.log('🎮 Room.started detected as backup')
      // Only trigger if we haven't already started loading
      if (!isStarting) {
        console.log('⚡ BACKUP: Game started detected - page.tsx will handle navigation')
        // Don't navigate here - let page.tsx handle it
      }
    }
  }, [room?.started, onStartGame, isHost, isStarting])

  // Listen for test messages
  useEffect(() => {
    if (socket) {
      const handleTestMessage = ({ message, sender, timestamp }: any) => {
        console.log('📡 Test message received:', message, 'from', sender)
        setLastTestMessage(`${sender}: ${message}`)
        // Clear message after 5 seconds
        setTimeout(() => setLastTestMessage(null), 5000)
      }
      
      socket.on('test:messageReceived', handleTestMessage)
      return () => {
        socket.off('test:messageReceived', handleTestMessage)
      }
    }
  }, [socket])

  // CRITICAL: Listen for lobby updates to see other players!
  useEffect(() => {
    console.log('\n🔍 === WAITING ROOM STATE CHECK ===')
    console.log('🔍 Room ID:', roomId)
    console.log('🔍 Is Host:', isHost)
    console.log('🔍 Socket connected:', connected)
    console.log('🔍 Room data exists:', !!room)
    console.log('🔍 Players in room:', room ? Object.keys(room.players).length : 0)
    if (room) {
      console.log('👥 Player list:')
      Object.entries(room.players).forEach(([id, p]: [string, any]) => {
        console.log(`  - ${p.avatar} ${p.name} (${id.substring(0, 8)}...)${p.isHost ? ' 👑 HOST' : ''}`)
      })
      console.log('🏠 Room details:', {
        hostId: room.hostId,
        hostName: room.hostName,
        started: room.started
      })
    } else {
      console.log('❌ No room data available!')
      console.log('🔍 Socket ID:', socket?.id)
      console.log('🔍 Error:', error)
    }
    console.log('🔍 === END STATE CHECK ===\n')
  }, [room, connected, roomId, isHost, socket, error])

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy room ID:', err)
    }
  }

  const shareRoom = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'CryptoClash Kamer',
          text: `Join mijn CryptoClash kamer met ID: ${roomId}`,
          url: shareUrl
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to share:', err)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CryptoClash - Join mijn spel!',
          text: `Join mijn CryptoClash spel met room ID: ${roomId}`,
          url: shareUrl
        })
      } catch (err) {
        console.log('Share cancelled or failed:', err)
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to share:', err)
      }
    }
  }

  const handleStartGame = () => {
    console.log('🚀 === START GAME - NO CHECKS ===')
    
    setIsStarting(true)
    
    // Just start the game - no conditions
    console.log('📤 Starting game...')
    startGame(roomId)
    
    // Let server event trigger navigation - don't navigate here
    console.log('⚡ Game start initiated - server will trigger navigation')
    setIsStarting(false)
    
    console.log('🚀 === GAME START INITIATED ===')
  }

  const sendTestMessage = () => {
    console.log('🧪 Test button clicked!')
    console.log('🔍 Socket exists:', !!socket)
    console.log('🔍 Connected:', connected)
    console.log('🔍 Room ID:', roomId)
    console.log('🔍 Player Name:', playerName)
    
    // Clear previous feedback
    setTestFeedback(null)
    
    if (!socket) {
      const errorMsg = 'Geen Socket.io verbinding beschikbaar'
      console.log('❌', errorMsg)
      setTestFeedback({ type: 'error', message: errorMsg })
      return
    }
    
    if (!connected) {
      const errorMsg = 'Socket.io niet verbonden met server'
      console.log('❌', errorMsg)
      setTestFeedback({ type: 'error', message: errorMsg })
      return
    }
    
    if (!roomId) {
      const errorMsg = 'Geen room ID beschikbaar'
      console.log('❌', errorMsg)
      setTestFeedback({ type: 'error', message: errorMsg })
      return
    }
    
    try {
      const testMessage = `Test bericht van ${playerName || 'Onbekend'} om ${currentTime.toLocaleTimeString()}`
      console.log('📤 Sending test message to room:', roomId, testMessage)
      
      socket.emit('test:message', { 
        roomCode: roomId, 
        message: testMessage, 
        sender: playerName || 'Onbekend' 
      })
      
      console.log('📤 Test message sent successfully!')
      setTestFeedback({ 
        type: 'success', 
        message: `✅ Bericht verstuurd naar room ${roomId}! Kijk of andere apparaten het ontvangen.` 
      })
      
      // Clear success message after 5 seconds
      setTimeout(() => setTestFeedback(null), 5000)
      
    } catch (error) {
      const errorMsg = `Fout bij versturen: ${error}`
      console.log('❌', errorMsg)
      setTestFeedback({ type: 'error', message: errorMsg })
    }
  }

  const getTimeSinceJoined = (joinedAt: number) => {
    const seconds = Math.floor((Date.now() - joinedAt) / 1000)
    if (seconds < 60) return `${seconds}s geleden`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m geleden`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-neon-gold/20 rounded-full">
              <Users className="w-12 h-12 text-neon-gold" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {isHost ? 'Market Screen - Wachtlobby' : 'Wachtlobby'}
          </h1>
          <p className="text-gray-400">
            {isHost ? 'Informatief scherm - Wacht tot spelers klaar zijn' : 'Wacht tot de host het spel start'}
          </p>
        </div>

        {/* Feedback (optioneel) */}
        {testFeedback && (
          <div
            className={`mt-3 p-3 rounded-lg border ${
              testFeedback.type === 'success'
                ? 'bg-green-500/20 border-green-500/50 text-green-300'
                : 'bg-red-500/20 border-red-500/50 text-red-300'
            }`}
          >
            <p className="text-sm font-semibold">{testFeedback.message}</p>
          </div>
        )}

        {/* Spel Overzicht (styled like previous screen) */}
        <div className="crypto-card mb-6">
          <h3 className="text-xl font-bold text-white mb-4">Spel Overzicht</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Lobby ID</div>
              <div className="text-neon-purple font-bold text-2xl font-mono">{roomId}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Start Jaar</div>
              <div className="text-neon-blue font-bold text-2xl">{new Date().getFullYear()}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Spel Duur</div>
              <div className="text-neon-gold font-extrabold text-2xl">{room?.settings?.gameDuration || 1} jaar</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Startgeld</div>
              <div className="text-neon-gold font-extrabold text-2xl">€{room?.settings?.startingCash?.toLocaleString('nl-NL') || '1.000'}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Volatiliteit</div>
              <div className="text-white text-2xl">📊</div>
            </div>
          </div>
          <div className="mt-5 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-white font-semibold">
              🎯 Doel: Bouw de grootste crypto portefeuille op in {room?.settings?.gameDuration || 1} jaar!
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Alleen echte spelers kunnen joinen. Start het spel wanneer alle gewenste spelers klaar zijn.
            </p>
          </div>
        </div>

        

        {/* Players Overview (Lobby Overzicht) */}
        <div className="crypto-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Lobby Overzicht
            </h3>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                Live
              </span>
            </div>
          </div>
          {room ? (
            <div className="space-y-4">
              {/* Host Card */}
              {Object.entries(room.players).filter(([_, player]) => player.isHost).length > 0 && (
                <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-yellow-300 font-semibold flex items-center">👑 Host</h4>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                  {Object.entries(room.players)
                    .filter(([_, player]) => player.isHost)
                    .map(([socketId, player]) => (
                      <div key={socketId} className="flex items-center justify-between mb-2 last:mb-0">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">{player.avatar}</div>
                          <div>
                            <div className="font-semibold text-white text-lg flex items-center">
                              {player.name}
                              {(player.name === 'Test Host' || player.name === 'Host') && (
                                <span className="ml-2 px-1 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">ACTIEF</span>
                              )}
                            </div>
                            <div className="text-xs text-yellow-300">Kamer eigenaar • {getTimeSinceJoined(player.joinedAt)}</div>
                          </div>
                        </div>
                        <div className="text-yellow-400 text-2xl">👑</div>
                      </div>
                    ))}
                </div>
              )}
              {/* Players Cards */}
              {orderedPlayers.length > 0 ? (
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-green-300 font-semibold flex items-center">
                      🎮 Spelers ({orderedPlayers.length})
                      {isHost && (
                        <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                          Sleep om volgorde te wijzigen
                        </span>
                      )}
                    </h4>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-3">
                    {orderedPlayers.map((player, index) => (
                      <div
                        key={player.id}
                        draggable={isHost}
                        onDragStart={(e) => handleDragStart(e, player.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, player.id)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-between p-3 bg-green-500/5 rounded-lg border transition-all duration-200 ${
                          isHost ? 'cursor-move hover:bg-green-500/10 border-green-500/20' : 'border-transparent'
                        } ${
                          draggedPlayer === player.id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {isHost && (
                            <div className="text-gray-400 hover:text-green-300 transition-colors">
                              <GripVertical className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-full text-sm font-bold text-green-300">
                            {index + 1}
                          </div>
                          <div className="text-2xl">{player.avatar}</div>
                          <div>
                            <div className="font-semibold text-white">{player.name}</div>
                            <div className="text-xs text-green-300">{getTimeSinceJoined(player.joinedAt)}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {index === 0 && (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-neon-gold/20 border border-neon-gold/50 rounded-full">
                              <span className="text-xs text-neon-gold font-bold">Eerste beurt</span>
                              <span className="text-neon-gold">⚡</span>
                            </div>
                          )}
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400 font-semibold">Live</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg text-center">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-gray-400 text-lg">Wachten op spelers...</p>
                  <p className="text-gray-500 text-sm mt-2">Deel de lobby ID zodat spelers kunnen joinen</p>
                  {isHost && (
                    <p className="text-blue-300 text-xs mt-3 bg-blue-500/10 p-2 rounded">
                      💡 Als host kun je de speler volgorde wijzigen door ze te verslepen
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-gray-300 text-lg">Wachten op spelers...</p>
              <p className="text-gray-500 text-sm mt-2">
                {!connected ? 'Geen verbinding met server...' : 
                 error ? `Fout: ${error}` :
                 'Deel de kamercode om vrienden uit te nodigen!'}
              </p>
              {connected && !error && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm font-semibold">🔍 Debug Info</p>
                  <p className="text-yellow-300 text-xs mt-1">Socket ID: {socket?.id || 'Geen socket'}</p>
                  <p className="text-yellow-300 text-xs">Room ID: {roomId}</p>
                  <p className="text-yellow-300 text-xs">Is Host: {isHost ? 'Ja' : 'Nee'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        
        {/* Live Room Status (moved below Lobby Overzicht) */}
        <div className="mb-6 p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-purple-400 font-semibold">🔍 Live Room Status</h3>
            <div className="text-xs text-purple-300">
              {currentTime.toLocaleTimeString()} - Live Update
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-purple-300">Socket ID:</span>
              <div className="font-mono text-xs text-white bg-black/30 p-1 rounded mt-1">{socket?.id || 'Geen verbinding'}</div>
            </div>
            <div>
              <span className="text-purple-300">Room ID:</span>
              <div className="font-mono text-xs text-white bg-black/30 p-1 rounded mt-1">{roomId}</div>
            </div>
            <div>
              <span className="text-purple-300">Verbinding:</span>
              <div className={`text-xs font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>{connected ? '✅ Live Socket.io' : '❌ Offline'}</div>
            </div>
            <div>
              <span className="text-purple-300">Room Data:</span>
              <div className={`text-xs font-semibold ${room ? 'text-green-400' : 'text-yellow-400'}`}>{room ? `✅ ${Object.keys(room.players).length} spelers` : '⚠️ Lokaal'}</div>
            </div>
          </div>
          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-blue-300 font-semibold">🧪 Room Sync Test</div>
              <button onClick={sendTestMessage} disabled={!connected} className="px-3 py-2 bg-blue-500/30 hover:bg-blue-500/50 border border-blue-500/70 text-white rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">📡 Test Sync</button>
            </div>
            <div className="text-xs text-blue-200">{connected ? 'Klik om bericht naar alle clients in room te sturen' : 'Geen verbinding - kan niet testen'}</div>
          </div>
        </div>

        {/* Action Buttons - HOST ONLY START */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full">
            {isHost ? (
              <>
                <button
                  onClick={handleStartGame}
                  disabled={isStarting || players.length < 1}
                  className="w-full bg-gradient-to-r from-neon-gold to-neon-turquoise text-white font-bold py-4 px-6 rounded-lg shadow-neon-gold transition-all duration-300 hover:shadow-neon-turquoise hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 text-xl"
                >
                  {isStarting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Spel Starten...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6" />
                      <span>Start Spel</span>
                    </>
                  )}
                </button>
                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-center">
                  <p className="text-blue-300 text-sm">
                    📊 Je gaat naar de <strong>Live Market Screen</strong> om alle spelers te monitoren
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full p-6 bg-gray-600/20 border border-gray-600/50 rounded-lg text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 font-semibold">Wachten op host...</span>
                </div>
                <p className="text-gray-400 text-sm">
                  De host zal het spel starten wanneer iedereen klaar is
                </p>
                <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                  <p className="text-blue-300 text-sm">
                    🎮 Je gaat naar je <strong>unieke speler interface</strong> zodra het spel begint
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Nieuwe Kamer Button - HOST ONLY */}
          {isHost && (
            <button
              onClick={onBack}
              disabled={isStarting}
              className="py-4 px-6 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Nieuwe Kamer</span>
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
          <h4 className="text-neon-blue font-semibold text-sm mb-2">💡 Tips voor de Host</h4>
          <div className="space-y-1 text-gray-300 text-xs">
            <p>• Dit is een informatief scherm voor alle spelers</p>
            <p>• Spelers moeten handmatig joinen met hun eigen apparaten</p>
            <p>• Deel de lobby ID via chat, email of mondeling</p>
            <p>• Start wanneer alle gewenste spelers hebben gejoind</p>
            <p>• Geen automatische fictieve spelers - alleen echte deelnemers</p>
          </div>
        </div>
      </div>

      {/* Loading Overlay when starting game */}
      {isStarting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-dark-bg via-purple-900/20 to-blue-900/20 p-8 rounded-2xl border border-neon-blue/30 shadow-2xl">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <img
                  src="/Collage_logo.png"
                  alt="CryptoClash"
                  className="w-[40vw] md:w-[18vw] h-auto max-h-[30vh] drop-shadow-[0_8px_30px_rgba(139,92,246,0.6)]"
                />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-gold bg-clip-text text-transparent mb-2">
                {isHost ? 'Spel wordt gestart...' : 'Spel is gestart!'}
              </h3>
              <p className="text-gray-300 text-sm">
                {isHost ? 'Even geduld, we bereiden alles voor' : 'Je wordt doorgestuurd naar je speler interface'}
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-400">
                <span className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-neon-purple rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-neon-gold rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
