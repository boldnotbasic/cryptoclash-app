/**
 * REAL-TIME SYNC MONITORING SYSTEM
 * Tracks and logs all data synchronization events for debugging
 */

export interface SyncEvent {
  id: string
  type: 'send' | 'receive' | 'conflict' | 'resolution'
  playerId: string
  playerName: string
  deviceId: string
  data: {
    totalValue: number
    portfolioValue: number
    cashBalance: number
    portfolio: Record<string, number>
  }
  timestamp: number
  source: 'client' | 'server'
  roomCode: string
  version?: number
}

export interface SyncMetrics {
  totalEvents: number
  conflicts: number
  resolutions: number
  avgSyncTime: number
  lastSyncTime: number
  deviceCount: number
  consistencyRate: number
}

/**
 * Sync monitoring and debugging system
 */
export class SyncMonitor {
  private static instance: SyncMonitor
  private events: SyncEvent[] = []
  private metrics: SyncMetrics = {
    totalEvents: 0,
    conflicts: 0,
    resolutions: 0,
    avgSyncTime: 0,
    lastSyncTime: 0,
    deviceCount: 0,
    consistencyRate: 100
  }
  private maxEvents = 1000 // Keep last 1000 events
  private subscribers: Set<(event: SyncEvent) => void> = new Set()

  static getInstance(): SyncMonitor {
    if (!this.instance) {
      this.instance = new SyncMonitor()
    }
    return this.instance
  }

  /**
   * Log a sync event
   */
  logEvent(event: Omit<SyncEvent, 'id' | 'timestamp'>): void {
    const syncEvent: SyncEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now()
    }

    this.events.push(syncEvent)
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    this.updateMetrics(syncEvent)
    this.notifySubscribers(syncEvent)

