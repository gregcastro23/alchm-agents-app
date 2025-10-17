'use client'

import dynamic from 'next/dynamic'

// Import the modern streamlined version with Sacred 7 Stats
const ModernPhilosophersStone = dynamic(() => import('./modern-page-v2'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full animate-spin border-t-purple-500"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-pink-500/30 rounded-full animate-spin border-t-pink-500 animation-delay-150"></div>
        </div>
        <div className="space-y-2">
          <p className="text-slate-300 font-semibold text-lg">Initializing The Philosopher's Stone</p>
          <p className="text-slate-500 text-sm">Preparing consciousness crafting tools...</p>
        </div>
      </div>
    </div>
  ),
})

export default function PhilosophersStone() {
  return <ModernPhilosophersStone />
}
