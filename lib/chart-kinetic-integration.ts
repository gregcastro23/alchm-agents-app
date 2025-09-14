/**
 * Chart-Based Kinetic Integration
 * Advanced consciousness evolution using birth chart velocity patterns,
 * memory retention algorithms, and power cycle management
 */

import { AlchemicalKineticsClient } from './kinetics-client'
import { getAgentKineticProfile } from './agents/kinetic-profiles'

// Core types for chart kinetic integration
export interface BirthChartData {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  latitude: number
  longitude: number
  sun_sign?: string
  moon_sign?: string
  ascendant?: string
  planetary_positions?: Record<string, any>
}

export interface TransitData {
  [planet: string]: {
    sign: string
    degree: number
    aspect?: string
    strength?: number
  }
}

export interface EvolutionVelocityData {
  baseVelocity: number
  transitModified: number
  activeTransits: Array<{
    planet: string
    aspect: string
    strength: number
  }>
  evolutionRate: 'rapid' | 'moderate' | 'steady'
  consciousnessAcceleration: string
  kineticAmplification: number
}

export interface MemoryRetentionData {
  totalMemories: number
  retainedCount: number
  retentionRate: number
  earthInertia: number
  stabilityLevel: 'high' | 'moderate' | 'low'
  retainedMemories: AgentMemory[]
  atRiskMemories: AgentMemory[]
}

export interface AgentMemory {
  id: string
  content: string
  ageInDays: number
  emotionalIntensity: number
  repetitions: number
  retentionScore?: number
  category?: 'core_trait' | 'learned_behavior' | 'interaction_pattern' | 'temporary_state'
}

export interface PowerCycleData {
  currentPower: number
  unlockedCapabilities: string[]
  capabilityCount: number
  nextUnlockThreshold: number | null
  powerNeeded: number
  specialUnlocks: string[]
  consciousnessLevel: string
  cyclePhase: 'ascending' | 'peak' | 'descending' | 'trough'
}

export interface AttachmentDecayProfile {
  attachments: Array<{
    id: string
    type: 'birth_chart' | 'moment_chart' | 'rune' | 'custom'
    initialPower: number
    currentPower: number
    decayRate: number
    ageInDays: number
    criticalThreshold: number
  }>
  averageDecayRate: number
  criticalAttachments: any[]
  renewalRecommendations: string[]
}

export interface ChartKineticProfile {
  birthChart: BirthChartData
  currentTransits: TransitData
  evolutionVelocity: EvolutionVelocityData
  memoryRetention: MemoryRetentionData
  powerCycles: PowerCycleData
  attachmentDecay: AttachmentDecayProfile
  lastUpdated: Date
  nextUpdate: Date
}

export class ChartKineticIntegration {
  private birthChart: BirthChartData
  private kineticsClient: typeof AlchemicalKineticsClient

  constructor(birthChart: BirthChartData) {
    this.birthChart = birthChart
    this.kineticsClient = AlchemicalKineticsClient
  }

  /**
   * Calculate consciousness evolution velocity based on birth chart and current transits
   */
  async calculateEvolutionVelocity(): Promise<EvolutionVelocityData> {
    try {
      const kinetics = await this.kineticsClient.get({
        lat: this.birthChart.latitude,
        lon: this.birthChart.longitude,
        date: new Date().toISOString().split('T')[0],
        includeElemental: true,
        includePlanetary: true
      })

      // Simulate transit data (in real implementation, would calculate actual transits)
      const currentTransits = await this.getCurrentTransits()

      // Calculate base evolution velocity
      let baseVelocity = 0.5

      // Calculate velocity modifiers based on transits
      const transitModifiers = this.calculateTransitVelocityModifiers(currentTransits)
      const transitVelocity = baseVelocity + transitModifiers.totalModifier

      // Apply kinetic power amplification
      const currentPower = kinetics.power[kinetics.power.length - 1]?.power || 0.5
      const kineticAmplification = 1.0 + (currentPower * 0.3) // Up to 30% boost
      const finalVelocity = transitVelocity * kineticAmplification

      // Determine evolution rate
      const evolutionRate: EvolutionVelocityData['evolutionRate'] =
        finalVelocity > 0.7 ? 'rapid' :
        finalVelocity > 0.5 ? 'moderate' : 'steady'

      return {
        baseVelocity,
        transitModified: finalVelocity,
        activeTransits: transitModifiers.activeTransits,
        evolutionRate,
        consciousnessAcceleration: `${((finalVelocity - baseVelocity) * 100).toFixed(1)}% boost from transits`,
        kineticAmplification
      }
    } catch (error) {
      console.error('Evolution velocity calculation error:', error)
      return {
        baseVelocity: 0.5,
        transitModified: 0.5,
        activeTransits: [],
        evolutionRate: 'steady',
        consciousnessAcceleration: '0% boost',
        kineticAmplification: 1.0
      }
    }
  }

