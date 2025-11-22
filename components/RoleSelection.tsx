'use client'

import { useState } from 'react'
import { BarChart3, Clock, Globe, ArrowLeft, Sparkles, TrendingUp, Users, Zap } from 'lucide-react'

interface RoleSelectionProps {
  onSelectRole: (role: 'host' | 'player') => void
  onBack?: () => void
}

export default function RoleSelection({ onSelectRole, onBack }: RoleSelectionProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('nl')
  const [selectedDuration, setSelectedDuration] = useState('3')
  const [isAnimating, setIsAnimating] = useState(false)

  const handleStart = () => {
    setIsAnimating(true)
    setTimeout(() => {
      onSelectRole('host')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/20 to-blue-900/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-neon-purple/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-neon-blue/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-neon-turquoise/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8 relative">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full blur-lg opacity-50 animate-pulse"></div>
              <div className="relative p-8 bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 rounded-full border-2 border-neon-blue/50 backdrop-blur-sm">
                <BarChart3 className="w-20 h-20 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-neon-gold animate-bounce" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-neon-blue to-neon-purple bg-clip-text text-transparent mb-4 animate-pulse">
              Market Screen Setup
            </h1>
            <p className="text-2xl text-gray-300 font-light">Configureer je professionele marktdashboard</p>
            <div className="flex justify-center items-center space-x-6 mt-6">
              <div className="flex items-center space-x-2 text-neon-turquoise">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-semibold">Live Data</span>
              </div>
              <div className="flex items-center space-x-2 text-neon-gold">
                <Users className="w-5 h-5" />
                <span className="text-sm font-semibold">Multi-Player</span>
              </div>
              <div className="flex items-center space-x-2 text-neon-purple">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-semibold">Real-Time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Language Selection */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-gold/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-card-bg/90 to-dark-bg/90 backdrop-blur-sm rounded-2xl p-8 border border-neon-purple/30 group-hover:border-neon-purple/50 transition-all duration-300 hover:scale-105">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-neon-purple/30 rounded-full blur-md animate-pulse"></div>
                  <div className="relative p-6 bg-gradient-to-br from-neon-purple/20 to-neon-gold/20 rounded-full border border-neon-purple/40">
                    <Globe className="w-12 h-12 text-neon-purple drop-shadow-lg" />
                  </div>
                </div>
                
                <div className="text-center w-full">
                  <h3 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-neon-purple to-neon-gold bg-clip-text text-transparent">Interface Taal</h3>
                  <p className="text-gray-300 text-lg mb-6">Kies je voorkeurstaal</p>
                  
                  <div className="space-y-3">
                    {[
                      { value: 'nl', flag: '🇳🇱', name: 'Nederlands', desc: 'Standaard taal' },
                      { value: 'en', flag: '🇬🇧', name: 'English', desc: 'International' },
                      { value: 'fr', flag: '🇫🇷', name: 'Français', desc: 'Langue française' },
                      { value: 'de', flag: '🇩🇪', name: 'Deutsch', desc: 'Deutsche Sprache' }
                    ].map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => setSelectedLanguage(lang.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                          selectedLanguage === lang.value
                            ? 'bg-gradient-to-r from-neon-purple/20 to-neon-gold/20 border-neon-purple text-white shadow-neon'
                            : 'bg-dark-bg/50 border-gray-600/50 text-gray-300 hover:border-neon-purple/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{lang.flag}</span>
                            <div className="text-left">
                              <div className="font-bold">{lang.name}</div>
                              <div className="text-sm opacity-70">{lang.desc}</div>
                            </div>
                          </div>
                          {selectedLanguage === lang.value && (
                            <div className="w-3 h-3 bg-neon-gold rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Year Selection */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-neon-turquoise/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-card-bg/90 to-dark-bg/90 backdrop-blur-sm rounded-2xl p-8 border border-neon-blue/30 group-hover:border-neon-blue/50 transition-all duration-300 hover:scale-105">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-neon-blue/30 rounded-full blur-md animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <div className="relative p-6 bg-gradient-to-br from-neon-blue/20 to-neon-turquoise/20 rounded-full border border-neon-blue/40">
                    <Clock className="w-12 h-12 text-neon-blue drop-shadow-lg" />
                  </div>
                </div>
                
                <div className="text-center w-full">
                  <h3 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-neon-blue to-neon-turquoise bg-clip-text text-transparent">Spelduur</h3>
                  <p className="text-gray-300 text-lg mb-6">Hoeveel jaar duurt het spel?</p>
                  
                  <div className="space-y-3">
                    {[
                      { value: '1', name: '1 Jaar', desc: 'Snel spel', emoji: '⚡', color: 'from-yellow-500/20 to-orange-500/20' },
                      { value: '2', name: '2 Jaar', desc: 'Kort spel', emoji: '🏃', color: 'from-orange-500/20 to-red-500/20' },
                      { value: '3', name: '3 Jaar', desc: 'Standaard spel', emoji: '🎯', color: 'from-neon-blue/20 to-neon-turquoise/20' },
                      { value: '5', name: '5 Jaar', desc: 'Lang spel', emoji: '🏔️', color: 'from-green-500/20 to-blue-500/20' },
                      { value: '10', name: '10 Jaar', desc: 'Epic spel', emoji: '🚀', color: 'from-purple-500/20 to-pink-500/20' }
                    ].map((duration) => (
                      <button
                        key={duration.value}
                        onClick={() => setSelectedDuration(duration.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                          selectedDuration === duration.value
                            ? `bg-gradient-to-r ${duration.color} border-neon-blue text-white shadow-neon-blue`
                            : 'bg-dark-bg/50 border-gray-600/50 text-gray-300 hover:border-neon-blue/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{duration.emoji}</span>
                            <div className="text-left">
                              <div className="font-bold">{duration.name}</div>
                              <div className="text-sm opacity-70">{duration.desc}</div>
                            </div>
                          </div>
                          {selectedDuration === duration.value && (
                            <div className="w-3 h-3 bg-neon-turquoise rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-turquoise rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300 animate-pulse"></div>
            <button
              onClick={handleStart}
              disabled={isAnimating}
              className={`relative bg-gradient-to-r from-neon-blue via-neon-purple to-neon-turquoise text-white font-bold py-6 px-16 rounded-2xl shadow-2xl transition-all duration-500 hover:scale-110 flex items-center justify-center space-x-4 text-xl border-2 border-white/20 ${
                isAnimating ? 'animate-pulse scale-110' : 'hover:shadow-neon-gold'
              }`}
            >
              {isAnimating ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Dashboard Laden...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-8 h-8 drop-shadow-lg" />
                  <span className="drop-shadow-lg">Start Market Dashboard</span>
                  <Sparkles className="w-6 h-6 animate-bounce" />
                </>
              )}
            </button>
          </div>
          
          {onBack && (
            <button
              onClick={onBack}
              className="py-4 px-8 bg-dark-bg/50 hover:bg-dark-bg/70 border-2 border-gray-600/50 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 backdrop-blur-sm hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Terug naar Kamer</span>
            </button>
          )}
        </div>

        {/* Features Preview */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-gold/10 via-transparent to-neon-purple/10 rounded-3xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-card-bg/50 to-dark-bg/50 backdrop-blur-sm rounded-3xl p-8 border border-neon-gold/30">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-neon-gold via-neon-purple to-neon-turquoise bg-clip-text text-transparent mb-2">
                🚀 Market Dashboard Features
              </h3>
              <p className="text-gray-400">Professionele tools voor de ultieme trading ervaring</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '📈', title: 'Live Koersen', desc: 'Real-time crypto prijzen', color: 'neon-green' },
                { icon: '👥', title: 'Speler Status', desc: 'Live portfolio tracking', color: 'neon-blue' },
                { icon: '🏆', title: 'Rankings', desc: 'Competitieve leaderboards', color: 'neon-gold' },
                { icon: '📊', title: 'Markt Stats', desc: 'Geavanceerde analytics', color: 'neon-purple' }
              ].map((feature, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="relative flex flex-col items-center space-y-3 p-4 rounded-xl border border-gray-700/50 group-hover:border-neon-gold/50 transition-all duration-300 hover:scale-105">
                    <div className="text-4xl animate-bounce" style={{animationDelay: `${index * 0.2}s`}}>
                      {feature.icon}
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white text-lg">{feature.title}</div>
                      <div className="text-sm text-gray-400 mt-1">{feature.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
