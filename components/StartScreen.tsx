'use client'

import { Users, Crown, Gamepad2, BarChart3, Languages, TrendingUp, Trophy } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface StartScreenProps {
  onSelectRole: (role: 'host' | 'player') => void
  onBypass?: () => void
  onSignOut?: () => void
  userName?: string
  lobbyCode?: string
}

export default function StartScreen({ onSelectRole, onBypass, onSignOut, userName, lobbyCode }: StartScreenProps) {
  const { language, setLanguage, t } = useLanguage()

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

        {/* User Info - Only show when logged in */}
        {userName && (
          <div className="crypto-card mb-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-neon-blue font-semibold">👋 Hi {userName}!</p>
                {lobbyCode && (
                  <p className="text-gray-300 text-sm">
                    Lobby Code: <span className="text-neon-gold font-mono">{lobbyCode}</span>
                  </p>
                )}
                {!lobbyCode && (
                  <p className="text-red-400 text-sm">
                    No lobby code - subscription needed
                  </p>
                )}
              </div>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}

        {/* Role Selection Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Host Option */}
          <button
            onClick={() => onSelectRole('host')}
            className="crypto-card bg-gradient-to-br from-gray-900/95 via-purple-500/5 to-gray-900/95 border-2 border-purple-500/70 ring-1 ring-purple-500/40 hover:border-purple-500/90 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 group cursor-pointer"
          >
            <div className="px-4 py-5 text-center space-y-3">
              {/* Icoon boven titel */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-neon-blue/20 rounded-full group-hover:bg-neon-blue/30 transition-colors">
                  <Crown className="w-8 h-8 text-neon-blue" />
                </div>
                <h2 className="text-2xl font-bold text-white" suppressHydrationWarning>{t('startScreen.hosting')}</h2>
              </div>
            </div>
          </button>

          {/* Player Option */}
          <button
            onClick={() => onSelectRole('player')}
            className="crypto-card bg-gradient-to-br from-gray-900/95 via-purple-500/5 to-gray-900/95 border-2 border-purple-500/70 ring-1 ring-purple-500/40 hover:border-purple-500/90 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 group cursor-pointer"
          >
            <div className="px-4 py-5 text-center space-y-3">
              {/* Icoon boven titel */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-neon-purple/20 rounded-full group-hover:bg-neon-purple/30 transition-colors">
                  <Users className="w-8 h-8 text-neon-purple" />
                </div>
                <h2 className="text-2xl font-bold text-white" suppressHydrationWarning>{t('startScreen.playing')}</h2>
              </div>
            </div>
          </button>
        </div>

        {/* Bypass Button */}
        {onBypass && (
          <div className="mt-6">
            <button
              onClick={onBypass}
              className="w-full py-4 border-2 border-orange-500 hover:border-orange-600 text-orange-500 hover:text-orange-600 font-bold rounded-xl transition-all duration-300"
            >
              <span suppressHydrationWarning>🚀 {t('startScreen.bypassStripe')}</span>
            </button>
          </div>
        )}

        {/* Language Selector */}
        <div className="crypto-card mt-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Languages className="w-5 h-5 text-neon-blue" />
            <h3 className="text-lg font-bold text-white" suppressHydrationWarning>{t('common.selectLanguage')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setLanguage('nl')}
              className={`p-3 rounded-lg border-2 transition-all duration-200 text-center font-semibold ${
                language === 'nl'
                  ? 'border-neon-blue bg-neon-blue/20 text-neon-blue'
                  : 'border-gray-500/50 hover:border-gray-400 text-gray-400 hover:text-gray-300 bg-gray-600/10'
              }`}
            >
              🇳🇱 Nederlands
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`p-3 rounded-lg border-2 transition-all duration-200 text-center font-semibold ${
                language === 'en'
                  ? 'border-neon-blue bg-neon-blue/20 text-neon-blue'
                  : 'border-gray-500/50 hover:border-gray-400 text-gray-400 hover:text-gray-300 bg-gray-600/10'
              }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`p-3 rounded-lg border-2 transition-all duration-200 text-center font-semibold ${
                language === 'fr'
                  ? 'border-neon-blue bg-neon-blue/20 text-neon-blue'
                  : 'border-gray-500/50 hover:border-gray-400 text-gray-400 hover:text-gray-300 bg-gray-600/10'
              }`}
            >
              🇫🇷 Français
            </button>
          </div>
        </div>

        {/* Game Info - USPs */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Multiplayer Trading */}
          <div className="crypto-card text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-neon-purple/20 rounded-full">
                <Users className="w-8 h-8 text-neon-purple" />
              </div>
              <h4 className="text-neon-gold font-bold text-lg">{t('startScreen.features.multiplayer.title')}</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{t('startScreen.features.multiplayer.desc')}</p>
            </div>
          </div>

          {/* Live Market */}
          <div className="crypto-card text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-neon-turquoise/20 rounded-full">
                <TrendingUp className="w-8 h-8 text-neon-turquoise" />
              </div>
              <h4 className="text-neon-gold font-bold text-lg">{t('startScreen.features.liveMarket.title')}</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{t('startScreen.features.liveMarket.desc')}</p>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="crypto-card text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-neon-gold/20 rounded-full">
                <Trophy className="w-8 h-8 text-neon-gold" />
              </div>
              <h4 className="text-neon-gold font-bold text-lg">{t('startScreen.features.leaderboard.title')}</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{t('startScreen.features.leaderboard.desc')}</p>
            </div>
          </div>
        </div>

        {/* Privacy Policy Link */}
        <div className="mt-8 text-center">
          <a 
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-neon-gold transition-colors text-sm underline"
          >
            Privacybeleid
          </a>
        </div>
      </div>
    </div>
  )
}
