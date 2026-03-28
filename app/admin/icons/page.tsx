'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, RefreshCw, Check, AlertCircle, Smile, Layers, Type, Coins } from 'lucide-react'
import { useIcons } from '@/contexts/IconContext'

interface IconConfig {
  avatars: { list: string[] }
  events: Record<string, string>
  cryptos: Record<string, string>
  ui: Record<string, string>
  lucideIcons: Record<string, string>
}

interface Currency {
  symbol: string
  name: string
  code: string
  description?: string
}

interface CurrencyConfig {
  currency: Currency
  availableCurrencies: Currency[]
}

const SECTION_META: Record<string, { label: string; description: string }> = {
  avatars:     { label: 'Speler Avatars',    description: 'De 20 emoji\'s die spelers kunnen kiezen als avatar' },
  events:      { label: 'Event Icons',        description: 'Emoji\'s voor markt-events (Bull Run, Bear Market...)' },
  cryptos:     { label: 'Crypto Icons',       description: 'Emoji\'s per crypto munt' },
  ui:          { label: 'UI Emoji\'s',        description: 'Kleine emoji\'s verspreid door de interface' },
  lucideIcons: { label: 'Lucide Icon Names',  description: 'Namen van vector-iconen (bijv. Play, ArrowLeft). Zie lucide.dev voor alle namen.' },
  currency:    { label: 'Valuta',             description: 'Kies de valuta die in het spel wordt gebruikt (Bloom, Euro, Dollar, etc.)' }
}

const KEY_LABELS: Record<string, string> = {
  bullRun: 'Bull Run event',
  bearMarket: 'Bear Market event',
  whaleAlert: 'Whale Alert event',
  forecast: 'Market Forecast',
  boost: 'Positief event (boost)',
  crash: 'Negatief event (crash)',
  DSHEEP: 'Dark Sheep (DSHEEP)',
  NGT: 'Nugget (NGT)',
  LNTR: 'Lentra (LNTR)',
  OMLT: 'Omlet (OMLT)',
  REX: 'Rex (REX)',
  ORLO: 'Orlo (ORLO)',
  host: 'Host badge',
  player: 'Speler icoon',
  start: 'Start knop',
  newRoom: 'Nieuwe kamer / Nieuwe Kamer knop',
  settings: 'Instellingen',
  leaderboard: 'Leaderboard',
  wallet: 'Wallet',
  cash: 'Cash saldo',
  buy: 'Kopen',
  sell: 'Verkopen',
  scan: 'Scannen',
  dice: 'Dobbelstenen',
  market: 'Markt',
  timer: 'Timer',
  music: 'Muziek / Muziek aan',
  ranking: 'Ranglijst',
  profit: 'Winst',
  loss: 'Verlies',
  startGame: 'Start Spel knop',
  back: 'Terug knop',
  close: 'Sluiten knop',
  check: 'Vinkje',
  trendUp: 'Trend omhoog',
  trendDown: 'Trend omlaag',
  barChart: 'Staafgrafiek',
  trophy: 'Trofee',
  zap: 'Zap/bliksem',
  globe: 'Wereldbol',
  save: 'Opslaan',
  edit: 'Bewerken',
  copy: 'Kopiëren',
  qrCode: 'QR Code',
  musicOff: 'Muziek uit',
  users: 'Gebruikers',
  chevronDown: 'Pijl omlaag',
  chevronRight: 'Pijl rechts',
  alertCircle: 'Waarschuwing',
  info: 'Info',
  star: 'Ster'
}

const DEFAULT_CONFIG: IconConfig = {
  avatars: { list: ['🤡','🚀','💎','⚡️','💀','🦊','🦄','🌝','👾','👽','👻','🦁','🐲','🦉','🦅','🦈','🐙','🤯','😎','🤠'] },
  events: { bullRun:'🐂', bearMarket:'🐻', whaleAlert:'🐋', forecast:'🔮', boost:'📈', crash:'📉' },
  cryptos: { DSHEEP:'🐑', NGT:'🪙', LNTR:'💡', OMLT:'🍳', REX:'🦖', ORLO:'🔵' },
  ui: { host:'👑', player:'👤', start:'▶️', newRoom:'🔄', settings:'⚙️', leaderboard:'🏆', wallet:'💼', cash:'💵', buy:'🛒', sell:'💸', scan:'📷', dice:'🎲', market:'📊', timer:'⏱️', music:'🎵', ranking:'🏅', profit:'✅', loss:'❌' },
  lucideIcons: { startGame:'Play', newRoom:'RefreshCw', back:'ArrowLeft', close:'X', settings:'Settings', check:'Check', trendUp:'TrendingUp', trendDown:'TrendingDown', barChart:'BarChart3', trophy:'Trophy', wallet:'Wallet', zap:'Zap', globe:'Globe', save:'Save', edit:'Pencil', copy:'Copy', qrCode:'QrCode', music:'Music', musicOff:'VolumeX', timer:'Timer', users:'Users', chevronDown:'ChevronDown', chevronRight:'ChevronRight', alertCircle:'AlertCircle', info:'Info', star:'Star', dice:'Dices' }
}

