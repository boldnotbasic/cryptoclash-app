'use client'

import { useState, useRef, useEffect } from 'react'
import { Zap, Coins, TrendingUp, RefreshCw, ArrowLeft, Camera, X } from 'lucide-react'
import QrScanner from 'qr-scanner'

// List of 20 random avatars
const avatars = [
  '🤡', '🚀', '💎', '⚡️', '💀', '🦊', '🦄', '🤖', '👾', '👽', 
  '👻', '🦁', '🐲', '🦉', '🦅', '🦈', '🐙', '🤯', '😎', '🤠'
];

interface LoginScreenProps {
  onLogin: (name: string, avatar: string, roomCode: string) => void
  onBack?: () => void
  room?: any // Room data to check which avatars are already taken
}

export default function LoginScreen({ onLogin, onBack, room }: LoginScreenProps) {
  const [step, setStep] = useState<'roomCode' | 'profile'>('roomCode')
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])
  const [showScanner, setShowScanner] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanMethod, setScanMethod] = useState<'camera' | 'file'>('camera')
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)

  const handleRoomCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomCode.trim()) {
      setStep('profile')
    }
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (playerName.trim()) {
      onLogin(playerName.trim(), selectedAvatar, roomCode.trim())
    }
  }

  const startScanner = async () => {
    setShowScanner(true)
    setScanError(null)
    
    // Wait for video element to be mounted
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (videoRef.current) {
      try {
        console.log('Starting QR scanner...')
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR Code detected:', result.data)
            setRoomCode(result.data.toUpperCase())
            stopScanner()
            setStep('profile')
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Use back camera on mobile
          }
        )
        
        qrScannerRef.current = qrScanner
        
        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera()
        if (!hasCamera) {
          setScanError('Geen camera gevonden op dit apparaat.')
          return
        }
        
        await qrScanner.start()
        console.log('QR scanner started successfully')
      } catch (err: any) {
        console.error('Scanner error:', err)
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      console.log('QR Code detected from file:', result.data)
      setRoomCode(result.data.toUpperCase())
      setShowScanner(false)
      setStep('profile')
    } catch (err) {
      console.error('File scan error:', err)
      setScanError('Geen QR code gevonden in deze afbeelding. Probeer een andere foto.')
    }
  }

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg via-purple-900/20 to-blue-900/20">
      <div className="max-w-md w-full mx-4">
        {/* Logo en Titel */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/Collage_logo.png"
              alt="CryptoClash"
              className="w-[50vw] md:w-[25vw] h-auto max-h-[60vh] drop-shadow-[0_8px_30px_rgba(139,92,246,0.6)]"
            />
          </div>
        </div>

        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Terug</span>
          </button>
        )}

        {/* Step 1: Room Code */}
        {step === 'roomCode' && (
          <div className="crypto-card">
            <div className="flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-neon-turquoise mr-2" />
              <h2 className="text-xl font-semibold text-white">Join Game</h2>
            </div>
            
            <form onSubmit={handleRoomCodeSubmit} className="space-y-6">
              <div>
                <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300 mb-2">
                  Voer de lobby code in:
                </label>
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Bijv. ABC123"
                  className="neon-input w-full text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-dark-bg text-gray-400">of</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setScanMethod('camera')
                    startScanner()
                  }}
                  className="py-3 px-4 bg-neon-gold/20 hover:bg-neon-gold/30 border border-neon-gold/50 text-neon-gold rounded-lg font-semibold transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs">Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/50 text-neon-purple rounded-lg font-semibold transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <Zap className="w-5 h-5" />
                  <span className="text-xs">Upload QR</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <button
                type="submit"
                className="neon-button w-full"
                disabled={!roomCode.trim()}
              >
                Volgende →
              </button>
            </form>
          </div>
        )}

        {/* QR Scanner Modal */}
        {showScanner && scanMethod === 'camera' && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Scan QR Code</h3>
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full py-2 bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/50 text-neon-purple rounded-lg text-sm font-semibold transition-colors"
                  >
                    Probeer foto upload in plaats daarvan
                  </button>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-neon-gold/10 border border-neon-gold/30 rounded-lg">
                <p className="text-neon-gold text-sm text-center">
                  📱 Richt je camera op de QR code in de wachtlobby
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Profile (Avatar & Name) */}
        {step === 'profile' && (
          <div className="crypto-card">
            <div className="flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-neon-turquoise mr-2" />
              <h2 className="text-xl font-semibold text-white">Welkom Speler!</h2>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">
                  Voer je spelernaam in:
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Bijv. CryptoKoning"
                  className="neon-input w-full"
                  maxLength={20}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kies je avatar:
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {avatars.map((avatar) => {
                    // Check if this avatar is already taken by another player
                    const isTaken = room?.players ? Object.values(room.players).some((p: any) => p.avatar === avatar) : false
                    
                    return (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => !isTaken && setSelectedAvatar(avatar)}
                        disabled={isTaken}
                        className={`text-3xl p-2 rounded-lg transition-all duration-200 ${ 
                          isTaken
                            ? 'bg-dark-bg/30 opacity-50 cursor-not-allowed'
                            : selectedAvatar === avatar 
                              ? 'bg-neon-gold/30 ring-2 ring-neon-gold scale-110' 
                              : 'bg-dark-bg/50 hover:bg-neon-purple/20'
                        }`}
                        title={isTaken ? 'Deze avatar is al in gebruik' : avatar}
                      >
                        {avatar}
                      </button>
                    )
                  })}
                </div>
                {room?.players && Object.keys(room.players).length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    💡 Grijze avatars zijn al in gebruik door andere spelers
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('roomCode')}
                  className="flex-1 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors font-semibold"
                >
                  ← Terug
                </button>
                <button
                  type="submit"
                  className="neon-button flex-1"
                  disabled={!playerName.trim()}
                >
                  Start! 🚀
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
