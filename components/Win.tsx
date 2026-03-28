"use client"

import { useState } from 'react'
import { Gift, Coins, TrendingUp, TrendingDown } from 'lucide-react'
import Header from './Header'
import SpinWheel from './SpinWheel'
import CandlestickChart from './CandlestickChart'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatCurrency } from '@/utils/currency'

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

interface PriceChange {
  percentage: number
  timestamp: number
}

interface WinProps {
  playerName: string
  playerAvatar: string
  cryptos: CryptoCurrency[]
  onNavigate: (screen: string) => void
  onWinCrypto: (cryptoSymbol: string) => void
  onWinCash: () => void
  onWinGoldHen: () => void
  priceHistory?: Record<string, PriceChange[]>
}

const getCryptoImagePath = (symbol: string): string | null => {
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

export default function Win({
  playerName,
  playerAvatar,
  cryptos,
  onNavigate,
  onWinCrypto,
  onWinCash,
  onWinGoldHen,
  priceHistory = {}
}: WinProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const topCryptos = cryptos.slice(0, 6)
  const [selectedType, setSelectedType] = useState<'crypto' | 'cash' | 'wheel' | null>(null)
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState<string | null>(null)
  const [selectedCashOption, setSelectedCashOption] = useState<'500' | 'gold' | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showWheel, setShowWheel] = useState(false)

  // Bepaal beste stijger en hoogste waarde
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

  const handleSelectCrypto = (symbol: string) => {
    setSelectedType('crypto')
    setSelectedCryptoSymbol(symbol)
    setSelectedCashOption(null)
  }

  const handleSelectCash = (option: '500' | 'gold') => {
    setSelectedType('cash')
    setSelectedCashOption(option)
    setSelectedCryptoSymbol(null)
  }

  const handleValidateWin = () => {
    if (selectedType === 'crypto' && selectedCryptoSymbol) {
      onWinCrypto(selectedCryptoSymbol)
      const coin = cryptos.find(c => c.symbol === selectedCryptoSymbol)
      setSuccessMessage(`${t('win.youWon')} 1 ${coin?.name || selectedCryptoSymbol}!`)
    } else if (selectedType === 'cash' && selectedCashOption) {
      if (selectedCashOption === '500') {
        onWinCash()
        setSuccessMessage(t('win.youWonCash500'))
      } else {
        onWinGoldHen()
        setSuccessMessage(t('win.youWonGoldHen'))
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4">
      <div className="max-w-6xl mx-auto">
        <Header
          playerName={playerName}
          playerAvatar={playerAvatar}
          onLogoClick={() => onNavigate('actions-menu')}
        />

        {/* Page Header - zelfde stijl als Kopen kaart */}
        <div className="crypto-card mb-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">{t('win.title')}</h1>
          <p className="text-gray-400 text-sm">
            {t('win.subtitle')}
          </p>
        </div>

        {/* Win Crypto kaart */}
        <div className="crypto-card p-4 bg-dark-bg/70 flex flex-col mb-4">
            <div className="flex items-center mb-3">
              <Gift className="w-6 h-6 text-neon-turquoise mr-2" />
              <h2 className="text-lg font-bold text-white">{t('win.winCryptoTitle')}</h2>
            </div>
            {/* Zelfde tegelstijl als Kopen: 2 kolommen, brede tegels */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              {topCryptos.map((crypto) => {
                const imagePath = getCryptoImagePath(crypto.symbol)
                const isSelected = selectedType === 'crypto' && selectedCryptoSymbol === crypto.symbol
                const isTopGainerTile = topGainer && crypto.symbol === topGainer.symbol
                const isTopValueTile = topValueCoin && crypto.symbol === topValueCoin.symbol
                const isBothHighlight = isTopGainerTile && isTopValueTile

                return (
                  <button
                    key={crypto.id}
                    type="button"
                    onClick={() => handleSelectCrypto(crypto.symbol)}
                    className={`p-3 rounded-xl transition shadow-sm bg-dark-bg/40 text-left hover:border-white/20 ${
                      isSelected
                        ? 'border-4 border-neon-blue shadow-[0_0_32px_rgba(56,189,248,1)] ring-2 ring-neon-blue/50'
                        : isBothHighlight
                          ? 'border-2 border-neon-gold/80 animate-gold-purple-glow-breathe'
                          : isTopGainerTile
                            ? 'border-2 border-neon-gold/80 animate-gold-glow-breathe'
                            : isTopValueTile
                              ? 'border-2 border-neon-purple/80 animate-purple-glow-breathe'
                              : 'border-2 border-white/10'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl bg-transparent flex items-center justify-center overflow-visible -mt-6 mb-1">
                        {imagePath ? (
                          <img
                            src={imagePath}
                            alt={crypto.name}
                            width={120}
                            height={120}
                            className="object-contain drop-shadow-[0_0_32px_rgba(0,0,0,1)]"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-3xl">{crypto.icon}</span>
                        )}
                      </div>
                      <div className="w-full mt-1">
                        <div className="flex items-center justify-between">
                          <div className="text-white font-semibold truncate mr-2">{crypto.name}</div>
                          <div className="text-neon-turquoise font-bold whitespace-nowrap">
                            {formatCurrency(crypto.price, currency.symbol)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="text-gray-400 text-xs">{crypto.symbol}</div>
                          {typeof crypto.change24h === 'number' && (
                            <div
                              className={`text-xs px-1.5 py-0.5 rounded-sm border flex items-center space-x-1 ${
                                (crypto.change24h || 0) >= 0
                                  ? 'text-green-400 border-green-400/30'
                                  : 'text-red-400 border-red-400/30'
                              }`}
                            >
                              {(crypto.change24h || 0) >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>
                                {(crypto.change24h || 0) >= 0 ? '+' : ''}
                                {(crypto.change24h || 0).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

        {/* Spin the Wheel - Full width between widgets */}
        <button
          type="button"
          onClick={() => {
            setSelectedType('wheel')
            setSelectedCryptoSymbol(null)
            setSelectedCashOption(null)
            setShowWheel(true)
          }}
          className={`w-full p-4 rounded-xl transition shadow-sm bg-dark-bg/40 text-left flex items-center justify-center gap-3 mb-4 ${
            selectedType === 'wheel'
              ? 'border-4 border-neon-purple shadow-[0_0_32px_rgba(168,85,247,1)] ring-2 ring-neon-purple/50'
              : 'border-2 border-purple-500/30 hover:border-purple-500/50'
          }`}
        >
          <div className="text-6xl">🎡</div>
          <div className="text-center">
            <div className="text-white font-bold text-xl mb-1">{t('win.spinTheWheel')}</div>
            <div className="text-purple-300 text-sm">{t('win.winRandomCrypto')}</div>
          </div>
        </button>

        {/* Win Cash kaart met twee opties */}
        <div className="crypto-card p-4 bg-dark-bg/70 flex flex-col mb-6">
            <div className="flex items-center mb-3">
              <Coins className="w-6 h-6 text-neon-gold mr-2" />
              <h2 className="text-lg font-bold text-white">{t('win.winCashTitle')}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              {/* ⚘500 Cash tegel */}
              <button
                type="button"
                onClick={() => handleSelectCash('500')}
                className={`p-3 rounded-xl transition shadow-sm bg-dark-bg/40 text-left flex flex-col items-center ${
                  selectedType === 'cash' && selectedCashOption === '500'
                    ? 'border-4 border-neon-blue shadow-[0_0_32px_rgba(56,189,248,1)] ring-2 ring-neon-blue/50'
                    : 'border-2 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Cash figure uit de tegel laten komen */}
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl bg-transparent flex items-center justify-center overflow-visible -mt-6 mb-1">
                  <img
                    src="/wincash.png"
                    alt="⚘500 Cash"
                    width={120}
                    height={120}
                    className="object-contain drop-shadow-[0_0_32px_rgba(0,0,0,1)]"
                    loading="lazy"
                  />
                </div>
                <div className="w-full text-center mt-1">
                  <div className="text-white font-semibold text-sm mb-0.5">{t('win.cash500')}</div>
                  <div className="text-gray-400 text-xs">{t('win.directToCashWallet')}</div>
                </div>
              </button>

              {/* Goudhaantje ⚘1000 tegel */}
              <button
                type="button"
                onClick={() => handleSelectCash('gold')}
                className={`p-3 rounded-xl transition shadow-sm bg-dark-bg/40 text-left flex flex-col items-center ${
                  selectedType === 'cash' && selectedCashOption === 'gold'
                    ? 'border-4 border-neon-blue shadow-[0_0_32px_rgba(56,189,248,1)] ring-2 ring-neon-blue/50'
                    : 'border-2 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Goudhaantje figure uit de tegel laten komen */}
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl bg-transparent flex items-center justify-center overflow-visible -mt-6 mb-1">
                  <img
                    src="/goudhaantje.png"
                    alt="Goudhaantje ⚘1000"
                    width={120}
                    height={120}
                    className="object-contain drop-shadow-[0_0_32px_rgba(0,0,0,1)]"
                    loading="lazy"
                  />
                </div>
                <div className="w-full text-center mt-1">
                  <div className="text-white font-semibold text-sm mb-0.5">{t('win.goldHen1000')}</div>
                  <div className="text-gray-400 text-xs">{t('win.premiumCashPrize')}</div>
                </div>
              </button>
            </div>
          </div>

        {/* Overzicht + Valideren */}
        <div className="crypto-card">
          <div className="flex items-center justify-between">
            <div className="text-gray-300">
              {selectedType === 'crypto' && selectedCryptoSymbol ? (
                (() => {
                  const coin = cryptos.find(c => c.symbol === selectedCryptoSymbol)
                  if (!coin) return <div>{t('win.chooseAPrize')}</div>
                  const imagePath = getCryptoImagePath(coin.symbol)
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                        {imagePath ? (
                          <img
                            src={imagePath}
                            alt={coin.name}
                            width={32}
                            height={32}
                            className="object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-2xl">{coin.icon}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{coin.name}</div>
                        <div className="text-sm text-gray-400">{t('win.win1Coin')}</div>
                      </div>
                    </div>
                  )
                })()
              ) : selectedType === 'cash' && selectedCashOption ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                    <img
                      src={selectedCashOption === '500' ? '/wincash.png' : '/goudhaantje.png'}
                      alt={selectedCashOption === '500' ? '⚘500 Cash' : 'Goudhaantje ⚘1000'}
                      width={32}
                      height={32}
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {selectedCashOption === '500' ? t('win.cash500') : t('win.goldHen1000')}
                    </div>
                    <div className="text-sm text-gray-400">{t('win.addedToCashWallet')}</div>
                  </div>
                </div>
              ) : (
                <div>{t('win.chooseAPrize')}</div>
              )}
            </div>
            {selectedType && (
              <div className="text-right">
                <div className="text-gray-400 text-sm">{t('win.value')}</div>
                <div className="text-white font-bold text-xl">
                  {selectedType === 'crypto' && selectedCryptoSymbol
                    ? (() => {
                        const coin = cryptos.find(c => c.symbol === selectedCryptoSymbol)
                        return coin
                          ? `⚘${coin.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '⚘0,00'
                      })()
                    : selectedType === 'cash' && selectedCashOption === '500'
                      ? '⚘500,00'
                      : selectedType === 'cash' && selectedCashOption === 'gold'
                        ? '⚘1.000,00'
                        : '⚘0,00'}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => onNavigate('actions-menu')}
              className="flex-1 crypto-card bg-gray-600/20 hover:bg-gray-600/30 text-gray-200 py-2 rounded-lg"
            >
              {t('common.back')}
            </button>
            <button
              type="button"
              disabled={!selectedType || selectedType === 'wheel'}
              onClick={handleValidateWin}
              className={`flex-1 py-2 rounded-lg font-semibold ${
                !selectedType || selectedType === 'wheel'
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-neon-gold text-black hover:opacity-90'
              }`}
            >
              {selectedType === 'wheel' ? t('win.spinTheWheel') : t('win.validate')}
            </button>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="crypto-card bg-dark-bg/95 border border-neon-gold/40 max-w-xs w-full text-center p-6">
            <h3 className="text-xl font-bold text-white mb-2">{t('win.congratulations')}</h3>
            <p className="text-gray-300 mb-4">{successMessage}</p>
            <button
              type="button"
              onClick={() => {
                setSuccessMessage(null)
                onNavigate('main-menu')
              }}
              className="w-full py-2 rounded-lg bg-neon-gold text-black font-semibold hover:opacity-90 transition"
            >
              {t('common.ok')}
            </button>
          </div>
        </div>
      )}

      {/* Spin Wheel Modal */}
      {showWheel && (
        <SpinWheel
          cryptos={cryptos}
          onClose={() => {
            setShowWheel(false)
            setSelectedType(null)
          }}
          onWinCrypto={(symbol) => {
            onWinCrypto(symbol)
            setShowWheel(false)
            const coin = cryptos.find(c => c.symbol === symbol)
            setSuccessMessage(`${t('win.youWon')} 1 ${coin?.name || symbol}!`)
          }}
        />
      )}
    </div>
  )
}
