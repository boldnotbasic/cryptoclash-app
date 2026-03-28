/**
 * Format a number as currency with the given symbol
 * @param amount - The amount to format
 * @param symbol - The currency symbol (e.g., '⚘', '€', '$')
 * @param options - Formatting options
 */
export function formatCurrency(
  amount: number,
  symbol: string,
  options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    locale?: string
  }
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    locale = 'nl-NL'
  } = options || {}

  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  })

  return `${symbol}${formatted}`
}
