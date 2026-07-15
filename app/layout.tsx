import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import AuthRecoveryHandler from '@/components/AuthRecoveryHandler'
import Footer from '@/components/Footer'

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
        <AuthRecoveryHandler />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
