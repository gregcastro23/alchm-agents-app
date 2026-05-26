'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/toaster'
import { usePathname } from 'next/navigation'
import { MonicaChatBubble } from '@/components/monica/monica-chat-bubble'
import { usePlanetaryPositions } from '@/hooks/usePlanetaryPositions'
import { FloatingAdminPanel } from '@/components/admin/FloatingAdminPanel'

function MonicaWrapper() {
  const pathname = usePathname()
  const disabledForDesktopSurface = pathname?.startsWith('/desktop')
  const { alchmQuantities, monicaConstant } = usePlanetaryPositions({
    refreshInterval: 60000,
    enabled: !disabledForDesktopSurface,
  })

  if (disabledForDesktopSurface) return null

  return (
    <MonicaChatBubble
      pathname={pathname}
      currentMC={monicaConstant}
      consciousnessLevel="Active" // This could be calculated based on MC
    />
  )
}

function DesktopAwareAdminPanel() {
  const pathname = usePathname()
  if (pathname?.startsWith('/desktop')) return null
  return <FloatingAdminPanel />
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
      <DesktopAwareAdminPanel />
      <MonicaWrapper />
    </SessionProvider>
  )
}
