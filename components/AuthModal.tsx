'use client'

import { useState } from 'react'
import { X, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const { sendMagicLink } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Vul een geldig e-mailadres in')
      setIsLoading(false)
      return
    }

    const { error } = await sendMagicLink(email)
    
    if (error) {
      setError(error.message || 'Er ging iets mis. Probeer opnieuw.')
      setIsLoading(false)
      return
    }

    setEmailSent(true)
    setIsLoading(false)
  }

  const handleClose = () => {
    setEmail('')
    setError(null)
    setEmailSent(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="crypto-card max-w-md w-full mx-4 p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {emailSent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check je inbox!</h2>
            <p className="text-gray-400 mb-4">
              We hebben een magic link gestuurd naar <span className="text-neon-blue">{email}</span>
            </p>
            <p className="text-sm text-gray-500">
              Klik op de link in de email om in te loggen
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-blue/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-neon-blue" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Inloggen</h2>
              <p className="text-gray-400 text-sm">
                Vul je e-mailadres in om een magic link te ontvangen
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.com"
                  className="w-full px-4 py-3 bg-dark-bg/60 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue transition-colors"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Versturen...
                  </>
                ) : (
                  'Verstuur Magic Link'
                )}
              </button>
            </form>

            <p className="text-center text-gray-500 text-xs mt-4">
              Nog geen account? Die wordt automatisch aangemaakt.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
