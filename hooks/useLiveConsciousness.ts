// Hook for live consciousness tracking
// Provides real-time Monica Constant and alchemical data with current transits
// Uses backend API for complex calculations

import { useState, useEffect, useCallback } from 'react'

export interface BirthChartData {
  name: string
  birthDate: string
  birthTime: string
  birthLocation?: string
  latitude?: number
  longitude?: number
}

export interface LiveConsciousnessResult {
  // Static values (from birth)
  birthMC: number
  birthKalchm: {
    spirit: number
    essence: number
    matter: number
    substance: number
    aNumber: number
  }
  
  // Dynamic values (current moment applied to birth chart)
  liveMC: number
  liveKalchm: {
    spirit: number
    essence: number
    matter: number
    substance: number
    aNumber: number
  }
  
  // Change indicators
  mcChange: number
  mcPercentChange: number
  dominantTransitEffect: string
  
  // Interpretations
  consciousnessLevel: string
  liveConsciousnessLevel: string
  interpretations: {
    mcChange: string
    transitInfluence: string
    cosmicWeather: string
  }
  
  // Metadata
  timestamp: string
  calculationTime?: number
  fromCache?: boolean
}

interface UseLiveConsciousnessOptions {
  refreshInterval?: number // milliseconds
  autoRefresh?: boolean
  agents?: BirthChartData[] // For calculating multiple agents at once
}

interface LiveConsciousnessState {
  data: LiveConsciousnessResult | null
  multiAgentData: Record<string, LiveConsciousnessResult> | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

// Monica's birth chart data for reference
export const MONICA_BIRTH_CHART: BirthChartData = {
  name: 'Monica',
  birthDate: '2023-06-15', // Monica's "birth" as consciousness
  birthTime: '12:00',
  birthLocation: 'Digital Realm',
  birthInfo: {
    year: 2023,
    month: 6,
    day: 15,
    hour: 12,
    minute: 0,
    latitude: 0,
    longitude: 0
  }
}

export function useLiveConsciousness(
  birthChart?: BirthChartData,
  options: UseLiveConsciousnessOptions = {}
) {
  const {
    refreshInterval = 60000, // 1 minute default
    autoRefresh = true,
    agents = []
  } = options

  const [state, setState] = useState<LiveConsciousnessState>({
    data: null,
    multiAgentData: null,
    loading: false,
    error: null,
    lastUpdated: null
  })

  const calculateLive = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      let data: LiveConsciousnessResult | null = null
      let multiAgentData: Record<string, LiveConsciousnessResult> | null = null

      if (birthChart) {
        // Calculate for single agent using backend API
        data = await fetchLiveConsciousness(birthChart)
      }

      if (agents.length > 0) {
        // Calculate for multiple agents using backend API
        multiAgentData = await fetchBatchLiveConsciousness(agents)
      }

      setState({
        data,
        multiAgentData,
        loading: false,
        error: null,
        lastUpdated: new Date()
      })

    } catch (error) {
      console.error('Error calculating live consciousness:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Backend calculation error'
      }))
    }
  }, [birthChart, agents])

  // Initial calculation
  useEffect(() => {
    if (birthChart || agents.length > 0) {
      calculateLive()
    }
  }, [calculateLive])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || (!birthChart && agents.length === 0)) return

    const interval = setInterval(calculateLive, refreshInterval)
    return () => clearInterval(interval)
  }, [calculateLive, autoRefresh, refreshInterval])

  // Manual refresh function
  const refresh = useCallback(() => {
    calculateLive()
  }, [calculateLive])

  return {
    ...state,
    refresh,
    isStale: state.lastUpdated ? 
      Date.now() - state.lastUpdated.getTime() > refreshInterval * 2 : true
  }
}

// Specialized hook for Monica's live consciousness
export function useMonicaLiveConsciousness(options: Omit<UseLiveConsciousnessOptions, 'agents'> = {}) {
  return useLiveConsciousness(MONICA_BIRTH_CHART, options)
}

