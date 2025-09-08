"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { getPlanetaryDignity, getSignElement, getPlanetaryElement } from "@/lib/astrological-data"
import { getCurrentPlanetaryPositions } from "@/lib/calculate-transits"
import ElementalChart from "@/components/elemental-chart"
import TarotCosmicWidget from "@/components/tarot-cosmic-widget"

export default function ChartOfTheMomentPage() {
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [isDiurnal, setIsDiurnal] = useState(true)
  const [currentPlanetaryPositions, setCurrentPlanetaryPositions] = useState<Record<string, { sign: string, degree: string }>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Get the current planetary positions, date, and time
  const fetchPlanetaryPositions = useCallback(() => {
    setRefreshing(true)
    
    const now = new Date()
    // Force a timestamp to prevent caching
    const timestamp = now.getTime()
    
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
    
    // Calculate current planetary positions with the timestamp to prevent caching
    const positions = getCurrentPlanetaryPositions(timestamp)
    
    // Check if positions seem valid
    const positionCount = Object.keys(positions).length
    if (positionCount < 10 && retryCount < 3) {
      console.log(`Incomplete positions (${positionCount}), retrying...`, positions)
      setRetryCount(retryCount + 1)
      setTimeout(fetchPlanetaryPositions, 1000)
      return
    }
    
    setCurrentPlanetaryPositions(positions)
    setLoading(false)
    setRefreshing(false)
  }, [retryCount])
  
  // Fetch on mount and when retry count changes
  useEffect(() => {
    fetchPlanetaryPositions()
  }, [fetchPlanetaryPositions])
  
  // Prepare data for ElementalChart component
  const chartPlanets = Object.entries(currentPlanetaryPositions).reduce(
    (acc, [planet, data]) => ({
      ...acc,
      [`${planet.toLowerCase()}Sign`]: data.sign
    }),
    {}
  )
  
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

  if (loading) {
    return (
      <div className="container py-12 px-4 mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">Current Planetary Positions</h1>
        <div className="flex justify-center items-center h-60">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p>Calculating planetary positions...</p>
            {retryCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Retrying calculation ({retryCount}/3)...
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 px-4 mx-auto">
      <h1 className="text-3xl font-bold text-center mb-4">Current Planetary Positions</h1>
      <p className="text-center mb-4 max-w-2xl mx-auto">
        Explore the current planetary alignments and their elemental influences
      </p>
      
      <div className="flex justify-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchPlanetaryPositions}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Positions'}
        </Button>
      </div>
      
      <div className="mb-2 text-center text-sm text-muted-foreground">
        {currentDate} at {currentTime} - {isDiurnal ? "Day" : "Night"} Chart
      </div>
      
      {/* Cosmic Tarot Moment */}
      <div className="mb-8 max-w-md mx-auto">
        <TarotCosmicWidget variant="card" showExpanded={false} />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center">Chart of the Moment</CardTitle>
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
    </div>
  )
} 