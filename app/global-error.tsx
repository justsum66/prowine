'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-primary-cream px-4">
          <div className="text-center max-w-md">
            <h1 className="font-display text-4xl font-bold text-primary-dark mb-4">
              嚴重錯誤
            </h1>
            <p className="font-sans text-lg text-secondary-grey-600 mb-6">
              {error.message || '應用程式發生嚴重錯誤'}
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-primary-burgundy text-white rounded hover:bg-primary-gold transition-colors"
            >
              重試
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

