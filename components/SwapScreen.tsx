'use client'

import { useState } from 'react'
import { ArrowLeftRight, Check, X } from 'lucide-react'
import Image from 'next/image'
import Header from './Header'

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
  rank: number
  portfolio: { [key: string]: number }
  cashBalance: number
}

interface SwapScreenProps {
  playerName: string
  playerAvatar: string
  cryptos: CryptoCurrency[]
  players: Player[]
  onNavigate: (screen: string) => void
  onSwapConfirm: (myCryptoId: string, otherPlayerId: string, otherCryptoId: string) => void
}

const getCryptoImagePath = (symbol: string): string | null => {
  // Zelfde mapping als in MainMenu / Crypto Wallet zodat de swap-tegels
  // exact dezelfde coin-figuren gebruiken
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

export default function SwapScreen({ 
  playerName, 
  playerAvatar, 
  cryptos, 
  players,
  onNavigate,
  onSwapConfirm 
}: SwapScreenProps) {
  const [selectedMyCrypto, setSelectedMyCrypto] = useState<string | null>(null)
  const [selectedOtherPlayer, setSelectedOtherPlayer] = useState<string | null>(null)
  const [selectedOtherCrypto, setSelectedOtherCrypto] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Filter out host and current player from players list
  const otherPlayers = players.filter(
    p => !p.name.includes('Host') && 
         !p.name.includes('host') && 
         p.name !== playerName
  )

  // Get cryptos that current player owns (amount > 0)
  const myCryptos = cryptos.filter(c => c.amount > 0)

  // Get selected other player's portfolio
  const selectedPlayer = otherPlayers.find(p => p.id === selectedOtherPlayer)
  const otherPlayerCryptos = selectedPlayer 
    ? cryptos.filter(c => {
        const amount = selectedPlayer.portfolio[c.symbol] || 0
        console.log(`🔍 ${selectedPlayer.name} - ${c.symbol}: ${amount}`)
        return amount > 0
      })
    : []

  // Debug log
  if (selectedPlayer) {
    console.log('🎯 Selected player portfolio:', selectedPlayer.portfolio)
    console.log('🎯 Available cryptos for swap:', otherPlayerCryptos.map(c => `${c.symbol}: ${selectedPlayer.portfolio[c.symbol]}`))
  }

  const handleSwapClick = () => {
    if (selectedMyCrypto && selectedOtherPlayer && selectedOtherCrypto) {
      setShowConfirmation(true)
    }
  }

  const handleConfirmSwap = () => {
    if (selectedMyCrypto && selectedOtherPlayer && selectedOtherCrypto) {
      onSwapConfirm(selectedMyCrypto, selectedOtherPlayer, selectedOtherCrypto)
      setShowConfirmation(false)
      // Reset selections
      setSelectedMyCrypto(null)
      setSelectedOtherPlayer(null)
      setSelectedOtherCrypto(null)
    }
  }

  const myCrypto = cryptos.find(c => c.id === selectedMyCrypto)
  const otherCrypto = cryptos.find(c => c.id === selectedOtherCrypto)

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header 
          playerName={playerName} 
          playerAvatar={playerAvatar} 
          onLogoClick={() => onNavigate('main-menu')} 
        />

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Swap Crypto's</h1>
          <p className="text-gray-400 text-sm">Ruil één van jouw crypto's met die van een andere speler</p>
        </div>

        {/* Swap Interface */}
        <div className="space-y-6">
          {/* Step 1: Select Your Crypto */}
          <div className="crypto-card bg-gradient-to-br from-gray-900/95 via-orange-500/5 to-gray-900/95 border-2 border-orange-500/70">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="bg-orange-500/20 text-orange-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Selecteer jouw crypto</span>
            </h2>
            
            {myCryptos.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Je hebt nog geen crypto's om te ruilen</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {myCryptos.map((crypto) => {
                  const imagePath = getCryptoImagePath(crypto.symbol)
                  const isSelected = selectedMyCrypto === crypto.id
                  return (
                    <button
                      key={crypto.id}
                      onClick={() => setSelectedMyCrypto(crypto.id)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-between bg-gray-900/70 ${
                        isSelected
                          ? 'border-orange-400 shadow-lg shadow-orange-500/40 ring-1 ring-orange-400/70'
                          : 'border-gray-700 hover:border-orange-400/70 hover:bg-gray-800/80'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2 w-full">
                        {imagePath ? (
                          <Image
                            src={imagePath}
                            alt={crypto.name}
                            width={40}
                            height={40}
                            className="rounded-xl object-contain"
                          />
                        ) : (
                          <span className="text-3xl">
                            {crypto.icon}
                          </span>
                        )}
                        <p className="text-sm font-bold text-white tracking-tight text-center">{crypto.symbol}</p>
                        <p className="text-xs text-cyan-400 font-semibold">€{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        {/* Amount pill zonder paarse background */}
                        <div className="w-full mt-1">
                          <div className="w-full rounded-full border border-white/40 shadow-md px-2 py-0.5 text-center">
                            <span className="text-[10px] font-semibold text-white">
                              {crypto.amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-orange-500/20 to-cyan-500/20 border-2 border-orange-500/50 rounded-full">
              <ArrowLeftRight className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Step 2: Select Other Player */}
          <div className="crypto-card bg-gradient-to-br from-gray-900/95 via-cyan-500/5 to-gray-900/95 border-2 border-cyan-500/70">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span className="bg-cyan-500/20 text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>Selecteer andere speler</span>
            </h2>
            
            {otherPlayers.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Geen andere spelers beschikbaar</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {otherPlayers.map((player) => {
                  const isSelected = selectedOtherPlayer === player.id
                  return (
                    <button
                      key={player.id}
                      onClick={() => {
                        setSelectedOtherPlayer(player.id)
                        setSelectedOtherCrypto(null) // Reset crypto selection when changing player
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/30'
                          : 'border-gray-700 bg-gray-800/50 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{player.avatar}</span>
                        <div className="flex-1 text-left">
                          <p className="text-white font-bold">{player.name}</p>
                          <p className="text-xs text-gray-400">€{player.totalValue.toLocaleString('nl-NL')}</p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-cyan-500" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Step 3: Select Other Player's Crypto */}
          {selectedOtherPlayer && (
            <div className="crypto-card bg-gradient-to-br from-gray-900/95 via-cyan-500/5 to-gray-900/95 border-2 border-cyan-500/70">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <span className="bg-cyan-500/20 text-cyan-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>Selecteer crypto van {selectedPlayer?.name}</span>
              </h2>
              
              {otherPlayerCryptos.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Deze speler heeft geen crypto's om te ruilen</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {otherPlayerCryptos.map((crypto) => {
                    const imagePath = getCryptoImagePath(crypto.symbol)
                    const isSelected = selectedOtherCrypto === crypto.id
                    const amount = selectedPlayer?.portfolio[crypto.symbol] || 0
                    return (
                      <button
                        key={crypto.id}
                        onClick={() => setSelectedOtherCrypto(crypto.id)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-between bg-gray-900/70 ${
                          isSelected
                            ? 'border-cyan-400 shadow-lg shadow-cyan-500/40 ring-1 ring-cyan-400/70'
                            : 'border-gray-700 hover:border-cyan-400/70 hover:bg-gray-800/80'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2 w-full">
                          {imagePath ? (
                            <Image
                              src={imagePath}
                              alt={crypto.name}
                              width={40}
                              height={40}
                              className="rounded-xl object-contain"
                            />
                          ) : (
                            <span className="text-3xl">
                              {crypto.icon}
                            </span>
                          )}
                          <p className="text-sm font-bold text-white tracking-tight text-center">{crypto.symbol}</p>
                          <p className="text-xs text-cyan-400 font-semibold">€{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          {/* Amount pill zonder paarse background */}
                          <div className="w-full mt-1">
                            <div className="w-full rounded-full border border-white/40 shadow-md px-2 py-0.5 text-center">
                              <span className="text-[10px] font-semibold text-white">
                                {amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwapClick}
            disabled={!selectedMyCrypto || !selectedOtherPlayer || !selectedOtherCrypto}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              selectedMyCrypto && selectedOtherPlayer && selectedOtherCrypto
                ? 'bg-gradient-to-r from-neon-purple via-neon-gold to-neon-purple text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <ArrowLeftRight className="w-6 h-6" />
              <span>Ruil Crypto's</span>
            </div>
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && myCrypto && otherCrypto && selectedPlayer && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-md w-full">
              {/* Gradient border top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-neon-purple via-neon-gold to-neon-purple rounded-t-2xl"></div>
              <div className="crypto-card bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-orange-500/70 rounded-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">Bevestig Swap</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{playerAvatar}</span>
                    <div>
                      <p className="text-white font-bold">{playerName}</p>
                      <p className="text-sm text-gray-400">Geeft: {myCrypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{myCrypto.amount.toFixed(4)}</p>
                    <p className="text-xs text-gray-400">coins</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowLeftRight className="w-6 h-6 text-orange-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{selectedPlayer.avatar}</span>
                    <div>
                      <p className="text-white font-bold">{selectedPlayer.name}</p>
                      <p className="text-sm text-gray-400">Geeft: {otherCrypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{(selectedPlayer.portfolio[otherCrypto.symbol] || 0).toFixed(4)}</p>
                    <p className="text-xs text-gray-400">coins</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <X className="w-5 h-5" />
                    <span>Annuleer</span>
                  </div>
                </button>
                <button
                  onClick={handleConfirmSwap}
                  className="flex-1 py-3 bg-gradient-to-r from-neon-purple via-neon-gold to-neon-purple hover:shadow-xl text-white font-bold rounded-lg transition-all"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Check className="w-5 h-5" />
                    <span>Bevestig</span>
                  </div>
                </button>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => onNavigate('actions-menu')}
            className="w-full crypto-card bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 font-semibold py-3 px-4 rounded-lg hover:scale-105 transition-transform"
          >
            ← Terug naar Acties
          </button>
        </div>
      </div>
    </div>
  )
}
