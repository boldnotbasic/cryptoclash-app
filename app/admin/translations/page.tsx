'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, RefreshCw, ChevronDown, ChevronRight, Globe, Check, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

type TranslationData = Record<string, Record<string, string>>

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const val = obj[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val as Record<string, unknown>, fullKey))
    } else if (typeof val === 'string') {
      result[fullKey] = val
    }
  }
  return result
}

function unflattenObject(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {}
      }
      current = current[parts[i]] as Record<string, unknown>
    }
    current[parts[parts.length - 1]] = value
  }
  return result
}

const SECTION_LABELS: Record<string, string> = {
  common: 'Algemeen',
  mainMenu: 'Hoofdmenu',
  hostSetup: 'Spel Aanmaken',
  waitingRoom: 'Wachtkamer',
  roomJoin: 'Spel Joinen',
  gameDashboard: 'Game Dashboard',
  buyCrypto: 'Crypto Kopen',
  marketDashboard: 'Markt Dashboard',
  events: 'Events',
  diceRoll: 'Dobbelsteen'
}

export default function TranslationsAdminPage() {
  const { reloadTranslations } = useLanguage()
  const [nlFlat, setNlFlat] = useState<Record<string, string>>({})
  const [enFlat, setEnFlat] = useState<Record<string, string>>({})
  const [frFlat, setFrFlat] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ common: true })
  const [search, setSearch] = useState('')
  const [newKeySection, setNewKeySection] = useState('')
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyNl, setNewKeyNl] = useState('')
  const [newKeyEn, setNewKeyEn] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nlRes, enRes, frRes] = await Promise.all([
        fetch('/api/translations?lang=nl', { cache: 'no-store' }),
        fetch('/api/translations?lang=en', { cache: 'no-store' }),
        fetch('/api/translations?lang=fr', { cache: 'no-store' })
      ])
      const nl = await nlRes.json()
      const en = await enRes.json()
      const fr = await frRes.json()
      setNlFlat(flattenObject(nl))
      setEnFlat(flattenObject(en))
      setFrFlat(flattenObject(fr))
    } catch {
      console.error('Failed to load translations')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const [nlRes, enRes, frRes] = await Promise.all([
        fetch('/api/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: 'nl', translations: unflattenObject(nlFlat) })
        }),
        fetch('/api/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: 'en', translations: unflattenObject(enFlat) })
        }),
        fetch('/api/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: 'fr', translations: unflattenObject(frFlat) })
        })
      ])
      if (nlRes.ok && enRes.ok && frRes.ok) {
        setSaveStatus('success')
        await reloadTranslations()
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
    setSaving(false)
  }

  const [newKeyFr, setNewKeyFr] = useState('')

  const addKey = () => {
    if (!newKeySection || !newKeyName) return
    const fullKey = `${newKeySection}.${newKeyName}`
    setNlFlat(prev => ({ ...prev, [fullKey]: newKeyNl }))
    setEnFlat(prev => ({ ...prev, [fullKey]: newKeyEn }))
    setFrFlat(prev => ({ ...prev, [fullKey]: newKeyFr }))
    setOpenSections(prev => ({ ...prev, [newKeySection]: true }))
    setNewKeyName('')
    setNewKeyNl('')
    setNewKeyEn('')
    setNewKeyFr('')
  }

  const sections = Array.from(
    new Set(Object.keys(nlFlat).map(k => k.split('.')[0]))
  )

  const filteredKeys = (section: string) => {
    return Object.keys(nlFlat)
      .filter(k => k.startsWith(`${section}.`))
      .filter(k => {
        if (!search) return true
        const subKey = k.replace(`${section}.`, '')
        const nlVal = nlFlat[k] || ''
        const enVal = enFlat[k] || ''
        const q = search.toLowerCase()
        return subKey.toLowerCase().includes(q) || nlVal.toLowerCase().includes(q) || enVal.toLowerCase().includes(q)
      })
  }

  const missingEnCount = Object.keys(nlFlat).filter(k => !enFlat[k]).length
  const missingFrCount = Object.keys(nlFlat).filter(k => !frFlat[k]).length
  const missingCount = missingEnCount + missingFrCount

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Vertalingen laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold">Translation Admin</h1>
              <p className="text-xs text-gray-400">CryptoClash — NL / EN / FR</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {missingEnCount > 0 && (
              <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" />
                {missingEnCount} EN · {missingFrCount} FR ontbreken
              </div>
            )}

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
                saveStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : saveStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saveStatus === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Opslaan...' : saveStatus === 'success' ? 'Opgeslagen!' : saveStatus === 'error' ? 'Fout!' : 'Alles Opslaan'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Search */}
        <input
          type="text"
          placeholder="Zoek op key, Nederlandse of Engelse tekst..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        />

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">
          <span>Key</span>
          <span className="flex items-center gap-1">🇳🇱 Nederlands</span>
          <span className="flex items-center gap-1">🇬🇧 English</span>
          <span className="flex items-center gap-1">🇫🇷 Français</span>
        </div>

        {/* Sections */}
        {sections.map(section => {
          const keys = filteredKeys(section)
          if (keys.length === 0 && search) return null
          const isOpen = openSections[section] ?? false
          const sectionMissing = keys.filter(k => !enFlat[k] || !frFlat[k]).length

          return (
            <div key={section} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <span className="font-semibold text-white">{SECTION_LABELS[section] || section}</span>
                  <span className="text-xs text-gray-500 font-mono">{section}</span>
                  <span className="text-xs text-gray-600">{keys.length} keys</span>
                </div>
                {sectionMissing > 0 && (
                  <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                    {sectionMissing} ontbreekt
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="border-t border-gray-800 divide-y divide-gray-800/50">
                  {keys.map(key => {
                    const subKey = key.replace(`${section}.`, '')
                    const missingEn = !enFlat[key]
                    const missingFr = !frFlat[key]
                    const anyMissing = missingEn || missingFr
                    return (
                      <div
                        key={key}
                        className={`grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-5 py-3 items-start ${anyMissing ? 'bg-yellow-500/5' : ''}`}
                      >
                        <div className="pt-2">
                          <span className="text-xs font-mono text-purple-400">{subKey}</span>
                        </div>
                        <textarea
                          value={nlFlat[key] || ''}
                          onChange={e => setNlFlat(prev => ({ ...prev, [key]: e.target.value }))}
                          rows={1}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-blue-500 transition-colors w-full"
                          style={{ minHeight: '38px' }}
                          onInput={e => {
                            const el = e.target as HTMLTextAreaElement
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                          }}
                        />
                        <textarea
                          value={enFlat[key] || ''}
                          onChange={e => setEnFlat(prev => ({ ...prev, [key]: e.target.value }))}
                          rows={1}
                          placeholder={missingEn ? '⚠️ Ontbreekt nog' : ''}
                          className={`bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none transition-colors w-full ${
                            missingEn ? 'border-yellow-500/50 placeholder-yellow-600/60 focus:border-yellow-400' : 'border-gray-700 focus:border-green-500'
                          }`}
                          style={{ minHeight: '38px' }}
                          onInput={e => {
                            const el = e.target as HTMLTextAreaElement
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                          }}
                        />
                        <textarea
                          value={frFlat[key] || ''}
                          onChange={e => setFrFlat(prev => ({ ...prev, [key]: e.target.value }))}
                          rows={1}
                          placeholder={missingFr ? '⚠️ Ontbreekt nog' : ''}
                          className={`bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none transition-colors w-full ${
                            missingFr ? 'border-yellow-500/50 placeholder-yellow-600/60 focus:border-yellow-400' : 'border-gray-700 focus:border-green-500'
                          }`}
                          style={{ minHeight: '38px' }}
                          onInput={e => {
                            const el = e.target as HTMLTextAreaElement
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Add new key */}
        <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-5">
          <h3 className="font-semibold text-purple-400 mb-4">+ Nieuwe vertaalsleutel toevoegen</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sectie</label>
              <select
                value={newKeySection}
                onChange={e => setNewKeySection(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Kies sectie...</option>
                {sections.map(s => (
                  <option key={s} value={s}>{SECTION_LABELS[s] || s} ({s})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Key naam</label>
              <input
                type="text"
                placeholder="bijv. saveButton"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">🇳🇱 Nederlands</label>
              <input
                type="text"
                placeholder="Nederlandse tekst"
                value={newKeyNl}
                onChange={e => setNewKeyNl(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">🇬🇧 English</label>
              <input
                type="text"
                placeholder="English text"
                value={newKeyEn}
                onChange={e => setNewKeyEn(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">🇫🇷 Français</label>
              <input
                type="text"
                placeholder="Texte français"
                value={newKeyFr}
                onChange={e => setNewKeyFr(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <button
            onClick={addKey}
            disabled={!newKeySection || !newKeyName}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Key Toevoegen
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 pb-8">
          Vergeet niet op <strong className="text-gray-400">Alles Opslaan</strong> te klikken na wijzigingen.
        </p>
      </div>
    </div>
  )
}
