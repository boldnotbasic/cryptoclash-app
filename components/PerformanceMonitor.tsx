'use client'

import React, { useState, useEffect } from 'react'
import { ErrorHandler, PerformanceMonitor } from '@/utils/errorHandler'
import { Activity, Clock, Zap, AlertTriangle } from 'lucide-react'

interface PerformanceStats {
  renderTime: number
  memoryUsage?: number
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  lastUpdate: number
}

interface PerformanceMonitorProps {
  isVisible?: boolean
  onToggle?: () => void
}

export const PerformanceMonitorComponent: React.FC<PerformanceMonitorProps> = ({ 
  isVisible = false, 
  onToggle 
}) => {
  const [stats, setStats] = useState<PerformanceStats>({
    renderTime: 0,
    connectionStatus: 'disconnected',
    lastUpdate: Date.now()
  })
  const [logs, setLogs] = useState<any[]>([])

  // Monitor component render time
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const renderTime = performance.now() - startTime
      setStats(prev => ({
        ...prev,
        renderTime: Math.round(renderTime * 100) / 100,
        lastUpdate: Date.now()
      }))
    }
  })

  // Get memory usage if available
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setStats(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100
        }))
      }
    }

    updateMemoryUsage()
    const interval = setInterval(updateMemoryUsage, 5000)
    return () => clearInterval(interval)
  }, [])

  // Get error logs
  useEffect(() => {
    const updateLogs = () => {
      const recentLogs = ErrorHandler.getLogs().slice(-5)
      setLogs(recentLogs)
    }

    updateLogs()
    const interval = setInterval(updateLogs, 2000)
    return () => clearInterval(interval)
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/50 text-neon-purple p-2 rounded-full transition-all duration-200"
        title="Performance Monitor"
      >
        <Activity className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-dark-bg/95 backdrop-blur-sm border border-neon-purple/30 rounded-lg p-4 max-w-sm w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Activity className="w-4 h-4 text-neon-purple" />
          <span>Performance Monitor</span>
        </h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>

      {/* Performance Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Render Time</span>
          </span>
          <span className={`font-mono ${stats.renderTime > 16 ? 'text-red-400' : 'text-green-400'}`}>
            {stats.renderTime}ms
          </span>
        </div>

        {stats.memoryUsage && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>Memory</span>
            </span>
            <span className={`font-mono ${stats.memoryUsage > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
              {stats.memoryUsage}MB
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Connection</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              stats.connectionStatus === 'connected' ? 'bg-green-400' :
              stats.connectionStatus === 'connecting' ? 'bg-yellow-400' :
              'bg-red-400'
            }`} />
            <span className="text-white text-xs capitalize">{stats.connectionStatus}</span>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="border-t border-gray-600/30 pt-3">
        <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3" />
          <span>Recent Logs ({logs.length})</span>
        </h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-xs text-gray-500">No recent logs</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`w-1 h-1 rounded-full ${
                    log.level === 'error' ? 'bg-red-400' :
                    log.level === 'warn' ? 'bg-yellow-400' :
                    log.level === 'info' ? 'bg-blue-400' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-gray-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-white text-xs ml-3 truncate" title={log.message}>
                  {log.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-600/30 pt-3 mt-3">
        <div className="flex space-x-2">
          <button
            onClick={() => ErrorHandler.clearLogs()}
            className="text-xs bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 px-2 py-1 rounded transition-colors"
          >
            Clear Logs
          </button>
          <button
            onClick={() => console.log('Performance Stats:', stats)}
            className="text-xs bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/50 text-neon-purple px-2 py-1 rounded transition-colors"
          >
            Log Stats
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to use performance monitoring
 */
export const usePerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false)

  const toggle = () => setIsVisible(!isVisible)
  const show = () => setIsVisible(true)
  const hide = () => setIsVisible(false)

  return {
    isVisible,
    toggle,
    show,
    hide,
    PerformanceMonitor: () => (
      <PerformanceMonitorComponent 
        isVisible={isVisible} 
        onToggle={toggle} 
      />
    )
  }
}
