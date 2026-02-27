'use client'

import { useEffect } from 'react'

export default function AdminError({
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
    <div className="min-h-screen bg-fairway-900 flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-4xl mb-4">🚧</div>
        <h2 className="font-display text-2xl text-fairway-900 mb-2">
          Admin Panel Error
        </h2>
        <p className="text-fairway-700 text-sm mb-6">
          Something went wrong loading the admin panel. Check your connection and try again.
        </p>
        <button onClick={reset} className="btn-primary w-full">
          Try Again
        </button>
      </div>
    </div>
  )
}
