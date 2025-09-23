'use client'

import { AlchemicalKineticsClient } from './kinetics-client'
import { getAgentKineticProfile, calculateKineticCompatibility } from './agents/kinetic-profiles'
import { routeTask } from './agents/router'
import { getCurrentPlanetaryPositions } from './calculate-transits'
import { dynamicAspectsEngine, type DynamicAspectsAnalysis } from './dynamic-aspects-engine'
import type { PlanetPosition } from './astrological-pattern-recognition'

// Central utilities for kinetics integration across the platform
export class KineticsIntegration {
  private static instance: KineticsIntegration
  private kineticCache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 120000 // 2 minutes

  static getInstance(): KineticsIntegration {
    if (!KineticsIntegration.instance) {
      KineticsIntegration.instance = new KineticsIntegration()
    }
    return KineticsIntegration.instance
  }

  // Get enhanced kinetic data with caching
  async getEnhancedKinetics(
    location: { lat: number; lon: number },
    options: {
      includeAgentOptimization?: boolean
      includePowerPrediction?: boolean
      includeResonanceMap?: boolean
    } = {}
  ): Promise<EnhancedKineticData> {
    const cacheKey = `${location.lat},${location.lon}-${JSON.stringify(options)}`
    const cached = this.kineticCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      // Get base kinetic data
      const kinetics = await AlchemicalKineticsClient.get({
        lat: location.lat,
        lon: location.lon,
        date: new Date().toISOString().split('T')[0],
        includeElemental: true,
        includePlanetary: true,
        window: 3,
      })

      let enhanced: EnhancedKineticData = {
        base: kinetics,
        currentPower: kinetics.power[kinetics.power.length - 1]?.power || 0.5,
        currentHour: kinetics.timing?.planetaryHours[0] || 'Sun',
        momentum: this.calculateMomentum(kinetics),
        velocity: this.calculateVelocity(kinetics),
        agentOptimization: options.includeAgentOptimization
          ? await this.calculateAgentOptimization(kinetics)
          : undefined,
        powerPrediction: options.includePowerPrediction
          ? this.predictPowerTrends(kinetics)
          : undefined,
        resonanceMap: options.includeResonanceMap
          ? await this.buildResonanceMap(kinetics)
          : undefined,
        timestamp: Date.now(),
      }

      // Aspect-modulated kinetics: applying/separating integration
      try {
        const aspectAnalysis = await this.getCurrentDynamicAspects()
        if (aspectAnalysis) {
          const { velocityModifier, powerModifier } =
            this.computeAspectKineticModifiers(aspectAnalysis)

          // Apply velocity modifier (cap to 1.0 to preserve scale)
          enhanced = {
            ...enhanced,
            velocity: Math.min(1.0, enhanced.velocity * velocityModifier),
            currentPower: Math.max(0, Math.min(1.0, enhanced.currentPower * powerModifier)),
            powerPrediction: enhanced.powerPrediction
              ? {
                  ...enhanced.powerPrediction,
                  nextHourPower: Math.max(
                    0.1,
                    Math.min(1.0, enhanced.powerPrediction.nextHourPower * powerModifier)
                  ),
                }
              : undefined,
          }
        }
      } catch (err) {
        console.warn('Aspect-modulated kinetics integration skipped:', err)
      }

      // Cache the result
      this.kineticCache.set(cacheKey, { data: enhanced, timestamp: Date.now() })
      return enhanced
    } catch (error) {
      console.error('Enhanced kinetics calculation error:', error)
      throw new Error('Failed to calculate enhanced kinetics')
    }
  }

  // Calculate current momentum based on power trends
  private calculateMomentum(kinetics: any): 'building' | 'sustained' | 'peak' | 'waning' {
    const powerData = kinetics.power || []
    if (powerData.length < 2) return 'building'

    const current = powerData[powerData.length - 1]?.power || 0.5
    const previous = powerData[powerData.length - 2]?.power || 0.5
    const trend = current - previous

    if (current > 0.8) return 'peak'
    if (trend > 0.05) return 'building'
    if (Math.abs(trend) < 0.02) return 'sustained'
    return 'waning'
  }

  // Calculate velocity based on elemental changes
  private calculateVelocity(kinetics: any): number {
    const elemental = kinetics.elemental || {}
    const mercury = elemental.mercury || 0
    const mars = elemental.mars || 0

    // Mercury principle: velocity of change
    // Mars principle: force behind change
    return Math.min(1.0, mercury * 0.7 + mars * 0.3)
  }

  /**
   * Build PlanetPosition[] for dynamic aspects using current calculated positions
   */
  private buildCurrentPlanetPositions(): PlanetPosition[] {
    const positions = getCurrentPlanetaryPositions()
    const entries = Object.entries(positions)
    const planets: PlanetPosition[] = []

    entries.forEach(([planet, data]) => {
      if (!data?.sign || typeof data.degree !== 'number') return
      planets.push({
        planet,
        sign: data.sign,
        degree: Math.max(0, Math.min(29.9999, data.degree)),
        house: 0,
        date: new Date(),
      })
    })

    return planets
  }

  /**
   * Get current dynamic aspects analysis (cached by engine)
   */
  private async getCurrentDynamicAspects(): Promise<DynamicAspectsAnalysis | null> {
    try {
      const planets = this.buildCurrentPlanetPositions()
      if (planets.length < 2) return null
      return await dynamicAspectsEngine.calculateDynamicAspects(planets, 7)
    } catch (e) {
      return null
    }
  }

  /**
   * Compute kinetic modifiers based on applying/exact/separating aspects
   * - Velocity: +up to 15% for applying (proximity-weighted), +25% at exact, gentle decay when separating
   * - Power: +20% within 3 days before exact, +25% at exact
   */
  private computeAspectKineticModifiers(analysis: DynamicAspectsAnalysis): {
    velocityModifier: number
    powerModifier: number
  } {
    const aspects = analysis.currentAspects || []

    const exactAspects = aspects.filter(a => (a as any).orb !== undefined && a.orb <= 1.0)
    const applyingAspects = aspects.filter(a => (a as any).applying)
    const separatingAspects = aspects.filter(a => (a as any).separating)

    // Defaults
    let velocityModifier = 1.0
    let powerModifier = 1.0

    if (exactAspects.length > 0) {
      velocityModifier = 1.25
      powerModifier = 1.25
      return { velocityModifier, powerModifier }
    }

    if (applyingAspects.length > 0) {
      // Proximity-weighted boost up to +15%
      const days = applyingAspects
        .map(a => Math.max(0, (a as any).daysToExact ?? Number.POSITIVE_INFINITY))
        .filter(v => Number.isFinite(v))
      const minDays = days.length > 0 ? Math.min(...days) : 7
      const proximityBoost = Math.max(0, (7 - minDays) / 7) * 0.15
      velocityModifier = 1.0 + proximityBoost

      // Power +20% if within 3 days of exact
      if (minDays <= 3) {
        powerModifier = 1.2
      }
    } else if (separatingAspects.length > 0) {
      // Gentle normalization with small residual boost up to +15% decaying with time
      const avgAbsOrbVel =
        separatingAspects.reduce((sum, a) => sum + Math.abs((a as any).orbVelocity || 0), 0) /
        separatingAspects.length
      const sepDays = Math.abs(avgAbsOrbVel * 30)
      const decayFactor = Math.max(0.05, Math.exp(-sepDays / 10))
      velocityModifier = 1.0 + 0.15 * decayFactor
      powerModifier = 1.0 // stabilized
    }

    return { velocityModifier, powerModifier }
  }

  // Find optimal agents for current kinetic conditions
  private async calculateAgentOptimization(kinetics: any): Promise<AgentOptimization> {
    const currentHour = kinetics.timing?.planetaryHours[0] || 'Sun'
    const power = kinetics.power[kinetics.power.length - 1]?.power || 0.5

    const agentProfiles = await import('./agents/kinetic-profiles')
    const profiles = agentProfiles.agentKineticProfiles

    const optimized: AgentRecommendation[] = []

    Object.entries(profiles).forEach(([agentId, profile]) => {
      let score = 0

      // Peak hour alignment
      if (profile.peak_hours.includes(currentHour)) {
        score += 0.4
      }

      // Power alignment
      if (power > 0.7 && profile.consciousness_rate > 0.7) {
        score += 0.3
      }

      // Memory persistence for complex tasks
      if (profile.memory_persistence > 0.8) {
        score += 0.2
      }

      // Special kinetics bonus
      if (profile.special_kinetics) {
        score += 0.1
      }

      if (score > 0.3) {
        optimized.push({
          agentId,
          name: profile.name,
          score,
          reason: this.getOptimizationReason(score, profile, currentHour),
        })
      }
    })

    // Sort by score and take top 5
    optimized.sort((a, b) => b.score - a.score)

    return {
      recommendations: optimized.slice(0, 5),
      currentConditions: {
        hour: currentHour,
        power,
        momentum: this.calculateMomentum(kinetics),
      },
    }
  }

  private getOptimizationReason(score: number, profile: any, hour: string): string {
    if (score > 0.7) {
      return `Peak alignment with ${hour} hour and high consciousness rate`
    } else if (score > 0.5) {
      return `Strong performance during current conditions`
    } else {
      return `Good compatibility with current kinetic flow`
    }
  }

  // Predict power trends for next 2 hours
  private predictPowerTrends(kinetics: any): PowerPrediction {
    const powerData = kinetics.power || []
    if (powerData.length < 3) {
      return {
        trend: 'stable',
        confidence: 0.3,
        nextHourPower: 0.5,
        peakWindow: null,
      }
    }

    // Simple linear regression for trend
    const recent = powerData.slice(-3).map(p => p.power || 0.5)
    const trend = (recent[2] - recent[0]) / 2
    const current = recent[2]

    const nextHourPower = Math.max(0.1, Math.min(1.0, current + trend))

    let trendLabel: 'rising' | 'falling' | 'stable' = 'stable'
    if (trend > 0.05) trendLabel = 'rising'
    else if (trend < -0.05) trendLabel = 'falling'

    // Predict peak window
    let peakWindow: string | null = null
    if (trendLabel === 'rising' && nextHourPower > 0.7) {
      const hoursAhead = Math.round((0.85 - current) / Math.max(0.01, trend))
      if (hoursAhead <= 3) {
        peakWindow = `Peak expected in ${hoursAhead} hour${hoursAhead !== 1 ? 's' : ''}`
      }
    }

    return {
      trend: trendLabel,
      confidence: Math.min(0.9, 0.4 + powerData.length * 0.1),
      nextHourPower,
      peakWindow,
    }
  }

  // Build agent resonance map for group dynamics
  private async buildResonanceMap(kinetics: any): Promise<ResonanceMap> {
    const agentProfiles = await import('./agents/kinetic-profiles')
    const profiles = agentProfiles.agentKineticProfiles

    const map: Record<string, Record<string, number>> = {}
    const agents = Object.keys(profiles)

    // Calculate pairwise resonances
    for (let i = 0; i < agents.length; i++) {
      map[agents[i]] = {}
      for (let j = i + 1; j < agents.length; j++) {
        const resonance = calculateKineticCompatibility(agents[i], agents[j])
        map[agents[i]][agents[j]] = resonance

        // Symmetric mapping
        if (!map[agents[j]]) map[agents[j]] = {}
        map[agents[j]][agents[i]] = resonance
      }
    }

    // Find strongest resonance groups (3+ agents with >70% compatibility)
    const strongGroups = this.findResonanceGroups(map, 0.7, 3)

    return {
      pairwiseResonances: map,
      strongGroups,
      averageResonance: this.calculateAverageResonance(map),
      timestamp: Date.now(),
    }
  }

  private findResonanceGroups(
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
      const candidates = agents.filter(
        a => a !== agent && map[agent][a] && map[agent][a] >= threshold
      )

      // Build connected group
      candidates.forEach(candidate => {
        if (visited.has(candidate)) return

        // Check if candidate resonates with all current group members
        const resonatesWithAll = group.every(
          member => map[candidate][member] && map[candidate][member] >= threshold
        )

        if (resonatesWithAll) {
          group.push(candidate)
        }
      })

      if (group.length >= minSize) {
        group.forEach(member => visited.add(member))

        const avgResonance = this.calculateGroupResonance(group, map)
        groups.push({
          agents: group,
          averageResonance: avgResonance,
          description: `High-synergy group of ${group.length} agents`,
        })
      }
    })

    return groups.sort((a, b) => b.averageResonance - a.averageResonance)
  }

  private calculateGroupResonance(
    agents: string[],
    map: Record<string, Record<string, number>>
  ): number {
    let totalResonance = 0
    let pairCount = 0

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        totalResonance += map[agents[i]][agents[j]] || 0
        pairCount++
      }
    }

    return pairCount > 0 ? totalResonance / pairCount : 0
  }

  private calculateAverageResonance(map: Record<string, Record<string, number>>): number {
    let total = 0
    let count = 0

    Object.values(map).forEach(agentMap => {
      Object.values(agentMap).forEach(resonance => {
        total += resonance
        count++
      })
    })

    return count > 0 ? total / count : 0
  }

  // Get kinetic enhancements for agent responses
  async getAgentEnhancements(
    agentId: string,
    location: { lat: number; lon: number }
  ): Promise<AgentEnhancements> {
    try {
      const profile = getAgentKineticProfile(agentId)
      if (!profile) {
        return { available: false, reason: 'No kinetic profile found' }
      }

      const kinetics = await this.getEnhancedKinetics(location)

      const enhancements: AgentEnhancements = {
        available: true,
        profile,
        currentAlignment: this.calculateCurrentAlignment(profile, kinetics),
        suggestedEnhancements: [],
        powerBoost: 1.0,
      }

      // Calculate power boost
      if (profile.peak_hours.includes(kinetics.currentHour)) {
        enhancements.powerBoost += 0.2 // 20% boost during peak hours
      }

      if (kinetics.currentPower > 0.7 && profile.consciousness_rate > 0.7) {
        enhancements.powerBoost += 0.15 // 15% boost for high consciousness during high power
      }

      // Suggested enhancements based on conditions
      if (kinetics.momentum === 'peak') {
        enhancements.suggestedEnhancements.push('enhanced_creativity')
        enhancements.suggestedEnhancements.push('deeper_insights')
      }

      if (profile.memory_persistence > 0.8) {
        enhancements.suggestedEnhancements.push('conversation_continuity')
      }

      if (profile.special_kinetics) {
        enhancements.suggestedEnhancements.push('personality_amplification')
      }

      return enhancements
    } catch (error) {
      console.error('Agent enhancement calculation error:', error)
      return {
        available: false,
        reason: 'Failed to calculate kinetic enhancements',
      }
    }
  }

  private calculateCurrentAlignment(profile: any, kinetics: EnhancedKineticData): number {
    let alignment = 0.5 // Base alignment

    // Peak hour alignment
    if (profile.peak_hours.includes(kinetics.currentHour)) {
      alignment += 0.3
    }

    // Power level alignment
    const powerDiff = Math.abs(profile.consciousness_rate - kinetics.currentPower)
    alignment += (1.0 - powerDiff) * 0.2

    return Math.min(1.0, Math.max(0.0, alignment))
  }

  // Clear cache (useful for testing or forced refresh)
  clearCache(): void {
    this.kineticCache.clear()
  }

  // Get cache statistics
  getCacheStats(): { size: number; oldest: number; newest: number } {
    const timestamps = Array.from(this.kineticCache.values()).map(v => v.timestamp)
    return {
      size: this.kineticCache.size,
      oldest: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newest: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    }
  }
}

