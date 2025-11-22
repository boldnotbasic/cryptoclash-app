'use client'

import { X, AlertTriangle, CheckCircle } from 'lucide-react'

interface SellConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  cryptoName: string
  cryptoSymbol: string
  amount: number
  percentage: number
  value: number
}

export default function SellConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  cryptoName,
  cryptoSymbol,
  amount,
  percentage,
  value
}: SellConfirmModalProps) {
  if (!isOpen) return null

  const isFullSale = percentage === 100

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-dark-bg to-gray-900 rounded-2xl border border-gray-700 max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-white">Verkoop Bevestigen</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <p className="text-gray-300 text-center">
            {isFullSale 
              ? `Ben je zeker dat je al je ${cryptoName} wil verkopen?`
              : `Ben je zeker dat je ${percentage}% van je ${cryptoName} wil verkopen?`
            }
          </p>
          
          {/* Sale Details */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Crypto:</span>
              <span className="text-white font-semibold">{cryptoName} ({cryptoSymbol})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Hoeveelheid:</span>
              <span className="text-white font-semibold">{amount.toFixed(2)} {cryptoSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Waarde:</span>
              <span className="text-neon-gold font-bold text-lg">
                €{value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105"
          >
            Verkopen
          </button>
        </div>
      </div>
    </div>
  )
}
