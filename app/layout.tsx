import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'The Field of Greens',
  description: 'If you pick him, points will come. — 2026 One-and-Done PGA Tour Golf Contest',
  icons: { icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⛳</text></svg>' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-fairway-dark text-cream/50 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="font-display text-cream/70 text-lg mb-1">The Field of Greens</p>
            <p className="text-sm italic mb-3">"If you pick him, points will come."</p>
            <p className="text-xs">2026 Season · Jan 15 – Aug 20 · Council Bluffs / Omaha / Storm Lake</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
