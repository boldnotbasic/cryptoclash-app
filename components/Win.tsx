"use client"

import { useState } from 'react'
import { Gift, Coins } from 'lucide-react'
import Header from './Header'
import SpinWheel from './SpinWheel'

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

interface WinProps {
  playerName: string
  playerAvatar: string
  cryptos: CryptoCurrency[]
  onNavigate: (screen: string) => void
  onWinCrypto: (cryptoSymbol: string) => void
  onWinCash: () => void
  onWinGoldHen: () => void
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
  onWinGoldHen
}: WinProps) {
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
      setSuccessMessage(`Je hebt 1 ${coin?.name || selectedCryptoSymbol} gewonnen!`)
    } else if (selectedType === 'cash' && selectedCashOption) {
      if (selectedCashOption === '500') {
        onWinCash()
        setSuccessMessage('Je hebt €500 cash gewonnen!')
      } else {
        onWinGoldHen()
        setSuccessMessage('Je hebt het Goudhaantje gewonnen: €1000 cash!')
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
          <h1 className="text-2xl font-bold text-white mb-1">Win Crypto of Cash</h1>
          <p className="text-gray-400 text-sm">
            Kies een munt om 1 extra coin te winnen of kies voor een cash bonus.
          </p>
        </div>

        {/* Opties grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Win Crypto kaart */}
          <div className="crypto-card p-4 bg-dark-bg/70 flex flex-col">
            <div className="flex items-center mb-3">
              <Gift className="w-6 h-6 text-neon-turquoise mr-2" />
              <h2 className="text-lg font-bold text-white">Win Crypto</h2>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Kies één van de munten hieronder om direct 1 extra coin aan je wallet toe te voegen.
            </p>
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
                            €{crypto.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-gray-400 text-xs">{crypto.symbol}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Win Cash kaart met twee opties */}
          <div className="crypto-card p-4 bg-dark-bg/70 flex flex-col">
            <div className="flex items-center mb-3">
              <Coins className="w-6 h-6 text-neon-gold mr-2" />
              <h2 className="text-lg font-bold text-white">Win Cash</h2>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Kies een cash prijs:
              <span className="text-neon-gold font-semibold"> €500</span> of
              <span className="text-neon-gold font-semibold"> Goudhaantje €1000</span> in je Cash Wallet.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              {/* €500 Cash tegel */}
              <button
                type="button"
                onClick={() => handleSelectCash('500')}
                className={`p-3 rounded-xl transition shadow-sm bg-dark-bg/40 text-left flex flex-col items-center ${
                  selectedType === 'cash' && selectedCashOption === '500'
                    ? 'border-4 border-neon-blue shadow-[0_0_32px_rgba(56,189,248,1)] ring-2 ring-neon-blue/50'
                    : 'border-2 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden mb-2">
                  <img
                    src="/wincash.png"
                    alt="€500 Cash"
                    width={80}
                    height={80}
                    className="object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="w-full text-center">
                  <div className="text-white font-semibold text-sm mb-0.5">€500 Cash</div>
                  <div className="text-gray-400 text-xs">Direct in Cash Wallet</div>
                </div>
              </button>

              {/* Goudhaantje €1000 tegel */}
              <button
                type="button"
                onClick={() => handleSelectCash('gold')}
                className={`p-3 rounded-xl transition shadow-sm bg-dark-bg/40 text-left flex flex-col items-center ${
                  selectedType === 'cash' && selectedCashOption === 'gold'
                    ? 'border-4 border-neon-blue shadow-[0_0_32px_rgba(56,189,248,1)] ring-2 ring-neon-blue/50'
                    : 'border-2 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden mb-2">
                  <img
                    src="/goudhaantje.png"
                    alt="Goudhaantje €1000"
                    width={80}
                    height={80}
                    className="object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="w-full text-center">
                  <div className="text-neon-gold font-semibold text-sm mb-0.5">Goudhaantje €1000</div>
                  <div className="text-gray-400 text-xs">Premium cash prijs</div>
                </div>
              </button>
            </div>
          </div>

          {/* Spin the Wheel - Full width below cash options */}
          <button
            type="button"
            onClick={() => {
              setSelectedType('wheel')
              setSelectedCryptoSymbol(null)
              setSelectedCashOption(null)
              setShowWheel(true)
            }}
            className={`w-full p-4 rounded-xl transition shadow-sm bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-left flex items-center justify-center gap-3 ${
              selectedType === 'wheel'
                ? 'border-4 border-neon-purple shadow-[0_0_32px_rgba(168,85,247,1)] ring-2 ring-neon-purple/50'
                : 'border-2 border-purple-500/30 hover:border-purple-500/50'
            }`}
          >
            <div className="text-6xl">🎡</div>
            <div className="text-center">
              <div className="text-white font-bold text-xl mb-1">Spin the Wheel!</div>
              <div className="text-purple-300 text-sm">Win een willekeurige crypto</div>
            </div>
          </button>
        </div>

        {/* Overzicht + Valideren */}
        <div className="crypto-card">
          <div className="flex items-center justify-between">
            <div className="text-gray-300">
              {selectedType === 'crypto' && selectedCryptoSymbol ? (
                (() => {
                  const coin = cryptos.find(c => c.symbol === selectedCryptoSymbol)
                  if (!coin) return <div>Kies een prijs</div>
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
                        <div className="text-sm text-gray-400">Win 1 coin</div>
                      </div>
                    </div>
                  )
                })()
              ) : selectedType === 'cash' && selectedCashOption ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                    <img
                      src={selectedCashOption === '500' ? '/wincash.png' : '/goudhaantje.png'}
                      alt={selectedCashOption === '500' ? '€500 Cash' : 'Goudhaantje €1000'}
                      width={32}
                      height={32}
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {selectedCashOption === '500' ? '€500 Cash' : 'Goudhaantje €1000'}
                    </div>
                    <div className="text-sm text-gray-400">Wordt toegevoegd aan Cash Wallet</div>
                  </div>
                </div>
              ) : (
                <div>Kies een prijs</div>
              )}
            </div>
            {selectedType && (
              <div className="text-right">
                <div className="text-gray-400 text-sm">Waarde</div>
                <div className="text-white font-bold text-xl">
                  {selectedType === 'crypto' && selectedCryptoSymbol
                    ? (() => {
                        const coin = cryptos.find(c => c.symbol === selectedCryptoSymbol)
                        return coin
                          ? `€${coin.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '€0,00'
                      })()
                    : selectedType === 'cash' && selectedCashOption === '500'
                      ? '€500,00'
                      : selectedType === 'cash' && selectedCashOption === 'gold'
                        ? '€1.000,00'
                        : '€0,00'}
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
              Terug
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
              {selectedType === 'wheel' ? 'Draai het rad!' : 'Valideren'}
            </button>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="crypto-card bg-dark-bg/95 border border-neon-gold/40 max-w-xs w-full text-center p-6">
            <h3 className="text-xl font-bold text-white mb-2">Gefeliciteerd!</h3>
            <p className="text-gray-300 mb-4">{successMessage}</p>
            <button
              type="button"
              onClick={() => {
                setSuccessMessage(null)
                onNavigate('main-menu')
              }}
              className="w-full py-2 rounded-lg bg-neon-gold text-black font-semibold hover:opacity-90 transition"
            >
              Ok
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
            setSuccessMessage(`Je hebt 1 ${cryptos.find(c => c.symbol === symbol)?.name || symbol} gewonnen!`)
          }}
        />
      )}
    </div>
  )
}
