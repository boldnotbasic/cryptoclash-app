'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { QrCode, BarChart3, Wallet, Settings, TrendingUp, TrendingDown, Crown, Medal, Trophy, CreditCard, Zap, Users, ListChecks } from 'lucide-react'
import { getTileClasses } from '@/utils/styleUtils'
import Header from './Header'
import ScanResult, { ScanEffect } from './ScanResult'

interface CryptoCurrency {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  amount: number
  color: string
  icon: string
  volume: number
  marketCap: number
}

interface Player {
  id: string
  name: string
  avatar: string
  totalValue: number
  portfolio: { [key: string]: number }
  rank: number
}

interface ScanAction {
  id: string
  timestamp: number
  player: string
  action: string
  effect: string
  avatar?: string
}

interface Player {
  id: string
  name: string
  avatar: string
  totalValue: number
  rank: number
  portfolio: { [key: string]: number }
  cashBalance: number
}

interface MainMenuProps {
  playerName: string
  playerAvatar: string
  cryptos: CryptoCurrency[]
  onNavigate: (screen: 'qr-scanner' | 'market' | 'portfolio' | 'cash' | 'rankings' | 'settings' | 'scan-transcript' | 'actions-menu') => void
  onAddScanAction?: (action: ScanAction) => void
  lastScanEffect?: string
  cashBalance?: number
  players?: Player[]
  playerScanActions?: ScanAction[]
  autoScanActions?: ScanAction[]
  onSendTestMessage?: (message: string) => void
  onVerifyRoom?: () => void
  transactions?: any[]
  year?: number
  onPassStart?: () => void
  gameFinished?: boolean
  onApplyScanEffect?: (effect: ScanEffect) => void
  actionsDisabled?: boolean
  onEndTurnConfirm?: () => void
}

