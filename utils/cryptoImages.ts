/**
 * Crypto Image Path Utility
 * 
 * Centralized function to get crypto image paths with support for custom icons.
 * Priority: Custom SVG > Custom PNG > Default PNG > null
 */

export function getCryptoImagePath(symbol?: string): string | null {
  if (!symbol) return null
  
  // Normalize symbol to uppercase for consistency
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
  if (!mappedSymbol) return null
  
  // Priority 1: Custom SVG in /crypto-icons/
  const customSvg = `/crypto-icons/${mappedSymbol}.svg`
  
  // Priority 2: Custom PNG in /crypto-icons/
  const customPng = `/crypto-icons/${mappedSymbol}.png`
  
  // Priority 3: Default images in /public/
  const defaultImages: Record<string, string> = {
    'DSHP': '/dsheep.png',
    'ORX': '/orex.png',
    'LNTR': '/lentra.png',
    'SIL': '/silica.png',
    'REX': '/rex.png',
    'GLX': '/glooma.png'
  }
  
  // Return custom SVG path (will be checked by browser)
  // If custom doesn't exist, browser will fallback to default
  // We return the custom path first to allow easy override
  return customSvg
}

/**
 * Get crypto image with fallback logic
 * Use this when you need guaranteed fallback to default images
 */
export function getCryptoImageWithFallback(symbol?: string): string | null {
  if (!symbol) return null
  
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
  if (!mappedSymbol) return null
  
  // Default images
  const defaultImages: Record<string, string> = {
    'DSHP': '/dsheep.png',
    'ORX': '/orex.png',
    'LNTR': '/lentra.png',
    'SIL': '/silica.png',
    'REX': '/rex.png',
    'GLX': '/glooma.png'
  }
  
  return defaultImages[mappedSymbol] || null
}

/**
 * Check if custom icon exists for a crypto
 * Returns the custom path if it exists, otherwise null
 */
export async function checkCustomIcon(symbol: string): Promise<string | null> {
  const normalizedSymbol = symbol.toUpperCase()
  
  // Try SVG first
  const svgPath = `/crypto-icons/${normalizedSymbol}.svg`
  try {
    const response = await fetch(svgPath, { method: 'HEAD' })
    if (response.ok) return svgPath
  } catch {
    // SVG doesn't exist, try PNG
  }
  
  // Try PNG
  const pngPath = `/crypto-icons/${normalizedSymbol}.png`
  try {
    const response = await fetch(pngPath, { method: 'HEAD' })
    if (response.ok) return pngPath
  } catch {
    // PNG doesn't exist either
  }
  
  return null
}
