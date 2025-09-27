'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/toaster'
// Temporarily disable MonicaLazy for debugging
// import { MonicaLazy } from '@/components/monica/monica-lazy'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
      {/* <MonicaLazy /> */}
    </SessionProvider>
  )
}
