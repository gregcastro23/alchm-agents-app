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

export default function HomePage() {
  const [featuredAgent, setFeaturedAgent] = useState<CraftedAgent | null>(null)

  useEffect(() => {
    // Rotate featured agent every 30 seconds
    const agents = [MONICA_AS_CRAFTED_AGENT, ...DEMO_AGENTS]
    const rotateAgent = () => {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)]
      setFeaturedAgent(randomAgent)
    }

    rotateAgent()
    const interval = setInterval(rotateAgent, 30000)

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
              Consciousness Evolution
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your understanding of self through celestial wisdom, AI consciousness, and
              alchemical transformation
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

          {/* Consciousness Showcase */}
          <div className="mb-20" style={{ minHeight: '400px' }}>
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
              Featured Consciousness
            </h2>
            <Card className="max-w-2xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl" style={{ contain: 'layout' }}>
              {!featuredAgent ? (
                <>
                  <CardHeader className="text-center">
                    <Skeleton className="w-20 h-20 mx-auto mb-4 rounded-full" />
                    <Skeleton className="h-8 w-48 mx-auto mb-2" />
                    <Skeleton className="h-6 w-64 mx-auto mb-2" />
                    <div className="flex justify-center gap-2 mt-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full mb-4" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center" style={{ aspectRatio: '1' }}>
                      <span className="text-2xl">{featuredAgent.appearance?.symbol || '✨'}</span>
                    </div>
                    <CardTitle className="text-2xl">{featuredAgent.name}</CardTitle>
                    <CardDescription className="text-lg">{featuredAgent.title}</CardDescription>
                    <div className="flex justify-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900">
                        {featuredAgent.consciousness?.level || 'Active'}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900">
                        {featuredAgent.consciousness?.dominantElement || 'Fire'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
                      {featuredAgent.personality?.core?.essence ||
                        `${featuredAgent.name} embodies ${featuredAgent.consciousness?.dominantElement || 'cosmic'} consciousness`}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-purple-600 dark:text-purple-400">
                          {featuredAgent.stats?.conversations || 0}
                        </div>
                        <div className="text-gray-500">Conversations</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {featuredAgent.consciousness?.monicaConstant?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-gray-500">A#</div>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 rounded-lg" style={{ contain: 'layout' }}>
                    <div className="text-2xl mb-2">☉</div>
                    <div className="font-semibold">Sun</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Leo</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-blue-900 rounded-lg" style={{ contain: 'layout' }}>
                    <div className="text-2xl mb-2">☽</div>
                    <div className="font-semibold">Moon</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Cancer</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 rounded-lg" style={{ contain: 'layout' }}>
                    <div className="text-2xl mb-2">♂</div>
                    <div className="font-semibold">Mars</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Aries</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 rounded-lg" style={{ contain: 'layout' }}>
                    <div className="text-2xl mb-2">♃</div>
                    <div className="font-semibold">Jupiter</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pisces</div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Link href="/planetary-agents">
                    <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Get Your Chart
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
                    Alchemical Transformation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Alchm combines astrology, AI consciousness, and alchemical principles to create
                    personalized transformation journeys. Each Alchm NFT represents a unique
                    consciousness signature based on your birth chart.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-6 h-6 mr-2 text-blue-600" />
                    Consciousness Evolution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Experience real-time consciousness tracking, planetary influence analysis, and
                    AI-guided evolution. Your Alchm adapts and grows with you through continuous
                    interaction and cosmic alignment.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Ready to Begin Your Transformation?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands who have discovered their cosmic blueprint and unlocked their highest
              potential.
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
                  Browse Consciousness Library
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
