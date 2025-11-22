'use client'

import { ArrowLeft, Clock, User } from 'lucide-react'
import Header from './Header'

interface ScanAction {
  id: string
  timestamp: number
  player: string
  action: string
  effect: string
  avatar?: string
}

interface ScanTranscriptProps {
  playerName: string
  playerAvatar: string
  playerScanActions: ScanAction[]
  autoScanActions: ScanAction[]
  onBack: () => void
}

export default function ScanTranscript({ 
  playerName, 
  playerAvatar, 
  playerScanActions, 
  autoScanActions, 
  onBack 
}: ScanTranscriptProps) {
  // Combine and sort all scan actions
  const allScans = [...playerScanActions, ...autoScanActions]
    .sort((a, b) => b.timestamp - a.timestamp)

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('nl-NL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-4xl mx-auto">
        <Header playerName={playerName} playerAvatar={playerAvatar} onLogoClick={onBack} />

        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onBack}
            className="p-3 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Scan Transcript</h1>
            <p className="text-gray-400">Volledige geschiedenis van alle scan acties</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="crypto-card text-center">
            <p className="text-gray-400 text-sm">Totaal Scans</p>
            <p className="text-2xl font-bold text-neon-blue">{allScans.length}</p>
          </div>
          
          <div className="crypto-card text-center">
            <p className="text-gray-400 text-sm">Jouw Scans</p>
            <p className="text-2xl font-bold text-neon-gold">{playerScanActions.length}</p>
          </div>
          
          <div className="crypto-card text-center">
            <p className="text-gray-400 text-sm">Live Activiteit</p>
            <p className="text-2xl font-bold text-neon-turquoise">{autoScanActions.length}</p>
          </div>
        </div>

        {/* Scan History */}
        <div className="crypto-card">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Scan Geschiedenis</span>
          </h2>
          
          {allScans.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-gray-400 text-lg">Nog geen scan acties</p>
              <p className="text-gray-500 text-sm mt-2">Scan een QR code om te beginnen!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allScans.map((action, index) => (
                <div 
                  key={action.id} 
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                    action.player === playerName 
                      ? 'bg-neon-gold/10 border border-neon-gold/30' 
                      : 'bg-dark-bg/30 hover:bg-dark-bg/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">
                        {action.avatar || (action.player === playerName ? playerAvatar :
                         action.player === 'Bot' ? '🤖' :
                         action.player === 'CryptoMaster' ? '🚀' : 
                         action.player === 'BlockchainBoss' ? '💎' : '⚡')}
                      </span>
                      <div>
                        <p className={`font-semibold ${
                          action.player === playerName ? 'text-neon-gold' : 'text-white'
                        }`}>
                          {action.player}
                          {action.player === playerName && (
                            <span className="ml-2 text-xs bg-neon-gold text-dark-bg px-2 py-1 rounded-full font-bold">
                              JIJ
                            </span>
                          )}
                        </p>
                        <p className="text-gray-400 text-sm">{action.action}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold ${
                      action.effect.includes('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {action.effect}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {formatDate(action.timestamp)} {formatTime(action.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
