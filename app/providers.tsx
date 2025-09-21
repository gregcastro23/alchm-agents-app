'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/toaster'
import { MonicaOmnipresent } from '@/components/monica/monica-omnipresent'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
      <MonicaOmnipresent />
    </SessionProvider>
  )
}
