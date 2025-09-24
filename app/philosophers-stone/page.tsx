'use client'

import dynamic from 'next/dynamic'

// Dynamically import the component to avoid SSR issues with Clerk
const PhilosophersStoneComponent = dynamic(() => import('./PhilosophersStoneComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
})

export default function PhilosophersStone() {
  return <PhilosophersStoneComponent />
}
