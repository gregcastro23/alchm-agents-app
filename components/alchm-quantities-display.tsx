"use client"

import { useState, useEffect } from "react"
import { Flame, Droplets, Wind, Mountain, Coins, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

// Token display component
function TokenDisplay({ 
  value, 
  icon, 
  name, 
  color, 
  description
}: { 
  value: number; 
  icon: React.ReactNode; 
  name: string; 
  color: string;
  description: string;
}) {
  // Round to 3 decimal places for token display
  const tokenValue = value.toFixed(3)
  
  return (
    <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-lg">{name}</span>
        </div>
        <Badge className={color}>{name.substring(0, 3).toUpperCase()}</Badge>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <Coins className="h-5 w-5 text-yellow-500" />
        <span className="text-xl font-mono font-bold">{tokenValue}</span>
      </div>
      
      <p className="text-sm text-muted-foreground mt-2">
        {description}
      </p>
      
      <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
        <span>Token ID: {name.toLowerCase()}-{Math.floor(Date.now()/1000000)}</span>
        <span>Market: Planetary</span>
      </div>
    </div>
  )
}

export default function AlchmQuantitiesDisplay() {
  const [data, setData] = useState<AlchemyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [detailedError, setDetailedError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    async function fetchAlchmQuantities() {
      if (!isMounted) return
      
      setLoading(true)
      setError(null)
      setDetailedError(null)
      
      // Add a small delay to ensure API server is ready (with exponential backoff)
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000)
      await new Promise(resolve => setTimeout(resolve, backoffTime))
      
      try {
        console.log(`Fetching alchm quantities data... (attempt ${retryCount + 1})`)
        
        // Create a timeout promise to handle hanging requests
        const timeoutPromise = new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error("Request timed out after 15 seconds")), 15000)
        )
        
        // Create the fetch promise
        const fetchPromise = fetch('/api/alchm-quantities', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          cache: 'no-store',
        })
        
        // Race the promises
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
        
        if (!response.ok) {
          let errorDetail = `API responded with status: ${response.status}`
          
          try {
            // Try to extract detailed error message from API response
            const errorData = await response.json()
            if (errorData.error) {
              errorDetail = errorData.error
              if (errorData.details) {
                setDetailedError(errorData.details)
              }
            }
          } catch (e) {
            console.error("Error parsing error response:", e)
          }
          
          throw new Error(errorDetail)
        }
        
        const jsonData = await response.json()
        console.log('Received data:', jsonData)
        
        if (!jsonData || !jsonData.quantities) {
          throw new Error('Invalid data format received from API')
        }
        
        // Validate all expected values are present and are numbers
        ['Spirit', 'Essence', 'Matter', 'Substance'].forEach(key => {
          if (typeof jsonData.quantities[key] !== 'number') {
            throw new Error(`Invalid format for ${key}: expected number but got ${typeof jsonData.quantities[key]}`)
          }
        })
        
        if (isMounted) {
          setData(jsonData)
          // Reset retry count on success
          setRetryCount(0)
        }
      } catch (err) {
        console.error("Error fetching Alchm quantities:", err)
        
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch data")
          
          // Retry logic - retry up to 5 times with exponential backoff
          if (retryCount < 5) {
            const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 30000)
            console.log(`Retrying in ${retryDelay}ms (attempt ${retryCount + 1}/5)`)
            setTimeout(() => {
              if (isMounted) {
                setRetryCount(prev => prev + 1)
              }
            }, retryDelay)
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchAlchmQuantities()
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchAlchmQuantities, 5 * 60 * 1000)
    
    // Cleanup
    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount(0) // Reset retry count to trigger a new attempt
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-semibold">Error Loading Data</h3>
        </div>
        <p className="mb-2">{error}</p>
        {detailedError && (
          <details className="mt-2 mb-3">
            <summary className="cursor-pointer text-sm">Technical Details</summary>
            <p className="mt-1 text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded whitespace-pre-wrap">
              {detailedError}
            </p>
          </details>
        )}
        <button 
          onClick={handleRetry}
          className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 hover:dark:bg-red-800/70 rounded text-sm font-medium"
        >
          Retry Now
        </button>
      </div>
    )
  }

  return (
    <div>
      {loading ? (
        <div className="flex flex-col justify-center items-center h-60 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Calculating current alchemical quantities...</p>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground">Retry attempt {retryCount}/5...</p>
          )}
        </div>
      ) : data ? (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between text-sm mb-4">
            <div><span className="font-medium">Sun Sign:</span> {data.sunSign || "Unknown"}</div>
            <div><span className="font-medium">Dominant Element:</span> {data.dominantElement || "Unknown"}</div>
            <div><span className="font-medium">Chart Ruler:</span> {data.chartRuler || "Unknown"}</div>
          </div>
          
          <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-center text-sm">
            <p>These token quantities are determined by astrological calculations for the current planetary positions.</p>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <TokenDisplay 
              value={data.quantities.Spirit}
              icon={<Flame className="h-6 w-6 text-red-500" />}
              name="Spirit"
              color="bg-red-500 hover:bg-red-600"
              description="Spirit represents the active, transformative energy in the system. Associated with the Sun, Mars, and Jupiter."
            />
            
            <TokenDisplay 
              value={data.quantities.Essence}
              icon={<Droplets className="h-6 w-6 text-blue-500" />}
              name="Essence"
              color="bg-blue-500 hover:bg-blue-600"
              description="Essence represents the fluid, connective energy. Associated with the Moon, Venus, and Neptune."
            />

            <TokenDisplay 
              value={data.quantities.Matter}
              icon={<Mountain className="h-6 w-6 text-amber-700" />}
              name="Matter"
              color="bg-amber-700 hover:bg-amber-800"
              description="Matter represents physical manifestation and substance. Associated with Saturn, Mars, and the Moon."
            />

            <TokenDisplay 
              value={data.quantities.Substance}
              icon={<Wind className="h-6 w-6 text-purple-500" />}
              name="Substance"
              color="bg-purple-500 hover:bg-purple-600"
              description="Substance represents foundational stability and framework. Associated with Mercury, Neptune, and Saturn."
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg mt-4 text-sm">
            <div className="text-center text-muted-foreground mb-2">
              Thermodynamic Properties
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-1 border-b border-gray-200 dark:border-gray-700">
                <span className="font-medium">Heat:</span>
                <span className="font-mono">{data.heat.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between p-1 border-b border-gray-200 dark:border-gray-700">
                <span className="font-medium">Entropy:</span>
                <span className="font-mono">{data.entropy.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between p-1 border-b border-gray-200 dark:border-gray-700">
                <span className="font-medium">Reactivity:</span>
                <span className="font-mono">{data.reactivity.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between p-1 border-b border-gray-200 dark:border-gray-700">
                <span className="font-medium">Energy:</span>
                <span className="font-mono">{data.energy.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground p-8 border rounded-lg">
          <p className="font-medium">Unable to load alchemical data</p>
          <p className="mt-2 text-sm">The system couldn't retrieve current planetary token quantities.</p>
          <button 
            onClick={handleRetry}
            className="mt-3 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
} 