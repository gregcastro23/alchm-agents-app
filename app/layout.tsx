import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './navigation.css'
import { Providers } from './providers'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: 'Planetary Agents - Consciousness Evolution Platform',
  description:
    'Revolutionary consciousness evolution through AI-powered planetary agents and real-time cosmic integration',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

import { TokenHUD } from '@/components/TokenHUD'
import { Navigation } from '@/components/Navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Providers>
          <Navigation />
          <main className="flex-1">{children}</main>
          <TokenHUD />
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