// Types for enhanced kinetic data
export interface EnhancedKineticData {
  base: any
  currentPower: number
  currentHour: string
  momentum: 'building' | 'sustained' | 'peak' | 'waning'
  velocity: number
  agentOptimization?: AgentOptimization
  powerPrediction?: PowerPrediction
  resonanceMap?: ResonanceMap
  timestamp: number
}

export interface AgentOptimization {
  recommendations: AgentRecommendation[]
  currentConditions: {
    hour: string
    power: number
    momentum: string
  }
}

export interface AgentRecommendation {
  agentId: string
  name: string
  score: number
  reason: string
}

export interface PowerPrediction {
  trend: 'rising' | 'falling' | 'stable'
  confidence: number
  nextHourPower: number
  peakWindow: string | null
}

export interface ResonanceMap {
  pairwiseResonances: Record<string, Record<string, number>>
  strongGroups: ResonanceGroup[]
  averageResonance: number
  timestamp: number
}

export interface ResonanceGroup {
  agents: string[]
  averageResonance: number
  description: string
}

export interface AgentEnhancements {
  available: boolean
  reason?: string
  profile?: any
  currentAlignment?: number
  suggestedEnhancements?: string[]
  powerBoost?: number
}

// Convenience functions
export const kinetics = KineticsIntegration.getInstance()

