/**
 * Centralized error handling and logging utilities
 */

export interface ErrorLog {
  timestamp: number
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  context?: any
  stack?: string
}

export class ErrorHandler {
  private static logs: ErrorLog[] = []
  private static maxLogs = 100

  /**
   * Log an error with context
   */
  static logError(message: string, error?: Error, context?: any): void {
    const log: ErrorLog = {
      timestamp: Date.now(),
      level: 'error',
      message,
      context,
      stack: error?.stack
    }

    this.addLog(log)
    console.error(`❌ ${message}`, context, error)
  }

  /**
   * Log a warning
   */
  static logWarning(message: string, context?: any): void {
    const log: ErrorLog = {
      timestamp: Date.now(),
      level: 'warn',
      message,
      context
    }

    this.addLog(log)
    console.warn(`⚠️ ${message}`, context)
  }

  /**
   * Log info message
   */
  static logInfo(message: string, context?: any): void {
    const log: ErrorLog = {
      timestamp: Date.now(),
      level: 'info',
      message,
      context
    }

    this.addLog(log)
    console.log(`ℹ️ ${message}`, context)
  }

  /**
   * Log debug message (only in development)
   */
  static logDebug(message: string, context?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const log: ErrorLog = {
        timestamp: Date.now(),
        level: 'debug',
        message,
        context
      }

      this.addLog(log)
      console.debug(`🐛 ${message}`, context)
    }
  }

  /**
   * Add log to internal storage
   */
  private static addLog(log: ErrorLog): void {
    this.logs.push(log)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * Get all logs
   */
  static getLogs(): ErrorLog[] {
    return [...this.logs]
  }

  /**
   * Get logs by level
   */
  static getLogsByLevel(level: ErrorLog['level']): ErrorLog[] {
    return this.logs.filter(log => log.level === level)
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    this.logs = []
  }

  /**
   * Safe async operation wrapper
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    context?: any
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      this.logError(errorMessage, error as Error, context)
      return null
    }
  }

  /**
   * Safe sync operation wrapper
   */
  static safeSync<T>(
    operation: () => T,
    errorMessage: string,
    context?: any
  ): T | null {
    try {
      return operation()
    } catch (error) {
      this.logError(errorMessage, error as Error, context)
      return null
    }
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map()

  /**
   * Start timing an operation
   */
  static startTimer(key: string): void {
    this.timers.set(key, performance.now())
  }

  /**
   * End timing and log result
   */
  static endTimer(key: string, operation: string): number {
    const startTime = this.timers.get(key)
    if (!startTime) {
      ErrorHandler.logWarning(`Timer not found for key: ${key}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(key)

    if (duration > 100) { // Log slow operations
      ErrorHandler.logWarning(`Slow operation detected: ${operation}`, { duration: `${duration.toFixed(2)}ms` })
    } else {
      ErrorHandler.logDebug(`Operation completed: ${operation}`, { duration: `${duration.toFixed(2)}ms` })
    }

    return duration
  }

  /**
   * Monitor a function's performance
   */
  static monitor<T>(fn: () => T, operation: string): T {
    const key = `${operation}-${Date.now()}`
    this.startTimer(key)
    
    try {
      const result = fn()
      this.endTimer(key, operation)
      return result
    } catch (error) {
      this.endTimer(key, `${operation} (failed)`)
      throw error
    }
  }

  /**
   * Monitor an async function's performance
   */
  static async monitorAsync<T>(fn: () => Promise<T>, operation: string): Promise<T> {
    const key = `${operation}-${Date.now()}`
    this.startTimer(key)
    
    try {
      const result = await fn()
      this.endTimer(key, operation)
      return result
    } catch (error) {
      this.endTimer(key, `${operation} (failed)`)
      throw error
    }
  }
}
