'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-cream px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-4xl font-bold text-primary-dark mb-4">
          發生錯誤
        </h1>
        <p className="font-sans text-lg text-secondary-grey-600 mb-6">
          {error.message || '頁面載入時發生錯誤'}
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="default" size="lg" onClick={reset}>
            重試
          </Button>
          <Button variant="outline" size="lg" href="/">
            返回首頁
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="font-sans text-sm text-secondary-grey-400 cursor-pointer">
              錯誤詳情（開發模式）
            </summary>
            <pre className="mt-4 p-4 bg-white rounded text-xs overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

