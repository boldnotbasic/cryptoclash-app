/**
 * Utility functions for conditional styling
 */

/**
 * Creates conditional tile classes based on clickability
 * @param isClickable - Whether the tile should be interactive
 * @param baseClasses - Base CSS classes
 * @param interactiveClasses - Classes to add when clickable (hover, scale, etc.)
 * @returns Combined CSS classes
 */
export const getTileClasses = (
  isClickable: boolean,
  baseClasses: string,
  interactiveClasses: string = "hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
): string => {
  if (isClickable) {
    return `${baseClasses} ${interactiveClasses}`
  }
  return `${baseClasses} cursor-not-allowed opacity-75`
}

/**
 * Creates conditional button/card classes
 * @param isEnabled - Whether the element should be interactive
 * @param baseClasses - Base CSS classes
 * @param enabledClasses - Classes when enabled
 * @param disabledClasses - Classes when disabled
 * @returns Combined CSS classes
 */
export const getInteractiveClasses = (
  isEnabled: boolean,
  baseClasses: string,
  enabledClasses: string = "hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer",
  disabledClasses: string = "cursor-not-allowed opacity-50"
): string => {
  return `${baseClasses} ${isEnabled ? enabledClasses : disabledClasses}`
}

/**
 * Consistent border styling for widgets
 */
export const WIDGET_BORDERS = {
  default: "border border-gray-600/30",
  highlighted: "border border-neon-purple/30",
  success: "border border-green-500/30",
  warning: "border border-yellow-500/30",
  error: "border border-red-500/30"
} as const
