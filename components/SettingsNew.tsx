'use client'

import { Settings as SettingsIcon, Globe, Palette, Moon, Sun, Check, ArrowLeft } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import Header from './Header'

type Theme = 'dark' | 'light'

interface SettingsProps {
  onBack: () => void
  playerName: string
  playerAvatar: string
}

type Language = 'nl' | 'en' | 'fr' | 'de'

const languages = [
  { code: 'nl' as Language, name: 'Nederlands', flag: '🇳🇱' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' }
]

export default function Settings({ onBack, playerName, playerAvatar }: SettingsProps) {
  const { language: currentLanguage, theme: currentTheme, setLanguage, setTheme } = useApp()

  return (
    <div className={`min-h-screen p-4 ${currentTheme === 'light' ? 'bg-white' : 'bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10'}`}>
      <div className="max-w-4xl mx-auto">
        <Header playerName={playerName} playerAvatar={playerAvatar} onLogoClick={onBack} />
        
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className={`p-3 rounded-lg transition-colors ${currentTheme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-2">
            <SettingsIcon className={`w-8 h-8 ${currentTheme === 'light' ? 'text-blue-600' : 'text-neon-gold'}`} />
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>Instellingen</h1>
              <p className={currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Pas je app voorkeuren aan</p>
            </div>
          </div>
          
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Language Settings */}
          <div className={`p-6 rounded-lg ${currentTheme === 'light' ? 'bg-white border-gray-200 shadow-lg border' : 'crypto-card'}`}>
            <div className="flex items-center space-x-3 mb-6">
              <Globe className={`w-6 h-6 ${currentTheme === 'light' ? 'text-blue-600' : 'text-neon-gold'}`} />
              <h2 className={`text-2xl font-bold ${currentTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>Taal / Language</h2>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    currentLanguage === lang.code
                      ? 'border-neon-gold bg-neon-gold/20 text-neon-gold'
                      : 'border-gray-600 hover:border-neon-turquoise text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{lang.flag}</div>
                  <div className="text-sm font-bold">{lang.code.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Settings */}
          <div className={`p-6 rounded-lg ${currentTheme === 'light' ? 'bg-white border-gray-200 shadow-lg border' : 'crypto-card'}`}>
            <div className="flex items-center space-x-3 mb-6">
              <Palette className={`w-6 h-6 ${currentTheme === 'light' ? 'text-blue-600' : 'text-neon-gold'}`} />
              <h2 className={`text-2xl font-bold ${currentTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>Thema</h2>
            </div>
            
            <div className="space-y-3">
              {/* Dark Theme */}
              <button
                onClick={() => {
                  console.log('Setting theme to dark')
                  setTheme('dark' as Theme)
                }}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                  currentTheme === 'dark'
                    ? 'border-neon-gold bg-neon-gold/10'
                    : 'border-gray-600 hover:border-gray-500 bg-dark-bg/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-900 rounded-full">
                    <Moon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold ${currentTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>Donker Thema</p>
                    <p className={`text-sm ${currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Neon kleuren en donkere achtergrond</p>
                  </div>
                </div>
                {currentTheme === 'dark' && (
                  <Check className="w-5 h-5 text-neon-gold" />
                )}
              </button>

              {/* Light Theme */}
              <button
                onClick={() => {
                  console.log('Setting theme to light')
                  setTheme('light' as Theme)
                }}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                  currentTheme === 'light'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-600 hover:border-gray-500 bg-dark-bg/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Sun className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold ${currentTheme === 'light' ? 'text-gray-900' : 'text-white'}`}>Licht Thema</p>
                    <p className={`text-sm ${currentTheme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Heldere kleuren en lichte achtergrond</p>
                  </div>
                </div>
                {currentTheme === 'light' && (
                  <Check className={`w-5 h-5 ${currentTheme === 'light' ? 'text-blue-600' : 'text-neon-gold'}`} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save Notice */}
        <div className={`mt-6 p-4 rounded-lg ${currentTheme === 'light' ? 'bg-green-50 border border-green-200' : 'bg-green-900/20 border border-green-500'}`}>
          <p className={`text-center ${currentTheme === 'light' ? 'text-green-800' : 'text-green-400'}`}>
            ✅ Je instellingen worden automatisch opgeslagen
          </p>
        </div>
      </div>
    </div>
  )
}
