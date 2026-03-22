'use client'

import { Crown, CheckCircle, XCircle } from 'lucide-react'

interface WelcomeScreenProps {
  userName: string
  userEmail: string
  isSubscribed: boolean
  onContinue: () => void
}

export default function WelcomeScreen({ userName, userEmail, isSubscribed, onContinue }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-neon-purple/10 flex items-center justify-center p-4">
      <div className="crypto-card max-w-lg w-full p-8 text-center">
        {/* Welcome Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
          <Crown className="w-10 h-10 text-white" />
        </div>

        {/* Greeting */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Hi {userName}! 👋
        </h1>
        <p className="text-gray-400 text-sm mb-8">{userEmail}</p>

        {/* Subscription Status */}
        <div className={`p-6 rounded-xl border-2 mb-8 ${
          isSubscribed 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            {isSubscribed ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <h2 className={`text-xl font-bold ${
              isSubscribed ? 'text-green-400' : 'text-red-400'
            }`}>
              {isSubscribed ? 'Actief Abonnement' : 'Geen Actief Abonnement'}
            </h2>
          </div>
          <p className="text-gray-300 text-sm">
            {isSubscribed 
              ? 'Je hebt volledige toegang tot alle features' 
              : 'Upgrade om lobby\'s te kunnen aanmaken'}
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full py-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-lg"
        >
          Doorgaan
        </button>
      </div>
    </div>
  )
}
