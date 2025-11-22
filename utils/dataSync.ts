/**
 * CENTRALIZED DATA SYNCHRONIZATION SYSTEM
 * Single Source of Truth for cross-device consistency
 */

export interface PlayerData {
  id: string
  name: string
  avatar: string
  portfolio: Record<string, number>
  cashBalance: number
  portfolioValue: number
  totalValue: number
  lastUpdate: number
  socketId?: string
}

export interface RoomState {
  roomCode: string
  players: Record<string, PlayerData>
  cryptoPrices: Record<string, number>
  lastSync: number
  version: number
}

/**
 * Data validation utilities
 */
export class DataValidator {
  static validatePlayerData(data: Partial<PlayerData>): boolean {
    if (!data.name || typeof data.name !== 'string') return false
    if (typeof data.cashBalance !== 'number' || data.cashBalance < 0) return false
    if (typeof data.portfolioValue !== 'number' || data.portfolioValue < 0) return false
    if (typeof data.totalValue !== 'number' || data.totalValue < 0) return false
    
    // Validate portfolio consistency
    if (data.portfolio && typeof data.portfolio === 'object') {
      for (const [symbol, amount] of Object.entries(data.portfolio)) {
        if (typeof amount !== 'number' || amount < 0) return false
      }
    }
    
    return true
  }

  static validateTotalValue(portfolioValue: number, cashBalance: number, totalValue: number): boolean {
    const calculatedTotal = Math.round((portfolioValue + cashBalance) * 100) / 100
    const difference = Math.abs(calculatedTotal - totalValue)
    return difference < 0.01 // Allow 1 cent difference for rounding
  }

  static sanitizePlayerData(data: Partial<PlayerData>): PlayerData | null {
    if (!this.validatePlayerData(data)) return null

    return {
      id: data.id || '',
      name: data.name || '',
      avatar: data.avatar || '👤',
      portfolio: data.portfolio || {},
      cashBalance: Math.round((data.cashBalance || 0) * 100) / 100,
      portfolioValue: Math.round((data.portfolioValue || 0) * 100) / 100,
      totalValue: Math.round((data.totalValue || 0) * 100) / 100,
      lastUpdate: Date.now(),
      socketId: data.socketId
    }
  }
}

/**
 * Centralized state manager for room data
 */
export class RoomStateManager {
  private static instances: Map<string, RoomStateManager> = new Map()
  private state: RoomState
  private subscribers: Set<(state: RoomState) => void> = new Set()

  private constructor(roomCode: string) {
    this.state = {
      roomCode,
      players: {},
      cryptoPrices: {},
      lastSync: Date.now(),
      version: 1
    }
  }

  static getInstance(roomCode: string): RoomStateManager {
    if (!this.instances.has(roomCode)) {
      this.instances.set(roomCode, new RoomStateManager(roomCode))
    }
    return this.instances.get(roomCode)!
  }

  subscribe(callback: (state: RoomState) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  private notify(): void {
    this.state.lastSync = Date.now()
    this.state.version++
    this.subscribers.forEach(callback => callback({ ...this.state }))
  }

  updatePlayer(playerId: string, data: Partial<PlayerData>): boolean {
    const sanitized = DataValidator.sanitizePlayerData({ ...data, id: playerId })
    if (!sanitized) {
      console.error('❌ Invalid player data:', data)
      return false
    }

    // Validate total value consistency
    if (!DataValidator.validateTotalValue(sanitized.portfolioValue, sanitized.cashBalance, sanitized.totalValue)) {
      console.warn('⚠️ Total value inconsistency detected, recalculating...')
      sanitized.totalValue = Math.round((sanitized.portfolioValue + sanitized.cashBalance) * 100) / 100
    }

    this.state.players[playerId] = sanitized
    this.notify()
    
    console.log(`✅ Player ${sanitized.name} updated: €${sanitized.totalValue}`)
    return true
  }

  getPlayer(playerId: string): PlayerData | null {
    return this.state.players[playerId] || null
  }

  getAllPlayers(): PlayerData[] {
    return Object.values(this.state.players)
      .sort((a, b) => b.totalValue - a.totalValue)
      .map((player, index) => ({ ...player, rank: index + 1 }))
  }

  updateCryptoPrices(prices: Record<string, number>): void {
    this.state.cryptoPrices = { ...prices }
    
    // Recalculate all portfolio values with new prices
    Object.values(this.state.players).forEach(player => {
      const newPortfolioValue = Object.entries(player.portfolio).reduce((sum, [symbol, amount]) => {
        const price = prices[symbol] || 0
        return sum + (price * amount)
      }, 0)
      
      const roundedPortfolioValue = Math.round(newPortfolioValue * 100) / 100
      const newTotalValue = Math.round((roundedPortfolioValue + player.cashBalance) * 100) / 100
      
      if (Math.abs(player.portfolioValue - roundedPortfolioValue) > 0.01) {
        player.portfolioValue = roundedPortfolioValue
        player.totalValue = newTotalValue
        player.lastUpdate = Date.now()
      }
    })
    
    this.notify()
  }

  getState(): RoomState {
    return { ...this.state }
  }

  removePlayer(playerId: string): void {
    delete this.state.players[playerId]
    this.notify()
  }

  static cleanup(roomCode: string): void {
    this.instances.delete(roomCode)
  }
}

/**
 * Throttling and debouncing utilities for performance optimization
 */
export class PerformanceUtils {
  private static timers: Map<string, NodeJS.Timeout> = new Map()
  private static lastExecution: Map<string, number> = new Map()

  /**
   * Debounce function execution
   */
  static debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.timers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        func(...args)
        this.timers.delete(key)
      }, delay)

      this.timers.set(key, timer)
    }
  }

  /**
   * Throttle function execution
   */
  static throttle<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const lastExec = this.lastExecution.get(key) || 0
      const now = Date.now()

      if (now - lastExec >= delay) {
        func(...args)
        this.lastExecution.set(key, now)
      }
    }
  }

  /**
   * Clear all timers for cleanup
   */
  static cleanup(): void {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.lastExecution.clear()
  }
}

/**
 * Cross-device synchronization utilities
 */
export class SyncManager {
  static generateSyncHash(data: PlayerData): string {
    const syncString = `${data.name}-${data.cashBalance}-${data.portfolioValue}-${data.totalValue}-${JSON.stringify(data.portfolio)}`
    return btoa(syncString).slice(0, 16)
  }

  static detectConflicts(local: PlayerData, remote: PlayerData): string[] {
    const conflicts: string[] = []
    
    if (Math.abs(local.cashBalance - remote.cashBalance) > 0.01) {
      conflicts.push(`Cash: Local €${local.cashBalance} vs Remote €${remote.cashBalance}`)
    }
    
    if (Math.abs(local.portfolioValue - remote.portfolioValue) > 0.01) {
      conflicts.push(`Portfolio: Local €${local.portfolioValue} vs Remote €${remote.portfolioValue}`)
    }
    
    if (Math.abs(local.totalValue - remote.totalValue) > 0.01) {
      conflicts.push(`Total: Local €${local.totalValue} vs Remote €${remote.totalValue}`)
    }
    
    return conflicts
  }

  static resolveConflict(local: PlayerData, remote: PlayerData): PlayerData {
    // Use most recent data based on timestamp
    const winner = local.lastUpdate > remote.lastUpdate ? local : remote
    console.log(`🔄 Conflict resolved: Using ${winner === local ? 'local' : 'remote'} data (${new Date(winner.lastUpdate).toLocaleTimeString()})`)
    return winner
  }
}
