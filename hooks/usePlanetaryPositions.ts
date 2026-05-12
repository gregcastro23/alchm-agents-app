// Unified hook for consistent planetary positions across all components
// Enhanced with Chrome DevTools MCP integration and backend API calls
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  defaultAlchemicalMCPConfig,
  validateTokenEquilibrium,
} from '@/test/alchemical-devtools/mcp-config'
import {
  getPlanetaryPositionsAction,
  getAlchemicalQuantitiesAction,
} from '@/lib/actions/backend-actions'

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
  useApi?: boolean // Use API endpoint vs direct calculation, default true
  retryAttempts?: number // Number of retry attempts, default 3
}

const DEFAULT_OPTIONS: Required<UsePlanetaryPositionsOptions> = {
  refreshInterval: 30000, // 30 seconds
  useApi: true, // Use API endpoint by default for consistency
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

  const fetchPlanetaryData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      const [posData, alchmData] = await Promise.all([
        getPlanetaryPositionsAction(),
        getAlchemicalQuantitiesAction(true),
      ])

      if ((posData as any).error) throw new Error((posData as any).error)
      if ((alchmData as any).error) throw new Error((alchmData as any).error)

      const planetaryPositions: PlanetaryPosition[] = Object.entries(
        (posData as any)?.planetary_positions || {}
      ).map(([name, body]: [string, any]) => ({
        planet: name,
        sign: body?.sign ?? '',
        degree: typeof body?.degree === 'number' ? body.degree : 0,
        retrograde: Boolean(body?.isRetrograde),
      }))

      const alchmQuantities: AlchemicalQuantities = {
        spirit: Number((alchmData as any)?.spirit_score ?? 0),
        essence: Number((alchmData as any)?.essence_score ?? 0),
        matter: Number((alchmData as any)?.matter_score ?? 0),
        substance: Number((alchmData as any)?.substance_score ?? 0),
        Heat: Number((alchmData as any)?.Heat ?? 0),
        Entropy: Number((alchmData as any)?.Entropy ?? 0),
        Reactivity: Number((alchmData as any)?.Reactivity ?? 0),
        Energy: Number((alchmData as any)?.Energy ?? 0),
      }

      setData({
        timestamp: new Date().toISOString(),
        planetaryPositions,
        alchmQuantities,
        monicaConstant: Number((alchmData as any)?.['A-Number'] ?? 0),
        loading: false,
        error: null,
        lastUpdated: new Date(),
      })
    } catch (error) {
      console.error('usePlanetaryPositions: Error:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [])

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchPlanetaryData()
  }, [fetchPlanetaryData])

  // Initial fetch
  useEffect(() => {
    fetchPlanetaryData()
  }, [fetchPlanetaryData])

  return {
    ...data,
    refresh,
  }
}

// Helper hook for legacy components that just need positions
export function usePlanetaryPositionsOnly(options: UsePlanetaryPositionsOptions = {}) {
  const { planetaryPositions, loading, error, refresh } = usePlanetaryPositions(options)

  // Convert to legacy format for backward compatibility with validation
  const legacyPositions =
    planetaryPositions?.reduce(
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
    ) || {}

  return {
    positions: legacyPositions,
    loading,
    error,
    refresh,
  }
}

export default usePlanetaryPositions
