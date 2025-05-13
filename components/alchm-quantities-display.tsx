"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Flame, Droplets, Wind, Mountain } from "lucide-react"

type AlchemyQuantities = {
  Spirit: number
  Essence: number
  Matter: number
  Substance: number
  DayEssence: number
  NightEssence: number
}

type AlchemyData = {
  quantities: AlchemyQuantities
  dominantElement: string
  heat: number
  entropy: number
  reactivity: number
  energy: number
  sunSign: string
  chartRuler: string
  timestamp: string
}

export default function AlchmQuantitiesDisplay() {
  const [data, setData] = useState<AlchemyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAlchmQuantities() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/alchm-quantities')
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        const data = await response.json()
        setData(data)
      } catch (err) {
        console.error("Error fetching Alchm quantities:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }
    
    fetchAlchmQuantities()
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchAlchmQuantities, 5 * 60 * 1000)
    
    return () => clearInterval(intervalId)
  }, [])
  
  // Function to normalize alchemical values to 0-100 range
  function normalizeValue(value: number): number {
    // Usually alchemical values are between 0-10, so multiply by 10
    const normalized = value * 10
    return Math.min(Math.max(normalized, 0), 100)
  }
  
  // Get a CSS class for the value strength
  function getStrengthClass(value: number): string {
    if (value >= 80) return "text-green-500 font-bold"
    if (value >= 60) return "text-blue-500"
    if (value >= 40) return "text-yellow-500"
    if (value >= 20) return "text-orange-500"
    return "text-red-500"
  }
  
  // Get the appropriate progress color
  function getProgressColor(value: number): string {
    if (value >= 80) return "bg-green-500"
    if (value >= 60) return "bg-blue-500"
    if (value >= 40) return "bg-yellow-500"
    if (value >= 20) return "bg-orange-500"
    return "bg-red-500"
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-lg border border-red-200">
        <h3 className="font-semibold mb-2">Error Loading Data</h3>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : data ? (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between text-sm mb-4">
            <div><span className="font-medium">Sun Sign:</span> {data.sunSign || "Unknown"}</div>
            <div><span className="font-medium">Dominant Element:</span> {data.dominantElement || "Unknown"}</div>
            <div><span className="font-medium">Chart Ruler:</span> {data.chartRuler || "Unknown"}</div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                <span className="font-medium">Spirit</span>
              </div>
              <span className={getStrengthClass(normalizeValue(data.quantities.Spirit))}>
                {normalizeValue(data.quantities.Spirit).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={normalizeValue(data.quantities.Spirit)} 
              className="h-2" 
              indicatorClassName={getProgressColor(normalizeValue(data.quantities.Spirit))} 
            />
            <p className="text-sm text-muted-foreground">
              Spirit represents the active, transformative energy in the system. Associated with the Sun, Mars, and Jupiter.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Essence</span>
              </div>
              <span className={getStrengthClass(normalizeValue(data.quantities.Essence))}>
                {normalizeValue(data.quantities.Essence).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={normalizeValue(data.quantities.Essence)} 
              className="h-2" 
              indicatorClassName={getProgressColor(normalizeValue(data.quantities.Essence))} 
            />
            <p className="text-sm text-muted-foreground">
              Essence represents the fluid, connective energy. Associated with the Moon, Venus, and Neptune.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mountain className="h-5 w-5 text-amber-700" />
                <span className="font-medium">Matter</span>
              </div>
              <span className={getStrengthClass(normalizeValue(data.quantities.Matter))}>
                {normalizeValue(data.quantities.Matter).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={normalizeValue(data.quantities.Matter)} 
              className="h-2" 
              indicatorClassName={getProgressColor(normalizeValue(data.quantities.Matter))} 
            />
            <p className="text-sm text-muted-foreground">
              Matter represents physical manifestation and substance. Associated with Saturn, Mars, and the Moon.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Substance</span>
              </div>
              <span className={getStrengthClass(normalizeValue(data.quantities.Substance))}>
                {normalizeValue(data.quantities.Substance).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={normalizeValue(data.quantities.Substance)} 
              className="h-2" 
              indicatorClassName={getProgressColor(normalizeValue(data.quantities.Substance))} 
            />
            <p className="text-sm text-muted-foreground">
              Substance represents foundational stability and framework. Associated with Mercury, Neptune, and Saturn.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg mt-4 text-sm">
            <div className="text-center text-muted-foreground mb-2">
              Thermodynamic Properties
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>Heat: {(data.heat * 100).toFixed(1)}%</div>
              <div>Entropy: {(data.entropy * 100).toFixed(1)}%</div>
              <div>Reactivity: {(data.reactivity * 100).toFixed(1)}%</div>
              <div>Energy: {(data.energy * 100).toFixed(1)}%</div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  )
} 