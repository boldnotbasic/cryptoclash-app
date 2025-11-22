'use client'

import { ArrowLeft, CreditCard, Euro, TrendingUp } from 'lucide-react'
import Header from './Header'

interface Transaction {
  id: string
  type: 'sell'
  cryptoSymbol: string
  cryptoName: string
  amount: number
  price: number
  total: number
  timestamp: number
}

interface CashProps {
  onBack: () => void
  playerName: string
  playerAvatar: string
  cashBalance: number
  transactions?: Transaction[]
}

export default function Cash({ onBack, playerName, playerAvatar, cashBalance, transactions = [] }: CashProps) {
  // Calculate totals from transactions
  const totalSales = transactions.reduce((sum, t) => sum + t.total, 0)
  const todayTransactions = transactions.filter(t => {
    const today = new Date()
    const transactionDate = new Date(t.timestamp)
    return transactionDate.toDateString() === today.toDateString()
  }).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-4xl mx-auto">
        <Header playerName={playerName} playerAvatar={playerAvatar} onLogoClick={onBack} />
        
        {/* Page Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="p-3 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-2">
            <Euro className="w-8 h-8 text-neon-gold" />
            <div>
              <h1 className="text-3xl font-bold text-white">Cash Wallet</h1>
              <p className="text-gray-400">Jouw cash geld</p>
            </div>
          </div>
        </div>

        {/* Bank Card - Apple Wallet Style */}
        <div className="mb-8">
          <div className="relative">
            {/* Card */}
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-6 shadow-2xl border border-gray-700">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-gray-400 text-sm font-medium">CRYPTOCLASH BANK</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-white text-lg font-bold">{playerName}</p>
                    <span className="text-lg">{playerAvatar}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-8 h-8 text-neon-gold" />
                </div>
              </div>

              {/* Balance */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-1">Beschikbaar Saldo</p>
                <p className="text-white text-4xl font-bold">
                  €{cashBalance.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Card Number */}
              <div className="mb-4">
                <p className="text-gray-300 text-lg font-mono tracking-wider">
                  •••• •••• •••• {Math.floor(Math.random() * 9000) + 1000}
                </p>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-gray-400 text-xs">GELDIG TOT</p>
                  <p className="text-gray-300 text-sm font-mono">12/28</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">CRYPTO CASH</p>
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-neon-gold rounded-full flex items-center justify-center">
                      <span className="text-black text-xs font-bold">CC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chip */}
              <div className="absolute top-20 right-6">
                <div className="w-12 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md border border-yellow-500"></div>
              </div>
            </div>

            {/* Card Shadow/Reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none"></div>
          </div>
        </div>

        {/* Transaction History - Direct onder bankkaart */}
        <div className="crypto-card">
          <h3 className="text-xl font-bold text-white mb-4">Recente Transacties</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nog geen transacties</p>
              <p className="text-gray-500 text-sm">Verkoop crypto's om cash te verdienen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => {
                const timeAgo = Math.floor((Date.now() - transaction.timestamp) / 1000)
                const minutes = Math.floor(timeAgo / 60)
                const hours = Math.floor(minutes / 60)
                const days = Math.floor(hours / 24)
                
                let timeText = ''
                if (days > 0) timeText = `${days}d geleden`
                else if (hours > 0) timeText = `${hours}u geleden`
                else if (minutes > 0) timeText = `${minutes}m geleden`
                else timeText = 'Nu'

                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-dark-bg/30 rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Verkoop {transaction.cryptoName}</p>
                        <p className="text-gray-400 text-sm">
                          {transaction.amount.toFixed(2)} {transaction.cryptoSymbol} @ €{transaction.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-500 font-bold">
                        +€{transaction.total.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-gray-400 text-sm">{timeText}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="crypto-card text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Totale Verkopen</h3>
            <p className="text-2xl font-bold text-green-500">
              €{totalSales.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-gray-400 text-sm">Deze sessie</p>
          </div>
          
          <div className="crypto-card text-center">
            <Euro className="w-8 h-8 text-neon-gold mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Beschikbaar</h3>
            <p className="text-2xl font-bold text-neon-gold">
              €{cashBalance.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-gray-400 text-sm">Cash saldo</p>
          </div>
          
          <div className="crypto-card text-center">
            <CreditCard className="w-8 h-8 text-neon-blue mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Transacties</h3>
            <p className="text-2xl font-bold text-neon-blue">{todayTransactions}</p>
            <p className="text-gray-400 text-sm">Vandaag</p>
          </div>
        </div>
      </div>
    </div>
  )
}