export async function getKineticEnhancements(
  agentId: string,
  location: { lat: number; lon: number }
): Promise<AgentEnhancements> {
  return kinetics.getAgentEnhancements(agentId, location)
}

export async function getGroupKinetics(
  agentIds: string[],
  location: { lat: number; lon: number }
): Promise<{ resonances: Record<string, Record<string, number>>; harmony: number }> {
  const enhanced = await kinetics.getEnhancedKinetics(location, { includeResonanceMap: true })

  if (!enhanced.resonanceMap) {
    return { resonances: {}, harmony: 0 }
  }

  // Filter resonances for selected agents
  const filteredResonances: Record<string, Record<string, number>> = {}
  agentIds.forEach(agentId => {
    if (enhanced.resonanceMap!.pairwiseResonances[agentId]) {
      filteredResonances[agentId] = {}
      agentIds.forEach(otherAgentId => {
        if (
          agentId !== otherAgentId &&
          enhanced.resonanceMap!.pairwiseResonances[agentId][otherAgentId]
        ) {
          filteredResonances[agentId][otherAgentId] =
            enhanced.resonanceMap!.pairwiseResonances[agentId][otherAgentId]
        }
      })
    }
  })

  // Calculate group harmony
  let totalResonance = 0
  let pairCount = 0

  agentIds.forEach((agent1, i) => {
    agentIds.slice(i + 1).forEach(agent2 => {
      if (filteredResonances[agent1] && filteredResonances[agent1][agent2]) {
        totalResonance += filteredResonances[agent1][agent2]
        pairCount++
      }
    })
  })

  const harmony = pairCount > 0 ? totalResonance / pairCount : 0

  return { resonances: filteredResonances, harmony }
}

export default KineticsIntegration
