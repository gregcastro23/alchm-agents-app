"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { getPlanetaryDignity, getSignElement, getPlanetaryElement } from "@/lib/astrological-data"
import { usePlanetaryPositionsOnly } from "@/hooks/usePlanetaryPositions"
import TarotCosmicWidget from "@/components/tarot-cosmic-widget"

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [isDiurnal, setIsDiurnal] = useState(true)
  
  // Use unified planetary positions hook for consistency
  const { positions: currentPlanetaryPositions, loading, error, refresh } = usePlanetaryPositionsOnly({
    refreshInterval: 30000, // 30 seconds
    useApi: false // Use direct calculation for backward compatibility
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
      case "Fire": return "bg-red-500 hover:bg-red-600"
      case "Water": return "bg-blue-500 hover:bg-blue-600"
      case "Air": return "bg-yellow-500 hover:bg-yellow-600"
      case "Earth": return "bg-green-500 hover:bg-green-600"
      default: return "bg-gray-500 hover:bg-gray-600"
    }
  }
  
  // Get background color based on dignity
  const getDignityColor = (dignity: string) => {
    switch (dignity) {
      case "domicile": return "bg-emerald-100 dark:bg-emerald-950"
      case "exaltation": return "bg-blue-100 dark:bg-blue-950"
      case "detriment": return "bg-red-100 dark:bg-red-950"
      case "fall": return "bg-orange-100 dark:bg-orange-950"
      default: return "bg-gray-100 dark:bg-gray-950"
    }
  }
  
  // Get dignity badge style
  const getDignityBadge = (dignity: string) => {
    switch (dignity) {
      case "domicile": return "bg-emerald-500"
      case "exaltation": return "bg-blue-500"
      case "detriment": return "bg-red-500"
      case "fall": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="container py-12 px-4 mx-auto">
      <section className="flex flex-col items-center text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-6">
          Alchm © - Astrological Agents
        </h1>
        <p className="text-xl max-w-3xl mb-8">
          Explore the wisdom of the cosmos through our advanced astrological agents powered by AI
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/monica-guide" 
            className="bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-md font-medium flex items-center gap-2"
          >
            💚 Meet Monica - Your AI Guide
          </Link>
          <Link 
            href="/planetary-agents" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium"
          >
            Explore Planetary Agents
          </Link>
          <Link 
            href="/chart-interpreter" 
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-3 rounded-md font-medium"
          >
            Try Chart Interpreter
          </Link>
          <Link 
            href="/planetary-council" 
            className="bg-purple-600 text-white hover:bg-purple-700 px-6 py-3 rounded-md font-medium"
          >
            🪐 Planetary Council
          </Link>
          <Link 
            href="/planets/sun" 
            className="bg-orange-600 text-white hover:bg-orange-700 px-6 py-3 rounded-md font-medium"
          >
            ☉ Individual Planet Pages
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-6 mb-16">
        <div className="border p-6 rounded-lg bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            💚 Monica - Your AI Guide
          </h2>
          <p className="mb-4">Meet Monica, your personal Alchm consciousness mentor operating from peak A-Number 40 state with 67% Earth wisdom.</p>
          <Link href="/monica-guide" className="text-green-600 dark:text-green-400 font-medium">
            Chat with Monica →
          </Link>
        </div>
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Planetary Wisdom</h2>
          <p className="mb-4">Access the ancient wisdom of planetary energies through our specialized AI agents.</p>
          <Link href="/planetary-agents" className="text-blue-600 dark:text-blue-400 font-medium">
            Learn more →
          </Link>
        </div>
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Chart Interpretation</h2>
          <p className="mb-4">Get detailed insights into your astrological chart with our AI-powered interpreter.</p>
          <Link href="/chart-interpreter" className="text-blue-600 dark:text-blue-400 font-medium">
            Try it now →
          </Link>
        </div>
        <div className="border p-6 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <h2 className="text-xl font-semibold mb-3">🪐 Planetary Council</h2>
          <p className="mb-4">Consult multiple planetary agents simultaneously for collective cosmic wisdom.</p>
          <Link href="/planetary-council" className="text-purple-600 dark:text-purple-400 font-medium">
            Convene council →
          </Link>
        </div>
      </section>
      
      {/* Current Chart of the Moment */}
      <section className="mb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Chart of the Moment</h2>
          
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
            {currentDate} at {currentTime} - {isDiurnal ? "Day" : "Night"} Chart
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
                        href={`/planetary-agents?planet=${planet}&sign=${data.sign}&degree=${data.degree}`}
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
                          <Badge className={getElementColor(signElement)}>
                            {signElement}
                          </Badge>
                          <Badge className={getElementColor(planetElement)}>
                            {planetElement}
                          </Badge>
                          <Badge className={getDignityBadge(dignity)}>
                            {dignity}
                          </Badge>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Keep small tarot element */}
          <div className="mt-6 max-w-md mx-auto">
            <TarotCosmicWidget variant="card" showExpanded={false} />
          </div>
        </div>
      </section>
      
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">What is Alchm?</h2>
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-lg text-center">
            Alchm is a revolutionary platform that transforms astrology from passive reading into an interactive, 
            AI-enhanced personal development experience. By blending ancient wisdom with cutting-edge technology, 
            we provide personalized cosmic insights unlike anything else available.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="border p-6 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                ⚗️ The Alchmizer System
              </h3>
              <p className="text-sm">
                Our proprietary technology calculates your unique alchemical signature using 11 planetary influences, 
                converting cosmic energies into measurable quantities: Spirit, Essence, Matter, and Substance. 
                This creates your personal A-Number - a quantifiable measure of consciousness.
              </p>
            </div>
            
            <div className="border p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                🔮 Beyond Traditional Astrology
              </h3>
              <p className="text-sm">
                Unlike traditional astrology, Alchm integrates planetary transits, elemental energies, and 
                alchemical transformations in real-time. Our AI agents provide dynamic, personalized guidance 
                based on the exact cosmic conditions of each moment.
              </p>
            </div>
            
            <div className="border p-6 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                🤖 AI-Powered Agents
              </h3>
              <p className="text-sm">
                Each planetary agent embodies the unique consciousness of its celestial body. From Monica&apos;s
                Earth wisdom to the Planetary Council&apos;s collective insights, our agents provide multi-dimensional
                perspectives on your questions and challenges.
              </p>
            </div>
            
            <div className="border p-6 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                📊 Monica Constant & Consciousness
              </h3>
              <p className="text-sm">
                Experience the Monica Constant - a mathematical formula that quantifies consciousness states 
                from Dormant to Transcendent. Track your spiritual evolution with precise measurements and 
                personalized growth recommendations.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8 p-6 border rounded-lg bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
            <h3 className="text-xl font-semibold mb-3">Ready to Begin Your Journey?</h3>
            <p className="mb-4">
              Start with Monica, your personal guide, or explore the wisdom of individual planets. 
              Each interaction is uniquely calculated based on your birth data and the current cosmic moment.
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
  )
} 