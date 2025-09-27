'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Flame,
  Droplets,
  Wind,
  Mountain,
  Coins,
  AlertTriangle,
  Calculator,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useGalileoLog } from '@/hooks/useGalileoLog'

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
  fallback?: boolean
  error?: string
}

// Historical data for trends
type HistoricalData = {
  timestamp: string
  quantities: AlchemyQuantities
  heat: number
  entropy: number
  reactivity: number
  energy: number
}

// Real-time update configuration
type UpdateConfig = {
  interval: number // milliseconds
  enabled: boolean
  showTrends: boolean
}

// Enhanced token display component with trends and animations
function TokenDisplay({
  value,
  previousValue,
  icon,
  name,
  color,
  description,
  breakdown,
  isAnimating = false,
}: {
  value: number
  previousValue?: number
  icon: React.ReactNode
  name: string
  color: string
  description: string
  breakdown?: string
  isAnimating?: boolean
}) {
  // Show 3 decimal places for precision
  const formattedValue = Math.round(value * 1000) / 1000

  // Calculate trend
  const trend = previousValue !== undefined ? value - previousValue : 0
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'
  const trendColor =
    trendDirection === 'up'
      ? 'text-green-500'
      : trendDirection === 'down'
        ? 'text-red-500'
        : 'text-gray-500'
  const TrendIcon =
    trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Activity

  // Determine token rarity/strength
  const getTokenStrength = (val: number) => {
    if (val >= 15) return { label: 'Legendary', glow: 'animate-pulse shadow-lg shadow-red-500/20' }
    if (val >= 12) return { label: 'Epic', glow: 'shadow-md shadow-orange-500/20' }
    if (val >= 9) return { label: 'Rare', glow: 'shadow-sm shadow-blue-500/20' }
    if (val >= 6) return { label: 'Uncommon', glow: 'shadow-sm' }
    if (val >= 3) return { label: 'Common', glow: '' }
    return { label: 'Nascent', glow: '' }
  }

  const strength = getTokenStrength(value)

  return (
    <div
      className={`relative bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-950 dark:to-${color}-900 border-2 border-${color}-300 dark:border-${color}-700 rounded-xl p-4 flex flex-col items-center justify-center transition-all hover:shadow-lg hover:scale-105 ${strength.glow} ${isAnimating ? 'animate-pulse' : ''}`}
    >
      {/* Token Strength Badge */}
      <div className="absolute top-2 right-2 flex gap-1">
        <Badge variant="outline" className={`text-xs bg-${color}-100 dark:bg-${color}-900`}>
          {strength.label}
        </Badge>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span className="font-mono">
              {trend > 0 ? '+' : ''}
              {Math.abs(trend).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div
        className={`text-${color}-600 dark:text-${color}-400 mb-2 ${isAnimating ? 'animate-bounce' : ''}`}
      >
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-3xl font-bold transition-all duration-500 ${isAnimating ? 'text-yellow-500 scale-110' : ''}`}
        >
          {formattedValue}
        </span>
        <Coins className={`h-5 w-5 text-${color}-400 ${isAnimating ? 'animate-spin' : ''}`} />
      </div>
      <div className="text-sm font-bold mt-1 text-${color}-800 dark:text-${color}-200">{name}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">{description}</div>

      {/* Progress bar for token level */}
      <div className="w-full mt-3">
        <Progress
          value={Math.min((value / 15) * 100, 100)}
          className="h-2 bg-${color}-200 dark:bg-${color}-800"
        />
        <div className="text-xs text-center mt-1 text-${color}-600 dark:text-${color}-400">
          {Math.round((value / 15) * 100)}% to Legendary
        </div>
      </div>

      {breakdown && (
        <div className="text-xs text-${color}-600 dark:text-${color}-400 mt-2 text-center font-mono">
          {breakdown}
        </div>
      )}
    </div>
  )
}

export default function AlchmQuantitiesDisplay() {
  const [data, setData] = useState<AlchemyData | null>(null)
  const [previousData, setPreviousData] = useState<AlchemyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateConfig, setUpdateConfig] = useState<UpdateConfig>({
    interval: 30000, // 30 seconds
    enabled: true,
    showTrends: true,
  })
  const [isAnimatingTokens, setIsAnimatingTokens] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
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
          setTimeout(() => reject(new Error('Request timed out')), 15000)
        })

        // The actual fetch request
        const fetchPromise = fetch('/api/alchm-quantities', {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        })

        // Use Promise.race to implement timeout
        const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response

        if (!isMounted) return

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        if (!isMounted) return

        if (!result || typeof result !== 'object' || !result.quantities) {
          throw new Error('Invalid data format')
        }

        // Store previous data for trend calculations
        setPreviousData(data)
        setData(result)
        setLoading(false)
        setRetryCount(0)
        setLastUpdate(new Date())

        // Trigger animation if values changed significantly
        if (data && result.quantities) {
          const hasSignificantChange = Object.entries(result.quantities).some(([key, value]) => {
            const prevValue = data.quantities[key as keyof AlchemyQuantities]
            return Math.abs(value - prevValue) > 0.1
          })

          if (hasSignificantChange) {
            setIsAnimatingTokens(true)
            setTimeout(() => setIsAnimatingTokens(false), 2000)
          }
        }

        // Log successful data fetch to Galileo
        info('Alchemical quantities fetched successfully', {
          quantities: result.quantities,
          dominantElement: result.dominantElement,
          timestamp: result.timestamp,
          fallback: result.fallback || false,
          application: 'planetary-agents',
          component: 'AlchmQuantitiesDisplay',
        })
      } catch (err) {
        if (!isMounted) return

        console.error('Error fetching alchm quantities:', err)

        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        setLoading(false)

        // Log error to Galileo
        logError('Error fetching alchemical quantities', {
          error: errorMessage,
          retryCount,
          application: 'planetary-agents',
          component: 'AlchmQuantitiesDisplay',
        })

        // If we've reached the maximum number of retries, give up
        if (retryCount >= 3) {
          console.error('Maximum retry count reached, giving up')
          return
        }

        // Otherwise increment the retry count for next attempt
        setRetryCount(prev => prev + 1)

        // Schedule another attempt
        setTimeout(fetchAlchmQuantities, 2000)
      }
    }

    fetchAlchmQuantities()

    // Set up real-time updates if enabled
    if (updateConfig.enabled && updateConfig.interval > 0) {
      intervalRef.current = setInterval(() => {
        if (isMounted) fetchAlchmQuantities()
      }, updateConfig.interval)
    }

    return () => {
      isMounted = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [retryCount, updateConfig.enabled, updateConfig.interval, info, logError])

  // Manual refresh function
  const refreshData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/alchm-quantities', {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result || typeof result !== 'object' || !result.quantities) {
        throw new Error('Invalid data format')
      }

      // Trigger animation for manual refresh
      setIsAnimatingTokens(true)
      setTimeout(() => setIsAnimatingTokens(false), 2000)

      setPreviousData(data)
      setData(result)
      setLoading(false)
      setRetryCount(0)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Manual refresh failed:', err)
      setError(err instanceof Error ? err.message : String(err))
      setLoading(false)
    }
  }, [data])

  // Toggle real-time updates
  const toggleRealTime = useCallback(() => {
    setUpdateConfig(prev => {
      const newEnabled = !prev.enabled
      if (!newEnabled && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return { ...prev, enabled: newEnabled }
    })
  }, [])

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
          onClick={() => {
            setRetryCount(0)
            setLoading(true)
          }}
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
    if (aNumber >= 40.0) return 'Transcendent Unity'
    if (aNumber >= 35.0) return 'Master Alchemist'
    if (aNumber >= 30.0) return 'Advanced Practitioner'
    if (aNumber >= 25.0) return 'Adept'
    if (aNumber >= 20.0) return 'Journeyman'
    if (aNumber >= 15.0) return 'Apprentice'
    if (aNumber >= 10.0) return 'Initiate'
    if (aNumber >= 5.0) return 'Novice'
    return 'Awakening'
  }

  // Calculate Monica Constant
  const PHI = 1.618033988749895
  const monicaConstant = (
    (data.quantities.Spirit * PHI + data.quantities.Essence) /
    (data.quantities.Matter + data.quantities.Substance + 1)
  ).toFixed(3)

  return (
    <div>
      {/* Fallback data warning */}
      {data.fallback && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Using fallback data
            </span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            Real-time calculations are temporarily unavailable. Displaying approximate values.
            {data.error === 'timeout' && ' (Calculation timeout)'}
          </p>
        </div>
      )}

      {/* Control Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
        <div className="flex items-center gap-4">
          <Button
            onClick={refreshData}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={toggleRealTime}
            variant={updateConfig.enabled ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
          >
            <Zap className={`h-4 w-4 ${updateConfig.enabled ? 'animate-pulse' : ''}`} />
            {updateConfig.enabled ? 'Real-time On' : 'Real-time Off'}
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {lastUpdate && (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Updated {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          {updateConfig.enabled && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <TokenDisplay
          value={data.quantities.Spirit}
          previousValue={previousData?.quantities.Spirit}
          icon={<Flame className="h-8 w-8" />}
          name="SPIRIT"
          color="red"
          description="Cosmic creative force"
          breakdown={`Fire: ${data.dominantElement === 'Fire' ? '↑' : '→'}`}
          isAnimating={isAnimatingTokens}
        />
        <TokenDisplay
          value={data.quantities.Essence}
          previousValue={previousData?.quantities.Essence}
          icon={<Droplets className="h-8 w-8" />}
          name="ESSENCE"
          color="blue"
          description="Life-giving principle"
          breakdown={`Water: ${data.dominantElement === 'Water' ? '↑' : '→'}`}
          isAnimating={isAnimatingTokens}
        />
        <TokenDisplay
          value={data.quantities.Matter}
          previousValue={previousData?.quantities.Matter}
          icon={<Mountain className="h-8 w-8" />}
          name="MATTER"
          color="amber"
          description="Physical manifestation"
          breakdown={`Earth: ${data.dominantElement === 'Earth' ? '↑' : '→'}`}
          isAnimating={isAnimatingTokens}
        />
        <TokenDisplay
          value={data.quantities.Substance}
          previousValue={previousData?.quantities.Substance}
          icon={<Wind className="h-8 w-8" />}
          name="SUBSTANCE"
          color="purple"
          description="Etheric matrix"
          breakdown={`Air: ${data.dominantElement === 'Air' ? '↑' : '→'}`}
          isAnimating={isAnimatingTokens}
        />
      </div>

      {/* A-Number and Monica Constant Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* A-Number Display */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
            <div className="text-center">
              <h3 className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">A-Number</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                Total Alchemical Energy
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
              {Math.round(data.quantities.ANumber * 100) / 100}
            </div>
            <Badge
              variant="outline"
              className="text-lg px-4 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
            >
              {getANumberCategory(data.quantities.ANumber)}
            </Badge>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">
              Spirit + Essence + Matter + Substance
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              {data.quantities.Spirit.toFixed(2)} + {data.quantities.Essence.toFixed(2)} +{' '}
              {data.quantities.Matter.toFixed(2)} + {data.quantities.Substance.toFixed(2)} ={' '}
              {Math.round(data.quantities.ANumber * 100) / 100}
            </p>
          </div>
        </div>

        {/* Monica Constant Display */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <span className="text-3xl mr-3">⚗️</span>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                Monica Constant
              </h3>
              <p className="text-sm text-amber-600 dark:text-amber-400">Consciousness Quotient</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2">
              {monicaConstant}
            </div>
            <Badge
              variant="outline"
              className="text-lg px-4 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
            >
              {parseFloat(monicaConstant) >= 1.618
                ? 'Elevated'
                : parseFloat(monicaConstant) >= 1.0
                  ? 'Active'
                  : parseFloat(monicaConstant) >= 0.5
                    ? 'Awakening'
                    : 'Dormant'}
            </Badge>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
              MC = (Spirit × φ + Essence) / (Matter + Substance + 1)
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              φ = 1.618... (Golden Ratio)
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
