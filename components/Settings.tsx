'use client'

import { Settings as SettingsIcon, Globe, Palette, Moon, Sun, Check } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

interface SettingsProps {
  onBack: () => void
}

type Language = 'nl' | 'en' | 'fr' | 'de'
type Theme = 'dark' | 'light'

const languages = [
  { code: 'nl' as Language, name: 'Nederlands', flag: '🇳🇱' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' }
]

export default function Settings({ onBack }: SettingsProps) {
  const { language: currentLanguage, theme: currentTheme, setLanguage, setTheme } = useApp()

  const getThemeClasses = () => {
    if (currentTheme === 'light') {
      return {
        bg: 'bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50',
        card: 'bg-white border-gray-200 shadow-lg',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        accent: 'text-blue-600'
      }
    }
    return {
      bg: 'bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10',
      card: 'crypto-card',
      text: 'text-white',
      textSecondary: 'text-gray-400',
      button: 'neon-button',
      accent: 'text-neon-gold'
    }
  }

  const themeClasses = getThemeClasses()

  return (
    <div className={`min-h-screen ${themeClasses.bg} p-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className={themeClasses.button}
          >
            ← Terug naar Menu
          </button>
          
          <div className="flex items-center space-x-2">
            <SettingsIcon className={`w-8 h-8 ${themeClasses.accent}`} />
            <div>
              <h1 className={`text-3xl font-bold ${themeClasses.text}`}>Instellingen</h1>
              <p className={themeClasses.textSecondary}>Pas je app voorkeuren aan</p>
            </div>
          </div>
          
          <div></div> {/* Spacer for centering */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Language Settings */}
          <div className={`${themeClasses.card} p-6`}>
            <div className="flex items-center space-x-3 mb-6">
              <Globe className={`w-6 h-6 ${themeClasses.accent}`} />
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Taal / Language</h2>
            </div>
            
            <div className="space-y-3">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => setLanguage(language.code)}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                    currentLanguage === language.code
                      ? currentTheme === 'light' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-neon-gold bg-neon-gold/10'
                      : currentTheme === 'light'
                        ? 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        : 'border-gray-600 hover:border-gray-500 bg-dark-bg/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{language.flag}</span>
                    <span className={`font-semibold ${themeClasses.text}`}>{language.name}</span>
                  </div>
                  {currentLanguage === language.code && (
                    <Check className={`w-5 h-5 ${themeClasses.accent}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Settings */}
          <div className={`${themeClasses.card} p-6`}>
            <div className="flex items-center space-x-3 mb-6">
              <Palette className={`w-6 h-6 ${themeClasses.accent}`} />
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Thema</h2>
            </div>
            
            <div className="space-y-3">
              {/* Dark Theme */}
              <button
                onClick={() => setTheme('dark')}
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
                    <p className={`font-semibold ${themeClasses.text}`}>Donker Thema</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Neon kleuren en donkere achtergrond</p>
                  </div>
                </div>
                {currentTheme === 'dark' && (
                  <Check className={`w-5 h-5 ${themeClasses.accent}`} />
                )}
              </button>

              {/* Light Theme */}
              <button
                onClick={() => setTheme('light')}
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
                    <p className={`font-semibold ${themeClasses.text}`}>Licht Thema</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Heldere kleuren en lichte achtergrond</p>
                  </div>
                </div>
                {currentTheme === 'light' && (
                  <Check className={`w-5 h-5 ${themeClasses.accent}`} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className={`mt-8 ${themeClasses.card} p-6`}>
          <h3 className={`text-xl font-bold ${themeClasses.text} mb-4`}>Voorbeeld</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${currentTheme === 'light' ? 'bg-blue-50 border border-blue-200' : 'bg-neon-purple/20 border border-neon-purple'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">⚡</span>
                <span className={`font-bold ${themeClasses.text}`}>Virticoin</span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'light' ? 'text-blue-600' : 'text-neon-gold'}`}>
                €1,250.50
              </p>
              <p className={`text-sm ${currentTheme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                +5.2%
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${currentTheme === 'light' ? 'bg-green-50 border border-green-200' : 'bg-neon-turquoise/20 border border-neon-turquoise'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">📊</span>
                <span className={`font-bold ${themeClasses.text}`}>LedgerX</span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'light' ? 'text-green-600' : 'text-neon-gold'}`}>
                €445.75
              </p>
              <p className={`text-sm ${currentTheme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                +8.7%
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${currentTheme === 'light' ? 'bg-orange-50 border border-orange-200' : 'bg-neon-gold/20 border border-neon-gold'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">₿</span>
                <span className={`font-bold ${themeClasses.text}`}>BitCoin</span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme === 'light' ? 'text-orange-600' : 'text-neon-gold'}`}>
                €3,450.00
              </p>
              <p className={`text-sm ${currentTheme === 'light' ? 'text-red-600' : 'text-red-400'}`}>
                -0.8%
              </p>
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
