'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/toaster'
import { usePathname } from 'next/navigation'
import { MonicaChatBubble } from '@/components/monica/monica-chat-bubble'
import { usePlanetaryPositions } from '@/hooks/usePlanetaryPositions'

function MonicaWrapper() {
  const pathname = usePathname()
  const { alchmQuantities, monicaConstant } = usePlanetaryPositions({
    refreshInterval: 60000,
  })

  return (
    <MonicaChatBubble
      pathname={pathname}
      currentMC={monicaConstant}
      consciousnessLevel="Active" // This could be calculated based on MC
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
      <MonicaWrapper />
    </SessionProvider>
  )
}
