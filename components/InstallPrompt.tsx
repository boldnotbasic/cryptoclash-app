'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const { t } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    // Check if user already dismissed prompt
    const dismissed = localStorage.getItem('pwa_install_dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    // Show again after 7 days
    if (dismissedTime > sevenDaysAgo) return

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after 5 seconds
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // For iOS, show prompt after 5 seconds if not installed
    if (ios && !standalone) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
      localStorage.setItem('pwa_install_dismissed', Date.now().toString())
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_install_dismissed', Date.now().toString())
  }

  // Don't show if already installed
  if (isStandalone) return null

  // Don't show if dismissed
  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 border-2 border-purple-500 rounded-xl shadow-2xl shadow-purple-500/20 p-4 max-w-md mx-auto relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
          aria-label={t('install.closeLabel')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-white font-bold text-lg mb-1">{t('install.title')}</h3>
            <p className="text-gray-300 text-sm">
              {t('install.subtitle')}
            </p>
          </div>
        </div>

        {isIOS ? (
          // iOS instructions
          <div className="bg-black/30 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-300 mb-2">
              <strong className="text-white">{t('install.iosHow')}</strong>
            </p>
            <ol className="text-xs text-gray-400 space-y-1 ml-4">
              <li>1. {t('install.iosStep1')} <strong className="text-white">{t('install.iosStep1b')}</strong> <span className="inline-block bg-blue-500/20 px-1.5 py-0.5 rounded text-white">□↑</span> {t('install.iosStep1c')}</li>
              <li>2. {t('install.iosStep2')} <strong className="text-white">{t('install.iosStep2b')}</strong></li>
              <li>3. {t('install.iosStep3')} <strong className="text-white">{t('install.iosStep3b')}</strong></li>
            </ol>
          </div>
        ) : (
          // Android/Chrome install button
          <button
            onClick={handleInstallClick}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-2"
          >
            <Download className="w-5 h-5" />
            {t('install.installNow')}
          </button>
        )}

        <button
          onClick={handleDismiss}
          className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
        >
          {t('install.maybeLater')}
        </button>
      </div>
    </div>
  )
}