    // Console logging for development
    this.logToConsole(syncEvent)
  }

  /**
   * Subscribe to sync events
   */
  subscribe(callback: (event: SyncEvent) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Get events for a specific player
   */
  getPlayerEvents(playerId: string, limit: number = 50): SyncEvent[] {
    return this.events
      .filter(event => event.playerId === playerId)
      .slice(-limit)
      .reverse()
  }

  /**
   * Get events for a specific room
   */
  getRoomEvents(roomCode: string, limit: number = 100): SyncEvent[] {
    return this.events
      .filter(event => event.roomCode === roomCode)
      .slice(-limit)
      .reverse()
  }

  /**
   * Get current metrics
   */
  getMetrics(): SyncMetrics {
    return { ...this.metrics }
  }

  /**
   * Detect sync patterns and issues
   */
  analyzeSyncPatterns(playerId: string): {
    avgTimeBetweenUpdates: number
    conflictRate: number
    mostRecentConflict?: SyncEvent
    syncHealth: 'good' | 'warning' | 'critical'
  } {
    const playerEvents = this.getPlayerEvents(playerId, 100)
    const sendEvents = playerEvents.filter(e => e.type === 'send')
    const conflicts = playerEvents.filter(e => e.type === 'conflict')

    let avgTimeBetweenUpdates = 0
    if (sendEvents.length > 1) {
      const timeDiffs = []
      for (let i = 1; i < sendEvents.length; i++) {
        timeDiffs.push(sendEvents[i-1].timestamp - sendEvents[i].timestamp)
      }
      avgTimeBetweenUpdates = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length
    }

    const conflictRate = playerEvents.length > 0 ? (conflicts.length / playerEvents.length) * 100 : 0
    const mostRecentConflict = conflicts[0]

    let syncHealth: 'good' | 'warning' | 'critical' = 'good'
    if (conflictRate > 20) syncHealth = 'critical'
    else if (conflictRate > 5) syncHealth = 'warning'

    return {
      avgTimeBetweenUpdates,
      conflictRate,
      mostRecentConflict,
      syncHealth
    }
  }

  /**
   * Generate sync report
   */
  generateSyncReport(roomCode: string): string {
    const roomEvents = this.getRoomEvents(roomCode, 200)
    const players = Array.from(new Set(roomEvents.map(e => e.playerId)))
    
    let report = `\n🔍 === SYNC REPORT FOR ROOM ${roomCode} ===\n`
    report += `📊 Total Events: ${roomEvents.length}\n`
    report += `👥 Active Players: ${players.length}\n`
    report += `⚠️ Conflicts: ${roomEvents.filter(e => e.type === 'conflict').length}\n`
    report += `✅ Resolutions: ${roomEvents.filter(e => e.type === 'resolution').length}\n\n`

    players.forEach(playerId => {
      const playerEvents = roomEvents.filter(e => e.playerId === playerId)
      const analysis = this.analyzeSyncPatterns(playerId)
      const latestEvent = playerEvents[0]
      
      report += `👤 Player: ${latestEvent?.playerName || playerId}\n`
      report += `   💯 Latest Total: €${latestEvent?.data.totalValue?.toFixed(2) || 'N/A'}\n`
      report += `   📈 Events: ${playerEvents.length}\n`
      report += `   ⚠️ Conflict Rate: ${analysis.conflictRate.toFixed(1)}%\n`
      report += `   🏥 Health: ${analysis.syncHealth.toUpperCase()}\n\n`
    })

    report += `🔍 === END SYNC REPORT ===\n`
    return report
  }

  /**
   * Clear old events
   */
  clearEvents(olderThanMs: number = 300000): void { // Default 5 minutes
    const cutoff = Date.now() - olderThanMs
    this.events = this.events.filter(event => event.timestamp > cutoff)
  }

  private generateEventId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private updateMetrics(event: SyncEvent): void {
    this.metrics.totalEvents++
    this.metrics.lastSyncTime = event.timestamp

    if (event.type === 'conflict') {
      this.metrics.conflicts++
    } else if (event.type === 'resolution') {
      this.metrics.resolutions++
    }

    // Calculate consistency rate
    const recentEvents = this.events.slice(-100)
    const conflicts = recentEvents.filter(e => e.type === 'conflict').length
    this.metrics.consistencyRate = recentEvents.length > 0 
      ? ((recentEvents.length - conflicts) / recentEvents.length) * 100 
      : 100

    // Update device count
    const uniqueDevices = new Set(this.events.slice(-50).map(e => e.deviceId))
    this.metrics.deviceCount = uniqueDevices.size
  }

  private notifySubscribers(event: SyncEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in sync monitor subscriber:', error)
      }
    })
  }

  private logToConsole(event: SyncEvent): void {
    const emoji = {
      send: '📤',
      receive: '📥',
      conflict: '⚠️',
      resolution: '✅'
    }[event.type]

    const color = {
      send: 'color: #4CAF50',
      receive: 'color: #2196F3',
      conflict: 'color: #FF9800',
      resolution: 'color: #9C27B0'
    }[event.type]

    console.log(
      `%c${emoji} SYNC ${event.type.toUpperCase()}: ${event.playerName} → €${event.data.totalValue.toFixed(2)} (${event.source})`,
      color
    )

    if (event.type === 'conflict') {
      console.warn('🔍 Conflict details:', {
        player: event.playerName,
        device: event.deviceId,
        data: event.data,
        timestamp: new Date(event.timestamp).toLocaleTimeString()
      })
    }
  }
}

/**
 * Convenience functions for logging sync events
 */
export const SyncLogger = {
  logSend(playerId: string, playerName: string, deviceId: string, roomCode: string, data: SyncEvent['data'], version?: number): void {
    SyncMonitor.getInstance().logEvent({
      type: 'send',
      playerId,
      playerName,
      deviceId,
      roomCode,
      data,
      source: 'client',
      version
    })
  },

  logReceive(playerId: string, playerName: string, deviceId: string, roomCode: string, data: SyncEvent['data'], version?: number): void {
    SyncMonitor.getInstance().logEvent({
      type: 'receive',
      playerId,
      playerName,
      deviceId,
      roomCode,
      data,
      source: 'server',
      version
    })
  },

  logConflict(playerId: string, playerName: string, deviceId: string, roomCode: string, data: SyncEvent['data']): void {
    SyncMonitor.getInstance().logEvent({
      type: 'conflict',
      playerId,
      playerName,
      deviceId,
      roomCode,
      data,
      source: 'client'
    })
  },

  logResolution(playerId: string, playerName: string, deviceId: string, roomCode: string, data: SyncEvent['data']): void {
    SyncMonitor.getInstance().logEvent({
      type: 'resolution',
      playerId,
      playerName,
      deviceId,
      roomCode,
      data,
      source: 'server'
    })
  }
}
