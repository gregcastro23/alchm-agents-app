"use client"

import { useState, useEffect } from "react"
import { Flame, Droplets, Wind, Mountain, Coins, AlertTriangle, Calculator } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useGalileoLog } from "@/hooks/useGalileoLog"

type AlchemyQuantities = {
  Spirit: number
  Essence: number
  Matter: number
  Substance: number
  ANumber: number
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
  // Round to 2 decimal places
  const formattedValue = Math.round(value * 100) / 100;
  
  return (
    <div className={`bg-${color}-50 dark:bg-${color}-950 border border-${color}-200 dark:border-${color}-800 rounded-lg p-4 flex flex-col items-center justify-center transition-all hover:shadow-md`}>
      <div className={`text-${color}-500 mb-2`}>
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{formattedValue}</span>
        <Coins className="h-4 w-4 text-gray-400" />
      </div>
      <div className="text-sm font-medium mt-1">{name}</div>
      <div className="text-xs text-gray-500 mt-1 text-center">{description}</div>
    </div>
  );
}

export default function AlchmQuantitiesDisplay() {
  const [data, setData] = useState<AlchemyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { info, error: logError } = useGalileoLog()

  useEffect(() => {
    let isMounted = true
    
    async function fetchAlchmQuantities() {
      if (!isMounted) return
      
      setLoading(true)
      setError(null)
      
      try {
        console.log(`Fetching alchemical quantities... (attempt ${retryCount + 1})`)
        
        // Add a small delay with exponential backoff based on retry count
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000)
        await new Promise(resolve => setTimeout(resolve, backoffTime))
        
        // Create a timeout promise to handle hanging request
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out")), 15000)
        })
        
        // The actual fetch request
        const fetchPromise = fetch("/api/alchm-quantities", {
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        })
        
        // Use Promise.race to implement timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
        
        if (!isMounted) return
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (!isMounted) return
        
        if (!result || typeof result !== 'object' || !result.quantities) {
          throw new Error("Invalid data format")
        }
        
        setData(result)
        setLoading(false)
        setRetryCount(0)
        
        // Log successful data fetch to Galileo
        info('Alchemical quantities fetched successfully', {
          quantities: result.quantities,
          dominantElement: result.dominantElement,
          timestamp: result.timestamp,
          application: 'planetary-agents',
          component: 'AlchmQuantitiesDisplay'
        })
        
      } catch (err) {
        if (!isMounted) return
        
        console.error("Error fetching alchm quantities:", err)
        
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        setLoading(false)
        
        // Log error to Galileo
        logError('Error fetching alchemical quantities', {
          error: errorMessage,
          retryCount,
          application: 'planetary-agents',
          component: 'AlchmQuantitiesDisplay'
        })
        
        // If we've reached the maximum number of retries, give up
        if (retryCount >= 3) {
          console.error("Maximum retry count reached, giving up")
          return
        }
        
        // Otherwise increment the retry count for next attempt
        setRetryCount(prev => prev + 1)
        
        // Schedule another attempt
        setTimeout(fetchAlchmQuantities, 2000)
      }
    }
    
    fetchAlchmQuantities()
    
    return () => {
      isMounted = false
    }
  }, [retryCount, info, logError])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-lg font-medium text-center">Calculating Alchemical Quantities...</p>
        <p className="text-sm text-center text-muted-foreground mt-2">
          Fetching real-time planetary positions to generate accurate token values
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 border rounded-lg bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-center">Error Loading Alchemical Data</h3>
        <p className="text-sm text-center text-muted-foreground mt-2">{error}</p>
        <button 
          onClick={() => { setRetryCount(0); setLoading(true); }}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium text-center">No Data Available</h3>
        <p className="text-sm text-center text-muted-foreground mt-2">
          Unable to retrieve alchemical quantities. Please try again later.
        </p>
      </div>
    )
  }

  // Helper function to get A-Number category
  const getANumberCategory = (aNumber: number): string => {
    if (aNumber >= 3.0) return "Maximum Power";
    if (aNumber >= 2.5) return "High Energy";
    if (aNumber >= 2.0) return "Balanced Energy";
    if (aNumber >= 1.5) return "Moderate Energy";
    if (aNumber >= 1.0) return "Focused Energy";
    return "Subtle Energy";
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <TokenDisplay 
          value={data.quantities.Spirit} 
          icon={<Flame className="h-6 w-6" />} 
          name="SPIRIT" 
          color="red"
          description="Cosmic creative force"
        />
        <TokenDisplay 
          value={data.quantities.Essence} 
          icon={<Droplets className="h-6 w-6" />} 
          name="ESSENCE" 
          color="blue"
          description="Life-giving principle"
        />
        <TokenDisplay 
          value={data.quantities.Matter} 
          icon={<Mountain className="h-6 w-6" />} 
          name="MATTER" 
          color="amber"
          description="Physical substance"
        />
        <TokenDisplay 
          value={data.quantities.Substance} 
          icon={<Wind className="h-6 w-6" />} 
          name="SUBSTANCE" 
          color="purple"
          description="Etheric foundation"
        />
      </div>
      
      {/* A-Number Special Display */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
            <div className="text-center">
              <h3 className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">A-Number</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">Total Alchemical Energy</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
              {Math.round(data.quantities.ANumber * 100) / 100}
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
              {getANumberCategory(data.quantities.ANumber)}
            </Badge>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">
              Spirit + Essence + Matter + Substance = {Math.round(data.quantities.ANumber * 100) / 100}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Dominant: {data.dominantElement}</Badge>
            <Badge variant="outline">Sun in {data.sunSign}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div className="flex items-center justify-between">
            <span>Heat:</span>
            <span className="font-mono">{(data.heat * 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Entropy:</span>
            <span className="font-mono">{(data.entropy * 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Reactivity:</span>
            <span className="font-mono">{(data.reactivity * 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Energy:</span>
            <span className="font-mono">{(data.energy * 100).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
} 