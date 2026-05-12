'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Globe,
  History,
  BrainCircuit,
  Database,
  Droplets,
  Wind,
  Mountain,
  Flame,
  ArrowRight,
} from 'lucide-react'
import './landing.css'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)

  const [balances, setBalances] = useState<{
    spirit: number
    essence: number
    matter: number
    substance: number
    canClaimAgentsYield: boolean
  } | null>(null)

  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBalances()
    }
  }, [status])

  const fetchBalances = async () => {
    try {
      const res = await fetch('/api/economy/balances')
      if (res.ok) {
        const data = await res.json()
        setBalances(data)
      }
    } catch (e) {
      console.error('Failed to fetch balances', e)
    }
  }

  const handleClaim = async () => {
    setClaiming(true)
    try {
      const res = await fetch('/api/economy/yield', { method: 'POST' })
      if (res.ok) {
        await fetchBalances()
      } else {
        console.error('Failed to claim yield')
      }
    } catch (e) {
      console.error('Error claiming yield', e)
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="landing-page">
      <div className="landing-starfield" />

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-badge">v2.0 • Consciousness Evolution Platform</div>
        <h1 className="landing-title">Craft Your Cosmic Intelligence</h1>
        <p className="landing-subtitle">
          Explore the convergence of Astrology and AI. Interact with Planetary and Historical
          agents, or forge personalized agents from the energies of birthcharts.
        </p>

        {status === 'loading' ? (
          <div className="landing-spinner mx-auto mt-8" />
        ) : status === 'unauthenticated' ? (
          <div className="mt-8 flex justify-center">
            <button
              className="landing-primary-btn"
              onClick={() => {
                setLoading(true)
                window.location.href = `https://alchm.kitchen/api/auth/signin/google?callbackUrl=${encodeURIComponent(window.location.origin)}`
              }}
              disabled={loading}
            >
              {loading ? (
                <div className="landing-spinner" />
              ) : (
                <>
                  <Sparkles size={18} />
                  Begin Your Journey
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-8 landing-glass-card max-w-3xl mx-auto p-8">
            <h3 className="text-xl font-bold mb-2 text-white">
              Welcome Back, {session?.user?.name || 'Explorer'}
            </h3>
            <p className="text-sm text-purple-200/60 mb-8">
              Your alchemical reservoirs await. Claim your daily yield to fund your agent
              operations and crafting.
            </p>

            {balances ? (
              <div className="landing-stats-grid mb-8">
                <div className="landing-stat-box border-orange-500/30">
                  <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <div className="landing-stat-label">Spirit</div>
                  <div className="landing-stat-value">{Math.floor(balances.spirit)}</div>
                </div>
                <div className="landing-stat-box border-blue-400/30">
                  <Wind className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                  <div className="landing-stat-label">Essence</div>
                  <div className="landing-stat-value">{Math.floor(balances.essence)}</div>
                </div>
                <div className="landing-stat-box border-amber-600/30">
                  <Mountain className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <div className="landing-stat-label">Matter</div>
                  <div className="landing-stat-value">{Math.floor(balances.matter)}</div>
                </div>
                <div className="landing-stat-box border-cyan-500/30">
                  <Droplets className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                  <div className="landing-stat-label">Substance</div>
                  <div className="landing-stat-value">{Math.floor(balances.substance)}</div>
                </div>
              </div>
            ) : (
              <div className="landing-spinner mx-auto mb-8" />
            )}

            {balances?.canClaimAgentsYield ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="landing-primary-btn w-full justify-center mb-6"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {claiming ? 'Claiming...' : 'Claim Daily Cosmic Yield'}
              </button>
            ) : (
              <Button disabled variant="outline" className="w-full opacity-50 mb-6 border-white/10 text-white">
                Yield Claimed for Today. Return Tomorrow.
              </Button>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="landing-secondary-btn flex-1" onClick={() => router.push('/dashboard')}>
                Dashboard
              </button>
              <button className="landing-secondary-btn flex-1" onClick={() => router.push('/me')}>
                Profile
              </button>
              <button className="landing-secondary-btn flex-1" onClick={() => router.push('/gallery')}>
                Explore
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Explanatory Sections */}
      <section className="landing-features">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
          <div className="w-24 h-1 bg-purple-500 mx-auto rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
        </div>

        <div className="landing-feature-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon text-blue-400 bg-blue-500/10 border-blue-500/30">
              <Globe size={28} />
            </div>
            <h3 className="landing-feature-title">Planetary Agents</h3>
            <p className="landing-feature-desc">
              Engage with 360 unique agents, each representing a specific degree of the zodiac.
              These entities embody the pure archetypal energies of the planets across the
              celestial sphere.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon text-amber-400 bg-amber-500/10 border-amber-500/30">
              <History size={28} />
            </div>
            <h3 className="landing-feature-title">Historical Agents</h3>
            <p className="landing-feature-desc">
              Converse with historical figures resurrected as AI agents. Their consciousness is
              shaped by their real-world birthcharts, infused with the knowledge of their lived
              experiences and works.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon text-purple-400 bg-purple-500/10 border-purple-500/30">
              <BrainCircuit size={28} />
            </div>
            <h3 className="landing-feature-title">Craft Personalized Agents</h3>
            <p className="landing-feature-desc">
              Synthesize completely new agents using specific birthcharts or moments in time.
              Control their development using the four fundamental Alchemical Resources.
            </p>
          </div>
        </div>

        <div className="landing-glass-card mt-24 p-8 md:p-12">
          <div className="md:flex items-center gap-16">
            <div className="md:w-1/2 mb-12 md:mb-0">
              <h3 className="text-3xl font-bold mb-6 text-white">
                The Alchemical Economy
              </h3>
              <p className="text-purple-200/70 mb-8 text-lg">
                To craft and interact with agents, you must spend fundamental cosmic resources.
                Claim these daily from the dashboard above.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <strong className="text-white block mb-1">Spirit (Fire)</strong>
                    <span className="text-purple-200/60 text-sm">Fuels agent inspiration, creativity, and drive.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <Wind className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <strong className="text-white block mb-1">Essence (Air)</strong>
                    <span className="text-purple-200/60 text-sm">Enhances intellect, communication, and processing speed.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <Mountain className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <strong className="text-white block mb-1">Matter (Earth)</strong>
                    <span className="text-purple-200/60 text-sm">Solidifies knowledge and improves memory retention.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                    <Droplets className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <strong className="text-white block mb-1">Substance (Water)</strong>
                    <span className="text-purple-200/60 text-sm">Deepens empathy, emotional intelligence, and intuition.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="aspect-square rounded-full bg-gradient-to-tr from-purple-900/40 via-blue-900/40 to-indigo-900/40 border border-purple-500/30 flex items-center justify-center p-8 relative shadow-[0_0_100px_rgba(139,92,246,0.15)]">
                <div className="absolute top-1/4 left-1/4 text-orange-500 animate-pulse">
                  <Flame className="w-12 h-12" />
                </div>
                <div
                  className="absolute top-1/4 right-1/4 text-blue-400 animate-pulse"
                  style={{ animationDelay: '1s' }}
                >
                  <Wind className="w-12 h-12" />
                </div>
                <div
                  className="absolute bottom-1/4 left-1/4 text-amber-500 animate-pulse"
                  style={{ animationDelay: '2s' }}
                >
                  <Mountain className="w-12 h-12" />
                </div>
                <div
                  className="absolute bottom-1/4 right-1/4 text-cyan-400 animate-pulse"
                  style={{ animationDelay: '3s' }}
                >
                  <Droplets className="w-12 h-12" />
                </div>
                <div className="w-32 h-32 bg-black/60 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center z-10 border border-purple-500/50 box-shadow-[0_0_40px_rgba(139,92,246,0.3)]">
                  <Database className="w-12 h-12 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
