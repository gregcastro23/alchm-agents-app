'use client'

import { usePathname } from 'next/navigation'

import { Navigation } from '@/components/Navigation'
import { TokenHUD } from '@/components/TokenHUD'

export function RootChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDesktopSurface = pathname?.startsWith('/desktop')

  return (
    <>
      {!isDesktopSurface && <Navigation />}
      <main className={isDesktopSurface ? 'flex-1 min-h-screen' : 'flex-1'}>{children}</main>
      {!isDesktopSurface && <TokenHUD />}
    </>
  )
}
