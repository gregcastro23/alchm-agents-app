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
  const response = await fetch('/api/consciousness/live', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(birthChart)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API error: ${response.status}`)
  }

  return response.json()
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
