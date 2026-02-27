import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-fairway-900 flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-6xl mb-4">🏌️</div>
        <h1 className="font-display text-4xl text-fairway-900 mb-2">404</h1>
        <h2 className="font-display text-xl text-fairway-800 mb-3">
          Out of Bounds
        </h2>
        <p className="text-fairway-700 text-sm mb-6">
          That page doesn&apos;t exist. Take a drop and head back to the fairway.
        </p>
        <Link href="/" className="btn-primary inline-block">
          Back to the Field
        </Link>
      </div>
    </div>
  )
}
