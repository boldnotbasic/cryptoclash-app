'use client'

import { useState, useEffect, useRef } from 'react'
import { GripVertical, Dices, Play, ArrowRight } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface PlayerEntry {
  socketId: string
  name: string
  avatar: string
  roll: number | null
  rolling: boolean
}

interface DiceRollProps {
  roomId: string
  isHost: boolean
  playerName: string
  playerAvatar: string
  onStartGame: () => void
  onBack: () => void
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1
}

export default function DiceRoll({ roomId, isHost, playerName, playerAvatar, onStartGame, onBack }: DiceRollProps) {
  const { room, socket } = useSocket()
  const [players, setPlayers] = useState<PlayerEntry[]>([])
  const [myRoll, setMyRoll] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const animFrames = useRef<{ [key: string]: NodeJS.Timeout }>({})

  // Build player list from room state
  useEffect(() => {
    if (room?.players) {
      setPlayers(prev => {
        const existing = new Map(prev.map(p => [p.socketId, p]))
        return Object.entries(room.players).map(([sid, p]: [string, any]) => ({
          socketId: sid,
          name: p.name,
          avatar: p.avatar,
          roll: existing.get(sid)?.roll ?? null,
          rolling: existing.get(sid)?.rolling ?? false,
        }))
      })
    }
  }, [room])

  // Listen for dice roll broadcasts from other players
  useEffect(() => {
    if (!socket) return
    const onRoll = ({ socketId, roll }: { socketId: string; roll: number }) => {
      setPlayers(prev =>
        prev.map(p => p.socketId === socketId ? { ...p, roll, rolling: false } : p)
      )
    }
    socket.on('dice:rolled', onRoll)
    return () => { socket.off('dice:rolled', onRoll) }
  }, [socket])

  // My own roll
  const handleRoll = () => {
    if (isRolling || myRoll !== null) return
    setIsRolling(true)

    // Animate my tile
    const mySocketId = socket?.id
    if (!mySocketId) return

    setPlayers(prev => prev.map(p => p.socketId === mySocketId ? { ...p, rolling: true } : p))

    let ticks = 0
    const interval = setInterval(() => {
      ticks++
      setPlayers(prev =>
        prev.map(p => p.socketId === mySocketId ? { ...p, roll: rollDie() } : p)
      )
      if (ticks >= 12) {
        clearInterval(interval)
        const finalRoll = rollDie()
        setMyRoll(finalRoll)
        setIsRolling(false)
        setPlayers(prev =>
          prev.map(p => p.socketId === mySocketId ? { ...p, roll: finalRoll, rolling: false } : p)
        )
        socket?.emit('dice:roll', { roomId, roll: finalRoll })
      }
    }, 80)
  }

  const allRolled = players.length > 0 && players.every(p => p.roll !== null)

  // Sort by roll descending (highest first = first to play)
  const sortedPlayers = allRolled
    ? [...players].sort((a, b) => (b.roll ?? 0) - (a.roll ?? 0))
    : players

  // Drag to reorder (host only, after all rolled)
  const handleDragStart = (index: number) => {
    if (!isHost || !allRolled) return
    setDragIndex(index)
  }

  const handleDragEnter = (index: number) => {
    if (dragIndex === null || dragIndex === index) return
    setDragOverIndex(index)
  }

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const reordered = [...sortedPlayers]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    setPlayers(reordered)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const myEntry = players.find(p => p.name === playerName)
  const hasRolled = myRoll !== null

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 md:p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Terug
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">🎲 Speelvolgorde</h1>
            <p className="text-gray-400 text-sm mt-1">Gooi de dobbelsteen — hoogste gaat eerst</p>
          </div>
          <div className="w-12" />
        </div>

        {/* Player tiles */}
        <div className="space-y-3 mb-6">
          {(allRolled ? sortedPlayers : players).map((player, index) => {
            const isMe = player.name === playerName
            const isDragging = dragIndex === index
            const isDragOver = dragOverIndex === index

            return (
              <div
                key={player.socketId}
                draggable={isHost && allRolled}
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                className={`crypto-card flex items-center gap-4 transition-all duration-200
                  ${isDragging ? 'opacity-40 scale-95' : ''}
                  ${isDragOver ? 'border-neon-purple ring-1 ring-neon-purple/50' : ''}
                  ${isMe ? 'border-neon-blue/50' : ''}
                `}
              >
                {/* Order badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${allRolled && index === 0 ? 'bg-neon-gold/20 text-neon-gold' : 'bg-white/10 text-gray-400'}`}>
                  {allRolled ? index + 1 : '—'}
                </div>

                {/* Avatar + name */}
                <div className="text-3xl flex-shrink-0">{player.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">
                    {player.name}
                    {isMe && <span className="ml-2 text-xs text-neon-blue">(jij)</span>}
                    {allRolled && index === 0 && <span className="ml-2 text-xs text-neon-gold">👑 Eerste</span>}
                  </div>
                  {player.rolling && (
                    <div className="text-xs text-gray-400 animate-pulse">Aan het gooien…</div>
                  )}
                  {!player.rolling && player.roll === null && (
                    <div className="text-xs text-gray-500">Nog niet gegooid</div>
                  )}
                </div>

                {/* Dice result */}
                <div className="flex-shrink-0 text-right">
                  {player.rolling ? (
                    <span className="text-4xl animate-spin inline-block">🎲</span>
                  ) : player.roll !== null ? (
                    <div className="flex flex-col items-center">
                      <span className="text-4xl">{DICE_FACES[player.roll - 1]}</span>
                      <span className="text-xs text-gray-400 mt-0.5">{player.roll}</span>
                    </div>
                  ) : (
                    <span className="text-4xl opacity-20">🎲</span>
                  )}
                </div>

                {/* Drag handle (host only, after all rolled) */}
                {isHost && allRolled && (
                  <div className="flex-shrink-0 text-gray-500 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Status / action area */}
        {!hasRolled && !isHost && (
          <div className="text-center mb-4 text-gray-400 text-sm">
            Wacht op de host om te starten…
          </div>
        )}

        <div className="flex gap-3">
          {/* Roll button (for non-hosts who haven't rolled yet, or host rolling for themselves) */}
          {!hasRolled && (
            <button
              onClick={handleRoll}
              disabled={isRolling}
              className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                ${isRolling
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                }`}
            >
              <Dices className="w-6 h-6" />
              {isRolling ? 'Gooien…' : 'Gooi de dobbelsteen!'}
            </button>
          )}

          {/* Host: Start Spel button — only when all players have rolled */}
          {isHost && allRolled && (
            <button
              onClick={onStartGame}
              className="flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            >
              <Play className="w-6 h-6" />
              Start Spel
            </button>
          )}

          {/* Player who already rolled: waiting message */}
          {hasRolled && !isHost && !allRolled && (
            <div className="flex-1 py-4 rounded-xl bg-white/5 text-gray-400 text-center flex items-center justify-center gap-2">
              <span className="animate-pulse">⏳</span> Wacht op andere spelers…
            </div>
          )}

          {/* Player: all rolled but waiting for host */}
          {hasRolled && !isHost && allRolled && (
            <div className="flex-1 py-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-center flex items-center justify-center gap-2">
              <ArrowRight className="w-5 h-5" />
              Klaar! Wacht op host om te starten…
            </div>
          )}
        </div>

        {/* Reorder hint for host */}
        {isHost && allRolled && (
          <p className="text-center text-gray-500 text-xs mt-3">
            Sleep spelers om de volgorde aan te passen voor je start
          </p>
        )}

        {/* Not all rolled yet — status */}
        {!allRolled && (
          <div className="mt-4 text-center text-gray-500 text-xs">
            {players.filter(p => p.roll !== null).length} / {players.length} gegooid
          </div>
        )}
      </div>
    </div>
  )
}
