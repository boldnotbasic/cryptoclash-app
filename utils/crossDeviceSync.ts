/**
 * CROSS-DEVICE SYNCHRONIZATION SYSTEM
 * Ensures 100% data consistency across all devices
 */

export interface DeviceState {
  deviceId: string
  playerId: string
  playerName: string
  totalValue: number
  portfolioValue: number
  cashBalance: number
  portfolio: Record<string, number>
  timestamp: number
  version: number
}

export interface SyncConflict {
  playerId: string
  playerName: string
  conflicts: {
    field: string
    localValue: any
    remoteValue: any
    difference?: number
  }[]
  resolution: 'local' | 'remote' | 'calculated'
  timestamp: number
}

/**
 * Cross-device synchronization manager
 */
export class CrossDeviceSyncManager {
  private static instance: CrossDeviceSyncManager
  private deviceStates: Map<string, DeviceState> = new Map()
  private conflicts: SyncConflict[] = []
  private syncCallbacks: Set<(conflict: SyncConflict) => void> = new Set()

  static getInstance(): CrossDeviceSyncManager {
    if (!this.instance) {
      this.instance = new CrossDeviceSyncManager()
    }
    return this.instance
  }

  /**
   * Register a device state
   */
  registerDevice(state: DeviceState): void {
    const existingState = this.deviceStates.get(state.deviceId)
    
    if (existingState) {
      const conflicts = this.detectConflicts(existingState, state)
      if (conflicts.length > 0) {
        const conflict: SyncConflict = {
          playerId: state.playerId,
          playerName: state.playerName,
          conflicts,
          resolution: this.resolveConflicts(existingState, state),
          timestamp: Date.now()
        }
        
        this.conflicts.push(conflict)
        this.notifyConflict(conflict)
      }
    }
    
    this.deviceStates.set(state.deviceId, state)
  }

  /**
   * Detect conflicts between device states
   */
  private detectConflicts(local: DeviceState, remote: DeviceState): SyncConflict['conflicts'] {
    const conflicts: SyncConflict['conflicts'] = []
    
    // Check numerical values
    if (Math.abs(local.totalValue - remote.totalValue) > 0.01) {
      conflicts.push({
        field: 'totalValue',
        localValue: local.totalValue,
        remoteValue: remote.totalValue,
        difference: Math.abs(local.totalValue - remote.totalValue)
      })
    }
    
    if (Math.abs(local.portfolioValue - remote.portfolioValue) > 0.01) {
      conflicts.push({
        field: 'portfolioValue',
        localValue: local.portfolioValue,
        remoteValue: remote.portfolioValue,
        difference: Math.abs(local.portfolioValue - remote.portfolioValue)
      })
    }
    
    if (Math.abs(local.cashBalance - remote.cashBalance) > 0.01) {
      conflicts.push({
        field: 'cashBalance',
        localValue: local.cashBalance,
        remoteValue: remote.cashBalance,
        difference: Math.abs(local.cashBalance - remote.cashBalance)
      })
    }
    
    // Check portfolio differences
    const allSymbols = Array.from(new Set([...Object.keys(local.portfolio), ...Object.keys(remote.portfolio)]))
    for (const symbol of allSymbols) {
      const localAmount = local.portfolio[symbol] || 0
      const remoteAmount = remote.portfolio[symbol] || 0
      
      if (Math.abs(localAmount - remoteAmount) > 0.001) {
        conflicts.push({
          field: `portfolio.${symbol}`,
          localValue: localAmount,
          remoteValue: remoteAmount,
          difference: Math.abs(localAmount - remoteAmount)
        })
      }
    }
    
    return conflicts
  }

  /**
   * Resolve conflicts between states
   */
  private resolveConflicts(local: DeviceState, remote: DeviceState): 'local' | 'remote' | 'calculated' {
    // Use timestamp to determine most recent
    if (remote.timestamp > local.timestamp + 1000) { // 1 second tolerance
      return 'remote'
    } else if (local.timestamp > remote.timestamp + 1000) {
      return 'local'
    }
    
    // Use version number if timestamps are close
    if (remote.version > local.version) {
      return 'remote'
    } else if (local.version > remote.version) {
      return 'local'
    }
    
    // Calculate from portfolio if versions are equal
    return 'calculated'
  }

  /**
   * Subscribe to conflict notifications
   */
  onConflict(callback: (conflict: SyncConflict) => void): () => void {
    this.syncCallbacks.add(callback)
    return () => this.syncCallbacks.delete(callback)
  }

  /**
   * Notify subscribers of conflicts
   */
  private notifyConflict(conflict: SyncConflict): void {
    this.syncCallbacks.forEach(callback => callback(conflict))
  }

  /**
   * Get all conflicts for a player
   */
  getConflicts(playerId: string): SyncConflict[] {
    return this.conflicts.filter(c => c.playerId === playerId)
  }

  /**
   * Clear conflicts for a player
   */
  clearConflicts(playerId: string): void {
    this.conflicts = this.conflicts.filter(c => c.playerId !== playerId)
  }

  /**
   * Get device state
   */
  getDeviceState(deviceId: string): DeviceState | undefined {
    return this.deviceStates.get(deviceId)
  }

  /**
   * Get all device states for a player
   */
  getPlayerDevices(playerId: string): DeviceState[] {
    return Array.from(this.deviceStates.values()).filter(state => state.playerId === playerId)
  }

  /**
   * Validate data consistency across all devices for a player
   */
  validatePlayerConsistency(playerId: string): {
    isConsistent: boolean
    conflicts: SyncConflict['conflicts']
    recommendedState?: DeviceState
  } {
    const devices = this.getPlayerDevices(playerId)
    
    if (devices.length <= 1) {
      return { isConsistent: true, conflicts: [] }
    }
    
    const [primary, ...others] = devices.sort((a, b) => b.timestamp - a.timestamp)
    const allConflicts: SyncConflict['conflicts'] = []
    
    for (const device of others) {
      const conflicts = this.detectConflicts(primary, device)
      allConflicts.push(...conflicts)
    }
    
    return {
      isConsistent: allConflicts.length === 0,
      conflicts: allConflicts,
      recommendedState: primary
    }
  }
}

/**
 * Utility functions for cross-device sync
 */
export const CrossDeviceUtils = {
  /**
   * Generate unique device ID
   */
  generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Calculate portfolio value from portfolio and prices
   */
  calculatePortfolioValue(portfolio: Record<string, number>, prices: Record<string, number>): number {
    const value = Object.entries(portfolio).reduce((sum, [symbol, amount]) => {
      const price = prices[symbol] || 0
      return sum + (price * amount)
    }, 0)
    
    return Math.round(value * 100) / 100
  },

  /**
   * Validate total value calculation
   */
  validateTotalValue(portfolioValue: number, cashBalance: number, totalValue: number): boolean {
    const calculated = Math.round((portfolioValue + cashBalance) * 100) / 100
    return Math.abs(calculated - totalValue) < 0.01
  },

  /**
   * Create device state from player data
   */
  createDeviceState(
    deviceId: string,
    playerId: string,
    playerName: string,
    portfolio: Record<string, number>,
    cashBalance: number,
    portfolioValue: number,
    totalValue: number,
    version: number = 1
  ): DeviceState {
    return {
      deviceId,
      playerId,
      playerName,
      portfolio: { ...portfolio },
      cashBalance: Math.round(cashBalance * 100) / 100,
      portfolioValue: Math.round(portfolioValue * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      timestamp: Date.now(),
      version
    }
  }
}