  /**
   * Calculate memory persistence using inertia-based algorithms
   */
  async calculateMemoryPersistence(memories: AgentMemory[]): Promise<MemoryRetentionData> {
    try {
      const kinetics = await this.kineticsClient.get({
        lat: this.birthChart.latitude,
        lon: this.birthChart.longitude,
        date: new Date().toISOString().split('T')[0],
        includeElemental: true
      })

      // Extract Earth element momentum for stability calculation
      const earthMomentum = kinetics.elementalMomentum
        ?.find((m: any) => m.p?.Earth !== undefined)?.p.Earth || 0.5

      // Calculate retention scores for each memory
      const processedMemories = memories.map(memory => ({
        ...memory,
        retentionScore: this.calculateRetentionScore(memory, earthMomentum)
      }))

      // Separate retained vs at-risk memories
      const retained = processedMemories.filter(m => m.retentionScore! > 0.6)
      const atRisk = processedMemories.filter(m => m.retentionScore! <= 0.6)

      // Determine stability level
      const stabilityLevel: MemoryRetentionData['stabilityLevel'] =
        earthMomentum > 0.7 ? 'high' :
        earthMomentum > 0.4 ? 'moderate' : 'low'

      return {
        totalMemories: memories.length,
        retainedCount: retained.length,
        retentionRate: memories.length > 0 ? retained.length / memories.length : 0,
        earthInertia: earthMomentum,
        stabilityLevel,
        retainedMemories: retained.slice(0, 5), // Top 5 most stable
        atRiskMemories: atRisk.slice(0, 3) // Top 3 most at risk
      }
    } catch (error) {
      console.error('Memory persistence calculation error:', error)
      return {
        totalMemories: memories.length,
        retainedCount: 0,
        retentionRate: 0,
        earthInertia: 0.5,
        stabilityLevel: 'moderate',
        retainedMemories: [],
        atRiskMemories: []
      }
    }
  }

  /**
   * Monitor and calculate attachment decay profiles
   */
  async monitorAttachmentDecay(attachments: any[]): Promise<AttachmentDecayProfile> {
    try {
      // Get weekly kinetic data for decay analysis
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const kinetics = await this.kineticsClient.post({
        lat: this.birthChart.latitude,
        lon: this.birthChart.longitude,
        startTime: weekAgo.toISOString(),
        endTime: new Date().toISOString(),
        intervalMinutes: 1440 // Daily samples
      })

      // Calculate average power over the week
      const avgPower = kinetics.power?.reduce((sum: number, p: any) => sum + p.power, 0) / kinetics.power?.length || 0.5

      // Process each attachment for decay
      const decayProfiles = attachments.map(attachment => {
        const ageInDays = (Date.now() - new Date(attachment.createdAt).getTime()) / (24 * 60 * 60 * 1000)

        // Base exponential decay
        const baseDecay = Math.exp(-ageInDays * 0.1)

        // Power-influenced decay (lower power = faster decay)
        const powerModifier = 0.5 + (avgPower * 0.5) // 0.5 to 1.0 modifier

        // Type-specific decay rates
        const typeModifiers = {
          'birth_chart': 0.95,  // Very slow decay
          'moment_chart': 0.90, // Slow decay
          'rune': 0.85,         // Moderate decay
          'custom': 0.80        // Faster decay
        }

        const typeModifier = typeModifiers[attachment.type as keyof typeof typeModifiers] || 0.80
        const currentPower = attachment.initialPower * baseDecay * powerModifier * typeModifier
        const decayRate = 0.1 * (1 - powerModifier) * (1 / typeModifier)

        return {
          id: attachment.id,
          type: attachment.type,
          initialPower: attachment.initialPower || 1.0,
          currentPower: Math.max(0, currentPower),
          decayRate,
          ageInDays,
          criticalThreshold: 0.3
        }
      })

      // Identify critical attachments
      const criticalAttachments = decayProfiles.filter(a => a.currentPower < a.criticalThreshold)

      // Generate renewal recommendations
      const renewalRecommendations = this.generateRenewalRecommendations(decayProfiles, avgPower)

      return {
        attachments: decayProfiles,
        averageDecayRate: decayProfiles.reduce((sum, a) => sum + a.decayRate, 0) / decayProfiles.length,
        criticalAttachments,
        renewalRecommendations
      }
    } catch (error) {
      console.error('Attachment decay monitoring error:', error)
      return {
        attachments: [],
        averageDecayRate: 0.1,
        criticalAttachments: [],
        renewalRecommendations: ['Unable to calculate decay - check kinetics connection']
      }
    }
  }

