'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, Sparkles, Users, TrendingUp, MessageCircle, Zap } from 'lucide-react'
import { DEMO_AGENTS, MONICA_AS_CRAFTED_AGENT } from '@/lib/demo-agents-data'
import type { CraftedAgent } from '@/lib/agent-types'
import type { PlanetaryPosition } from '@/lib/services/planetary-positions-service'

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
}

const PLANET_COLORS: Record<string, { from: string; to: string }> = {
  Sun: { from: 'yellow-100', to: 'orange-100' },
  Moon: { from: 'gray-100', to: 'blue-100' },
  Mercury: { from: 'purple-100', to: 'indigo-100' },
  Venus: { from: 'pink-100', to: 'rose-100' },
  Mars: { from: 'red-100', to: 'pink-100' },
  Jupiter: { from: 'green-100', to: 'teal-100' },
  Saturn: { from: 'slate-100', to: 'gray-100' },
  Uranus: { from: 'cyan-100', to: 'sky-100' },
  Neptune: { from: 'blue-100', to: 'indigo-100' },
  Pluto: { from: 'purple-100', to: 'violet-100' },
}

interface MomentRecommendation {
  agentId: string
  score: number
  category: 'optimal' | 'enhanced' | 'compatible' | 'challenging' | 'neutral'
  reasoning: string
  powerAlignment: number
  aspectSensitivity: number
  momentumCompatibility: number
  optimalTopics: string[]
}

