'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type AccuracyLevel = 'high' | 'medium' | 'low' | 'fallback'

export interface PlanetaryPosition {
  planet: string
  sign: string
  degree: number
  retrograde?: boolean
}

export interface AlchemicalQuantities {
  spirit: number
  essence: number
  matter: number
  substance: number
  Heat?: number
  Entropy?: number
  Reactivity?: number
  Energy?: number
}

export interface PlanetaryData {
  timestamp: string
  planetaryPositions: PlanetaryPosition[]
  alchmQuantities?: AlchemicalQuantities
  monicaConstant?: number
  source: string
  accuracy: AccuracyLevel
  cached: boolean
  error?: string
}

interface UseUnifiedPlanetaryPositionsOptions {
  accuracy?: AccuracyLevel
  includeAlchemy?: boolean
  useCache?: boolean
  refreshInterval?: number // milliseconds, default 30000 (30 seconds)
  retryAttempts?: number
  autoRefresh?: boolean
}

const DEFAULT_OPTIONS: Required<UseUnifiedPlanetaryPositionsOptions> = {
  accuracy: 'high',
  includeAlchemy: false,
  useCache: true,
  refreshInterval: 30000,
  retryAttempts: 3,
  autoRefresh: true,
}

// Shared cache to ensure all components get the same data at the same time
const sharedCache = {
  data: null as PlanetaryData | null,
  lastFetch: 0,
  subscribers: new Set<() => void>(),
  isLoading: false,
  currentOptions: null as any,
}

export interface UnifiedPlanetaryState extends PlanetaryData {
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  isStale: boolean
  refresh: () => Promise<void>
  clearCache: () => void
}

export function useUnifiedPlanetaryPositions(
  options: UseUnifiedPlanetaryPositionsOptions = {}
): UnifiedPlanetaryState {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const [data, setData] = useState<PlanetaryData>({
    timestamp: new Date().toISOString(),
    planetaryPositions: [],
    source: 'static-fallback',
    accuracy: 'fallback',
    cached: false,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const retryCountRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchPlanetaryData = useCallback(
    async (force: boolean = false): Promise<void> => {
      const now = Date.now()
      const cacheKey = `${opts.accuracy}-${opts.includeAlchemy}-${opts.useCache}`

      // Use shared cache if data is fresh and options match
      if (
        !force &&
        sharedCache.data &&
        cacheKey === sharedCache.currentOptions &&
        now - sharedCache.lastFetch < Math.min(opts.refreshInterval, 30000)
      ) {
        setData(sharedCache.data)
        setLoading(false)
        setError(null)
        setLastUpdated(new Date(sharedCache.lastFetch))
        return
      }

      // Prevent multiple simultaneous fetches
      if (sharedCache.isLoading && !force) {
        return
      }

      sharedCache.isLoading = true
      sharedCache.currentOptions = cacheKey

      try {
        // Cancel any previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()

        setLoading(true)
        setError(null)

        const fetches: Promise<Response>[] = [
          fetch('/api/astrologize', { signal: abortControllerRef.current.signal }),
        ]
        if (opts.includeAlchemy) {
          fetches.push(
            fetch('/api/alchemize?legacy=true', { signal: abortControllerRef.current.signal })
          )
        }
        const responses = await Promise.all(fetches)
        const posRes = responses[0]
        if (!posRes.ok) throw new Error(`positions failed: ${posRes.status}`)
        const posData = await posRes.json()

        const planetaryPositions: PlanetaryPosition[] = Object.entries(
          posData?.planetary_positions || {}
        ).map(([name, body]: [string, any]) => ({
          planet: name,
          sign: body?.sign ?? '',
          degree: typeof body?.degree === 'number' ? body.degree : 0,
          retrograde: Boolean(body?.isRetrograde),
        }))

        let alchmQuantities: AlchemicalQuantities | undefined
        let monicaConstant: number | undefined
        if (opts.includeAlchemy && responses[1]) {
          if (!responses[1].ok) throw new Error(`alchemize failed: ${responses[1].status}`)
          const a = await responses[1].json()
          alchmQuantities = {
            spirit: Number(a?.spirit_score ?? 0),
            essence: Number(a?.essence_score ?? 0),
            matter: Number(a?.matter_score ?? 0),
            substance: Number(a?.substance_score ?? 0),
            Heat: Number(a?.Heat ?? 0),
            Entropy: Number(a?.Entropy ?? 0),
            Reactivity: Number(a?.Reactivity ?? 0),
            Energy: Number(a?.Energy ?? 0),
          }
          monicaConstant = Number(a?.['A-Number'] ?? 0)
        }

        const result: PlanetaryData = {
          timestamp: new Date().toISOString(),
          planetaryPositions,
          alchmQuantities,
          monicaConstant,
          source: 'railway-proxy',
          accuracy: opts.accuracy,
          cached: false,
        }

        // Update shared cache
        sharedCache.data = result
        sharedCache.lastFetch = now

        // Notify all subscribers
        sharedCache.subscribers.forEach(callback => callback())

        setData(result)
        setLastUpdated(new Date())
        retryCountRef.current = 0 // Reset retry count on success
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return // Ignore aborted requests
        }

        console.error('Error fetching unified planetary positions:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

        // Retry logic
        if (retryCountRef.current < opts.retryAttempts) {
          retryCountRef.current++
          console.log(
            `Retrying unified planetary positions fetch (${retryCountRef.current}/${opts.retryAttempts})...`
          )

          // Exponential backoff: 1s, 2s, 4s
          const retryDelay = Math.pow(2, retryCountRef.current - 1) * 1000
          setTimeout(() => fetchPlanetaryData(force), retryDelay)
          return
        }

        setError(errorMessage)
        setData(prev => ({ ...prev, error: errorMessage }))
      } finally {
        setLoading(false)
        sharedCache.isLoading = false
      }
    },
    [opts.accuracy, opts.includeAlchemy, opts.useCache, opts.refreshInterval, opts.retryAttempts]
  )

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchPlanetaryData(true)
  }, [fetchPlanetaryData])

  // Clear cache function
  const clearCache = useCallback(() => {
    sharedCache.data = null
    sharedCache.lastFetch = 0
  }, [])

  // Subscribe to shared cache updates
  useEffect(() => {
    const updateFromCache = () => {
      if (sharedCache.data) {
        setData(sharedCache.data)
        setLoading(false)
        setError(null)
        setLastUpdated(new Date(sharedCache.lastFetch))
      }
    }

    sharedCache.subscribers.add(updateFromCache)

    return () => {
      sharedCache.subscribers.delete(updateFromCache)
    }
  }, [])

  // Initial fetch and interval setup
  useEffect(() => {
    fetchPlanetaryData()

    // Set up refresh interval if auto-refresh is enabled
    if (opts.autoRefresh && opts.refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchPlanetaryData()
      }, opts.refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchPlanetaryData, opts.autoRefresh, opts.refreshInterval])

  return {
    ...data,
    loading,
    error,
    lastUpdated,
    isStale: lastUpdated ? Date.now() - lastUpdated.getTime() > opts.refreshInterval : true,
    refresh,
    clearCache,
  }
}

