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
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/Collage_logo.png"
              alt="CryptoClash"
              className="w-[50vw] md:w-[30vw] h-auto max-h-[80vh] drop-shadow-[0_8px_30px_rgba(139,92,246,0.6)]"
            />
          </div>
          <h1 className="sr-only">CryptoClash</h1>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Host Option */}
          <button
            onClick={() => onSelectRole('host')}
            className="crypto-card hover:scale-105 transition-all duration-300 hover:shadow-neon-blue group cursor-pointer border-2 border-transparent hover:border-neon-blue/50"
          >
            <div className="px-4 py-5 text-center space-y-3">
              {/* Icoon boven titel */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-neon-blue/20 rounded-full group-hover:bg-neon-blue/30 transition-colors">
                  <Crown className="w-8 h-8 text-neon-blue" />
                </div>
                <h2 className="text-2xl font-bold text-white">Hosting</h2>
              </div>
            </div>
          </button>

          {/* Player Option */}
          <button
            onClick={() => onSelectRole('player')}
            className="crypto-card hover:scale-105 transition-all duration-300 hover:shadow-neon-purple group cursor-pointer border-2 border-transparent hover:border-neon-purple/50"
          >
            <div className="px-4 py-5 text-center space-y-3">
              {/* Icoon boven titel */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-neon-purple/20 rounded-full group-hover:bg-neon-purple/30 transition-colors">
                  <Users className="w-8 h-8 text-neon-purple" />
                </div>
                <h2 className="text-2xl font-bold text-white">Spelen</h2>
              </div>
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
