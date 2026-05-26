import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './navigation.css'
import { Providers } from './providers'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { RootChrome } from '@/components/RootChrome'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
  ),
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Providers>
          <RootChrome>{children}</RootChrome>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