// Legacy compatibility hook - maps to unified hook
export function usePlanetaryPositions(options: UseUnifiedPlanetaryPositionsOptions = {}) {
  const unified = useUnifiedPlanetaryPositions(options)

  // Convert to legacy format for backward compatibility
  const legacyPositions = unified.planetaryPositions.reduce(
    (acc, pos) => {
      acc[pos.planet] = {
        sign: pos.sign,
        degree: pos.degree.toString(),
        retrograde: pos.retrograde,
      }
      return acc
    },
    {} as Record<string, { sign: string; degree: string; retrograde: boolean }>
  )

  return {
    positions: legacyPositions,
    alchmQuantities: unified.alchmQuantities,
    monicaConstant: unified.monicaConstant,
    loading: unified.loading,
    error: unified.error,
    lastUpdated: unified.lastUpdated,
    isStale: unified.isStale,
    refresh: unified.refresh,
    source: unified.source,
    accuracy: unified.accuracy,
    cached: unified.cached,
  }
}

// Helper hook for positions-only (backward compatibility)
export function usePlanetaryPositionsOnly(options: UseUnifiedPlanetaryPositionsOptions = {}) {
  const { planetaryPositions, loading, error, refresh, source, accuracy, cached } =
    useUnifiedPlanetaryPositions(options)

  // Convert to legacy format
  const legacyPositions = planetaryPositions.reduce(
    (acc, pos) => {
      acc[pos.planet] = {
        sign: pos.sign,
        degree: pos.degree.toString(),
        retrograde: pos.retrograde,
      }
      return acc
    },
    {} as Record<string, { sign: string; degree: string; retrograde: boolean }>
  )

  return {
    positions: legacyPositions,
    loading,
    error,
    refresh,
    source,
    accuracy,
    cached,
  }
}

export default useUnifiedPlanetaryPositions