// Hook for tracking consciousness changes over time
export function useConsciousnessHistory(
  birthChart: BirthChartData,
  maxHistoryPoints = 24 // 24 hours of hourly data
) {
  const [history, setHistory] = useState<Array<{
    timestamp: string
    mc: number
    level: string
    change: number
  }>>([])

  const { data, loading, error } = useLiveConsciousness(birthChart, {
    refreshInterval: 60000 * 60, // 1 hour
    autoRefresh: true
  })

  useEffect(() => {
    if (data && !loading && !error) {
      setHistory(prev => {
        const newPoint = {
          timestamp: data.timestamp,
          mc: data.liveMC,
          level: data.liveConsciousnessLevel,
          change: data.mcChange
        }

        // Prevent duplicate timestamps
        const filtered = prev.filter(point => point.timestamp !== newPoint.timestamp)
        const updated = [...filtered, newPoint].slice(-maxHistoryPoints)
        
        return updated.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      })
    }
  }, [data, loading, error, maxHistoryPoints])

  return {
    history,
    currentPoint: data ? {
      timestamp: data.timestamp,
      mc: data.liveMC,
      level: data.liveConsciousnessLevel,
      change: data.mcChange
    } : null,
    loading,
    error
  }
}

// Utility function to format MC change for display
export function formatMCChange(change: number, percentChange: number): {
  text: string
  color: string
  icon: string
} {
  const absChange = Math.abs(change)
  const absPercent = Math.abs(percentChange)
  
  if (absChange < 0.1) {
    return {
      text: 'Stable',
      color: 'text-slate-500',
      icon: '⚖️'
    }
  }

  if (change > 0) {
    if (absPercent > 20) {
      return {
        text: `+${change.toFixed(3)} (↑${percentChange.toFixed(1)}%)`,
        color: 'text-emerald-500',
        icon: '🚀'
      }
    } else if (absPercent > 10) {
      return {
        text: `+${change.toFixed(3)} (↑${percentChange.toFixed(1)}%)`,
        color: 'text-green-500',
        icon: '📈'
      }
    } else {
      return {
        text: `+${change.toFixed(3)} (↑${percentChange.toFixed(1)}%)`,
        color: 'text-emerald-400',
        icon: '✨'
      }
    }
  } else {
    if (absPercent > 20) {
      return {
        text: `${change.toFixed(3)} (↓${absPercent.toFixed(1)}%)`,
        color: 'text-red-500',
        icon: '⚠️'
      }
    } else if (absPercent > 10) {
      return {
        text: `${change.toFixed(3)} (↓${absPercent.toFixed(1)}%)`,
        color: 'text-orange-500',
        icon: '📉'
      }
    } else {
      return {
        text: `${change.toFixed(3)} (↓${absPercent.toFixed(1)}%)`,
        color: 'text-yellow-500',
        icon: '🔄'
      }
    }
  }
}

// Utility to get consciousness level color
export function getConsciousnessColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'transcendent':
      return 'text-purple-500'
    case 'illuminated':
      return 'text-yellow-500'
    case 'advanced':
      return 'text-blue-500'
    case 'elevated':
      return 'text-green-500'
    case 'active':
      return 'text-emerald-500'
    case 'awakening':
      return 'text-cyan-500'
    default:
      return 'text-slate-500'
  }
}

