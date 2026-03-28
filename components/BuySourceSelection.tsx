'use client'

import { Building2, Users, Landmark, ShoppingCart } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface BuySourceSelectionProps {
  onSelectBank: () => void
  onSelectPlayers: () => void
  onBack: () => void
  activePlayerOrders?: number
}

export default function BuySourceSelection({ 
  onSelectBank, 
  onSelectPlayers, 
  onBack,
  activePlayerOrders = 0 
}: BuySourceSelectionProps) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-white/70 hover:text-white transition-colors flex items-center space-x-2"
          >
            <span>←</span>
            <span>Terug</span>
          </button>
          <h1 className="text-2xl font-bold text-white flex space-x-4"> <ShoppingCart className="w-8 h-8 text-emerald-400" /> Kopen</h1>
          <div className="w-20"></div>
        </div>

        {/* Subtitle */}
        <p className="text-center text-gray-300 mb-8">
          Waar wil je kopen?
        </p>

        {/* Options - side by side tiles */}
        <div className="grid grid-cols-2 gap-4">
          {/* Bank Option */}
          <button
            onClick={onSelectBank}
            className="crypto-card bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/50 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 p-5 text-center group flex flex-col items-center"
          >
            <div className="p-4 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors mb-3">
              <Landmark className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Van Beurs</h3>
            <div className="space-y-1 text-xs text-left w-full">
              <p className="text-gray-300 flex items-start space-x-1">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Vaste marktprijs</span>
              </p>
              <p className="text-gray-300 flex items-start space-x-1">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Directe transactie</span>
              </p>
              <p className="text-gray-300 flex items-start space-x-1">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Altijd beschikbaar</span>
              </p>
            </div>
          </button>

          {/* Players Option */}
          <button
            onClick={onSelectPlayers}
            className="crypto-card bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-2 border-purple-500/50 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 p-5 text-center group flex flex-col items-center"
          >
            <div className="p-4 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors mb-3">
              <Users className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Van Spelers
              {activePlayerOrders > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full">
                  {activePlayerOrders}
                </span>
              )}
            </h3>
            <div className="space-y-1 text-xs text-left w-full">
              <p className="text-gray-300 flex items-start space-x-1">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Koop van spelers</span>
              </p>
              <p className="text-gray-300 flex items-start space-x-1">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Betere prijzen mogelijk</span>
              </p>
              <p className="text-gray-300 flex items-start space-x-1">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{activePlayerOrders} aanbiedingen</span>
              </p>
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 crypto-card bg-blue-500/10 border border-blue-500/30 p-4">
          <p className="text-blue-300 text-sm text-center">
            Tip: Vergelijk prijzen tussen bank en spelers voor de beste deal!
          </p>
        </div>
      </div>
    </div>
  )
}
