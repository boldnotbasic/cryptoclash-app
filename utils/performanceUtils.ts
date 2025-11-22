/**
 * Performance utilities for React optimization
 */

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @param immediate - Execute immediately on first call
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

/**
 * Throttle function for performance optimization
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Cleanup utility for removing event listeners and timeouts
 */
export class CleanupManager {
  private timeouts: Set<NodeJS.Timeout> = new Set()
  private intervals: Set<NodeJS.Timeout> = new Set()
  private eventListeners: Array<{ element: EventTarget; event: string; handler: EventListener }> = []

  addTimeout(timeout: NodeJS.Timeout) {
    this.timeouts.add(timeout)
    return timeout
  }

  addInterval(interval: NodeJS.Timeout) {
    this.intervals.add(interval)
    return interval
  }

  addEventListener(element: EventTarget, event: string, handler: EventListener) {
    element.addEventListener(event, handler)
    this.eventListeners.push({ element, event, handler })
  }

  cleanup() {
    // Clear timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts.clear()

    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()

    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    this.eventListeners = []
  }
}

/**
 * Memory-efficient array operations
 */
export const ArrayUtils = {
  /**
   * Efficiently update array item by id
   */
  updateById<T extends { id: string | number }>(
    array: T[],
    id: string | number,
    updates: Partial<T>
  ): T[] {
    const index = array.findIndex(item => item.id === id)
    if (index === -1) return array
    
    const newArray = [...array]
    newArray[index] = { ...newArray[index], ...updates }
    return newArray
  },

  /**
   * Efficiently sort and rank players
   */
  sortAndRank<T extends { totalValue: number }>(
    array: T[]
  ): (T & { rank: number })[] {
    return array
      .sort((a, b) => b.totalValue - a.totalValue)
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }
}