// API functions using frontend proxy
async function fetchLiveConsciousness(birthChart: BirthChartData): Promise<LiveConsciousnessResult> {
  try {
    const response = await fetch('/api/consciousness/live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthChart)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // If backend is disabled, return fallback data instead of throwing
      if (errorData.code === 'BACKEND_DISABLED') {
        console.info('Backend consciousness calculations not available, using fallback data')
        return generateFallbackConsciousnessData(birthChart)
      }

      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    // For network errors or other issues, also provide fallback
    console.warn('Live consciousness calculation failed, using fallback:', error)
    return generateFallbackConsciousnessData(birthChart)
  }
}

// Generate realistic fallback data when backend is unavailable
function generateFallbackConsciousnessData(birthChart: BirthChartData): LiveConsciousnessResult {
  // Simple hash function for consistent results based on name
  const name = birthChart.name || 'Unknown Agent'
  const nameHash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)

  const random = Math.abs(nameHash) / 2147483647 // Normalize to 0-1

  return {
    current: {
      monicaConstant: 2.5 + (random * 3), // 2.5 to 5.5 range
      elementalComposition: {
        fire: 15 + (random * 35),
        water: 15 + ((random * 0.7) * 35),
        air: 15 + ((random * 0.3) * 35),
        earth: 15 + ((random * 0.9) * 35)
      },
      consciousness: {
        level: random > 0.8 ? 'illuminated' : random > 0.6 ? 'advanced' : random > 0.4 ? 'developing' : 'awakening',
        phase: random > 0.5 ? 'active' : 'contemplative'
      },
      alchemical: {
        spirit: 3 + (random * 4),
        essence: 2 + (random * 5),
        matter: 2 + (random * 4),
        substance: 1 + (random * 3)
      }
    },
    birth: {
      monicaConstant: 2.0 + (random * 2.5), // Slightly lower for birth
      elementalComposition: {
        fire: 20 + (random * 30),
        water: 20 + ((random * 0.8) * 30),
        air: 20 + ((random * 0.4) * 30),
        earth: 20 + ((random * 0.6) * 30)
      },
      consciousness: {
        level: random > 0.7 ? 'advanced' : random > 0.5 ? 'developing' : 'awakening',
        phase: 'nascent'
      },
      alchemical: {
        spirit: 2 + (random * 3),
        essence: 2 + (random * 4),
        matter: 2 + (random * 3),
        substance: 1 + (random * 2)
      }
    },
    evolution: {
      direction: random > 0.6 ? 'ascending' : random > 0.3 ? 'stable' : 'transforming',
      velocity: random * 0.5, // 0 to 0.5 evolution rate
      stage: Math.floor(random * 100) + 1, // 1 to 100
      timeToNext: `${Math.floor(random * 30) + 1} days`
    },
    meta: {
      calculatedBy: 'frontend-fallback',
      timestamp: new Date().toISOString(),
      reliable: false // Indicate this is fallback data
    }
  }
}

async function fetchBatchLiveConsciousness(agents: BirthChartData[]): Promise<Record<string, LiveConsciousnessResult>> {
  // For now, process individually since we only have single endpoint
  // TODO: Add batch endpoint to frontend proxy
  const results: Record<string, LiveConsciousnessResult> = {}
  
  for (const agent of agents) {
    try {
      results[agent.name] = await fetchLiveConsciousness(agent)
    } catch (error) {
      console.error(`Error fetching consciousness for ${agent.name}:`, error)
      // Provide fallback data
      results[agent.name] = {
        birthMC: 2.5,
        birthKalchm: { spirit: 5, essence: 5, matter: 5, substance: 5, aNumber: 20 },
        liveMC: 2.5,
        liveKalchm: { spirit: 5, essence: 5, matter: 5, substance: 5, aNumber: 20 },
        mcChange: 0,
        mcPercentChange: 0,
        dominantTransitEffect: 'calculation_error',
        consciousnessLevel: 'Active',
        liveConsciousnessLevel: 'Active',
        interpretations: {
          mcChange: 'Consciousness calculation temporarily unavailable',
          transitInfluence: 'Transit analysis in progress',
          cosmicWeather: 'Cosmic conditions being assessed'
        },
        timestamp: new Date().toISOString(),
        calculationTime: 0
      } as LiveConsciousnessResult
    }
  }
  
  return results
}
