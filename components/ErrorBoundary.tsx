'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorHandler } from '@/utils/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorHandler.logError('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    })

    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/10 to-blue-900/10 p-4 flex items-center justify-center">
          <div className="crypto-card max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-4">Er is iets misgegaan</h2>
            <p className="text-gray-400 mb-6">
              Er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="neon-button w-full"
              >
                Pagina vernieuwen
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/50 text-gray-300 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Opnieuw proberen
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-red-400 cursor-pointer mb-2">
                  Foutdetails (alleen in ontwikkeling)
                </summary>
                <pre className="text-xs text-gray-500 bg-dark-bg/50 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook for handling async errors in functional components
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: any) => {
    ErrorHandler.logError('Async error in component', error, context)
  }, [])

  const safeAsync = React.useCallback(
    async (
      operation: () => Promise<any>,
      errorMessage: string = 'Async operation failed'
    ): Promise<any> => {
      try {
        return await operation()
      } catch (error) {
        handleError(error as Error, { operation: errorMessage })
        return null
      }
    },
    [handleError]
  )

  return { handleError, safeAsync }
}
