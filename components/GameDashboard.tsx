'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { QrCode, TrendingUp, TrendingDown, Coins, User, Zap, BarChart3, ArrowLeft, Wallet, DollarSign, PieChart } from 'lucide-react'
import Header from './Header'
import SellConfirmModal from './SellConfirmModal'
import SellSuccessModal from './SellSuccessModal'

interface CryptoCurrency {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  amount: number
  color: string
  icon: string
}

interface GameDashboardProps {
  playerName: string
  playerAvatar: string
  cryptos: CryptoCurrency[]
  onBack: () => void
  onSellCrypto?: (cryptoId: string, amount: number) => void
}

export default function GameDashboard({ 
  playerName, 
  playerAvatar,
  cryptos, 
  onBack,
  onSellCrypto
}: GameDashboardProps) {
  const [totalValue, setTotalValue] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [pendingSale, setPendingSale] = useState<{
    cryptoId: string
    amount: number
    percentage: number
    value: number
    cryptoName: string
    cryptoSymbol: string
  } | null>(null)

  useEffect(() => {
    const total = cryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0)
    setTotalValue(total)
  }, [cryptos])

  const getColorClass = (color: string) => {
    const colorMap = {
      'neon-purple': 'border-neon-purple shadow-neon text-neon-purple',
      'neon-blue': 'border-neon-blue shadow-neon-blue text-neon-blue',
      'neon-turquoise': 'border-neon-turquoise shadow-neon-turquoise text-neon-turquoise',
      'neon-gold': 'border-neon-gold shadow-neon-gold text-neon-gold'
    }
    return colorMap[color as keyof typeof colorMap] || 'border-neon-purple shadow-neon text-neon-purple'
  }

  const getCryptoImagePath = (symbol: string) => {
    switch (symbol) {
      case 'DSHEEP': return '/dsheep.png'
      case 'LNTR': return '/lentra.png'
      case 'OMLT': return '/omlt.png'
      case 'ORLO': return '/orlo.png'
      case 'REX': return '/rex.png'
      case 'NUGGET': return '/Nugget.png'
      default: return null
    }
  }

  const handleSellClick = (cryptoId: string, percentage: number) => {
    const crypto = cryptos.find(c => c.id === cryptoId)
    if (!crypto) return

    const amountToSell = crypto.amount * (percentage / 100)
    const saleValue = crypto.price * amountToSell

    setPendingSale({
      cryptoId,
      amount: amountToSell,
      percentage,
      value: saleValue,
      cryptoName: crypto.name,
      cryptoSymbol: crypto.symbol
    })
    setShowConfirmModal(true)
  }

  const handleConfirmSale = () => {
    if (pendingSale && onSellCrypto) {
      onSellCrypto(pendingSale.cryptoId, pendingSale.amount)
      setShowConfirmModal(false)
      setShowSuccessModal(true)
    }
  }

  const handleCloseSuccess = () => {
    setShowSuccessModal(false)
    setPendingSale(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header playerName={playerName} playerAvatar={playerAvatar} onLogoClick={onBack} />
        
        {/* Page Header */}
        <div className="flex items-center mb-8 space-x-4">
          <button
            onClick={onBack}
            className="p-3 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <Wallet className="w-8 h-8 text-neon-gold" />
            <div>
              <h1 className="text-3xl font-bold text-white">Portfolio</h1>
              <p className="text-gray-400">Jouw crypto bezit</p>
            </div>
          </div>
        </div>

        {/* Total Value Card */}
        <div className="crypto-card text-center mb-8">
          <h2 className="text-lg font-semibold text-gray-400 mb-2">Totale Portfolio Waarde</h2>
          <p className="text-4xl font-bold text-neon-gold">
            €{totalValue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Crypto Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cryptos.map((crypto) => (
            <div key={crypto.id} className={`crypto-card ${getColorClass(crypto.color)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl inline-flex items-center justify-center overflow-hidden">
                    {(() => {
                      const imagePath = getCryptoImagePath(crypto.symbol)
                      if (!imagePath) return <span>{crypto.icon}</span>
                      return (
                        <Image
                          src={imagePath}
                          alt={crypto.name}
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      )
                    })()}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{crypto.name}</h3>
                    {/*<p className="text-gray-400">{crypto.symbol}</p>---> */}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    €{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className={`flex items-center justify-end space-x-1 ${
                    crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {crypto.change24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Holdings Display */}
              <div className="space-y-3 bg-dark-bg/30 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Aantal</p>
                    <p className="text-2xl font-bold text-white">
                      {crypto.amount.toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-xs">{crypto.symbol}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Waarde</p>
                    <p className="text-2xl font-bold text-neon-gold">
                      €{(crypto.price * crypto.amount).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                
                {/* Sell Buttons */}
                {crypto.amount > 0 && onSellCrypto && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <button
                      onClick={() => handleSellClick(crypto.id, 25)}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      Verkoop 25%
                    </button>
                    <button
                      onClick={() => handleSellClick(crypto.id, 50)}
                      className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      Verkoop 50%
                    </button>
                    <button
                      onClick={() => handleSellClick(crypto.id, 100)}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      Verkoop Alles
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Game Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="crypto-card text-center">
            <h3 className="text-lg font-semibold text-neon-purple mb-2">Beste Investering</h3>
            <p className="text-2xl font-bold text-white">
              {cryptos.reduce((best, crypto) => 
                crypto.change24h > best.change24h ? crypto : best
              ).name}
            </p>
            <p className="text-neon-turquoise">
              +{cryptos.reduce((best, crypto) => 
                crypto.change24h > best.change24h ? crypto : best
              ).change24h.toFixed(1)}%
            </p>
          </div>
          
          <div className="crypto-card text-center">
            <h3 className="text-lg font-semibold text-neon-blue mb-2">Totaal Munten</h3>
            <p className="text-2xl font-bold text-white">
              {cryptos.reduce((sum, crypto) => sum + crypto.amount, 0).toFixed(1)}
            </p>
            <p className="text-neon-gold">Crypto's</p>
          </div>
          
          <div className="crypto-card text-center">
            <h3 className="text-lg font-semibold text-neon-turquoise mb-2">Markt Status</h3>
            <p className="text-2xl font-bold text-white">
              {cryptos.filter(c => c.change24h > 0).length > cryptos.length / 2 ? 'Bull' : 'Bear'}
            </p>
            <p className="text-neon-purple">Market</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {pendingSale && (
        <SellConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSale}
          cryptoName={pendingSale.cryptoName}
          cryptoSymbol={pendingSale.cryptoSymbol}
          amount={pendingSale.amount}
          percentage={pendingSale.percentage}
          value={pendingSale.value}
        />
      )}

      <SellSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccess}
        value={pendingSale?.value || 0}
      />
    </div>
  )
}