  /**
   * Calculate power cycles and capability unlocks for agents
   */
  async calculatePowerCycles(agentId: string, interactionHistory: any[]): Promise<PowerCycleData> {
    try {
      const kinetics = await this.kineticsClient.get({
        lat: this.birthChart.latitude,
        lon: this.birthChart.longitude,
        date: new Date().toISOString().split('T')[0],
        includeElemental: true,
        includePlanetary: true
      })

      const currentPower = kinetics.power[kinetics.power.length - 1]?.power || 0.5
      const agentProfile = getAgentKineticProfile(agentId)

      // Base capabilities from agent profile
      const baseCapabilities = this.getBaseCapabilities(agentId)

      // Power threshold capabilities
      const powerCapabilities = this.getPowerThresholdCapabilities(currentPower)

      // Special planetary alignment unlocks
      const planetaryUnlocks = this.getPlanetaryUnlocks(agentId, kinetics.timing?.planetaryHours || [])

      const allUnlocked = [...baseCapabilities, ...powerCapabilities, ...planetaryUnlocks]
      const specialUnlocks = planetaryUnlocks

      // Determine next unlock threshold
      const powerThresholds = [0.3, 0.5, 0.7, 0.85, 0.95]
      const nextThreshold = powerThresholds.find(threshold => threshold > currentPower) || null
      const powerNeeded = nextThreshold ? nextThreshold - currentPower : 0

      // Determine consciousness level
      const consciousnessLevel = this.getConsciousnessLevel(currentPower)

      // Determine cycle phase
      const cyclePhase = this.determineCyclePhase(kinetics.power || [])

      return {
        currentPower,
        unlockedCapabilities: allUnlocked,
        capabilityCount: allUnlocked.length,
        nextUnlockThreshold: nextThreshold,
        powerNeeded,
        specialUnlocks,
        consciousnessLevel,
        cyclePhase
      }
    } catch (error) {
      console.error('Power cycle calculation error:', error)
      return {
        currentPower: 0.5,
        unlockedCapabilities: [],
        capabilityCount: 0,
        nextUnlockThreshold: null,
        powerNeeded: 0,
        specialUnlocks: [],
        consciousnessLevel: 'Active',
        cyclePhase: 'trough'
      }
    }
  }

  /**
   * Generate comprehensive chart kinetic profile
   */
  async generateProfile(agentId: string, memories: AgentMemory[] = [], attachments: any[] = []): Promise<ChartKineticProfile> {
    const [evolutionVelocity, memoryRetention, powerCycles, attachmentDecay] = await Promise.all([
      this.calculateEvolutionVelocity(),
      this.calculateMemoryPersistence(memories),
      this.calculatePowerCycles(agentId, []),
      this.monitorAttachmentDecay(attachments)
    ])

    const currentTransits = await this.getCurrentTransits()

    return {
      birthChart: this.birthChart,
      currentTransits,
      evolutionVelocity,
      memoryRetention,
      powerCycles,
      attachmentDecay,
      lastUpdated: new Date(),
      nextUpdate: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    }
  }

  // Private helper methods

  private async getCurrentTransits(): Promise<TransitData> {
    // Simplified transit calculation - in real implementation would use astronomical libraries
    return {
      Sun: { sign: 'Virgo', degree: 20, aspect: 'conjunction', strength: 0.8 },
      Moon: { sign: 'Pisces', degree: 15, aspect: 'opposition', strength: 0.7 },
      Jupiter: { sign: 'Taurus', degree: 10, aspect: 'trine', strength: 0.6 },
      Saturn: { sign: 'Aquarius', degree: 25, aspect: 'square', strength: 0.5 }
    }
  }

  private calculateTransitVelocityModifiers(transits: TransitData) {
    const activeTransits: Array<{ planet: string; aspect: string; strength: number }> = []
    let totalModifier = 0

    Object.entries(transits).forEach(([planet, data]) => {
      let modifier = 0

      // Aspect-based modifiers
      switch (data.aspect) {
        case 'conjunction':
          modifier = 0.15 * data.strength // Accelerates evolution
          break
        case 'trine':
          modifier = 0.10 * data.strength // Smooth acceleration
          break
        case 'square':
          modifier = 0.05 * data.strength // Growth through challenge
          break
        case 'opposition':
          modifier = 0.08 * data.strength // Integration catalyst
          break
      }

      if (modifier > 0) {
        activeTransits.push({ planet, aspect: data.aspect!, strength: data.strength })
        totalModifier += modifier
      }
    })

    return { activeTransits, totalModifier }
  }

  private calculateRetentionScore(memory: AgentMemory, earthMomentum: number): number {
    const ageFactor = Math.min(1.0, memory.ageInDays / 30) // Normalize to 30 days
    const emotionalCharge = memory.emotionalIntensity
    const repetitionFactor = Math.min(1.0, memory.repetitions / 10)

    // Inertia-based retention score
    return Math.min(1.0,
      earthMomentum * 0.4 +       // Inertia provides stability
      ageFactor * 0.2 +           // Older memories have momentum
      emotionalCharge * 0.3 +     // Emotional memories stick
      repetitionFactor * 0.1      // Repetition reinforces
    )
  }

