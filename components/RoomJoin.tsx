'use client'

import { useState, useEffect, useRef } from 'react'
import { Gamepad2, AlertCircle, ArrowLeft, QrCode, X } from 'lucide-react'
import { RoomStorage } from '@/utils/roomStorage'
import { useSocket } from '@/hooks/useSocket'
import QrScanner from 'qr-scanner'
import { useIcons } from '@/contexts/IconContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface RoomJoinProps {
  onJoinRoom: (roomId: string, playerName: string, playerAvatar: string) => void
  onBack: () => void
  onGoToMarketScreen?: () => void
  onBypassToGame?: () => void
  playerName?: string
  playerAvatar?: string
}



export default function RoomJoin({ onJoinRoom, onBack, onGoToMarketScreen, onBypassToGame, playerName: propPlayerName, playerAvatar: propPlayerAvatar }: RoomJoinProps) {
  const { t } = useLanguage()
  const { icons } = useIcons()
  const AVATARS = icons.avatars.list
  const { joinRoom, room, error: socketError, connected, socket } = useSocket()
  const [step, setStep] = useState<'code' | 'profile'>('code')
  const [roomId, setRoomId] = useState('')
  const [localPlayerName, setLocalPlayerName] = useState('')
  const [localPlayerAvatar, setLocalPlayerAvatar] = useState(AVATARS[0])
  const [error, setError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [checkingCode, setCheckingCode] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<string[]>([])
  const [attemptedRoomCode, setAttemptedRoomCode] = useState<string | null>(null)
  const [roomStateAtJoinStart, setRoomStateAtJoinStart] = useState<any>(null)
  const [lastSocketError, setLastSocketError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanMethod, setScanMethod] = useState<'camera' | 'file'>('camera')
  const [takenAvatars, setTakenAvatars] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)

  // Sync rooms from URL on component mount
  useEffect(() => {
    RoomStorage.syncFromUrl()
    setAvailableRooms(RoomStorage.getRooms())
  }, [])

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
      }
    }
  }, [])

  const startScanner = async () => {
    setShowScanner(true)
    setScanError(null)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (videoRef.current) {
      try {
        console.log('🎥 Starting QR scanner...')
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('✅ QR Code detected!', result.data)
            const code = result.data.trim().toUpperCase()
            console.log('📝 Processed code:', code)
            setRoomId(code)
            stopScanner()
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: false,
            highlightCodeOutline: false,
            preferredCamera: 'environment',
            maxScansPerSecond: 3,
          }
        )
        
        qrScannerRef.current = qrScanner
        
        const hasCamera = await QrScanner.hasCamera()
        if (!hasCamera) {
          setScanError('Geen camera gevonden op dit apparaat.')
          return
        }
        
        await qrScanner.start()
        console.log('✅ QR scanner started successfully')
      } catch (err: any) {
        console.error('❌ Scanner error:', err)
        if (err.name === 'NotAllowedError') {
          setScanError('Camera toegang geweigerd. Geef toestemming om de camera te gebruiken.')
        } else if (err.name === 'NotFoundError') {
          setScanError('Geen camera gevonden op dit apparaat.')
        } else if (err.name === 'NotReadableError') {
          setScanError('Camera is al in gebruik door een andere app.')
        } else {
          setScanError(`Camera fout: ${err.message || 'Onbekende fout'}`)
        }
        setShowScanner(false)
      }
    }
  }

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    setShowScanner(false)
    setScanError(null)
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId.trim()) {
      setError(t('roomJoin.errorEnterLobbyId'))
      return
    }
    if (roomId.trim().length < 3) {
      setError(t('roomJoin.errorMinLength'))
      return
    }
    if (!connected || !socket) {
      setError(t('roomJoin.errorNoConnection'))
      return
    }

    const targetRoomId = roomId.trim().toUpperCase()
    setRoomId(targetRoomId)
    setError('')
    setIsJoining(true)
    setCheckingCode(true)

    // Check if room exists WITHOUT joining (no fake players added)
    socket.emit('room:exists', { roomCode: targetRoomId })

    // Timeout fallback
    const timeout = setTimeout(() => {
      setIsJoining(false)
      setCheckingCode(false)
      setError(t('roomJoin.errorNoResponse'))
    }, 8000)

    // One-time listener for the result
    socket.once('room:existsResult', ({ exists, error: roomError, playerAvatars }: { exists: boolean, error?: string, playerAvatars?: string[] }) => {
      clearTimeout(timeout)
      setIsJoining(false)
      setCheckingCode(false)
      if (exists) {
        setError('')
        const taken = Array.isArray(playerAvatars)
          ? playerAvatars.filter((a) => typeof a === 'string')
          : []
        setTakenAvatars(taken)
        // Auto-select first avatar that isn't already taken
        const firstFree = AVATARS.find(a => !taken.includes(a))
        if (firstFree) setLocalPlayerAvatar(firstFree)
        setStep('profile')
      } else {
        setError(roomError || t('roomJoin.errorNotExists'))
      }
    })
  }

  // Keep taken avatars in sync when room updates (e.g. other players join while we zijn op profiel-stap)
  useEffect(() => {
    if (room && (room as any).players) {
      const avatarsFromRoom = Object.values((room as any).players || {}).map((p: any) => p.avatar)
      setTakenAvatars(avatarsFromRoom.filter((a) => typeof a === 'string'))
    }
  }, [room])

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!localPlayerName.trim()) {
      setError(t('roomJoin.errorEnterName'))
      return
    }
    setError('')
    // Lobby already validated in step 1 - now rejoin with real name/avatar
    const finalPlayerName = localPlayerName.trim()
    const finalPlayerAvatar = localPlayerAvatar
    setIsJoining(true)
    setAttemptedRoomCode(roomId)
    setRoomStateAtJoinStart(room)
    setLastSocketError(null)
    joinRoom(roomId, finalPlayerName, finalPlayerAvatar)

    setTimeout(() => {
      setIsJoining(prev => {
        if (!prev) return prev
        setError(t('roomJoin.errorNoServerResponse'))
        setAttemptedRoomCode(null)
        setRoomStateAtJoinStart(null)
        return false
      })
    }, 8000)
  }

  // Handle successful real join (step 2)
  useEffect(() => {
    if (room && isJoining && attemptedRoomCode && !socketError) {
      const roomChanged = room !== roomStateAtJoinStart
      const updatedRoomCode = ((room as any)?.code || '').toUpperCase()
      const matchesAttempt = updatedRoomCode === attemptedRoomCode

      if (roomChanged && matchesAttempt) {
        console.log('✅ Speler gejoind - naar wachtlobby')
        setIsJoining(false)
        setAttemptedRoomCode(null)
        setRoomStateAtJoinStart(null)
        onJoinRoom(updatedRoomCode, localPlayerName.trim(), localPlayerAvatar)
      }
    }
  }, [room, isJoining, attemptedRoomCode, roomStateAtJoinStart, onJoinRoom])

  // Handle Socket.io errors - detect NEW errors by comparing with last known
  useEffect(() => {
    if (socketError && socketError !== lastSocketError) {
      console.log('❌ NEW Socket error received:', socketError)
      setLastSocketError(socketError)
      setError(socketError)
      setIsJoining(false)
      setAttemptedRoomCode(null)
      setRoomStateAtJoinStart(null)
      
      // CRITICAL: Clear any stale room state to prevent navigation
      console.log('🧹 Clearing stale room state due to error')
    }
  }, [socketError, lastSocketError])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/Collage_logo.png"
              alt="CryptoClash"
              className="w-[50vw] md:w-[25vw] h-auto max-h-[60vh] drop-shadow-[0_8px_30px_rgba(139,92,246,0.6)]"
            />
          </div>
          <h1 className="sr-only">CryptoClash</h1>
          <p className="text-gray-400">{t('roomJoin.title')}</p>
        </div>

        {/* Step 1: Lobby Code */}
        {step === 'code' && (
        <div className="crypto-card">
          {/* Connection Status */}
          <div className="mb-4 p-3 rounded-lg bg-dark-bg/50 border border-gray-600/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('login.serverConnection')}:</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className={`text-sm font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? t('common.connected') : t('common.disconnected')}
                </span>
              </div>
            </div>
            {!connected && (
              <p className="text-xs text-yellow-400 mt-2">
                ⏳ {t('login.waitForConnection')}
              </p>
            )}
          </div>

          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <div className="flex items-center justify-center mb-2">
              <h2 className="text-xl font-semibold text-white">{t('login.joinGame')}</h2>
            </div>
            {/* QR Scan Button */}
            <button
              type="button"
              onClick={startScanner}
              className="w-full py-4 px-4 bg-neon-gold/20 hover:bg-neon-gold/30 border-2 border-neon-gold/50 text-neon-gold rounded-lg font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
            >
              <QrCode className="w-6 h-6" />
              <span className="text-lg">{t('login.scanQr')}</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-bg text-gray-400">{t('common.or')}</span>
              </div>
            </div>

            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-2">
                {t('login.enterCode')}
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value)
                  setError('')
                }}
                placeholder={t('login.codePlaceholder')}
                className="w-full p-4 bg-dark-bg border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-purple focus:outline-none text-center text-2xl font-bold tracking-wider"
                disabled={isJoining}
                maxLength={10}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!roomId.trim() || !connected || checkingCode}
              className="neon-button w-full"
            >
              {checkingCode ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('login.connecting')}</span>
                </div>
              ) : !connected ? (
                t('login.waitForConnection')
              ) : (
                t('login.nextStep')
              )}
            </button>
          </form>
          
          {/* Back Button */}
          <button
            onClick={onBack}
            className="w-full mt-4 py-3 px-6 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back')}</span>
          </button>
        </div>
        )}

        {/* Step 2: Profile */}
        {step === 'profile' && (
        <div className="crypto-card">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="flex items-center justify-center mb-2">
              <h2 className="text-xl font-semibold text-white">{t('login.welcomePlayer')}</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('login.enterName')}</label>
              <input
                type="text"
                value={localPlayerName}
                onChange={(e) => { setLocalPlayerName(e.target.value); setError('') }}
                placeholder={t('roomJoin.yourName') + '...'}
                className="neon-input w-full"
                maxLength={20}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('roomJoin.chooseAvatarLabel')}</label>
              {(() => {
                const takenSet = new Set(takenAvatars)
                return (
                  <div className="grid grid-cols-5 gap-2">
                    {AVATARS.map((avatar) => {
                      const isTaken = takenSet.has(avatar) && avatar !== localPlayerAvatar
                      return (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => !isTaken && setLocalPlayerAvatar(avatar)}
                          disabled={isTaken}
                          title={isTaken ? t('roomJoin.avatarTakenTitle') : ''}
                          className={`p-2 rounded-lg text-2xl transition-all ${
                            localPlayerAvatar === avatar
                              ? 'bg-neon-gold/30 ring-2 ring-neon-gold scale-110'
                              : isTaken
                                ? 'bg-dark-bg/50 opacity-30 cursor-not-allowed'
                                : 'bg-dark-bg/50 hover:bg-neon-purple/20 hover:scale-110'
                          }`}
                        >
                          {avatar}
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining || !localPlayerName.trim()}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-blue text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('roomJoin.checking')}</span>
                </>
              ) : (
                <>
                  <Gamepad2 className="w-5 h-5" />
                  <span>{t('roomJoin.join')}</span>
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => { setStep('code'); setError('') }}
            disabled={isJoining}
            className="w-full mt-4 py-3 px-6 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← {t('common.back')}</span>
          </button>
        </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            {t('roomJoin.noLobbyIdHint') || 'Heb je geen lobby ID? Vraag de spelleider om een nieuwe lobby aan te maken.'}
          </p>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{t('login.scanTitle')}</h3>
              <button
                onClick={stopScanner}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="relative rounded-xl overflow-hidden border-4 border-neon-gold/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
              <video
                ref={videoRef}
                className="w-full aspect-square object-cover"
                autoPlay
                muted
                playsInline
              />
              
              {/* Scan overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-neon-gold/30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-neon-gold rounded-lg" />
              </div>
            </div>
            
            {scanError && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{scanError}</p>
              </div>
            )}
            
            <p className="text-gray-400 text-sm mt-4 text-center">
              {t('login.pointCamera')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
