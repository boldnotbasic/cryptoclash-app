'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { signIn, signUp, user } = useAuth()
  const hasTriggeredSuccess = useRef(false)

  // When user becomes available after login, trigger success
  useEffect(() => {
    if (isOpen && user && isLoading && !hasTriggeredSuccess.current) {
      hasTriggeredSuccess.current = true
      setIsLoading(false)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        hasTriggeredSuccess.current = false
        handleClose()
        onSuccess?.()
      }, 1200)
    }
  }, [user, isOpen, isLoading])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      hasTriggeredSuccess.current = false
      setShowSuccess(false)
    }
  }, [isOpen])

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

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn')
      setIsLoading(false)
      return
    }

    try {
      if (isRegister) {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message || 'Registratie mislukt')
          setIsLoading(false)
          return
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message || 'Inloggen mislukt')
          setIsLoading(false)
          return
        }
      }
      // Success state will be triggered by the useEffect watching `user`
      // If user was already set (rare), handle it directly
      if (user) {
        setIsLoading(false)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          handleClose()
          onSuccess?.()
        }, 1200)
      }
      // Otherwise keep isLoading=true until useEffect detects user
    } catch (err) {
      setError('Er ging iets mis. Probeer opnieuw.')
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setIsRegister(false)
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

        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ingelogd!</h2>
            <p className="text-gray-400 text-sm">Welkom terug, je wordt doorgestuurd...</p>
          </div>
        ) : (
        <>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-blue/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-neon-blue" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isRegister ? 'Account aanmaken' : 'Inloggen'}
          </h2>
          <p className="text-gray-400 text-sm">
            {isRegister ? 'Maak een account om lobby\'s te kunnen aanmaken' : 'Log in met je account'}
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

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wachtwoord"
              className="w-full px-4 py-3 bg-dark-bg/60 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue transition-colors pr-12"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isRegister ? 'Aanmaken...' : 'Inloggen...'}
              </>
            ) : (
              isRegister ? 'Account aanmaken' : 'Inloggen'
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-4">
          {isRegister ? (
            <>
              Al een account?{' '}
              <button
                onClick={() => { setIsRegister(false); setError(null) }}
                className="text-neon-blue hover:underline"
              >
                Inloggen
              </button>
            </>
          ) : (
            <>
              Nog geen account?{' '}
              <button
                onClick={() => { setIsRegister(true); setError(null) }}
                className="text-neon-blue hover:underline"
              >
                Registreren
              </button>
            </>
          )}
        </p>
        </>
        )}
      </div>
    </div>
  )
}
