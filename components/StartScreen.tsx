'use client'

import { Users, Crown, Gamepad2, BarChart3 } from 'lucide-react'

interface StartScreenProps {
  onSelectRole: (role: 'host' | 'player') => void
}

export default function StartScreen({ onSelectRole }: StartScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img
              src="/cryptoclash-logo.png"
              alt="CryptoClash"
              className="h-40 md:h-66 drop-shadow-[0_8px_30px_rgba(139,92,246,0.6)]"
            />
          </div>
          <h1 className="sr-only">CryptoClash</h1>
          <p className="text-base text-gray-400">Multiplayer Crypto Trading Game</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Host Option */}
          <button
            onClick={() => onSelectRole('host')}
            className="crypto-card hover:scale-105 transition-all duration-300 hover:shadow-neon-blue group cursor-pointer border-2 border-transparent hover:border-neon-blue/50"
          >
            <div className="text-center p-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-neon-blue/20 rounded-full group-hover:bg-neon-blue/30 transition-colors">
                  <Crown className="w-12 h-12 text-neon-blue" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">Hosting</h2>
              <p className="text-gray-400 mb-6">Maak een nieuwe lobby aan en beheer het spel</p>

            </div>
          </button>

          {/* Player Option */}
          <button
            onClick={() => onSelectRole('player')}
            className="crypto-card hover:scale-105 transition-all duration-300 hover:shadow-neon-purple group cursor-pointer border-2 border-transparent hover:border-neon-purple/50"
          >
            <div className="text-center p-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-neon-purple/20 rounded-full group-hover:bg-neon-purple/30 transition-colors">
                  <Users className="w-12 h-12 text-neon-purple" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">Spelen</h2>
              <p className="text-gray-400 mb-6">Join een bestaande lobby en begin met traden</p>
            </div>
          </button>
        </div>

        {/* Game Info */}
        <div className="mt-12 crypto-card">
          <h3 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center space-x-2">
            <BarChart3 className="w-6 h-6 text-neon-turquoise" />
            <span>Over CryptoClash</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div>
              <h4 className="text-neon-gold font-semibold mb-2">🎮 Multiplayer Trading</h4>
              <p className="text-gray-300 text-sm">Compete met andere spelers in real-time crypto trading</p>
            </div>
            <div>
              <h4 className="text-neon-gold font-semibold mb-2">📱 QR Code Boosts</h4>
              <p className="text-gray-300 text-sm">Scan QR codes voor speciale markt effecten en voordelen</p>
            </div>
            <div>
              <h4 className="text-neon-gold font-semibold mb-2">📊 Live Markt</h4>
              <p className="text-gray-300 text-sm">Dynamische prijzen en marktbewegingen tijdens het spel</p>
            </div>
            <div>
              <h4 className="text-neon-gold font-semibold mb-2">🏆 Leaderboard</h4>
              <p className="text-gray-300 text-sm">Zie wie de beste crypto trader is in je groep</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
