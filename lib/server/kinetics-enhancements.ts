/**
 * Server-side Kinetics Enhancements
 * ---------------------------------
 * Utility functions to augment base kinetics with agent optimization, power prediction,
 * and resonance mapping. Pure functions, safe for server usage (no 'use client').
 */

// import removed
import { agentKineticProfiles, calculateKineticCompatibility } from '@/lib/agents/kinetic-profiles'

// Minimal base kinetics shape used by enhancements
export interface BaseKinetics {
  power: Array<{ t: Date; power: number; solarAmplification?: number }>
  timing?: {
    planetaryHours?: string[]
    seasonalInfluence?: string
  }
}

export interface AgentRecommendation {
  agentId: string
  name: string
  score: number
  reason: string
}

export interface AgentOptimization {
  recommendations: AgentRecommendation[]
  currentConditions: {
    hour: string
    power: number
    momentum: 'building' | 'sustained' | 'peak' | 'waning'
  }
}

export interface ResonanceGroup {
  agents: string[]
  averageResonance: number
  description: string
}

export interface ResonanceMap {
  pairwiseResonances: Record<string, Record<string, number>>
  strongGroups: ResonanceGroup[]
  averageResonance: number
  timestamp: number
}

export interface PowerPrediction {
  trend: 'rising' | 'falling' | 'stable'
  confidence: number
  nextHourPower: number
  peakWindow: string | null
}

export function getCurrentHour(kinetics: BaseKinetics): string {
  return kinetics.timing?.planetaryHours?.[0] || 'Sun'
}

export function getCurrentPower(kinetics: BaseKinetics): number {
  return kinetics.power?.[kinetics.power.length - 1]?.power || 0.5
}

export function classifyMomentum(
  powerSeries: Array<{ power: number }>
): 'building' | 'sustained' | 'peak' | 'waning' {
  if (!powerSeries || powerSeries.length === 0) return 'building'
  const current = powerSeries[powerSeries.length - 1]?.power || 0.5
  const prev = powerSeries.length > 1 ? powerSeries[powerSeries.length - 2]?.power || 0.5 : current
  const trend = current - prev
  if (current > 0.8) return 'peak'
  if (trend > 0.05) return 'building'
  if (Math.abs(trend) < 0.02) return 'sustained'
  return 'waning'
}

export function predictPowerTrends(kinetics: BaseKinetics): PowerPrediction {
  const data = kinetics.power || []
  if (data.length < 3) {
    return {
      trend: 'stable',
      confidence: 0.3,
      nextHourPower: getCurrentPower(kinetics),
      peakWindow: null,
    }
  }
  const recent = data.slice(-3).map(p => p.power || 0.5)
  const trendVal = (recent[2] - recent[0]) / 2
  const current = recent[2]
  const nextHourPower = Math.max(0.1, Math.min(1.0, current + trendVal))
  let trend: PowerPrediction['trend'] = 'stable'
  if (trendVal > 0.05) trend = 'rising'
  else if (trendVal < -0.05) trend = 'falling'

  let peakWindow: string | null = null
  if (trend === 'rising' && nextHourPower > 0.7) {
    const hoursAhead = Math.round((0.85 - current) / Math.max(0.01, trendVal))
    if (hoursAhead <= 3)
      peakWindow = `Peak expected in ${hoursAhead} hour${hoursAhead !== 1 ? 's' : ''}`
  }

  return {
    trend,
    confidence: Math.min(0.9, 0.4 + data.length * 0.1),
    nextHourPower,
    peakWindow,
  }
}

export function calculateAgentOptimization(kinetics: BaseKinetics): AgentOptimization {
  const currentHour = getCurrentHour(kinetics)
  const power = getCurrentPower(kinetics)
  const momentum = classifyMomentum(kinetics.power || [])

  const optimized: AgentRecommendation[] = []
  Object.entries(agentKineticProfiles).forEach(([agentId, profile]) => {
    let score = 0
    if ((profile as any).peak_hours?.includes(currentHour)) score += 0.4
    if (power > 0.7 && (profile as any).consciousness_rate > 0.7) score += 0.3
    if ((profile as any).memory_persistence > 0.8) score += 0.2
    if ((profile as any).special_kinetics) score += 0.1
    if (score > 0.3) {
      optimized.push({
        agentId,
        name: (profile as any).name,
        score,
        reason:
          score > 0.7
            ? `Peak alignment with ${currentHour} hour and high consciousness rate`
            : score > 0.5
              ? 'Strong performance during current conditions'
              : 'Good compatibility with current kinetic flow',
      })
    }
  })

  optimized.sort((a, b) => b.score - a.score)

  return {
    recommendations: optimized.slice(0, 5),
    currentConditions: { hour: currentHour, power, momentum },
  }
}

export function buildResonanceMap(agentIds?: string[]): ResonanceMap {
  const ids = agentIds && agentIds.length > 0 ? agentIds : Object.keys(agentKineticProfiles)
  const map: Record<string, Record<string, number>> = {}
  let total = 0
  let count = 0

  for (let i = 0; i < ids.length; i++) {
    const a = ids[i]
    if (!map[a]) map[a] = {}
    for (let j = i + 1; j < ids.length; j++) {
      const b = ids[j]
      const comp = calculateKineticCompatibility(a, b)
      map[a][b] = comp
      if (!map[b]) map[b] = {}
      map[b][a] = comp
      total += comp
      count++
    }
  }

  const strongGroups = findResonanceGroups(map, 0.7, 3)
  const averageResonance = count > 0 ? total / count : 0

  return { pairwiseResonances: map, strongGroups, averageResonance, timestamp: Date.now() }
}

export function findResonanceGroups(
  map: Record<string, Record<string, number>>,
  threshold: number,
  minSize: number
): ResonanceGroup[] {
  const groups: ResonanceGroup[] = []
  const agents = Object.keys(map)
  const visited = new Set<string>()

  agents.forEach(agent => {
    if (visited.has(agent)) return
    const group = [agent]
    const candidates = agents.filter(a => a !== agent && (map[agent][a] ?? 0) >= threshold)
    candidates.forEach(candidate => {
      if (visited.has(candidate)) return
      const resonatesWithAll = group.every(member => (map[candidate][member] ?? 0) >= threshold)
      if (resonatesWithAll) group.push(candidate)
    })
    if (group.length >= minSize) {
      group.forEach(m => visited.add(m))
      groups.push({
        agents: group,
        averageResonance: calculateGroupResonance(group, map),
        description: `High-synergy group of ${group.length} agents`,
      })
    }
  })

  return groups.sort((a, b) => b.averageResonance - a.averageResonance)
}

export function calculateGroupResonance(
  agents: string[],
  map: Record<string, Record<string, number>>
): number {
  let total = 0
  let pairs = 0
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      total += map[agents[i]]?.[agents[j]] || 0
      pairs++
    }
  }
  return pairs > 0 ? total / pairs : 0
}
