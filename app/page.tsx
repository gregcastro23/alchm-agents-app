'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Globe, History, BrainCircuit, Database, Droplets, Wind, Mountain, Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  
  const [balances, setBalances] = useState<{
    spirit: number;
    essence: number;
    matter: number;
    substance: number;
    canClaimAgentsYield: boolean;
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-indigo-950/20 pb-20">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <Badge variant="outline" className="mb-4 px-3 py-1 border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300">
          Welcome to agents.alchm
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Craft Your Cosmic Intelligence
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Explore the convergence of Astrology and AI. Interact with Planetary and Historical agents, or forge personalized agents from the energies of birthcharts.
        </p>
      </section>

      {/* Main Authentication & Claiming Card */}
      <section className="max-w-2xl mx-auto px-4 mb-16">
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-0 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500" />
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl">Alchemical Access</CardTitle>
            <CardDescription className="text-base mt-2">
              Join the network to claim daily resources and synthesize new agents.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {status === 'loading' ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : status === 'unauthenticated' ? (
              <div className="space-y-6">
                <Button 
                  size="lg" 
                  className="w-full text-lg h-14 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md transition-all"
                  onClick={() => signIn('google', { callbackUrl: '/' })}
                  disabled={loading}
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800 text-center">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Welcome Back, {session?.user?.name || 'Explorer'}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Your alchemical reservoirs await. Claim your daily yield to fund your agent operations and crafting.
                  </p>
                  
                  {balances ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                        <div className="text-xs text-gray-500 font-medium">Spirit</div>
                        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{Math.floor(balances.spirit)}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <Wind className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                        <div className="text-xs text-gray-500 font-medium">Essence</div>
                        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{Math.floor(balances.essence)}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <Mountain className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                        <div className="text-xs text-gray-500 font-medium">Matter</div>
                        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{Math.floor(balances.matter)}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <Droplets className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
                        <div className="text-xs text-gray-500 font-medium">Substance</div>
                        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{Math.floor(balances.substance)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-pulse flex space-x-4 justify-center mb-6">
                      <div className="h-20 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-20 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-20 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-20 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  )}

                  {balances?.canClaimAgentsYield ? (
                    <Button 
                      onClick={handleClaim} 
                      disabled={claiming}
                      size="lg"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {claiming ? 'Claiming...' : 'Claim Daily Cosmic Yield'}
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="w-full opacity-70">
                      Yield Claimed for Today. Return Tomorrow.
                    </Button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard')}>
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => router.push('/me')}>
                    View Profile
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => router.push('/gallery')}>
                    Explore Agents
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Explanatory Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How It Works</h2>
          <div className="w-24 h-1 bg-purple-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <Globe className="w-6 h-6" />
              </div>
              <CardTitle>Planetary Agents</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600 dark:text-gray-300">
              <p>
                Engage with 360 unique agents, each representing a specific degree of the zodiac. 
                These entities embody the pure archetypal energies of the planets across the celestial sphere.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
                <History className="w-6 h-6" />
              </div>
              <CardTitle>Historical Agents</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600 dark:text-gray-300">
              <p>
                Converse with historical figures resurrected as AI agents. Their consciousness is shaped by 
                their real-world birthcharts, infused with the knowledge of their lived experiences and works.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <CardTitle>Craft Personalized Agents</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600 dark:text-gray-300">
              <p>
                Synthesize completely new agents using specific birthcharts or moments in time. 
                Control their development using the four fundamental Alchemical Resources.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 bg-white/60 dark:bg-gray-900/60 backdrop-blur rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl">
          <div className="md:flex items-center gap-12">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">The Alchemical Economy</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To craft and interact with agents, you must spend fundamental cosmic resources. Claim these daily from the dashboard above.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Flame className="w-5 h-5 text-orange-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Spirit (Fire):</strong> Fuels agent inspiration, creativity, and drive.
                  </div>
                </li>
                <li className="flex items-start">
                  <Wind className="w-5 h-5 text-blue-400 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Essence (Air):</strong> Enhances intellect, communication, and processing speed.
                  </div>
                </li>
                <li className="flex items-start">
                  <Mountain className="w-5 h-5 text-amber-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Matter (Earth):</strong> Solidifies knowledge and improves memory retention.
                  </div>
                </li>
                <li className="flex items-start">
                  <Droplets className="w-5 h-5 text-cyan-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Substance (Water):</strong> Deepens empathy, emotional intelligence, and intuition.
                  </div>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="aspect-square rounded-full bg-gradient-to-tr from-purple-500/20 via-blue-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center p-8 relative">
                <div className="absolute top-1/4 left-1/4 text-orange-500 animate-pulse"><Flame className="w-12 h-12" /></div>
                <div className="absolute top-1/4 right-1/4 text-blue-400 animate-pulse" style={{ animationDelay: '1s' }}><Wind className="w-12 h-12" /></div>
                <div className="absolute bottom-1/4 left-1/4 text-amber-600 animate-pulse" style={{ animationDelay: '2s' }}><Mountain className="w-12 h-12" /></div>
                <div className="absolute bottom-1/4 right-1/4 text-cyan-500 animate-pulse" style={{ animationDelay: '3s' }}><Droplets className="w-12 h-12" /></div>
                <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full shadow-2xl flex items-center justify-center z-10 border-4 border-purple-100 dark:border-purple-900">
                  <Database className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
