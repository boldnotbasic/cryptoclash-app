'use client'

import { CheckCircle, CreditCard } from 'lucide-react'

interface SellSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  value: number
}

export default function SellSuccessModal({
  isOpen,
  onClose,
  value
}: SellSuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-dark-bg to-gray-900 rounded-2xl border border-green-500/30 max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verkoop Gelukt!</h2>
          <p className="text-gray-300">Je crypto is succesvol verkocht</p>
        </div>

        {/* Success Details */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <CreditCard className="w-6 h-6 text-green-500" />
            <span className="text-green-400 font-semibold">Toegevoegd aan bankrekening</span>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">
              +€{value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105"
        >
          Geweldig!
        </button>
      </div>
    </div>
  )
}
