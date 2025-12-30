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
  showSellControls?: boolean
  onEndGame?: () => void
}

export default function GameDashboard({ 
  playerName, 
  playerAvatar,
  cryptos, 
  onBack,
  onSellCrypto,
  showSellControls = false,
  onEndGame
}: GameDashboardProps) {
  const [totalValue, setTotalValue] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [selectedCryptoId, setSelectedCryptoId] = useState<string>('')
  const [sellQuantity, setSellQuantity] = useState<number>(1)
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
      case 'NGT': return '/Nugget.png'
      case 'NUGGET': return '/Nugget.png'
      default: return null
    }
  }

  // Bepaal beste stijger (op basis van 24u % verandering) en munt met hoogste prijs
  const topGainer = cryptos.reduce<CryptoCurrency | null>((best, c) => {
    if (!best) return c
    if (typeof c.change24h !== 'number') return best
    if (typeof best.change24h !== 'number') return c
    return c.change24h > best.change24h ? c : best
  }, null)

  const topValueCoin = cryptos.reduce<CryptoCurrency | null>((best, c) => {
    if (!best) return c
    return c.price > best.price ? c : best
  }, null)

  const selectedCrypto = cryptos.find(c => c.id === selectedCryptoId)
  const maxQuantity = selectedCrypto ? Math.min(Math.floor(selectedCrypto.amount), 10) : 10
  const saleValue = selectedCrypto ? selectedCrypto.price * sellQuantity : 0
  const canSell = selectedCrypto && sellQuantity > 0 && selectedCrypto.amount > 0

  const handleValidateSell = () => {
    if (!selectedCrypto || !canSell) return

    setPendingSale({
      cryptoId: selectedCrypto.id,
      amount: sellQuantity,
      percentage: Math.round((sellQuantity / selectedCrypto.amount) * 100),
      value: saleValue,
      cryptoName: selectedCrypto.name,
      cryptoSymbol: selectedCrypto.symbol
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

  const [showEndGameModal, setShowEndGameModal] = useState(false)

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
              <h1 className="text-3xl font-bold text-white">Crypto Wallet</h1>
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

        {/* Crypto Cards - selecteerbaar zoals bij Kopen */}
        <div className="crypto-card mb-4">
          <h2 className="text-lg font-semibold text-white mb-3">Kies een crypto</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cryptos.map((crypto) => {
            const isTopGainerTile = topGainer && crypto.id === topGainer.id
            const isTopValueTile = topValueCoin && crypto.id === topValueCoin.id
            const isBothHighlight = isTopGainerTile && isTopValueTile

            return (
            <button
              key={crypto.id}
              onClick={() => setSelectedCryptoId(crypto.id)}
              disabled={!showSellControls || crypto.amount === 0}
              className={`crypto-card rounded-xl p-3 bg-dark-bg/40 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                selectedCryptoId === crypto.id
                  ? 'border-2 border-neon-blue shadow-lg shadow-neon-blue/30'
                  : isBothHighlight
                    ? 'border-2 border-neon-gold/80 animate-gold-purple-glow-breathe'
                    : isTopGainerTile
                      ? 'border-2 border-neon-gold/80 animate-gold-glow-breathe'
                      : isTopValueTile
                        ? 'border-2 border-neon-purple/80 animate-purple-glow-breathe'
                        : 'border border-white/10'
              }`}
            >
              <div className="flex flex-col items-center">
                {/* Icon blok */}
                <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-xl bg-transparent flex items-center justify-center overflow-visible -mt-8 mb-1">
                  {(() => {
                    const imagePath = getCryptoImagePath(crypto.symbol)
                    if (!imagePath) return <span className="text-3xl">{crypto.icon}</span>
                    return (
                      <Image
                        src={imagePath}
                        alt={crypto.name}
                        width={150}
                        height={150}
                        className="object-contain drop-shadow-[0_0_32px_rgba(0,0,0,1)]"
                      />
                    )
                  })()}
                  {/* Aantal badge op de figuur */}
                  <div className="absolute top-1/2 right-0 translate-x-1 -translate-y-1/2 rounded-full bg-neon-purple/80 text-white border border-white/70 px-2.5 py-0.5 text-[11px] font-bold shadow-[0_0_14px_rgba(139,92,246,0.9)]">
                    {Math.floor(crypto.amount)}
                  </div>
                </div>

                <div className="w-full mt-1">
                  {/* Naam + prijs */}
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold truncate mr-2">{crypto.name}</div>
                    <div className="text-neon-turquoise font-bold whitespace-nowrap">
                      €{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Symbool + 24u badge */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-gray-400 text-xs">{crypto.symbol}</div>
                    <div
                      className={`text-[10px] px-1.5 py-0.5 rounded-sm border flex items-center ${
                        crypto.change24h >= 0
                          ? 'text-green-400 border-green-400/30'
                          : 'text-red-400 border-red-400/30'
                      }`}
                    >
                      {crypto.change24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(1)}%
                    </div>
                  </div>

                </div>
              </div>
            </button>
          )})}
          </div>
        </div>

        {/* Aantal Slider - alleen als controls actief zijn */}
        {showSellControls && onSellCrypto && (
          <div className="crypto-card mb-4">
            <h2 className="text-lg font-semibold text-white mb-3">Aantal</h2>
            <div className="space-y-3">
              {/* Custom slider met gevulde balk */}
              <div className="relative w-full h-7">
                {/* Achtergrond-balk */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  {/* Gevulde balk (effen oranje) */}
                  <div
                    className="h-full bg-neon-gold shadow-[0_0_12px_rgba(250,204,21,0.6)] transition-all duration-200"
                    style={{ width: `${((sellQuantity - 1) / (maxQuantity - 1)) * 100}%` }}
                  />
                </div>

                {/* Bolletje / handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-neon-gold bg-dark-bg shadow-[0_0_22px_rgba(250,204,21,0.95)] flex items-center justify-center"
                  style={{
                    left: `${((sellQuantity - 1) / (maxQuantity - 1)) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className="w-4 h-4 rounded-full bg-neon-gold shadow-[0_0_14px_rgba(250,204,21,0.9)]" />
                </div>

                {/* Onzichtbare native range voor interactie */}
                <input
                  type="range"
                  min={1}
                  max={maxQuantity}
                  step={1}
                  value={sellQuantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1
                    setSellQuantity(Math.min(Math.max(v, 1), maxQuantity))
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Labels onder slider */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>1</span>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wide text-gray-500">Geselecteerd</span>
                  <span className="mt-0.5 w-9 h-9 rounded-full bg-transparent border border-neon-gold/80 text-neon-gold font-bold text-base flex items-center justify-center shadow-[0_0_16px_rgba(250,204,21,0.7)]">
                    {sellQuantity}
                  </span>
                </div>
                <span>{maxQuantity}</span>
              </div>
            </div>
          </div>
        )}

        {/* Overzicht - alleen als controls actief zijn */}
        {showSellControls && onSellCrypto && (
          <div className="crypto-card mb-4">
            <div className="flex items-center justify-between">
              <div className="text-gray-300">
                {selectedCrypto ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center">
                      <img src={getCryptoImagePath(selectedCrypto.symbol) || ''} alt={selectedCrypto.name} width={64} height={64} className="object-contain" />
                    </div>
                    <div>
                      <div><span className="text-white font-semibold">{selectedCrypto.name}</span> × {sellQuantity}</div>
                      <div className="text-sm text-gray-400">Prijs per stuk: €{selectedCrypto.price.toFixed(2)}</div>
                    </div>
                  </div>
                ) : (
                  <div>Kies een crypto</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm">Totaal</div>
                <div className="text-white font-bold text-xl">€{saleValue.toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={onBack} className="flex-1 crypto-card bg-gray-600/20 hover:bg-gray-600/30 text-gray-200 py-2 rounded-lg">Terug</button>
              <button
                disabled={!canSell}
                onClick={handleValidateSell}
                className={`flex-1 py-2 rounded-lg font-semibold ${!canSell ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                Valideren
              </button>
            </div>

            {!canSell && selectedCrypto && sellQuantity === 0 && (
              <div className="text-yellow-400 text-sm mt-2">Selecteer een aantal</div>
            )}
            {!canSell && selectedCrypto && selectedCrypto.amount === 0 && (
              <div className="text-red-400 text-sm mt-2">Geen crypto beschikbaar</div>
            )}
          </div>
        )}

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
              {Math.floor(cryptos.reduce((sum, crypto) => sum + crypto.amount, 0))}
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

      {/* Spel afsluiten knop onderaan dashboard */}
      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => setShowEndGameModal(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-sm shadow-lg shadow-red-900/40 border border-red-400/60 transition-transform duration-200 hover:scale-105"
        >
          Spel afsluiten
        </button>
      </div>

      {showEndGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="crypto-card max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Spel definitief afsluiten?</h3>
            <p className="text-gray-300 text-sm mb-5">
              Hiermee wordt het huidige spel volledig beëindigd en wordt alle spelgeschiedenis gewist. Weet je het zeker?
            </p>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="flex-1 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm font-semibold"
                onClick={() => setShowEndGameModal(false)}
              >
                Annuleren
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold"
                onClick={() => {
                  setShowEndGameModal(false)
                  if (onEndGame) {
                    onEndGame()
                  }
                }}
              >
                Ja, afsluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