export default function MainMenu({ playerName, playerAvatar, cryptos, onNavigate, onAddScanAction, lastScanEffect, cashBalance = 0, players = [], playerScanActions = [], autoScanActions = [], onSendTestMessage, onVerifyRoom, transactions = [], year = 2024, onPassStart, onApplyScanEffect, actionsDisabled = false, onEndTurnConfirm, gameFinished = false }: MainMenuProps) {
  // Calculate portfolio value (with consistent rounding)
  const portfolioValue = Math.round(cryptos.reduce((sum, crypto) => sum + (crypto.price * crypto.amount), 0) * 100) / 100
  const totalValue = Math.round((portfolioValue + cashBalance) * 100) / 100
  
  // Debug logging for consistency check
  console.log(`🔍 MainMenu - Portfolio: €${portfolioValue}, Cash: €${cashBalance}, Total: €${totalValue}`)
  
  // Find current player in players array for comparison
  const currentPlayerInList = players.find(p => p.name === playerName)
  if (currentPlayerInList) {
    console.log(`📊 Dashboard shows - Total: €${currentPlayerInList.totalValue}, Cash: €${currentPlayerInList.cashBalance}`)
    console.log(`🔍 Detailed comparison:`)
    console.log(`  MainMenu Portfolio: €${portfolioValue}`)
    console.log(`  MainMenu Cash: €${cashBalance}`)
    console.log(`  MainMenu Total: €${totalValue}`)
    console.log(`  Dashboard Total: €${currentPlayerInList.totalValue}`)
    console.log(`  Dashboard Cash: €${currentPlayerInList.cashBalance}`)
    
    const difference = Math.abs(totalValue - currentPlayerInList.totalValue)
    console.log(`  Difference: €${difference}`)
    
    if (difference > 0.01) {
      console.warn(`⚠️ MISMATCH! MainMenu: €${totalValue} vs Dashboard: €${currentPlayerInList.totalValue}`)
      console.warn(`  This suggests data synchronization issues between local and server state`)
    } else {
      console.log(`✅ Values match within acceptable range (±€0.01)`)
    }
  }
  
  // Test message state
  const [testMessage, setTestMessage] = useState('')
  const [now, setNow] = useState(Date.now())
  const [isYearModalOpen, setIsYearModalOpen] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)

  const sanitizeEffect = (effect: string) => {
    try {
      if (typeof effect !== 'string') return effect
      return effect
        .replace(/\bRIZZ\b/g, 'NGT')
        .replace(/\bWHALE\b/g, 'REX')
    } catch {
      return effect
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getCryptoImagePath = (symbol: string) => {
    switch (symbol) {
      case 'DSHEEP': return '/dsheep.png'
      case 'LNTR': return '/lentra.png'
      case 'OMLT': return '/omlt.png'
      case 'ORLO': return '/orlo.png'
      case 'REX': return '/rex.png'
      case 'NGT': return '/Nugget.png'
      default: return null
    }
  }

  // Handle test message send
  const handleSendTestMessage = () => {
    if (testMessage.trim() && onSendTestMessage) {
      onSendTestMessage(testMessage.trim())
      setTestMessage('') // Clear input after sending
    }
  }

  // Simple test scan function with random coins and percentages
  const handleTestScan = () => {
    console.log('\n🧪 === TEST SCAN BUTTON CLICKED ===')
    console.log('👤 Player:', playerName)
    console.log('😀 Avatar:', playerAvatar)
    console.log('🔗 onAddScanAction available:', !!onAddScanAction)
    
    if (onAddScanAction) {
      // Array of fictional coins for random selection
      const possibleCoins = ['DSHEEP', 'NUGGET', 'LNTR', 'OMLT', 'REX', 'ORLO']
      
      // Generate random coin
      const randomCoin = possibleCoins[Math.floor(Math.random() * possibleCoins.length)]
      
      // Generate random percentage within default ±2% to align with volatility bounds
      const bound = 2
      const randomPercentage = (Math.random() * (2 * bound) - bound).toFixed(1)
      const sign = parseFloat(randomPercentage) >= 0 ? '+' : ''
      
      const testScanAction = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        player: playerName,
        action: 'Test Scan',
        effect: `${randomCoin} ${sign}${randomPercentage}%`,
        avatar: playerAvatar,
        cryptoSymbol: randomCoin,
        percentageValue: parseFloat(randomPercentage)
      }
      console.log('📊 Generated test scan:', testScanAction)
      console.log('📤 Calling onAddScanAction...')
      onAddScanAction(testScanAction)
      console.log('✅ Test scan sent to handler')
    } else {
      console.warn('⚠️ onAddScanAction not available!')
    }
    console.log('🧪 === TEST SCAN BUTTON COMPLETE ===\n')
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-neon-gold" />
      case 2: return <Medal className="w-5 h-5 text-gray-300" />
      case 3: return <Trophy className="w-5 h-5 text-yellow-600" />
      default: return <span className="w-5 h-5 flex items-center justify-center text-gray-400 font-bold">#{rank}</span>
    }
  }

  const menuButtons = [
    // QR Scanner tijdelijk uitgeschakeld
    // {
    //   id: 'scanner',
    //   title: 'Scannen',
    //   icon: QrCode,
    //   color: 'from-neon-purple to-neon-blue',
    //   description: 'QR codes scannen',
    //   action: () => onNavigate('qr-scanner')
    // },
    {
      id: 'market',
      title: 'Markt',
      icon: BarChart3,
      color: 'from-neon-blue to-neon-turquoise',
      description: 'Koersen bekijken',
      action: () => onNavigate('market')
    },
    {
      id: 'portfolio',
      title: 'Crypto Wallet',
      icon: Wallet,
      color: 'from-neon-turquoise to-neon-gold',
      description: 'Jouw crypto\'s',
      value: portfolioValue,
      action: () => onNavigate('portfolio')
    },
    {
      id: 'cash',
      title: 'Cash Wallet',
      icon: CreditCard,
      color: 'from-neon-gold to-green-500',
      description: 'Jouw cash geld',
      value: cashBalance,
      action: () => onNavigate('cash')
    },
    {
      id: 'actions',
      title: 'Acties',
      icon: ListChecks,
      color: 'from-green-500 to-neon-purple',
      description: 'Spel acties',
      action: () => onNavigate('actions-menu')
    },
    {
      id: 'rankings',
      title: 'Rankings',
      icon: Users,
      color: 'from-purple-600 to-blue-600',
      description: 'Spelers leaderboard',
      action: () => onNavigate('rankings')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header 
          playerName={playerName} 
          playerAvatar={playerAvatar} 
          onLogoClick={() => {}} 
          actionsDisabled={actionsDisabled}
          onEndTurnConfirm={onEndTurnConfirm}
        />

        {/* Overlay wanneer speler alle jaren heeft gespeeld */}
        {gameFinished && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="max-w-md mx-4 rounded-2xl bg-dark-bg/95 border border-neon-gold/60 shadow-[0_0_40px_rgba(250,204,21,0.6)] p-6 text-center">
              <h2 className="text-2xl font-bold text-neon-gold mb-3">Spel beëindigd</h2>
              <p className="text-gray-200 text-sm mb-1">
                Je hebt alle speeljaren voltooid.
              </p>
              <p className="text-gray-400 text-xs">
                Wacht tot de andere spelers het spel hebben afgerond.
              </p>
            </div>
          </div>
        )}

        {/* Menu Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Acties - Icon boven tekst */}
          <button
            onClick={actionsDisabled ? undefined : () => onNavigate('actions-menu')}
            className={getTileClasses(
              true,
              `crypto-card bg-gradient-to-br from-gray-900/95 via-purple-500/5 to-gray-900/95 border-2 border-purple-500/70 ring-1 ring-purple-500/40 text-center p-0 group h-[200px] flex flex-col shadow-lg shadow-purple-500/30 ${actionsDisabled ? 'opacity-40 pointer-events-none' : 'hover:shadow-purple-500/50 hover:border-purple-500/90'}`
            )}
          >
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-2">
              <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors shadow-inner">
                <ListChecks className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Acties</h3>
              {!actionsDisabled && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-neon-gold/20 border border-neon-gold/50 rounded-full">
                  <span className="text-xs text-neon-gold font-bold">Jouw beurt</span>
                  <span className="text-neon-gold">⚡</span>
                </div>
              )}
            </div>
          </button>

          {/* Markt - Met alle 6 crypto iconen + percentages */}
          <button
            onClick={() => onNavigate('market')}
            className={getTileClasses(
              true,
              "crypto-card bg-gradient-to-br from-gray-900/95 via-purple-500/5 to-gray-900/95 border-2 border-purple-500/70 ring-1 ring-purple-500/40 relative overflow-hidden p-0 h-[200px] flex flex-col shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:border-purple-500/90"
            )}
          >
            {/* Top deel: Icon + Titel */}
            <div className="pt-5 pb-3 flex items-center justify-center">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl flex-shrink-0 shadow-inner">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Markt</h3>
              </div>
            </div>
            {/* Spacer voor ruimte */}
            <div className="flex-1"></div>
            {/* Donker vlak met alle 6 crypto iconen + percentages */}
            <div className="bg-gradient-to-t from-dark-bg/90 to-dark-bg/70 backdrop-blur-sm py-2.5 px-2 border-t border-white/5">
              <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                {cryptos.map((crypto, index) => {
                  const imagePath = getCryptoImagePath(crypto.symbol)
                  const isBottomRow = index >= Math.max(0, cryptos.length - 3)
                  return (
                    <div key={crypto.id} className={`flex flex-col items-center ${isBottomRow ? 'pb-2.5' : ''}`}>
                      <span className="text-lg mb-0.5 drop-shadow-md inline-flex items-center justify-center overflow-hidden">
                        {imagePath ? (
                          <Image
                            src={imagePath}
                            alt={crypto.name}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        ) : (
                          <span>{crypto.icon}</span>
                        )}
                      </span>
                      <span className="text-[10px] text-white font-semibold">
                        €{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`font-bold text-[10px] ${crypto.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {crypto.change24h > 0 ? '+' : ''}{crypto.change24h.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </button>

          {/* Crypto Wallet - Met donker vlak onderaan en holdings preview */}
          <button
            onClick={() => onNavigate('portfolio')}
            className={getTileClasses(
              true,
              "crypto-card bg-gradient-to-br from-gray-900/95 via-purple-500/5 to-gray-900/95 border-2 border-purple-500/70 ring-1 ring-purple-500/40 relative overflow-hidden p-0 h-[200px] flex flex-col shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:border-purple-500/90"
            )}
          >
            {/* Top deel: Icon naast titel */}
            <div className="pt-4 pb-2 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-md bg-white/20">
                  <Wallet className="w-5 h-5 text-white" />
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">Crypto Wallet</h3>
              </div>
            </div>

            {/* Spacer voor ruimte */}
            <div className="flex-1"></div>

            {/* Holdings preview: donkere band full-width direct boven footer */}
            <div className="w-full bg-dark-bg/80 px-3 py-3">
              <div className="grid grid-cols-3 gap-4 place-items-center">
                {cryptos.filter(c => c.amount > 0).slice(0, 6).map((crypto) => {
                  const imagePath = getCryptoImagePath(crypto.symbol)
                  return (
                    <div key={crypto.id} className="flex flex-col items-center">
                      {imagePath ? (
                        <img
                          src={imagePath}
                          alt={crypto.name}
                          width={28}
                          height={28}
                          className="object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-lg">{crypto.icon}</span>
                      )}
                      <span className="text-[10px] text-white/90 mt-1 font-semibold">
                        {crypto.amount.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
                {cryptos.filter(c => c.amount > 0).length === 0 && (
                  <span className="text-xs text-white/70">Geen munten</span>
                )}
              </div>
            </div>
            {/* Donker vlak met waarde */}
            <div className="bg-gradient-to-t from-dark-bg/90 to-dark-bg/70 backdrop-blur-sm py-2.5 px-4 text-center border-t border-white/5 flex items-center justify-center">
              <p className="text-neon-gold font-bold text-lg tracking-wide drop-shadow-lg">
                €{portfolioValue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </button>

          {/* Cash - Icoon naast titel en laatste transactie */}
          <button
            onClick={() => onNavigate('cash')}
            className={getTileClasses(
              true,
              "crypto-card bg-gradient-to-br from-gray-900/95 via-purple-500/5 to-gray-900/95 border-2 border-purple-500/70 ring-1 ring-purple-500/40 relative overflow-hidden p-0 h-[200px] flex flex-col shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:border-purple-500/90"
            )}
          >
            {/* Top deel: Icon naast titel */}
            <div className="pt-4 pb-2 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-md bg-white/20">
                  <CreditCard className="w-5 h-5 text-white" />
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">Cash Wallet</h3>
              </div>
            </div>

            {/* Spacer voor ruimte */}
            <div className="flex-1"></div>

            {/* Laatste verkoop sectie */}
            <div className="w-full bg-dark-bg/80 px-3 py-3">
              {(() => {
                  // Find the most recent sell transaction
                  const sellTransactions = transactions?.filter((t: any) => t.type === 'sell') || []
                  const latestSell = sellTransactions.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))[0]
                  
                  if (latestSell) {
                    const mins = Math.max(0, Math.floor((Date.now() - (latestSell.timestamp || Date.now())) / 60000))
                    const hours = Math.floor(mins / 60)
                    const timeText = hours > 0 ? `${hours}u geleden` : `${mins}m geleden`
                    
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-xs text-white/90">
                            <div className="font-semibold">Verkoop {latestSell.cryptoName}</div>
                            <div className="text-white/70 text-[11px]">
                              {latestSell.amount.toFixed(2)} {latestSell.cryptoSymbol} @ €{latestSell.price.toFixed(2)} • {timeText}
                            </div>
                          </div>
                        </div>
                        <div className="text-green-400 text-sm font-bold">+€{latestSell.total.toFixed(2)}</div>
                      </div>
                    )
                  }

                  return (
                    <div className="flex items-center justify-center py-1">
                      <span className="text-xs text-white/70">Nog geen verkopen</span>
                    </div>
                  )
                })()}
            </div>
            {/* Donker vlak met waarde */}
            <div className="bg-gradient-to-t from-dark-bg/90 to-dark-bg/70 backdrop-blur-sm py-2.5 px-4 text-center border-t border-white/5 flex items-center justify-center">
              <p className="text-green-400 font-bold text-lg tracking-wide drop-shadow-lg">
                €{cashBalance.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </button>

          {/* Speeljaar - Jaartal tegel */}
          <button
            onClick={() => {
              if (!gameFinished) {
                setIsYearModalOpen(true)
              }
            }}
            className={getTileClasses(
              true,
              `crypto-card bg-gradient-to-br from-gray-900/95 via-purple-500/5 to-gray-900/95 border-2 border-purple-500/70 ring-1 ring-purple-500/40 text-center p-0 group h-[200px] flex flex-col shadow-lg shadow-purple-500/30 ${gameFinished ? 'opacity-40 pointer-events-none' : 'hover:shadow-purple-500/50 hover:border-purple-500/90'}`
            )}
          >
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-2">
              <div className="p-3 bg-white/20 rounded-xl transition-colors shadow-inner">
                <span className="text-4xl">📅</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Speeljaar</h3>
              <p className="text-2xl font-bold text-neon-gold">{year}</p>
            </div>
          </button>

          {/* Live Rankings - Naast Speeljaar */}
          <button
            onClick={() => onNavigate('rankings')}
            className={getTileClasses(
              true,
              "crypto-card bg-gradient-to-br from-gray-900/95 via-purple-500/5 to-gray-900/95 border-2 border-purple-500/70 ring-1 ring-purple-500/40 relative overflow-hidden p-0 h-[200px] flex flex-col shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:border-purple-500/90"
            )}
          >
            {/* Top deel: Titel */}
            <div className="pt-3 pb-2 flex items-center justify-center">
              <h3 className="text-sm font-bold text-white tracking-tight">🏆 Live Rankings</h3>
            </div>
            
            {/* Listview met spelers en totaal vermogen */}
            <div className="flex-1 px-3 pb-3 overflow-hidden">
              <div className="space-y-1">
                {players
                  .sort((a, b) => b.totalValue - a.totalValue)
                  .slice(0, 3)
                  .map((player, index) => (
                    <div key={player.id} className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-300 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border-yellow-400/30' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300/10 to-gray-500/10 border-gray-300/30' :
                      index === 2 ? 'bg-gradient-to-r from-amber-600/10 to-amber-800/10 border-amber-600/30' :
                      'bg-gradient-to-r from-gray-600/10 to-gray-800/10 border-gray-400/30'
                    } ${player.name === playerName ? 'ring-1 ring-neon-gold ring-opacity-50' : ''}`}>
                      
                      {/* Links: Ranking + Avatar + Naam (met truncatie) */}
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-300/20 text-gray-300' :
                          index === 2 ? 'bg-amber-600/20 text-amber-600' :
                          'bg-gray-600/20 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex items-center space-x-1 min-w-0">
                          <span className="text-sm">{player.avatar}</span>
                          <span className="text-xs text-gray-300 max-w-[80px] truncate">
                            {player.name}
                          </span>
                        </div>
                      </div>
                      
                      {/* Rechts: Totaal Vermogen */}
                      <div className="text-right">
                        <p className={`text-xs font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-amber-600' :
                          'text-gray-400'
                        }`}>
                          €{player.totalValue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                
                {players.length === 0 && (
                  <div className="text-center py-4">
                    <span className="text-gray-400 text-xs">Geen spelers</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Notification Bar - Latest Scan Actions */}
        <div className="mb-8">
          <div className="crypto-card bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 border border-neon-purple/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span className="animate-pulse">🔔</span>
                <span>Beurs</span>
              </h3>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            <div className="flex space-x-3 mb-4">
              <button 
                onClick={() => onNavigate('scan-transcript')}
                className="text-neon-blue hover:text-neon-purple text-sm font-semibold transition-colors"
              >
                Toon volledig transcript →
              </button>
            </div>
            
            <div className="space-y-2">
              {autoScanActions.slice(0, 2).map((action, index) => {
                const timeAgo = Math.floor((now - action.timestamp) / 1000)
                const minutes = Math.floor(timeAgo / 60)
                const seconds = timeAgo % 60
                
                return (
                  <div key={action.id} className="flex items-center justify-between p-2 bg-dark-bg/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {action.player === 'Bot' ? '🤖' : 
                         action.player === 'CryptoMaster' ? '🚀' : 
                         action.player === 'BlockchainBoss' ? '💎' : '⚡'}
                      </span>
                      <span className="text-sm text-white font-medium">{action.player}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">{action.action}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${
                        action.effect.includes('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {sanitizeEffect(action.effect)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {minutes > 0 ? `${minutes}m` : `${seconds}s`}
                      </span>
                    </div>
                  </div>
                )
              })}
              
              {autoScanActions.length === 0 && (
                <div className="text-center py-3">
                  <p className="text-gray-400 text-sm">Wachten op scan activiteit...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Player Actions */}
        <div className="mt-8 mb-8">
          <div className="crypto-card bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 border border-neon-purple/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <ListChecks className="w-5 h-5 text-neon-purple" />
                <span>Acties</span>
              </h3>
              <div className="bg-neon-purple/20 px-2 py-1 rounded-full border border-neon-purple/50">
                <span className="text-neon-purple text-xs font-bold">{playerScanActions.length} acties</span>
              </div>
            </div>
            <div className="flex items-center justify-end mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex space-x-3 mb-4">
              <button 
                onClick={() => onNavigate('scan-transcript')}
                className="text-neon-blue hover:text-neon-purple text-sm font-semibold transition-colors"
              >
                Toon volledig transcript →
              </button>
            </div>
            <div className="space-y-3">
              {/* Always show 2 actions, only player scans (exclude forecasts from other players) */}
              {Array.from({ length: 2 }).map((_, index) => {
                // Only show player scans, sorted by timestamp, filter out forecasts from other players
                const playerScans = [...playerScanActions]
                  .filter(scan => {
                    const isForecast = scan.effect?.includes('Market Forecast') || scan.action === 'Forecast'
                    // Show forecast only if it's from current player
                    if (isForecast) {
                      return scan.player === playerName
                    }
                    return true
                  })
                  .sort((a, b) => b.timestamp - a.timestamp)
                const action = playerScans[index]
                
                if (!action) {
                  return (
                    <div key={`placeholder-${index}`} className="flex items-center justify-between p-3 bg-dark-bg/20 rounded-lg border-2 border-dashed border-gray-600">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-400">?</span>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Wachten op scan...</p>
                          <p className="text-gray-500 text-xs">Scan een QR code</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 text-sm">--</p>
                      </div>
                    </div>
                  )
                }
                
                const timeAgo = Math.floor((now - action.timestamp) / 1000)
                const minutes = Math.floor(timeAgo / 60)
                const seconds = timeAgo % 60
                
                return (
                  <div key={action.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 ? 'bg-neon-purple/10 border border-neon-purple/30' : 'bg-dark-bg/30'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {action.avatar || (action.player === playerName ? playerAvatar :
                           action.player === 'CryptoMaster' ? '🚀' : 
                           action.player === 'BlockchainBoss' ? '💎' : '⚡')}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{action.player}</p>
                          <p className="text-xs text-gray-400">{action.action}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        action.effect.includes('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {sanitizeEffect(action.effect)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`} geleden
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {playerScanActions.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-400">Nog geen scan acties...</p>
              </div>
            )}
          </div>
        </div>


        {isYearModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-dark-bg/95 border border-white/10 rounded-lg p-5 w-80">
              <h3 className="text-white font-bold text-lg mb-2 text-center">Nieuw jaar starten?</h3>
              <p className="text-gray-300 text-sm mb-4 text-center">
                Ga over naar {year + 1} en ontvang €500 startgeld toegevoegd aan je Cash Wallet.
              </p>
              <div className="flex items-center justify-between space-x-3">
                <button
                  className="flex-1 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition"
                  onClick={() => setIsYearModalOpen(false)}
                >
                  Annuleren
                </button>
                <button
                  className="flex-1 py-2 rounded-md bg-neon-gold text-black font-semibold hover:opacity-90 transition"
                  onClick={() => {
                    try {
                      onPassStart && onPassStart()
                    } finally {
                      setIsYearModalOpen(false)
                    }
                  }}
                >
                  Bevestigen
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Jouw Positie */}
        <div className="crypto-card mb-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4">🏆 Jouw Positie</h2>
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-2">Ranking</p>
            <div className="flex items-center justify-center space-x-2">
              {getRankIcon(players.find(p => p.name === playerName)?.rank || 1)}
              <span className="text-3xl font-bold text-neon-gold">
                #{players.find(p => p.name === playerName)?.rank || 1}
              </span>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-2">Totaal Vermogen</p>
            <div className="bg-gradient-to-r from-neon-gold/20 to-neon-purple/20 border border-neon-gold/50 rounded-lg p-4">
              <p className="text-3xl font-bold text-neon-gold">
                €{totalValue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Portfolio Waarde</p>
              <p className="text-xl font-bold text-neon-blue">
                €{portfolioValue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Cash Saldo</p>
              <p className="text-xl font-bold text-green-400">
                €{cashBalance.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Scan Modal from Actions > Beurs */}
        {showScanModal && (
          <ScanResult
          onClose={() => setShowScanModal(false)}
          onApplyEffect={(effect) => {
            try { onApplyScanEffect && onApplyScanEffect(effect) } catch {}
          }}
        />
        )}

        {/* Test Message Widget */}
        {onSendTestMessage && (
          <div className="mt-6">
            <div className="crypto-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>💬</span>
                  <span>Tekstbericht</span>
                </h3>
              </div>
              
              <p className="text-gray-400 text-sm mb-3">
                Stuur een bericht naar het Market Screen dashboard
              </p>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Typ je bericht hier..."
                  className="w-full px-3 py-2 bg-dark-bg/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendTestMessage()}
                  maxLength={100}
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {testMessage.length}/100 karakters
                  </span>
                  
                  <button
                    onClick={handleSendTestMessage}
                    disabled={!testMessage.trim()}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      testMessage.trim()
                        ? 'bg-neon-blue hover:bg-neon-blue/80 text-white shadow-lg hover:shadow-neon-blue/20'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Verstuur
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="crypto-card text-center">
            <p className="text-gray-400 text-sm">Totale Spelers</p>
            <p className="text-2xl font-bold text-neon-blue">{players.length}</p>
          </div>
          
          <div className="crypto-card text-center">
            <p className="text-gray-400 text-sm">Actieve Munten</p>
            <p className="text-2xl font-bold text-neon-turquoise">{cryptos.length}</p>
          </div>
          
          <div className="crypto-card text-center">
            <p className="text-gray-400 text-sm">Markt Trend</p>
            <div className="flex items-center justify-center space-x-1">
              {cryptos.filter(c => c.change24h > 0).length > cryptos.length / 2 ? (
                <>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-xl font-bold text-green-400">Bull</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <span className="text-xl font-bold text-red-400">Bear</span>
                </>
              )}
            </div>
          </div>
          
          <div className="crypto-card text-center">
            <p className="text-gray-400 text-sm">Jouw Rang</p>
            <p className="text-2xl font-bold text-neon-gold">
              #{players.find(p => p.name === playerName)?.rank || 1}
            </p>
          </div>
        </div>

        {/* Settings Button - Onderaan */}
        <div className="mt-6">
          <button
            onClick={() => onNavigate('settings')}
            className="w-full crypto-card bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50 text-gray-300 font-semibold py-3 px-4 rounded-lg hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Instellingen</span>
          </button>
        </div>
      </div>
    </div>
  )
}
