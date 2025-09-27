'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard immediately
    router.replace('/dashboard')
  }, [router])

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Planetary Agents
        </h1>
        <p style={{ fontSize: '1.125rem' }}>Redirecting to dashboard...</p>
      </div>
    </div>
  )
}