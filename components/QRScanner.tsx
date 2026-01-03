'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, Zap, ArrowLeft, MessageSquare } from 'lucide-react'
import Header from './Header'
import EventPopup, { ScanEffect } from './EventPopup'

interface QRScannerProps {
  onScan: (effect: ScanEffect) => void
  onClose: () => void
  playerName: string
  playerAvatar: string
}

export default function QRScanner({ onScan, onClose, playerName, playerAvatar }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [showScanResult, setShowScanResult] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const audioUnlockedRef = useRef(false)

  // iOS / mobile: één keer audio "unlocken" bij eerste echte user-tap
  const unlockAudio = async () => {
    if (audioUnlockedRef.current) return
    try {
      const audio = new Audio('/chime_success.wav')
      audio.volume = 0
      await audio.play()
      audio.pause()
      audio.currentTime = 0
      audioUnlockedRef.current = true
      console.log('🔊 Audio unlocked for iOS')
    } catch (err) {
      console.warn('Audio unlock failed', err)
    }
  }

  useEffect(() => {
    requestCameraPermission()
    return () => {
      stopCamera()
    }
  }, [])

  const ensureVideoPlaying = async () => {
    if (!videoRef.current) return
    try {
      // iOS requires explicit attributes
      videoRef.current.setAttribute('playsinline', 'true')
      videoRef.current.setAttribute('webkit-playsinline', 'true' as any)
      videoRef.current.setAttribute('autoplay', 'true')
      videoRef.current.setAttribute('muted', 'true')
      videoRef.current.muted = true
      await videoRef.current.play()
      setVideoReady(true)
    } catch (e) {
      console.warn('Video play failed, will retry onloadedmetadata', e)
      videoRef.current.onloadedmetadata = async () => {
        try { await videoRef.current?.play(); setVideoReady(true) } catch {}
      }
    }
  }

  const pickRearCameraDeviceId = async (): Promise<string | undefined> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')
      // Try to find labels that hint back camera
      const rear = videoDevices.find(d => /back|rear|environment/i.test(d.label))
      return (rear || videoDevices[videoDevices.length - 1])?.deviceId
    } catch (e) {
      console.warn('enumerateDevices failed', e)
      return undefined
    }
  }

  const requestCameraPermission = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('Camera API not available, using simulation mode')
        setHasPermission(false)
        setError('Camera niet beschikbaar. Gebruik de simulatie knoppen hieronder.')
        return
      }

      // Prefer explicit rear device when possible (iOS reliability)
      let stream: MediaStream
      const rearId = await pickRearCameraDeviceId()
      if (rearId) {
        console.log('Using explicit rear camera deviceId', rearId)
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { deviceId: { exact: rearId } }
        })
      } else {
        console.log('Rear camera deviceId not found, falling back to facingMode')
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } }
        })
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        await ensureVideoPlaying()
      }
      
      setHasPermission(true)
    } catch (err) {
      console.error('Camera access denied:', err)
      setHasPermission(false)
      setError('Camera niet beschikbaar. Gebruik de simulatie knoppen hieronder.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const simulateQRScan = async () => {
    console.log('simulateQRScan called')
    setIsScanning(true)

    // Probeer audio te unlocken op eerste tap (voor iOS Safari)
    await unlockAudio()

    // Simuleer scan delay
    setTimeout(() => {
      console.log('Scan delay finished, showing result')
      setIsScanning(false)
      setShowScanResult(true)
    }, 1500)
  }

  const handleScanResult = (effect: ScanEffect) => {
    onScan(effect)
  }

  const closeScanResult = () => {
    console.log('closeScanResult called')
    setShowScanResult(false)
  }

  if (hasPermission === null) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="crypto-card text-center">
          <Camera className="w-16 h-16 text-neon-blue mx-auto mb-4 animate-pulse-neon" />
          <h2 className="text-xl font-bold text-white mb-2">Camera Toegang Aanvragen</h2>
          <p className="text-gray-400">Wachten op camera permissie...</p>
        </div>
      </div>
    )
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
        <div className="max-w-6xl mx-auto">
          <Header playerName={playerName} playerAvatar={playerAvatar} onLogoClick={onClose} />
          <div className="flex items-center justify-center">
            <div className="crypto-card text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 text-yellow-400">
            <Camera className="w-16 h-16" />
          </div>
          <h2 className="text-xl font-bold text-white mb-4">🎮 Simulatie Modus</h2>
          <p className="text-gray-400 mb-6">Camera niet beschikbaar, maar je kunt wel de simulatie knoppen gebruiken!</p>
          
          <div className="space-y-4">
            <button
              onClick={simulateQRScan}
              className="neon-button w-full flex items-center justify-center space-x-2"
              disabled={isScanning}
            >
              <Zap className="w-5 h-5" />
              <span>{isScanning ? 'Scannen...' : '⚡ Test Scan'}</span>
            </button>

            <button
              onClick={requestCameraPermission}
              className="neon-button w-full flex items-center justify-center space-x-2 bg-neon-blue/80 hover:bg-neon-blue"
            >
              <Camera className="w-5 h-5" />
              <span>Real-time scan</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-full py-3 px-6 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Terug
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-neon-gold/10 border border-neon-gold/30 rounded-lg">
            <p className="text-neon-gold text-sm">
              💡 <strong>Tip:</strong> Beide knoppen tonen random success meldingen met markteffecten!
            </p>
          </div>
        </div>
        
        
        {/* Scan Result Modal */}
        {showScanResult && (
          <EventPopup 
            onClose={closeScanResult}
            onApplyEffect={handleScanResult}
          />
        )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header playerName={playerName} playerAvatar={playerAvatar} onLogoClick={onClose} />
        
        <div className="relative bg-dark-bg rounded-lg overflow-hidden" style={{ height: '70vh' }}>

      {/* Camera View */}
      <div className="relative w-full h-screen">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          autoPlay
          muted
        />
        
        {/* Scan Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Scan Frame */}
            <div className="w-64 h-64 border-4 border-neon-turquoise rounded-lg relative animate-pulse-neon">
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-neon-gold rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-neon-gold rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-neon-gold rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-neon-gold rounded-br-lg"></div>
              
              {/* Scanning Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-purple to-transparent animate-bounce-slow"></div>
            </div>
            
            {/* Instructions */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-white font-semibold mb-2">Richt camera op QR code</p>
              <p className="text-gray-400 text-sm">Houd stil voor automatische scan</p>
            </div>
          </div>
        </div>

        {/* Canvas for QR detection (hidden) */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width="640"
          height="480"
        />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-bg to-transparent">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-center space-x-4">
            <button
              onClick={simulateQRScan}
              className="neon-button flex items-center space-x-2"
              disabled={isScanning}
            >
              <Zap className="w-5 h-5" />
              <span>{isScanning ? 'Scannen...' : 'Test Scan'}</span>
            </button>
            {!videoReady && (
              <button
                onClick={async () => { await ensureVideoPlaying() }}
                className="neon-button flex items-center space-x-2 bg-neon-blue/80 hover:bg-neon-blue"
              >
                <Camera className="w-5 h-5" />
                <span>Start camera</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center space-x-2 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Terug</span>
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            💡 Tip: Scan kaarten voor koerswijzigingen en speciale events!
          </p>
        </div>
      </div>

      {/* Scanning Animation Overlay */}
      {isScanning && (
        <div className="absolute inset-0 bg-dark-bg/80 flex items-center justify-center z-20">
          <div className="crypto-card text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <Zap className="w-16 h-16 text-neon-purple animate-pulse-neon" />
              <div className="absolute inset-0 border-4 border-neon-turquoise rounded-full animate-spin border-t-transparent"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">QR Code Scannen...</h3>
            <p className="text-gray-400">Verwerken van marktdata</p>
          </div>
        </div>
      )}

      {/* Scan Result Modal */}
      {showScanResult && (
        <EventPopup 
          onClose={closeScanResult}
          onApplyEffect={handleScanResult}
        />
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 left-4 bg-black/80 text-white p-2 rounded text-xs">
          showScanResult: {showScanResult.toString()}
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
