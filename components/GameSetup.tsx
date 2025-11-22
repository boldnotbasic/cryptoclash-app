'use client'

import { useState } from 'react'
import { Clock, Play, Globe, ArrowLeft } from 'lucide-react'

interface GameSetupProps {
  onStartGame: (startYear: number, gameDuration: number, language: string) => void
  onBack: () => void
}

export default function GameSetup({ onStartGame, onBack }: GameSetupProps) {
  const [gameDuration, setGameDuration] = useState(1)
  const [language, setLanguage] = useState('nl')

  const currentYear = new Date().getFullYear()
  const endYear = currentYear + gameDuration

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (gameDuration >= 1 && gameDuration <= 10) {
      onStartGame(currentYear, gameDuration, language)
    }
  }

  const presetDurations = [
    { years: 1, label: '1 Jaar', description: 'Snel spel' },
    { years: 2, label: '2 Jaar', description: 'Gemiddeld spel' },
    { years: 3, label: '3 Jaar', description: 'Lang spel' },
    { years: 5, label: '5 Jaar', description: 'Uitgebreid spel' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="p-3 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple transition-colors mb-6"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">🎮 Nieuw Spel</h1>
            <p className="text-gray-400">Stel je crypto trading game in</p>
          </div>
          
          <div></div> {/* Spacer */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Current Year Display */}
          <div className="crypto-card text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Globe className="w-6 h-6 text-neon-blue" />
              <h2 className="text-2xl font-bold text-white">Start Jaar</h2>
            </div>
            <div className="text-4xl font-bold text-neon-gold mb-2">{currentYear}</div>
            <p className="text-gray-400">Automatisch ingesteld op huidig jaar</p>
          </div>

          {/* Language Selection */}
          <div className="crypto-card">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-6 h-6 text-neon-turquoise" />
              <h2 className="text-2xl font-bold text-white">Taal Keuze</h2>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('nl')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                  language === 'nl'
                    ? 'border-neon-gold bg-neon-gold/20 text-neon-gold'
                    : 'border-gray-600 hover:border-neon-turquoise text-gray-300 hover:text-white'
                }`}
              >
                <div className="text-2xl mb-1">🇳🇱</div>
                <div className="text-sm font-bold">NL</div>
              </button>
              
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                  language === 'en'
                    ? 'border-neon-gold bg-neon-gold/20 text-neon-gold'
                    : 'border-gray-600 hover:border-neon-turquoise text-gray-300 hover:text-white'
                }`}
              >
                <div className="text-2xl mb-1">🇬🇧</div>
                <div className="text-sm font-bold">EN</div>
              </button>
              
              <button
                type="button"
                onClick={() => setLanguage('de')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                  language === 'de'
                    ? 'border-neon-gold bg-neon-gold/20 text-neon-gold'
                    : 'border-gray-600 hover:border-neon-turquoise text-gray-300 hover:text-white'
                }`}
              >
                <div className="text-2xl mb-1">🇩🇪</div>
                <div className="text-sm font-bold">DE</div>
              </button>
              
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                  language === 'fr'
                    ? 'border-neon-gold bg-neon-gold/20 text-neon-gold'
                    : 'border-gray-600 hover:border-neon-turquoise text-gray-300 hover:text-white'
                }`}
              >
                <div className="text-2xl mb-1">🇫🇷</div>
                <div className="text-sm font-bold">FR</div>
              </button>
            </div>
          </div>

          {/* Game Duration Selection */}
          <div className="crypto-card">
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="w-6 h-6 text-neon-turquoise" />
              <h2 className="text-2xl font-bold text-white">Spel Duur</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-white font-semibold min-w-[100px]">Jaren:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={gameDuration}
                  onChange={(e) => setGameDuration(parseInt(e.target.value))}
                  className="flex-1 p-3 bg-dark-bg border-2 border-neon-turquoise rounded-lg text-white font-bold text-xl focus:border-neon-gold focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presetDurations.map((preset) => (
                  <button
                    key={preset.years}
                    type="button"
                    onClick={() => setGameDuration(preset.years)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      gameDuration === preset.years
                        ? 'border-neon-turquoise bg-neon-turquoise/20 text-neon-turquoise'
                        : 'border-gray-600 hover:border-neon-turquoise text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-lg">{preset.label}</div>
                    <div className="text-sm opacity-80">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Game Summary */}
          <div className="crypto-card bg-gradient-to-r from-neon-purple/20 to-neon-gold/20">
            <div className="flex items-center space-x-3 mb-4">
              <Play className="w-6 h-6 text-neon-gold" />
              <h3 className="text-xl font-bold text-white">Spel Overzicht</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-gray-400 text-sm">Start Jaar</p>
                <p className="text-3xl font-bold text-neon-blue">{currentYear}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Spel Duur</p>
                <p className="text-3xl font-bold text-neon-turquoise">{gameDuration} jaar</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Taal</p>
                <p className="text-3xl font-bold text-neon-gold">
                  {language === 'nl' ? '🇳🇱' : 
                   language === 'en' ? '🇬🇧' :
                   language === 'de' ? '🇩🇪' : 
                   language === 'fr' ? '🇫🇷' : '🇳🇱'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-dark-bg/50 rounded-lg">
              <p className="text-center text-gray-300">
                🎯 <strong>Doel:</strong> Bouw de grootste crypto portefeuille op in {gameDuration} jaar!
              </p>
              <p className="text-center text-gray-400 text-sm mt-2">
                Het spel eindigt automatisch na {gameDuration} {gameDuration === 1 ? 'jaar' : 'jaar'}.
              </p>
            </div>
          </div>

          {/* Start Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-neon-purple to-neon-gold text-white font-bold py-4 px-6 rounded-lg shadow-neon-gold transition-all duration-300 hover:shadow-neon-purple hover:scale-105 flex items-center justify-center space-x-3 text-xl"
          >
            <Play className="w-6 h-6" />
            <span>Start Spel!</span>
          </button>
        </form>
      </div>
    </div>
  )
}
