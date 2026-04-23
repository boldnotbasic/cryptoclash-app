'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload, RefreshCw, Trash2, Image as ImageIcon, Check, AlertCircle, Download } from 'lucide-react'
import Image from 'next/image'

interface Asset {
  name: string
  size: number
  modified: string
  path: string
}

export default function AssetsAdminPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/assets', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setAssets(data.assets || [])
      }
    } catch {
      console.error('Failed to load assets')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadStatus('idle')

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/assets', {
          method: 'POST',
          body: formData
        })

        if (!res.ok) {
          setUploadStatus('error')
          setUploading(false)
          return
        }
      }

      setUploadStatus('success')
      setTimeout(() => setUploadStatus('idle'), 3000)
      await load()
    } catch {
      setUploadStatus('error')
    }

    setUploading(false)
  }

  const handleDelete = async (fileName: string) => {
    try {
      const res = await fetch('/api/assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      })

      if (res.ok) {
        await load()
        setDeleteConfirm(null)
      }
    } catch {
      console.error('Failed to delete asset')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const cryptoAssets = assets.filter(a => 
    ['dsheep.png', 'goudhaantje.png', 'lentra.png', 'silica.png', 'orex.png', 'rex.png', 'glooma.png'].includes(a.name.toLowerCase())
  )
  const eventAssets = assets.filter(a => 
    ['bull-run.png', 'beurscrash.png', 'whala-alert.png'].includes(a.name.toLowerCase())
  )
  const logoAssets = assets.filter(a => 
    a.name.toLowerCase().includes('logo') || a.name.toLowerCase().includes('icon')
  )
  const otherAssets = assets.filter(a => 
    !cryptoAssets.includes(a) && !eventAssets.includes(a) && !logoAssets.includes(a)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Assets laden...</p>
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
            <ImageIcon className="w-6 h-6 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold">Asset Manager</h1>
              <p className="text-xs text-gray-400">Beheer afbeeldingen in /public/ — {assets.length} bestanden</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs px-3 py-1.5 rounded-lg">
                <Check className="w-3.5 h-3.5" />
                Geüpload!
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5" />
                Upload mislukt
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
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Uploaden...' : 'Upload Afbeelding'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={e => handleUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400 mb-1">Sleep afbeeldingen hierheen of klik op Upload</p>
          <p className="text-xs text-gray-600">PNG, JPG, GIF, SVG, WebP — max 10MB per bestand</p>
        </div>

        {/* Crypto Assets */}
        {cryptoAssets.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              Crypto Logo's
              <span className="text-sm text-gray-500 font-normal">({cryptoAssets.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cryptoAssets.map(asset => (
                <AssetCard
                  key={asset.name}
                  asset={asset}
                  onDelete={handleDelete}
                  deleteConfirm={deleteConfirm}
                  setDeleteConfirm={setDeleteConfirm}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          </div>
        )}

        {/* Event Assets */}
        {eventAssets.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">📣</span>
              Event Afbeeldingen
              <span className="text-sm text-gray-500 font-normal">({eventAssets.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {eventAssets.map(asset => (
                <AssetCard
                  key={asset.name}
                  asset={asset}
                  onDelete={handleDelete}
                  deleteConfirm={deleteConfirm}
                  setDeleteConfirm={setDeleteConfirm}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          </div>
        )}

        {/* Logo Assets */}
        {logoAssets.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              Logo's & Icons
              <span className="text-sm text-gray-500 font-normal">({logoAssets.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {logoAssets.map(asset => (
                <AssetCard
                  key={asset.name}
                  asset={asset}
                  onDelete={handleDelete}
                  deleteConfirm={deleteConfirm}
                  setDeleteConfirm={setDeleteConfirm}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Assets */}
        {otherAssets.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">📁</span>
              Overige Bestanden
              <span className="text-sm text-gray-500 font-normal">({otherAssets.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {otherAssets.map(asset => (
                <AssetCard
                  key={asset.name}
                  asset={asset}
                  onDelete={handleDelete}
                  deleteConfirm={deleteConfirm}
                  setDeleteConfirm={setDeleteConfirm}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          </div>
        )}

        {assets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p>Geen afbeeldingen gevonden in /public/</p>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-gray-500">
          <p className="mb-2"><strong className="text-gray-400">Tip:</strong> Upload nieuwe afbeeldingen of vervang bestaande door een bestand met dezelfde naam te uploaden.</p>
          <p>Verwijderde bestanden worden permanent gewist. Zorg dat ze niet meer gebruikt worden in de code.</p>
        </div>
      </div>
    </div>
  )
}

function AssetCard({
  asset,
  onDelete,
  deleteConfirm,
  setDeleteConfirm,
  formatFileSize
}: {
  asset: Asset
  onDelete: (name: string) => void
  deleteConfirm: string | null
  setDeleteConfirm: (name: string | null) => void
  formatFileSize: (bytes: number) => string
}) {
  const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].some(ext => 
    asset.name.toLowerCase().endsWith(ext)
  )

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group hover:border-purple-500/50 transition-all">
      {/* Image Preview */}
      <div className="aspect-square bg-gray-800 relative flex items-center justify-center p-3">
        {isImage ? (
          <Image
            src={asset.path}
            alt={asset.name}
            width={200}
            height={200}
            className="object-contain w-full h-full"
          />
        ) : (
          <ImageIcon className="w-12 h-12 text-gray-600" />
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <p className="text-xs font-medium text-white truncate" title={asset.name}>
          {asset.name}
        </p>
        <p className="text-xs text-gray-500">{formatFileSize(asset.size)}</p>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <a
            href={asset.path}
            download
            className="flex-1 flex items-center justify-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-2 py-1.5 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            Download
          </a>

          {deleteConfirm === asset.name ? (
            <button
              onClick={() => onDelete(asset.name)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1.5 rounded transition-colors font-semibold"
            >
              Zeker weten?
            </button>
          ) : (
            <button
              onClick={() => setDeleteConfirm(asset.name)}
              className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs px-2 py-1.5 rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Verwijder
            </button>
          )}
        </div>

        {deleteConfirm === asset.name && (
          <button
            onClick={() => setDeleteConfirm(null)}
            className="w-full text-xs text-gray-500 hover:text-gray-400 py-1"
          >
            Annuleren
          </button>
        )}
      </div>
    </div>
  )
}
