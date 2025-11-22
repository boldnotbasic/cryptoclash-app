'use client'

import { useState } from 'react'
import { Zap, Coins, TrendingUp, RefreshCw } from 'lucide-react'

// List of 20 random avatars
const avatars = [
  '👑', '🚀', '💎', '⚡️', '💀', '🦊', '🦄', '🤖', '👾', '👽', 
  '👻', '🦁', '🐲', '🦉', '🦅', '🦈', '🐙', '🤯', '😎', '🤠'
];

interface LoginScreenProps {
  onLogin: (name: string, avatar: string) => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (playerName.trim()) {
      onLogin(playerName.trim(), selectedAvatar)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg via-purple-900/20 to-blue-900/20">
      <div className="max-w-md w-full mx-4">
        {/* Logo en Titel */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/cryptoclash-logo.png"
              alt="CryptoClash"
              className="h-40 md:h-66 drop-shadow-[0_8px_30px_rgba(139,92,246,0.6)]"
            />
          </div>
        </div>

        {/* Login Form */}
        <div className="crypto-card">
          <div className="flex items-center justify-center mb-6">
            <TrendingUp className="w-6 h-6 text-neon-turquoise mr-2" />
            <h2 className="text-xl font-semibold text-white">Welkom Speler!</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                {avatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`text-3xl p-2 rounded-lg transition-all duration-200 ${ 
                      selectedAvatar === avatar 
                        ? 'bg-neon-gold/30 ring-2 ring-neon-gold scale-110' 
                        : 'bg-dark-bg/50 hover:bg-neon-purple/20'
                    }`}>
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              className="neon-button w-full"
              disabled={!playerName.trim()}
            >
              Start CryptoClash! 🚀
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