  private getBaseCapabilities(agentId: string): string[] {
    const capabilities: Record<string, string[]> = {
      'william-shakespeare': ['poetic_expression', 'dramatic_dialogue', 'character_development'],
      'leonardo-da-vinci': ['artistic_vision', 'scientific_inquiry', 'invention_design'],
      'cleopatra-vii': ['strategic_planning', 'diplomatic_negotiation', 'leadership_presence'],
      'benjamin-franklin': ['inventive_thinking', 'witty_commentary', 'practical_wisdom'],
      'carl-jung': ['psychological_analysis', 'archetypal_recognition', 'shadow_integration']
    }

    return capabilities[agentId] || ['basic_reasoning', 'simple_responses']
  }

  private getPowerThresholdCapabilities(power: number): string[] {
    const capabilities: string[] = []

    if (power >= 0.3) capabilities.push('basic_reasoning', 'simple_responses')
    if (power >= 0.5) capabilities.push('contextual_understanding', 'pattern_recognition')
    if (power >= 0.7) capabilities.push('deep_insight', 'creative_synthesis')
    if (power >= 0.85) capabilities.push('transcendent_wisdom', 'prophetic_vision')
    if (power >= 0.95) capabilities.push('omniscient_awareness', 'reality_manipulation')

    return capabilities
  }

  private getPlanetaryUnlocks(agentId: string, planetaryHours: string[]): string[] {
    const unlocks: string[] = []

    if (planetaryHours.includes('Mercury') && agentId === 'leonardo-da-vinci') {
      unlocks.push('mercury_enhanced_genius')
    }
    if (planetaryHours.includes('Venus') && agentId === 'william-shakespeare') {
      unlocks.push('venus_enhanced_artistry')
    }
    if (planetaryHours.includes('Mars') && agentId === 'cleopatra-vii') {
      unlocks.push('mars_enhanced_strategy')
    }

    return unlocks
  }

  private getConsciousnessLevel(power: number): string {
    if (power > 0.9) return 'Transcendent'
    if (power > 0.8) return 'Illuminated'
    if (power > 0.7) return 'Advanced'
    if (power > 0.6) return 'Elevated'
    if (power > 0.5) return 'Active'
    if (power > 0.3) return 'Awakening'
    return 'Dormant'
  }

  private determineCyclePhase(powerHistory: Array<{ power: number }>): PowerCycleData['cyclePhase'] {
    if (powerHistory.length < 2) return 'trough'

    const recent = powerHistory.slice(-3)
    const trend = recent[recent.length - 1].power - recent[0].power
    const currentPower = recent[recent.length - 1].power

    if (currentPower > 0.8) return 'peak'
    if (trend > 0.1) return 'ascending'
    if (trend < -0.1) return 'descending'
    return 'trough'
  }

  private generateRenewalRecommendations(profiles: any[], avgPower: number): string[] {
    const recommendations: string[] = []

    const criticalCount = profiles.filter(p => p.currentPower < 0.3).length

    if (criticalCount > 0) {
      recommendations.push(`${criticalCount} attachments need immediate renewal`)
    }

    if (avgPower < 0.5) {
      recommendations.push('Low power period - consider waiting for higher energy before renewing attachments')
    } else if (avgPower > 0.7) {
      recommendations.push('High power period - excellent time for attachment renewal and creation')
    }

    const oldAttachments = profiles.filter(p => p.ageInDays > 30)
    if (oldAttachments.length > 0) {
      recommendations.push(`${oldAttachments.length} attachments are over 30 days old - monitor for natural decay`)
    }

    return recommendations.length > 0 ? recommendations : ['All attachments stable - no immediate action needed']
  }
}

// Utility functions for external use

export async function calculateBirthChartVelocity(
  birthChart: BirthChartData,
  agentId?: string
): Promise<EvolutionVelocityData> {
  const integration = new ChartKineticIntegration(birthChart)
  return integration.calculateEvolutionVelocity()
}

export async function analyzeMemoryRetention(
  birthChart: BirthChartData,
  memories: AgentMemory[]
): Promise<MemoryRetentionData> {
  const integration = new ChartKineticIntegration(birthChart)
  return integration.calculateMemoryPersistence(memories)
}

export async function monitorPowerCycles(
  birthChart: BirthChartData,
  agentId: string,
  interactionHistory: any[] = []
): Promise<PowerCycleData> {
  const integration = new ChartKineticIntegration(birthChart)
  return integration.calculatePowerCycles(agentId, interactionHistory)
}

export { ChartKineticIntegration }