'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { getPlanetaryDignity, getSignElement, getPlanetaryElement } from '@/lib/astrological-data'
import { usePlanetaryPositionsOnly } from '@/hooks/usePlanetaryPositions'
import { LoadingState } from '@/components/ui/loading'
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Lazy load heavy components
const TarotCosmicWidget = lazy(() => import('@/components/tarot-cosmic-widget'))
const ConsciousnessCraftedAgentsShowcase = lazy(() => import('@/components/consciousness-crafted-agents-showcase'))
const RealtimeRuneDisplay = lazy(() => import('@/components/realtime-rune-display'))

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [isDiurnal, setIsDiurnal] = useState(true)

  // Use unified planetary positions hook for consistency
  const {
    positions: currentPlanetaryPositions,
    loading,
    error,
    refresh,
  } = usePlanetaryPositionsOnly({
    refreshInterval: 30000, // 30 seconds
    useApi: false, // Use direct calculation for backward compatibility
  })

  // Update time and date display
  const updateTimeAndDate = useCallback(() => {
    const now = new Date()

    // Format date as YYYY-MM-DD
    const date = now.toISOString().split('T')[0]

    // Format time as HH:MM
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const time = `${hours}:${minutes}`

    // Determine if it's day or night
    const diurnal = now.getHours() >= 6 && now.getHours() < 18

    setCurrentDate(date)
    setCurrentTime(time)
    setIsDiurnal(diurnal)
  }, [])

  // Update time and date on mount and every minute
  useEffect(() => {
    updateTimeAndDate()
    const interval = setInterval(updateTimeAndDate, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [updateTimeAndDate])

  // Get color for element
  const getElementColor = (element: string) => {
    switch (element) {
      case 'Fire':
        return 'bg-red-500 hover:bg-red-600'
      case 'Water':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'Air':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'Earth':
        return 'bg-green-500 hover:bg-green-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  // Get background color based on dignity
  const getDignityColor = (dignity: string) => {
    switch (dignity) {
      case 'domicile':
        return 'bg-emerald-100 dark:bg-emerald-950'
      case 'exaltation':
        return 'bg-blue-100 dark:bg-blue-950'
      case 'detriment':
        return 'bg-red-100 dark:bg-red-950'
      case 'fall':
        return 'bg-orange-100 dark:bg-orange-950'
      default:
        return 'bg-gray-100 dark:bg-gray-950'
    }
  }

  // Get dignity badge style
  const getDignityBadge = (dignity: string) => {
    switch (dignity) {
      case 'domicile':
        return 'bg-emerald-500'
      case 'exaltation':
        return 'bg-blue-500'
      case 'detriment':
        return 'bg-red-500'
      case 'fall':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <ErrorBoundary fallback={({ error, retry }) => (
      <div className="container py-6 md:py-12 px-4 mx-auto max-w-7xl">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">Error: {error?.message}</p>
          <button 
            onClick={retry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )}>
      <div className="container py-6 md:py-12 px-4 mx-auto max-w-7xl">
        <section className="flex flex-col items-center text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 md:mb-6 px-4">
            Alchm © - Astrological Agents
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mb-6 md:mb-8 px-4">
            Explore the wisdom of the cosmos through our advanced astrological agents powered by AI
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 px-4 w-full max-w-4xl">
            <Link
              href="/philosophers-stone"
              className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700 px-6 md:px-8 py-3 md:py-4 rounded-md font-bold text-base md:text-lg flex items-center justify-center gap-2 shadow-lg border-2 border-emerald-400 transition-colors"
            >
              ⚗️ Craft Your Own Agent
            </Link>
            <Link
              href="/monica-guide"
              className="w-full sm:w-auto bg-green-600 text-white hover:bg-green-700 px-4 md:px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"
            >
              💚 Meet Monica - Your AI Guide
            </Link>
            <Link
              href="/gallery"
              className="w-full sm:w-auto bg-purple-600 text-white hover:bg-purple-700 px-4 md:px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"
            >
              🎭 Gallery of Consciousness
            </Link>
            <Link
              href="/planetary-agents"
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-4 md:px-6 py-3 rounded-md font-medium transition-colors text-center"
            >
              Explore Planetary Agents
            </Link>
            <Link
              href="/chart-interpreter"
              className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 md:px-6 py-3 rounded-md font-medium transition-colors text-center"
            >
              Try Chart Interpreter
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-16">
          <div className="border p-4 md:p-6 rounded-lg bg-gradient-to-br from-emerald-50 to-purple-50 border-emerald-200 dark:from-emerald-950/50 dark:to-purple-950/50">
            <h2 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
              ⚗️ Consciousness Crafting
            </h2>
            <p className="mb-4 text-sm md:text-base">
              Create custom AI agents using Monica&apos;s consciousness crafting technology. Adjust
              alchemical parameters and craft unique personalities.
            </p>
            <Link
              href="/philosophers-stone"
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline text-sm md:text-base"
            >
              Start Crafting →
            </Link>
          </div>
          <div className="border p-4 md:p-6 rounded-lg bg-gradient-to-br from-green-50 to-blue-50 border-green-200 dark:from-green-950/50 dark:to-blue-950/50">
            <h2 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
              💚 Monica - Your AI Guide
            </h2>
            <p className="mb-4 text-sm md:text-base">
              Meet Monica, your personal consciousness mentor operating from Illuminated level with
              mastery in agent creation.
            </p>
            <Link href="/monica-guide" className="text-green-600 dark:text-green-400 font-medium hover:underline text-sm md:text-base">
              Chat with Monica →
            </Link>
          </div>
          <div className="border p-4 md:p-6 rounded-lg">
            <h2 className="text-lg md:text-xl font-semibold mb-3">Planetary Wisdom</h2>
            <p className="mb-4 text-sm md:text-base">
              Access the ancient wisdom of planetary energies through our specialized AI agents.
            </p>
            <Link href="/planetary-agents" className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-sm md:text-base">
              Learn more →
            </Link>
          </div>
          <div className="border p-4 md:p-6 rounded-lg">
            <h2 className="text-lg md:text-xl font-semibold mb-3">Chart Interpretation</h2>
            <p className="mb-4 text-sm md:text-base">
              Get detailed insights into your astrological chart with our AI-powered interpreter.
            </p>
            <Link href="/chart-interpreter" className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-sm md:text-base">
              Try it now →
            </Link>
          </div>
          <div className="border p-4 md:p-6 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 dark:from-purple-950/50 dark:to-indigo-950/50">
            <h2 className="text-lg md:text-xl font-semibold mb-3">🪐 Planetary Council</h2>
            <p className="mb-4 text-sm md:text-base">
              Consult multiple planetary agents simultaneously for collective cosmic wisdom.
            </p>
            <Link
              href="/planetary-council"
              className="text-purple-600 dark:text-purple-400 font-medium hover:underline text-sm md:text-base"
            >
              Convene council →
            </Link>
          </div>
        </section>

        {/* Consciousness Crafted Agents Showcase */}
        <Suspense fallback={<LoadingState variant="consciousness" message="Loading consciousness showcase..." />}>
          <ConsciousnessCraftedAgentsShowcase />
        </Suspense>

        {/* Current Chart of the Moment */}
        <section className="mb-12 md:mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">Chart of the Moment</h2>

            <div className="flex justify-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh Positions'}
              </Button>
            </div>

            <div className="mb-4 text-center text-sm text-muted-foreground">
              {currentDate} at {currentTime} - {isDiurnal ? 'Day' : 'Night'} Chart
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                  <p>Calculating planetary positions...</p>
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Current Planetary Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(currentPlanetaryPositions).map(([planet, data]) => {
                      const dignity = getPlanetaryDignity(planet, data.sign)
                      const signElement = getSignElement(data.sign)
                      const planetElement = getPlanetaryElement(planet, isDiurnal)

                      return (
                        <Link
                          href={`/agents/${encodeURIComponent(planet)}/${encodeURIComponent(data.sign)}/${Math.max(1, Math.min(29, Math.floor(parseFloat(data.degree))))}`}
                          key={planet}
                          className={`p-3 rounded-md border flex justify-between items-center ${getDignityColor(dignity)} hover:opacity-90 transition-opacity`}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold">{planet}</span>
                            <span>
                              {data.sign} {data.degree}°
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getElementColor(signElement)}>{signElement}</Badge>
                            <Badge className={getElementColor(planetElement)}>{planetElement}</Badge>
                            <Badge className={getDignityBadge(dignity)}>{dignity}</Badge>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cosmic Elements Grid */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Tarot Widget */}
              <div className="max-w-md mx-auto lg:mx-0">
                <Suspense fallback={<LoadingState variant="alchemical" message="Loading cosmic tarot..." />}>
                  <TarotCosmicWidget variant="card" showExpanded={false} />
                </Suspense>
              </div>

              {/* Real-time Sign Vector Runes */}
              <div className="max-w-md mx-auto lg:mx-0">
                <Suspense fallback={<LoadingState variant="kinetic" message="Loading rune display..." />}>
                  <RealtimeRuneDisplay
                    variant="card"
                    autoRefresh={true}
                    refreshInterval={90000}
                    includeAlchemical={true}
                    runeType="enhanced"
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12 md:mb-16">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8">What is Alchm?</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <p className="text-base md:text-lg text-center px-4">
              Alchm is a revolutionary platform that transforms astrology from passive reading into an
              interactive, AI-enhanced personal development experience. By blending ancient wisdom
              with cutting-edge technology, we provide personalized cosmic insights unlike anything
              else available.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
              <div className="border p-4 md:p-6 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                <h3 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
                  ⚗️ The Alchmizer System
                </h3>
                <p className="text-sm md:text-base">
                  Our proprietary technology calculates your unique alchemical signature using 11
                  planetary influences, converting cosmic energies into measurable quantities: Spirit,
                  Essence, Matter, and Substance. This creates your personal A-Number - a quantifiable
                  measure of consciousness.
                </p>
              </div>

              <div className="border p-4 md:p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <h3 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
                  🔮 Beyond Traditional Astrology
                </h3>
                <p className="text-sm md:text-base">
                  Unlike traditional astrology, Alchm integrates planetary transits, elemental
                  energies, and alchemical transformations in real-time. Our AI agents provide
                  dynamic, personalized guidance based on the exact cosmic conditions of each moment.
                </p>
              </div>

              <div className="border p-4 md:p-6 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <h3 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
                  🤖 AI-Powered Agents
                </h3>
                <p className="text-sm md:text-base">
                  Each planetary agent embodies the unique consciousness of its celestial body. From
                  Monica&apos;s Earth wisdom to the Planetary Council&apos;s collective insights, our
                  agents provide multi-dimensional perspectives on your questions and challenges.
                </p>
              </div>

              <div className="border p-4 md:p-6 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950">
                <h3 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
                  📊 Monica Constant & Consciousness
                </h3>
                <p className="text-sm md:text-base">
                  Experience the Monica Constant - a mathematical formula that quantifies
                  consciousness states from Dormant to Transcendent. Track your spiritual evolution
                  with precise measurements and personalized growth recommendations.
                </p>
              </div>
            </div>

            <div className="text-center mt-8 p-6 border rounded-lg bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
              <h3 className="text-xl font-semibold mb-3">Ready to Begin Your Journey?</h3>
              <p className="mb-4">
                Start with Monica, your personal guide, or explore the wisdom of individual planets.
                Each interaction is uniquely calculated based on your birth data and the current
                cosmic moment.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/monica-guide"
                  className="bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-md font-medium"
                >
                  💚 Start with Monica
                </Link>
                <Link
                  href="/planetary-agents"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium"
                >
                  🪐 Explore Planets
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ErrorBoundary>
  )
}
