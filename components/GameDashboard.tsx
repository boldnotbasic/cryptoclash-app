'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { QrCode, Banknote , TrendingUp, TrendingDown, Coins, User, Zap, BarChart3, ArrowLeft, Wallet, DollarSign, PieChart } from 'lucide-react'
import Header from './Header'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCurrency } from '@/utils/currency'
import SellConfirmModal from './SellConfirmModal'
import SellSuccessModal from './SellSuccessModal'
import CandlestickChart from './CandlestickChart'

interface CryptoCurrency {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  amount: number
  color: string
  icon: string
  purchasePrice?: number
}

interface PriceChange {
  percentage: number
  timestamp: number
}

interface GameDashboardProps {
  playerName: string
  playerAvatar: string
  cryptos: CryptoCurrency[]
  onBack: () => void
  onSellCrypto?: (cryptoId: string, amount: number) => void
  showSellControls?: boolean
  onEndGame?: () => void
  priceHistory?: Record<string, PriceChange[]>
  onEndTurnConfirm?: () => void
  actionsDisabled?: boolean
}

export default function GameDashboard({ 
  playerName, 
  playerAvatar,
  cryptos, 
  onBack,
  onSellCrypto,
  showSellControls = false,
  onEndGame,
  priceHistory = {},
  onEndTurnConfirm,
  actionsDisabled = false
}: GameDashboardProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
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
  const maxQuantity = selectedCrypto ? Math.max(Math.floor(selectedCrypto.amount), 1) : 1
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header 
          playerName={playerName} 
          playerAvatar={playerAvatar} 
          onLogoClick={onBack} 
          onEndTurnConfirm={onEndTurnConfirm}
          actionsDisabled={actionsDisabled}
        />
        
        {/* Page Header */}
        <div className="flex items-center mb-8 space-x-4">
          <button
            onClick={onBack}
            className="p-3 rounded-lg bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <Banknote className="w-8 h-8 text-red" />
            <div>
              <h1 className="text-3xl font-bold text-white">Verkopen aan beurs</h1>
            </div>
          </div>
        </div>

        {/* Total Value Card */}
        <div className="crypto-card text-center mb-8">
          <h2 className="text-lg font-semibold text-gray-400 mb-2">{t('gameDashboard.totalPortfolioValue')}</h2>
          <p className="text-4xl font-bold text-neon-gold">
            {formatCurrency(totalValue, currency.symbol)}
          </p>
        </div>

        {/* Crypto Cards - selecteerbaar zoals bij Kopen */}
        <div className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cryptos.map((crypto) => {
            const isTopGainerTile = topGainer && crypto.id === topGainer.id
            const isTopValueTile = topValueCoin && crypto.id === topValueCoin.id
            const isBothHighlight = isTopGainerTile && isTopValueTile
            const isOwned = crypto.amount > 0

            return (
            <button
              key={crypto.id}
              onClick={() => setSelectedCryptoId(crypto.id)}
              disabled={!showSellControls || crypto.amount === 0}
              className={`p-3 rounded-xl border transition shadow-sm hover:shadow-md bg-dark-bg/40 text-left ${
                crypto.amount === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : ''
              } ${
                selectedCryptoId === crypto.id
                  ? 'border-2 border-neon-blue shadow-lg shadow-neon-blue/30'
                  : isBothHighlight
                    ? 'border-2 border-neon-gold/80 animate-gold-purple-glow-breathe'
                    : isTopGainerTile
                      ? 'border-2 border-neon-gold/80 animate-gold-glow-breathe'
                      : isTopValueTile
                        ? 'border-2 border-neon-purple/80 animate-purple-glow-breathe'
                        : 'border-white/10 hover:border-white/20'
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

                <div className="w-full mt-auto px-1">
                    {/* Naam + prijs */}
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold truncate mr-2">{crypto.name}</div>
                      <div className="text-neon-turquoise font-bold whitespace-nowrap">
                        {formatCurrency(crypto.price, currency.symbol)}
                      </div>
                    </div>

                    {/* Symbool + 24u badge */}
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="text-gray-400 text-xs">{crypto.symbol}</div>
                      <div
                        className={`text-xs px-1.5 py-0.5 rounded-sm border flex items-center space-x-1 ${
                          crypto.change24h >= 0
                            ? 'text-green-400 border-green-400/30'
                            : 'text-red-400 border-red-400/30'
                        }`}
                      >
                        {crypto.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {crypto.change24h >= 0 ? '+' : ''}
                          {crypto.change24h.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Momentum Indicator */}
                    {typeof crypto.change24h === 'number' && Math.abs(crypto.change24h) > 0 && (
                      <div className={`text-[9px] font-semibold mt-0.5 flex items-center space-x-1 ${
                        Math.abs(crypto.change24h) > 15 
                          ? crypto.change24h > 0 ? 'text-green-400' : 'text-red-400'
                          : crypto.change24h > 0 ? 'text-green-500/60' : 'text-red-500/60'
                      }`}>
                        {Math.abs(crypto.change24h) > 15 ? (
                          crypto.change24h > 0 ? (
                            <>↗️ {t('gameDashboard.strongRising')}</>
                          ) : (
                            <>↘️ {t('gameDashboard.strongFalling')}</>
                          )
                        ) : (
                          crypto.change24h > 0 ? (
                            <>→ {t('gameDashboard.lightRising')}</>
                          ) : (
                            <>→ {t('gameDashboard.lightFalling')}</>
                          )
                        )}
                      </div>
                    )}
                    
                    {/* Chart */}
                    <CandlestickChart 
                      priceHistory={priceHistory[crypto.symbol] || []} 
                      maxBars={6}
                      currentPercentage={crypto.change24h || 0}
                      currentPrice={crypto.price}
                    />

                    {/* Aankoopprijs + Winst/Verlies percentage */}
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/5">
                      <div className="text-gray-500 text-[10px]">
                        {t('gameDashboard.purchasePrice')}: <span className="text-gray-400">
                          {(crypto as any).purchasePrice 
                            ? `⚘${(crypto as any).purchasePrice.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '-'
                          }
                        </span>
                      </div>
                      <div className="text-[10px]">
                        {(crypto as any).purchasePrice ? (() => {
                          const profitLossPercentage = ((crypto.price - (crypto as any).purchasePrice) / (crypto as any).purchasePrice) * 100
                          return (
                            <span className={`font-bold ${profitLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(1)}%
                            </span>
                          )
                        })() : (
                          <span className="text-gray-400">-</span>
                        )}
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
            <h2 className="text-lg font-semibold text-white mb-3">{t('gameDashboard.quantity')}</h2>
            <div className="space-y-3">
              {/* Custom slider met gevulde balk */}
              <div className="relative w-full h-7">
                {/* Achtergrond-balk */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  {/* Gevulde balk (effen oranje) */}
                  <div
                    className="h-full bg-neon-gold shadow-[0_0_12px_rgba(250,204,21,0.6)] transition-all duration-200"
                    style={{ width: `${maxQuantity <= 1 ? 100 : ((sellQuantity - 1) / (maxQuantity - 1)) * 100}%` }}
                  />
                </div>

                {/* Bolletje / handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-neon-gold bg-dark-bg shadow-[0_0_22px_rgba(250,204,21,0.95)] flex items-center justify-center"
                  style={{
                    left: `${maxQuantity <= 1 ? 100 : ((sellQuantity - 1) / (maxQuantity - 1)) * 100}%`,
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

              {/* +/- knoppen met aantal in het midden */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSellQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full border border-neon-gold/60 text-neon-gold font-bold text-xl flex items-center justify-center hover:bg-neon-gold/10 active:scale-95 transition-all"
                >−</button>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wide text-gray-500">{t('gameDashboard.quantity')}</span>
                  <span className="mt-0.5 w-10 h-10 rounded-full bg-transparent border border-neon-gold/80 text-neon-gold font-bold text-base flex items-center justify-center shadow-[0_0_16px_rgba(250,204,21,0.7)]">
                    {sellQuantity}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSellQuantity(q => Math.min(maxQuantity, q + 1))}
                  className="w-10 h-10 rounded-full border border-neon-gold/60 text-neon-gold font-bold text-xl flex items-center justify-center hover:bg-neon-gold/10 active:scale-95 transition-all"
                >+</button>
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
                      <div className="text-sm text-gray-400">{t('gameDashboard.pricePerUnit')}: {formatCurrency(selectedCrypto.price, currency.symbol)}</div>
                    </div>
                  </div>
                ) : (
                  <div>{t('gameDashboard.chooseCrypto')}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm">{t('gameDashboard.total')}</div>
                <div className="text-white font-bold text-xl">{formatCurrency(saleValue, currency.symbol)}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={onBack} className="flex-1 crypto-card bg-gray-600/20 hover:bg-gray-600/30 text-gray-200 py-2 rounded-lg">{t('gameDashboard.back')}</button>
              <button
                disabled={!canSell}
                onClick={handleValidateSell}
                className={`flex-1 py-2 rounded-lg font-semibold ${!canSell ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                {t('gameDashboard.validate')}
              </button>
            </div>

            {!canSell && selectedCrypto && sellQuantity === 0 && (
              <div className="text-yellow-400 text-sm mt-2">{t('gameDashboard.selectAmount')}</div>
            )}
            {!canSell && selectedCrypto && selectedCrypto.amount === 0 && (
              <div className="text-red-400 text-sm mt-2">{t('gameDashboard.noStock')}</div>
            )}
          </div>
        )}

        {/* Game Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="crypto-card text-center">
            <h3 className="text-lg font-semibold text-neon-purple mb-2">{t('gameDashboard.bestInvestment')}</h3>
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
            <h3 className="text-lg font-semibold text-neon-blue mb-2">{t('gameDashboard.totalCoins')}</h3>
            <p className="text-2xl font-bold text-white">
              {Math.floor(cryptos.reduce((sum, crypto) => sum + crypto.amount, 0))}
            </p>
            <p className="text-neon-gold">Crypto's</p>
          </div>
          
          <div className="crypto-card text-center">
            <h3 className="text-lg font-semibold text-neon-turquoise mb-2">{t('gameDashboard.marketStatus')}</h3>
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
