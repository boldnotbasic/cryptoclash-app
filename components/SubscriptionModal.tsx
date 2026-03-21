'use client'

import { useState } from 'react'
import { X, CreditCard, Loader2, Crown, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getStripe, YEARLY_SUBSCRIPTION_PRICE_ID } from '@/lib/stripe'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  if (!isOpen) return null

  const handleSubscribe = async () => {
    if (!user) {
      setError('Je moet eerst inloggen')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          priceId: YEARLY_SUBSCRIPTION_PRICE_ID
        })
      })

      const { url, error: apiError } = await response.json()

      if (apiError) {
        throw new Error(apiError)
      }

      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="crypto-card max-w-md w-full mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-gold to-yellow-500 flex items-center justify-center">
            <Crown className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">CryptoClash Pro</h2>
          <p className="text-gray-400 text-sm">
            Krijg volledige toegang tot alle features
          </p>
        </div>

        <div className="bg-dark-bg/60 rounded-xl p-4 mb-6 border border-neon-gold/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Jaarabonnement</span>
            <div className="text-right">
              <span className="text-3xl font-bold text-white">€18</span>
              <span className="text-gray-500">/jaar</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Onbeperkt lobby's aanmaken</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Alle game modes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Priority support</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Automatische verlenging</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-neon-gold to-yellow-500 text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Even geduld...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Betalen met iDEAL / Kaart
            </>
          )}
        </button>

        <p className="text-center text-gray-500 text-xs mt-4">
          Veilig betalen via Stripe. Je kunt altijd opzeggen.
        </p>
      </div>
    </div>
  )
}
