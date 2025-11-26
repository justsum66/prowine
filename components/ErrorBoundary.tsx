'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // 如果有 fallback，直接返回（通常是 null，不顯示任何東西）
      if (this.props.fallback !== undefined) {
        return this.props.fallback
      }

      // 只有主內容區域才顯示完整錯誤頁面
      return (
        <div className="min-h-screen flex items-center justify-center bg-primary-cream px-4">
          <div className="text-center max-w-md">
            <h1 className="font-display text-4xl font-bold text-primary-dark mb-4">
              發生錯誤
            </h1>
            <p className="font-sans text-lg text-secondary-grey-600 mb-6">
              {this.state.error?.message || '頁面載入時發生錯誤'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="default"
                size="lg"
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
              >
                重新載入
              </Button>
              <Button variant="outline" size="lg" href="/">
                返回首頁
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="font-sans text-sm text-secondary-grey-400 cursor-pointer">
                  錯誤詳情（開發模式）
                </summary>
                <pre className="mt-4 p-4 bg-white rounded text-xs overflow-auto">
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

