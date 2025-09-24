// Unified hook for consistent planetary positions across all components
// Enhanced with Chrome DevTools MCP integration and backend API calls
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { calculateMC } from '@/lib/monica/monica-constant-validator'
import { logPerformance } from '@/lib/structured-logger'
import {
  defaultAlchemicalMCPConfig,
  validateTokenEquilibrium,
  isTokenStable,
  calculateStabilizationAdjustment,
  type ElementalTokens
} from '@/testing/alchemical-devtools/mcp-config'
import { emergencyHandler, type AstrologicalEvent } from '@/utils/alchemical-emergency-handler'

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
  // MCP-enhanced fields for token stabilization
  mcpMetrics?: {
    tokenStability: 'stable' | 'warning' | 'critical'
    equilibrium: ReturnType<typeof validateTokenEquilibrium>
    performanceMetrics: {
      calculationTime: number
      tokenRecalculationTime: number
      aspectCalculationTime: number
      memoryUsage: number
    }
    lastStabilization?: Date
    stabilizationEvents: number
  }
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

  // MCP performance monitoring refs
  const lastTokenEquilibriumRef = useRef<ReturnType<typeof validateTokenEquilibrium> | null>(null)
  const stabilizationEventsRef = useRef(0)
  const lastStabilizationRef = useRef<Date | null>(null)
  const currentTokensRef = useRef<ElementalTokens>({ spirit: 0, essence: 0, matter: 0, substance: 0 })

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

        // MCP: Start performance monitoring for token calculations
        const tokenCalculationStart = performance.now()
        const aspectCalculationStart = performance.now()

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
          // Use backend API for planetary and alchemical calculations
          const timestamp = new Date().toISOString()

          // Call backend API for current planetary alchemy data
          const planetaryResponse = await fetch('/api/alchemy/current-planetary-alchemy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              timestamp: timestamp,
              location: null // Will use default location
            }),
            signal: abortControllerRef.current.signal,
          })

          if (!planetaryResponse.ok) {
            throw new Error(`Planetary API request failed: ${planetaryResponse.status}`)
          }

          const planetaryData = await planetaryResponse.json()

          if (!planetaryData.success) {
            throw new Error(planetaryData.error || 'Planetary alchemy calculation failed')
          }

          // Extract data from backend response
          const positions = planetaryData.data.planetaryPositions
          const alchm = planetaryData.data.alchemicalQuantities

          // MCP: Track API call performance (replaces aspect calculation time)
          const aspectCalculationTime = planetaryData.metadata.computeTime || 0

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

          // MCP: Track token recalculation performance
          const tokenRecalculationTime = performance.now() - tokenCalculationStart

          // MCP: Validate token equilibrium and stability
          const currentTokens: ElementalTokens = { spirit, essence, matter, substance }
          const currentEquilibrium = validateTokenEquilibrium(currentTokens)
          const tokenStability = !isTokenStable(currentTokens, defaultAlchemicalMCPConfig) ? 'critical' :
                                currentEquilibrium.overallHealth < 0.7 ? 'warning' : 'stable'

          // MCP: Monitor token fluctuations and apply stabilization if needed
          let stabilizedTokens = currentTokens
          let stabilizationApplied = false

          if (tokenStability === 'critical' && lastTokenEquilibriumRef.current) {
            const previousEquilibrium = lastTokenEquilibriumRef.current
            const healthChange = Math.abs(currentEquilibrium.overallHealth - previousEquilibrium.overallHealth)

            // Only apply stabilization for significant health changes (>10% change)
            if (healthChange > 0.1) {
              const adjustment = calculateStabilizationAdjustment(currentTokens, defaultAlchemicalMCPConfig)
              stabilizedTokens = {
                spirit: Math.max(0, spirit + (adjustment.spirit || 0)),
                essence: Math.max(0, essence + (adjustment.essence || 0)),
                matter: Math.max(0, matter + (adjustment.matter || 0)),
                substance: Math.max(0, substance + (adjustment.substance || 0))
              }
              stabilizationApplied = true
              stabilizationEventsRef.current++
              lastStabilizationRef.current = new Date()

              // Log stabilization event
              logPerformance('token_stabilization_applied', tokenRecalculationTime, {
                system: 'mcp',
                operation: 'stabilization',
                metadata: {
                  originalTokens: currentTokens,
                  adjustedTokens: stabilizedTokens,
                  equilibrium: currentEquilibrium,
                  imbalanceChange
                }
              })
            }
          }

          // Update equilibrium and token references for next comparison
          lastTokenEquilibriumRef.current = currentEquilibrium
          currentTokensRef.current = stabilizedTokens

          // MCP: Emergency monitoring for critical astrological events
          // In a real implementation, this would check for actual astrological events
          // For now, we'll simulate basic emergency monitoring
          const mockActiveEvents: AstrologicalEvent[] = [] // Would be populated by astrological calculation

          const emergencyResponse = emergencyHandler.monitorAndRespond(stabilizedTokens, mockActiveEvents)

          // Apply emergency adjustments if triggered
          if (emergencyResponse.emergency) {
            stabilizedTokens = emergencyResponse.adjustedTokens
            stabilizationEventsRef.current++
            lastStabilizationRef.current = new Date()
          }

          // Validate Monica Constant calculation inputs and result
          let monicaConstant = 0
          try {
            const mcResult = calculateMC(
              stabilizedTokens.spirit,
              stabilizedTokens.essence,
              stabilizedTokens.matter,
              stabilizedTokens.substance,
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
              spirit: stabilizedTokens.spirit,
              essence: stabilizedTokens.essence,
              matter: stabilizedTokens.matter,
              substance: stabilizedTokens.substance,
              Heat: safeAlchmValue(alchm?.['Heat']),
              Entropy: safeAlchmValue(alchm?.['Entropy']),
              Reactivity: safeAlchmValue(alchm?.['Reactivity']),
              Energy: safeAlchmValue(alchm?.['Energy']),
            },
            monicaConstant,
            loading: false,
            error: null,
            lastUpdated: new Date(),
            // MCP: Include performance and stabilization metrics
            mcpMetrics: {
              tokenStability,
              equilibrium: currentEquilibrium,
              performanceMetrics: {
                calculationTime: performance.now() - tokenCalculationStart,
                tokenRecalculationTime,
                aspectCalculationTime,
                memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
              },
              lastStabilization: lastStabilizationRef.current || undefined,
              stabilizationEvents: stabilizationEventsRef.current
            }
          }
        }

        // Update shared cache
        sharedCache.data = result
        sharedCache.lastFetch = now

        // Notify all subscribers
        sharedCache.subscribers.forEach(callback => callback())

        setData(result)
        retryCountRef.current = 0 // Reset retry count on success

        // Log successful fetch performance with MCP metrics
        logPerformance('planetary_positions_fetch_success', Date.now() - fetchStartTime, {
          system: 'hook',
          operation: 'fetch_success',
          metadata: {
            useApi: opts.useApi,
            cached: false,
            planetsCount: result.planetaryPositions.length,
            mcpMetrics: result.mcpMetrics
          }
        })

        // MCP: Log performance warnings if thresholds exceeded
        if (result.mcpMetrics) {
          const { performanceMetrics, tokenStability } = result.mcpMetrics
          const config = defaultAlchemicalMCPConfig.performanceThresholds

          if (performanceMetrics.calculationTime > config.maxCalculationTime) {
            logPerformance('token_calculation_performance_warning', performanceMetrics.calculationTime, {
              system: 'mcp',
              operation: 'performance_warning',
              metadata: {
                threshold: config.maxCalculationTime,
                actual: performanceMetrics.calculationTime,
                tokenStability
              }
            })
          }

          if (performanceMetrics.memoryUsage > config.maxMemoryUsage) {
            logPerformance('token_memory_usage_warning', performanceMetrics.memoryUsage, {
              system: 'mcp',
              operation: 'memory_warning',
              metadata: {
                threshold: config.maxMemoryUsage,
                actual: performanceMetrics.memoryUsage,
                tokenStability
              }
            })
          }
        }
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

  // MCP: Manual token stabilization function
  const stabilizeTokens = useCallback(() => {
    if (data.mcpMetrics?.tokenStability === 'critical') {
      stabilizationEventsRef.current++
      lastStabilizationRef.current = new Date()

      // Force a recalculation with stabilization
      fetchPlanetaryData(true)

      logPerformance('manual_token_stabilization_triggered', 0, {
        system: 'mcp',
        operation: 'manual_stabilization',
        metadata: {
          previousStability: data.mcpMetrics?.tokenStability,
          equilibrium: data.mcpMetrics?.equilibrium
        }
      })
    }
  }, [data.mcpMetrics, fetchPlanetaryData])

  // MCP: Get current MCP metrics for external monitoring
  const getMCPMetrics = useCallback(() => {
    return data.mcpMetrics
  }, [data.mcpMetrics])

  // MCP: Check if stabilization is needed
  const needsStabilization = useCallback(() => {
    return data.mcpMetrics?.tokenStability === 'critical' ||
           (data.mcpMetrics?.tokenStability === 'warning' &&
            data.mcpMetrics.equilibrium.overallHealth < 0.7)
  }, [data.mcpMetrics])

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
    // MCP-enhanced functions
    stabilizeTokens,
    getMCPMetrics,
    needsStabilization,
    mcpConfig: defaultAlchemicalMCPConfig,
    // Emergency monitoring functions
    getEmergencyStatus: () => emergencyHandler.getMonitoringStatus(),
    assessEmergency: (events: AstrologicalEvent[]) =>
      emergencyHandler.assessEmergency(currentTokensRef.current, events),
    getEmergencyAlerts: (upcomingEvents: AstrologicalEvent[]) =>
      emergencyHandler.getPredictiveAlerts(upcomingEvents),
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