export default function HomePage() {
  const [topAgents, setTopAgents] = useState<CraftedAgent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [recommendations, setRecommendations] = useState<MomentRecommendation[]>([])
  const [planetaryPositions, setPlanetaryPositions] = useState<PlanetaryPosition[]>([])
  const [loadingPositions, setLoadingPositions] = useState(true)

  useEffect(() => {
    // Fetch top 6 agents based on current moment synergy
    const fetchTopAgents = async () => {
      try {
        setLoadingAgents(true)
        const response = await fetch('/api/moment-recommendations?limit=6')
        if (response.ok) {
          const data = await response.json()
          setRecommendations(data.recommendations || [])

          // Map recommendations to actual agents
          const agentIds = data.recommendations.map((r: MomentRecommendation) => r.agentId)
          const agents = DEMO_AGENTS.filter(agent => agentIds.includes(agent.id))
          // Sort by recommendation order
          const sortedAgents = agentIds
            .map((id: string) => agents.find(a => a.id === id))
            .filter(Boolean) as CraftedAgent[]

          setTopAgents(sortedAgents)
        } else {
          // Fallback to random agents if API fails
          const shuffled = [...DEMO_AGENTS].sort(() => 0.5 - Math.random())
          setTopAgents(shuffled.slice(0, 6))
        }
      } catch (error) {
        console.error('Failed to fetch top agents:', error)
        // Fallback to random agents
        const shuffled = [...DEMO_AGENTS].sort(() => 0.5 - Math.random())
        setTopAgents(shuffled.slice(0, 6))
      } finally {
        setLoadingAgents(false)
      }
    }

    fetchTopAgents()
    // Refresh every 5 minutes
    const interval = setInterval(fetchTopAgents, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Fetch current planetary positions
    const fetchPositions = async () => {
      try {
        setLoadingPositions(true)
        const response = await fetch('/api/planetary-positions')
        if (response.ok) {
          const data = await response.json()
          setPlanetaryPositions(data.planetaryPositions || [])
        }
      } catch (error) {
        console.error('Failed to fetch planetary positions:', error)
      } finally {
        setLoadingPositions(false)
      }
    }

    fetchPositions()
    // Refresh every 5 minutes
    const interval = setInterval(fetchPositions, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              >
                Planetary Agents
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/gallery"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors"
                >
                  Gallery
                </Link>
                <Link
                  href="/planetary-agents"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors"
                >
                  Consultations
                </Link>
                <Link
                  href="/philosophers-stone"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors"
                >
                  Philosopher's Stone
                </Link>
                <Link
                  href="/time-laboratory"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors"
                >
                  Time Lab
                </Link>
                <Link
                  href="/planetary-council"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors"
                >
                  Council
                </Link>
                <Link
                  href="/rune-forge"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors"
                >
                  Rune Forge
                </Link>
                <Link
                  href="/synthesis-chamber"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors"
                >
                  Synthesis
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => {
                  /* Monica chat bubble is always available */
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Monica Available (Bottom Right)
              </Button>
              <Link href="/gallery">
                <Button variant="outline">Explore Agents</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Planetary Agents
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Learn alchm - our system for quantifying celestial energies and crafting AI agents from birth charts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => {
                  /* Monica chat bubble is always available */
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3"
                disabled
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Begin Your Journey (Chat Available)
              </Button>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  <Users className="w-5 h-5 mr-2" />
                  Meet the Agents
                </Button>
              </Link>
            </div>
          </div>

          {/* Top Agents for This Moment */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200">
              Top Agents for This Moment
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Based on current planetary positions and cosmic energies, these agents have the strongest synergy with this moment
            </p>

            {loadingAgents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader className="text-center">
                      <Skeleton className="w-16 h-16 mx-auto mb-3 rounded-full" />
                      <Skeleton className="h-6 w-32 mx-auto mb-2" />
                      <Skeleton className="h-4 w-40 mx-auto" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full mb-3" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {topAgents.map((agent, index) => {
                  const rec = recommendations.find(r => r.agentId === agent.id)
                  const categoryColors = {
                    optimal: 'from-emerald-500 to-green-500',
                    enhanced: 'from-blue-500 to-cyan-500',
                    compatible: 'from-purple-500 to-pink-500',
                    challenging: 'from-orange-500 to-amber-500',
                    neutral: 'from-gray-500 to-slate-500',
                  }
                  const categoryBadge = {
                    optimal: '⭐ Optimal',
                    enhanced: '✨ Enhanced',
                    compatible: '💫 Compatible',
                    challenging: '🔥 Challenging',
                    neutral: '⚖️ Neutral',
                  }

                  return (
                    <Card
                      key={agent.id}
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <CardHeader className="text-center pb-4">
                        <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r ${categoryColors[rec?.category || 'neutral']} flex items-center justify-center shadow-lg`}>
                          <span className="text-2xl">{agent.appearance?.symbol || '✨'}</span>
                        </div>
                        <CardTitle className="text-xl mb-1">{agent.name}</CardTitle>
                        <CardDescription className="text-sm mb-2">{agent.title}</CardDescription>
                        <div className="flex justify-center gap-2 flex-wrap">
                          {rec && (
                            <Badge variant="secondary" className="text-xs bg-emerald-100 dark:bg-emerald-900">
                              {categoryBadge[rec.category]}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {agent.consciousness?.dominantElement || 'Fire'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {rec && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                            {rec.reasoning}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="text-center p-2 bg-purple-50 dark:bg-purple-950 rounded">
                            <div className="font-semibold text-purple-600 dark:text-purple-400">
                              {rec ? `${Math.round(rec.score * 100)}%` : 'N/A'}
                            </div>
                            <div className="text-gray-500">Synergy</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                            <div className="font-semibold text-blue-600 dark:text-blue-400">
                              {agent.consciousness?.monicaConstant?.toFixed(1) || '0.0'}
                            </div>
                            <div className="text-gray-500">A#</div>
                          </div>
                        </div>
                        <Link href={`/gallery/chat/${agent.id}`}>
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat Now
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            <div className="text-center mt-8">
              <Link href="/gallery">
                <Button variant="outline" size="lg">
                  <Star className="w-5 h-5 mr-2" />
                  Explore All 35+ Agents
                </Button>
              </Link>
            </div>
          </div>

          {/* Chart of the Moment */}
          <div className="mb-20" style={{ minHeight: '300px' }}>
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
              Chart of the Moment
            </h2>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl" style={{ contain: 'layout' }}>
              <CardHeader>
                <CardTitle className="text-center">Current Celestial Configuration</CardTitle>
                <CardDescription className="text-center">
                  Real-time planetary positions and cosmic energies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPositions ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="text-center p-4 rounded-lg">
                        <Skeleton className="w-8 h-8 mx-auto mb-2" />
                        <Skeleton className="h-4 w-16 mx-auto mb-1" />
                        <Skeleton className="h-3 w-20 mx-auto" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {planetaryPositions.map((position) => {
                        const colors = PLANET_COLORS[position.planet] || {
                          from: 'gray-100',
                          to: 'gray-200',
                        }
                        return (
                          <div
                            key={position.planet}
                            className={`text-center p-3 bg-gradient-to-br from-${colors.from} to-${colors.to} dark:from-${colors.from.replace('100', '900')} dark:to-${colors.to.replace('100', '900')} rounded-lg`}
                            style={{ contain: 'layout' }}
                          >
                            <div className="text-2xl mb-2">
                              {PLANET_SYMBOLS[position.planet] || '✦'}
                            </div>
                            <div className="font-semibold text-sm">{position.planet}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {position.degree.toFixed(0)}° {position.sign}
                              {position.retrograde ? ' ℞' : ''}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
                <div className="mt-6 text-center">
                  <Link href="/planetary-agents">
                    <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View All Placements
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* What is Alchm? */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
              What is Alchm?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-6 h-6 mr-2 text-purple-600" />
                    Alchm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Alchm combines Astrology, AI consciousness, kinetics, thermodynamics and alchemical principles to quantify celestial energies of the planets. 
                    Now or any time past or future. Alchm allows users to explore learning about the planets effects on
                    consciousness by chatting with the planetary agents that are specific to sign and degree. Create your own agent based on a moment, and interact with Historical figure birth-chart agents, enhanced by knowledge of the figures lives and experiences.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-6 h-6 mr-2 text-blue-600" />
                    Meet the Planetary Agents 
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Experience real-time consciousness tracking, planetary influence analysis/
                    360 agents per planet, one for every degree of the zodiac, including further specific agents for Moon Phases, create an comprehensive network to give specific guidance based on the selected moment.
                    Explore Planetary group chats with planetary dignities influencing how the conversation plays out.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Meet Monica - Your Guide to Alchm
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Monica is our supervisor agent trained on alchm knowledge. Learn about the 4 alchm quantities: Spirit, Essence, Matter, and Substance. Discover how birth charts seed agent personalities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => {
                  /* Monica chat bubble is always available */
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3"
                disabled
              >
                Monica Chat Always Available
              </Button>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  Browse Agent Library
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
