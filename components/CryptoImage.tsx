'use client'

import Image from 'next/image'
import { useState } from 'react'

interface CryptoImageProps {
  symbol: string
  alt?: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
}

/**
 * CryptoImage Component
 * 
 * Automatically tries to load custom crypto icons with fallback to default images.
 * Priority: /crypto-icons/{SYMBOL}.svg > /crypto-icons/{SYMBOL}.png > /{symbol}.png
 */
export default function CryptoImage({ 
  symbol, 
  alt, 
  width = 64, 
  height = 64, 
  className = '',
  priority = false,
  quality = 85
}: CryptoImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(() => {
    // Normalize symbol
    const normalizedSymbol = symbol.toUpperCase()
    
    // Map alternative symbols
    const symbolMap: Record<string, string> = {
      'DSHEEP': 'DSHP',
      'DSHP': 'DSHP',
      'ORX': 'ORX',
      'LNTR': 'LNTR',
      'SIL': 'SIL',
      'REX': 'REX',
      'GLX': 'GLX'
    }
    
    const mappedSymbol = symbolMap[normalizedSymbol]
    
    // Try custom SVG first
    return `/crypto-icons/${mappedSymbol}.svg`
  })
  
  const [hasError, setHasError] = useState(false)
  
  const handleError = () => {
    if (hasError) return // Prevent infinite loop
    
    setHasError(true)
    
    // Fallback chain
    const normalizedSymbol = symbol.toUpperCase()
    const symbolMap: Record<string, string> = {
      'DSHEEP': 'DSHP',
      'DSHP': 'DSHP',
      'ORX': 'ORX',
      'LNTR': 'LNTR',
      'SIL': 'SIL',
      'REX': 'REX',
      'GLX': 'GLX'
    }
    const mappedSymbol = symbolMap[normalizedSymbol]
    
    // If custom SVG failed, try custom PNG
    if (imageSrc.includes('/crypto-icons/') && imageSrc.endsWith('.svg')) {
      setImageSrc(`/crypto-icons/${mappedSymbol}.png`)
      setHasError(false)
      return
    }
    
    // If custom PNG failed, try default images
    if (imageSrc.includes('/crypto-icons/') && imageSrc.endsWith('.png')) {
      const defaultImages: Record<string, string> = {
        'DSHP': '/dsheep.png',
        'ORX': '/orex.png',
        'LNTR': '/lentra.png',
        'SIL': '/silica.png',
        'REX': '/rex.png',
        'GLX': '/glooma.png'
      }
      setImageSrc(defaultImages[mappedSymbol] || '/dsheep.png')
      setHasError(false)
      return
    }
  }
  
  return (
    <Image
      src={imageSrc}
      alt={alt || symbol}
      width={width}
      height={height}
      className={className}
      priority={priority}
      quality={quality}
      onError={handleError}
    />
  )
}