export default function IconsAdminPage() {
  const { reloadIcons } = useIcons()
  const [config, setConfig] = useState<IconConfig>(DEFAULT_CONFIG)
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState<'avatars' | 'events' | 'cryptos' | 'ui' | 'lucideIcons' | 'currency'>('avatars')
  const [editingAvatar, setEditingAvatar] = useState<number | null>(null)
  const [avatarInput, setAvatarInput] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [currencyHasChanges, setCurrencyHasChanges] = useState(false)
  const [customSymbol, setCustomSymbol] = useState('')
  const [customName, setCustomName] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [customDescription, setCustomDescription] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [iconsRes, currencyRes] = await Promise.all([
        fetch('/api/icons', { cache: 'no-store' }),
        fetch('/api/currency', { cache: 'no-store' })
      ])
      
      if (iconsRes.ok) {
        const data = await iconsRes.json()
        if (data?.avatars) {
          setConfig(data)
          setHasUnsavedChanges(false)
        }
      }
      
      if (currencyRes.ok) {
        const currencyData = await currencyRes.json()
        setCurrencyConfig(currencyData)
        setCurrencyHasChanges(false)
      }
    } catch {
      console.error('Failed to load configuration')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const promises = []
      
      if (hasUnsavedChanges) {
        promises.push(
          fetch('/api/icons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          })
        )
      }
      
      if (currencyHasChanges && currencyConfig) {
        promises.push(
          fetch('/api/currency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currency: currencyConfig.currency })
          })
        )
      }
      
      const results = await Promise.all(promises)
      const allOk = results.every(res => res.ok)
      
      if (allOk) {
        setSaveStatus('success')
        setHasUnsavedChanges(false)
        setCurrencyHasChanges(false)
        await reloadIcons()
        // Reload currency in the app if it was changed
        if (currencyHasChanges) {
          window.dispatchEvent(new Event('currencyChanged'))
        }
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
    setSaving(false)
  }

  const updateSection = (section: keyof IconConfig, key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, string>), [key]: value }
    }))
    setHasUnsavedChanges(true)
  }

  const updateAvatar = (index: number, value: string) => {
    const newList = [...config.avatars.list]
    newList[index] = value
    setConfig(prev => ({ ...prev, avatars: { list: newList } }))
    setEditingAvatar(null)
    setAvatarInput('')
    setHasUnsavedChanges(true)
  }

  const addAvatar = () => {
    if (config.avatars.list.length >= 30) return
    setConfig(prev => ({ ...prev, avatars: { list: [...prev.avatars.list, '❓'] } }))
    setHasUnsavedChanges(true)
  }

  const removeAvatar = (index: number) => {
    if (config.avatars.list.length <= 5) return
    const newList = config.avatars.list.filter((_, i) => i !== index)
    setConfig(prev => ({ ...prev, avatars: { list: newList } }))
    setHasUnsavedChanges(true)
  }

  const tabs = [
    { key: 'avatars',     label: 'Avatars',       icon: '🎭' },
    { key: 'events',      label: 'Events',         icon: '📣' },
    { key: 'cryptos',     label: 'Crypto\'s',      icon: '🪙' },
    { key: 'ui',          label: 'UI Emoji\'s',    icon: '✨' },
    { key: 'lucideIcons', label: 'Lucide Icons',   icon: '🔷' },
    { key: 'currency',    label: 'Valuta',         icon: '⚘' },
  ] as const

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Icons laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Smile className="w-6 h-6 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold">Icon & Emoji Admin</h1>
              <p className="text-xs text-gray-400">CryptoClash — Beheer alle icons en emoji's</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={load}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Herladen
            </button>
            <button
              onClick={save}
              disabled={saving}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold transition-all ${
                saveStatus === 'success' ? 'bg-green-600 text-white' :
                saveStatus === 'error'   ? 'bg-red-600 text-white' :
                hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-500 text-white animate-pulse' :
                'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saveStatus === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Opslaan...' : saveStatus === 'success' ? 'Opgeslagen!' : saveStatus === 'error' ? 'Fout!' : (hasUnsavedChanges || currencyHasChanges) ? 'Wijzigingen Opslaan' : 'Alles Opslaan'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section description */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 mb-6">
          <p className="text-sm text-gray-300">{SECTION_META[activeTab]?.description}</p>
        </div>

        {/* ─── AVATARS TAB ─── */}
        {activeTab === 'avatars' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">{config.avatars.list.length} avatars &middot; Klik op een avatar om te wijzigen</p>
              <button
                onClick={addAvatar}
                disabled={config.avatars.list.length >= 30}
                className="text-sm bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              >
                + Avatar Toevoegen
              </button>
            </div>

            <div className="grid grid-cols-5 gap-3 sm:grid-cols-8 md:grid-cols-10">
              {config.avatars.list.map((avatar, index) => (
                <div key={index} className="relative group">
                  {editingAvatar === index ? (
                    <div className="flex flex-col items-center gap-1">
                      <input
                        autoFocus
                        type="text"
                        value={avatarInput}
                        onChange={e => setAvatarInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') updateAvatar(index, avatarInput || avatar)
                          if (e.key === 'Escape') { setEditingAvatar(null); setAvatarInput('') }
                        }}
                        className="w-14 h-14 text-2xl text-center bg-gray-700 border-2 border-purple-500 rounded-xl focus:outline-none"
                        maxLength={4}
                      />
                      <button
                        onClick={() => updateAvatar(index, avatarInput || avatar)}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        ✓ OK
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => { setEditingAvatar(index); setAvatarInput(avatar) }}
                        className="w-14 h-14 text-2xl flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500 rounded-xl transition-all group-hover:scale-105"
                        title={`Avatar ${index + 1} — klik om te wijzigen`}
                      >
                        {avatar}
                      </button>
                      <button
                        onClick={() => removeAvatar(index)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Verwijderen"
                      >
                        ×
                      </button>
                      <span className="absolute -bottom-1 left-0 right-0 text-center text-xs text-gray-600">{index + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500">
                <span className="text-gray-400 font-medium">Tip:</span> Klik op een avatar om hem te bewerken. Voer een emoji in en druk Enter of klik ✓ OK.
                De rode × knop verschijnt bij hover om een avatar te verwijderen (minimum 5).
              </p>
            </div>
          </div>
        )}

        {/* ─── EVENTS / CRYPTOS / UI TABS ─── */}
        {(activeTab === 'events' || activeTab === 'cryptos' || activeTab === 'ui') && (
          <div className="space-y-2">
            {Object.entries(config[activeTab] as Record<string, string>).map(([key, value]) => (
              <div
                key={key}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4"
              >
                {/* Preview */}
                <div className="text-3xl w-12 text-center flex-shrink-0">{value}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{KEY_LABELS[key] || key}</p>
                  <p className="text-xs text-gray-500 font-mono">{activeTab}.{key}</p>
                </div>

                {/* Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={value}
                    onChange={e => updateSection(activeTab, key, e.target.value)}
                    maxLength={6}
                    className="w-20 text-center text-xl bg-gray-800 border border-gray-700 focus:border-purple-500 rounded-lg px-2 py-2 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── CURRENCY TAB ─── */}
        {activeTab === 'currency' && currencyConfig && (
          <div className="space-y-6">
            {/* Current Currency Display */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-4xl">
                  {currencyConfig.currency.symbol}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{currencyConfig.currency.name}</h3>
                  <p className="text-sm text-gray-400">Huidige valuta • Code: {currencyConfig.currency.code}</p>
                </div>
              </div>
              {currencyConfig.currency.description && (
                <p className="text-sm text-gray-300 bg-black/20 rounded-lg px-4 py-2">
                  {currencyConfig.currency.description}
                </p>
              )}
            </div>

            {/* Custom Currency Creator */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-green-400" />
                Maak je Eigen Valuta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Symbool (emoji of teken)
                  </label>
                  <input
                    type="text"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    placeholder="bijv. ⚘, 💰, 🌟, ¥"
                    maxLength={4}
                    className="w-full text-2xl text-center bg-gray-800 border border-gray-700 focus:border-green-500 rounded-lg px-4 py-3 focus:outline-none transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Naam
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="bijv. Coins, Credits, Stars"
                    maxLength={20}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 rounded-lg px-4 py-3 focus:outline-none transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Code (3-4 letters)
                  </label>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    placeholder="bijv. COIN, STAR, CRED"
                    maxLength={4}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 rounded-lg px-4 py-3 focus:outline-none transition-colors text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Beschrijving (optioneel)
                  </label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="bijv. Game credits voor spelers"
                    maxLength={50}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-green-500 rounded-lg px-4 py-3 focus:outline-none transition-colors text-white"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (customSymbol && customName && customCode) {
                    const newCurrency = {
                      symbol: customSymbol,
                      name: customName,
                      code: customCode,
                      description: customDescription || `Custom ${customName} currency`
                    }
                    setCurrencyConfig(prev => prev ? { ...prev, currency: newCurrency } : null)
                    setCurrencyHasChanges(true)
                    // Clear inputs
                    setCustomSymbol('')
                    setCustomName('')
                    setCustomCode('')
                    setCustomDescription('')
                  }
                }}
                disabled={!customSymbol || !customName || !customCode}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Gebruik deze Custom Valuta
              </button>
            </div>

            {/* Available Currencies */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-400" />
                Voorgedefinieerde Valuta's
              </h3>
              <div className="grid gap-3">
                {currencyConfig.availableCurrencies.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => {
                      setCurrencyConfig(prev => prev ? { ...prev, currency: curr } : null)
                      setCurrencyHasChanges(true)
                    }}
                    className={`bg-gray-900 border rounded-xl px-5 py-4 flex items-center gap-4 transition-all text-left ${
                      currencyConfig.currency.code === curr.code
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    {/* Currency Symbol */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                      currencyConfig.currency.code === curr.code
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'bg-gray-800 border border-gray-700'
                    }`}>
                      {curr.symbol}
                    </div>

                    {/* Currency Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-semibold text-white">{curr.name}</p>
                        <code className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">
                          {curr.code}
                        </code>
                      </div>
                      <p className="text-sm text-gray-400">{curr.description}</p>
                    </div>

                    {/* Selected Indicator */}
                    {currencyConfig.currency.code === curr.code && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">💡 Hoe werkt dit?</p>
                <ul className="text-xs text-blue-400/80 space-y-1 list-disc list-inside">
                  <li><strong>Custom Valuta:</strong> Maak je eigen valuta met elk emoji of symbool dat je wilt (🌟, 💰, 🍪, etc.)</li>
                  <li><strong>Voorgedefinieerd:</strong> Kies uit Bloom (⚘), Euro (€), Dollar ($), Bitcoin (₿) of Gems (💎)</li>
                  <li><strong>Bloom (⚘)</strong> is aanbevolen voor kinderen - fictieve game valuta zonder associatie met echt geld</li>
                  <li>Klik "Wijzigingen Opslaan" om de nieuwe valuta toe te passen</li>
                  <li>De wijziging wordt direct actief in het hele spel</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ─── LUCIDE ICONS TAB ─── */}
        {activeTab === 'lucideIcons' && (
          <div className="space-y-2">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-300 font-medium">Lucide icon namen</p>
                <p className="text-xs text-blue-400/80 mt-0.5">
                  Vul de exacte PascalCase naam in van een Lucide icon.
                  Bekijk alle beschikbare icons op{' '}
                  <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                    lucide.dev/icons
                  </a>
                  . Bijv: <code className="bg-blue-500/10 px-1 rounded">Play</code>, <code className="bg-blue-500/10 px-1 rounded">ArrowLeft</code>, <code className="bg-blue-500/10 px-1 rounded">TrendingUp</code>
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              {Object.entries(config.lucideIcons).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 flex items-center gap-4"
                >
                  {/* Icon name badge */}
                  <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Type className="w-4 h-4 text-purple-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{KEY_LABELS[key] || key}</p>
                    <p className="text-xs text-gray-500 font-mono">lucideIcons.{key}</p>
                  </div>

                  {/* Current value preview */}
                  <code className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md font-mono hidden sm:block">
                    {value}
                  </code>

                  {/* Input */}
                  <input
                    type="text"
                    value={value}
                    onChange={e => updateSection('lucideIcons', key, e.target.value)}
                    placeholder="bijv. Play"
                    className="w-36 text-sm bg-gray-800 border border-gray-700 focus:border-purple-500 rounded-lg px-3 py-2 focus:outline-none transition-colors font-mono text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-600 pt-8 pb-6">
          Vergeet niet op <strong className="text-gray-400">Alles Opslaan</strong> te klikken na wijzigingen.
        </p>
      </div>
    </div>
  )
}
