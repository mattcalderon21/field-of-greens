'use client'

import { useEffect } from 'react'

export default function PicksError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-4xl mb-4">⛳</div>
        <h2 className="font-display text-2xl text-fairway mb-2">
          Something went wrong
        </h2>
        <p className="text-fairway/60 text-sm mb-2">
          We had trouble loading your picks. This is usually a temporary issue.
        </p>
        {error?.message && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-2 mb-4 font-mono text-left break-all">
            {error.message}
          </p>
        )}
        <button onClick={reset} className="btn-primary w-full">
          Try Again
        </button>
      </div>
    </div>
  )
}
