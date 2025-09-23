// Unified hook for consistent planetary positions across all components
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCurrentPlanetaryPositions } from '@/lib/calculate-transits'
import { generateAlchmForCurrentMoment } from '@/lib/alchemizer'
import { calculateMC } from '@/lib/monica/monica-constant-validator'
import { logPerformance } from '@/lib/structured-logger'

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
  Heat: number
  Entropy: number
  Reactivity: number
  Energy: number
}

export interface UnifiedPlanetaryData {
  timestamp: string
  planetaryPositions: PlanetaryPosition[]
  alchmQuantities: AlchemicalQuantities
  monicaConstant: number
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface UsePlanetaryPositionsOptions {
  refreshInterval?: number // milliseconds, default 30000 (30 seconds)
  useApi?: boolean // Use API endpoint vs direct calculation, default false
  retryAttempts?: number // Number of retry attempts, default 3
}

const DEFAULT_OPTIONS: Required<UsePlanetaryPositionsOptions> = {
  refreshInterval: 30000, // 30 seconds
  useApi: false, // Use direct calculation by default for consistency
  retryAttempts: 3,
}

// Shared cache to ensure all components get the same data at the same time
const sharedCache = {
  data: null as UnifiedPlanetaryData | null,
  lastFetch: 0,
  subscribers: new Set<() => void>(),
  isLoading: false,
}

export function usePlanetaryPositions(options: UsePlanetaryPositionsOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const [data, setData] = useState<UnifiedPlanetaryData>({
    timestamp: new Date().toISOString(),
    planetaryPositions: [],
    alchmQuantities: {
      spirit: 0,
      essence: 0,
      matter: 0,
      substance: 0,
      Heat: 0,
      Entropy: 0,
      Reactivity: 0,
      Energy: 0,
    },
    monicaConstant: 0,
    loading: true,
    error: null,
    lastUpdated: null,
  })

  const retryCountRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchPlanetaryData = useCallback(
    async (force: boolean = false): Promise<void> => {
      const fetchStartTime = Date.now()
      const now = Date.now()

      // Use shared cache if data is fresh (within 30 seconds) and not forced
      if (!force && sharedCache.data && now - sharedCache.lastFetch < 30000) {
        setData(prev => ({ ...sharedCache.data!, loading: false }))
        logPerformance('planetary_positions_cache_hit', Date.now() - fetchStartTime, {
          system: 'hook',
          operation: 'cache_hit'
        })
        return
      }

      // Prevent multiple simultaneous fetches
      if (sharedCache.isLoading && !force) {
        return
      }

      sharedCache.isLoading = true

      try {
        // Cancel any previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()

        setData(prev => ({ ...prev, loading: true, error: null }))

        let result: UnifiedPlanetaryData

        if (opts.useApi) {
          // Use API endpoint (matches Philosopher's Stone approach)
          const response = await fetch('/api/philosophers-stone/positions', {
            signal: abortControllerRef.current.signal,
            cache: 'no-store',
          })

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`)
          }

          const apiData = await response.json()
          result = {
            ...apiData,
            loading: false,
            error: null,
            lastUpdated: new Date(),
          }
        } else {
          // Use direct calculation (matches other components)
          const timestamp = new Date().toISOString()
          const positions = getCurrentPlanetaryPositions(Date.now())
          const alchm = await generateAlchmForCurrentMoment()

          const planetaryPositions = [
            'Sun',
            'Moon',
            'Mercury',
            'Venus',
            'Mars',
            'Jupiter',
            'Saturn',
          ].map(planet => {
            const position = positions[planet]

            // Comprehensive validation with proper fallbacks
            let degree = 0
            if (position?.degree !== undefined) {
              if (typeof position.degree === 'number') {
                degree = Number.isFinite(position.degree) ? position.degree : 0
              } else {
                const parsed = parseFloat(String(position.degree))
                degree = Number.isFinite(parsed) ? parsed : 0
              }
            }

            // Ensure degree is within valid range
            degree = Math.max(0, Math.min(29.9999, degree))

            return {
              planet,
              sign: typeof position?.sign === 'string' ? position.sign : 'Aries',
              degree,
              retrograde: typeof position?.retrograde === 'boolean' ? position.retrograde : false,
            }
          })

          // Helper function to safely extract numeric values from alchemical data
          const safeAlchmValue = (value: any): number => {
            const num = typeof value === 'number' ? value : parseFloat(String(value || '0'))
            return Number.isFinite(num) ? num : 0
          }

          const spirit = safeAlchmValue(alchm?.['Alchemy Effects']?.['Total Spirit'])
          const essence = safeAlchmValue(alchm?.['Alchemy Effects']?.['Total Essence'])
          const matter = safeAlchmValue(alchm?.['Alchemy Effects']?.['Total Matter'])
          const substance = safeAlchmValue(alchm?.['Alchemy Effects']?.['Total Substance'])

          const fire = safeAlchmValue(alchm?.['Total Effect Value']?.['Fire'])
          const water = safeAlchmValue(alchm?.['Total Effect Value']?.['Water'])
          const air = safeAlchmValue(alchm?.['Total Effect Value']?.['Air'])
          const earth = safeAlchmValue(alchm?.['Total Effect Value']?.['Earth'])

          // Validate Monica Constant calculation inputs and result
          let monicaConstant = 0
          try {
            const mcResult = calculateMC(
              spirit,
              essence,
              matter,
              substance,
              fire,
              water,
              air,
              earth
            )
            monicaConstant = Number.isFinite(mcResult) ? mcResult : 0
          } catch (error) {
            console.warn('Error calculating Monica Constant:', error)
            monicaConstant = 0
          }

          result = {
            timestamp,
            planetaryPositions,
            alchmQuantities: {
              spirit,
              essence,
              matter,
              substance,
              Heat: safeAlchmValue(alchm?.['Heat']),
              Entropy: safeAlchmValue(alchm?.['Entropy']),
              Reactivity: safeAlchmValue(alchm?.['Reactivity']),
              Energy: safeAlchmValue(alchm?.['Energy']),
            },
            monicaConstant,
            loading: false,
            error: null,
            lastUpdated: new Date(),
          }
        }

        // Update shared cache
        sharedCache.data = result
        sharedCache.lastFetch = now

        // Notify all subscribers
        sharedCache.subscribers.forEach(callback => callback())

        setData(result)
        retryCountRef.current = 0 // Reset retry count on success

        // Log successful fetch performance
        logPerformance('planetary_positions_fetch_success', Date.now() - fetchStartTime, {
          system: 'hook',
          operation: 'fetch_success',
          metadata: {
            useApi: opts.useApi,
            cached: false,
            planetsCount: result.planetaryPositions.length
          }
        })
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return // Ignore aborted requests
        }

        console.error('Error fetching planetary positions:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

        // Retry logic
        if (retryCountRef.current < opts.retryAttempts) {
          retryCountRef.current++
          console.log(
            `Retrying planetary positions fetch (${retryCountRef.current}/${opts.retryAttempts})...`
          )

          // Exponential backoff: 1s, 2s, 4s
          const retryDelay = Math.pow(2, retryCountRef.current - 1) * 1000
          setTimeout(() => fetchPlanetaryData(force), retryDelay)
          return
        }

        setData(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
      } finally {
        sharedCache.isLoading = false
      }
    },
    [opts.useApi, opts.retryAttempts]
  )

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchPlanetaryData(true)
  }, [fetchPlanetaryData])

  // Subscribe to shared cache updates
  useEffect(() => {
    const updateFromCache = () => {
      if (sharedCache.data) {
        setData(prev => ({ ...sharedCache.data!, loading: false }))
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

    // Set up refresh interval
    if (opts.refreshInterval > 0) {
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
  }, [fetchPlanetaryData, opts.refreshInterval])

  return {
    ...data,
    refresh,
    isStale: data.lastUpdated
      ? Date.now() - data.lastUpdated.getTime() > opts.refreshInterval
      : true,
  }
}

// Helper hook for legacy components that just need positions
export function usePlanetaryPositionsOnly(options: UsePlanetaryPositionsOptions = {}) {
  const { planetaryPositions, loading, error, refresh } = usePlanetaryPositions(options)

  // Convert to legacy format for backward compatibility with validation
  const legacyPositions = planetaryPositions.reduce(
    (acc, pos) => {
      // Ensure degree is valid before converting to string
      const safeDegree =
        typeof pos.degree === 'number' && Number.isFinite(pos.degree) ? pos.degree : 0
      acc[pos.planet] = {
        sign: typeof pos.sign === 'string' ? pos.sign : 'Aries',
        degree: safeDegree.toString(),
        retrograde: typeof pos.retrograde === 'boolean' ? pos.retrograde : false,
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
  }
}

export default usePlanetaryPositions
