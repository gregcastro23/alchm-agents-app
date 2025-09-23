import { logger } from '../utils/logger.js'
import { getPlanetaryHour, getCurrentPlanetaryPositions } from './planetary-service.js'
import { generateAlchmForCurrentMoment } from './alchemizer-service.js'

export interface KineticsData {
  power: Array<{
    hour: number
    power: number
    planetary: string
  }>
  timing: {
    planetaryHours: string[]
    seasonalInfluence: string
  }
  elemental: {
    totals: {
      Fire: number
      Water: number
      Air: number
      Earth: number
    }
  }
}

export interface AgentOptimization {
  recommendedAgents: string[]
  powerAmplification: number
  harmonyScore: number
}

export interface PowerPrediction {
  nextPeak: string
  trend: 'ascending' | 'stable' | 'descending'
  confidence: number
}

export interface GroupDynamics {
  harmony: number
  powerAmplification: number
  momentumFlow: 'accelerating' | 'sustained' | 'decelerating'
  resonances: Record<string, any>
  optimalConfiguration: {
    recommended: string[]
    alternativeArrangements: string[][]
  }
}

/**
 * Calculate enhanced kinetics with real planetary data
 */
export async function calculateEnhancedKinetics(
  location: { lat: number; lon: number },
  options: {
    includeAgentOptimization?: boolean
    includePowerPrediction?: boolean
    includeResonanceMap?: boolean
    agentIds?: string[]
  } = {}
): Promise<{
  base: KineticsData
  agentOptimization?: AgentOptimization
  powerPrediction?: PowerPrediction
  resonanceMap?: Record<string, any>
}> {
  try {
    const now = new Date()
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Calculate power for each hour of the day
    const powerData = []
    const planetaryHours = []

    for (let hour = 0; hour < 24; hour++) {
      const hourDate = new Date(now)
      hourDate.setHours(hour, 0, 0, 0)

      const planetaryHour = getPlanetaryHour(hourDate, location.lat)
      planetaryHours.push(planetaryHour)

      // Calculate power based on planetary ruler
      const basePower = getPlanetaryPower(planetaryHour)

      // Apply location-based modifiers
      const latitudeModifier = 1 + (Math.abs(location.lat) / 90) * 0.2
      const timeModifier = 1 + 0.3 * Math.sin((hour * Math.PI) / 12)

      const power = Math.min(1.0, basePower * latitudeModifier * timeModifier)

      powerData.push({
        hour,
        power: Math.round(power * 1000) / 1000,
        planetary: planetaryHour,
      })
    }

    // Get current seasonal influence
    const season = getSeasonalInfluence(dayOfYear)

    // Calculate elemental distribution
    const elementalTotals = calculateElementalDistribution(planetaryHours)

    const baseKinetics: KineticsData = {
      power: powerData,
      timing: {
        planetaryHours: [...new Set(planetaryHours)],
        seasonalInfluence: season,
      },
      elemental: {
        totals: elementalTotals,
      },
    }

    const result: any = { base: baseKinetics }

    // Add optional enhancements
    if (options.includeAgentOptimization) {
      result.agentOptimization = calculateAgentOptimization(elementalTotals, planetaryHours)
    }

    if (options.includePowerPrediction) {
      result.powerPrediction = calculatePowerPrediction(powerData, now)
    }

    if (options.includeResonanceMap && options.agentIds) {
      result.resonanceMap = calculateResonanceMap(options.agentIds, elementalTotals)
    }

    return result
  } catch (error) {
    logger.error('Error calculating enhanced kinetics:', error)
    throw error
  }
}

/**
 * Calculate group dynamics for multiple agents
 */
export function calculateGroupDynamics(
  agentIds: string[],
  location: { lat: number; lon: number }
): GroupDynamics {
  try {
    const groupSize = agentIds.length

    // Calculate elemental distribution for current time
    const now = new Date()
    const currentPlanet = getPlanetaryHour(now, location.lat)
    const planetaryPowers = agentIds.map(() => getPlanetaryPower(currentPlanet))

    // Calculate harmony based on agent count and planetary alignment
    const baseHarmony = 0.8
    const sizeModifier = Math.max(0.5, 1 - (groupSize - 2) * 0.1)
    const planetaryAlignment = planetaryPowers.reduce((sum, p) => sum + p, 0) / groupSize

    const harmony = Math.min(1.0, baseHarmony * sizeModifier * planetaryAlignment)

    // Calculate power amplification
    const powerAmplification = 1 + (harmony - 0.5) * 0.8

    // Determine momentum flow
    let momentumFlow: 'accelerating' | 'sustained' | 'decelerating'
    if (harmony > 0.8) momentumFlow = 'accelerating'
    else if (harmony > 0.6) momentumFlow = 'sustained'
    else momentumFlow = 'decelerating'

    // Calculate individual resonances
    const resonances: Record<string, any> = {}
    agentIds.forEach((agentId, index) => {
      // Use agent position in group for deterministic synergy variation
      const synergyModifier = 0.9 + (index / Math.max(groupSize - 1, 1)) * 0.1

      resonances[agentId] = {
        individualContribution: 0.4 + planetaryPowers[index] * 0.3,
        groupSynergy: harmony * synergyModifier,
      }
    })

    // Generate optimal configuration
    const optimalConfiguration = {
      recommended: agentIds.slice(0, Math.ceil(groupSize * 0.7)),
      alternativeArrangements: [[...agentIds].reverse(), [...agentIds].sort()],
    }

    return {
      harmony: Math.round(harmony * 1000) / 1000,
      powerAmplification: Math.round(powerAmplification * 1000) / 1000,
      momentumFlow,
      resonances,
      optimalConfiguration,
    }
  } catch (error) {
    logger.error('Error calculating group dynamics:', error)
    throw error
  }
}

/**
 * Calculate token-specific kinetics
 */
export function calculateTokenKinetics(
  baseTokenRate: number,
  baseNFTRarity: number,
  location: { lat: number; lon: number }
): any {
  try {
    const now = new Date()
    const timeOfDay = now.getHours()
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Get current planetary hour for kinetic calculation
    const currentPlanet = getPlanetaryHour(now, location.lat)
    const planetaryPower = getPlanetaryPower(currentPlanet)

    // Calculate kinetic multiplier based on planetary power
    const kineticMultiplier = 0.8 + planetaryPower * 0.6

    // Apply time-based variations
    const timeMultiplier = 1 + 0.3 * Math.sin((timeOfDay * Math.PI) / 12)
    const seasonalModifier = 1 + 0.15 * Math.sin((dayOfYear * 2 * Math.PI) / 365)
    const solarAmplification = 1 + 0.1 * Math.sin((timeOfDay * Math.PI) / 6)

    // Calculate current rate
    const currentRate = baseTokenRate * kineticMultiplier * timeMultiplier

    // Calculate power level
    const powerLevel = Math.min(1.0, (currentRate / baseTokenRate) * 0.7 + planetaryPower * 0.3)

    // Determine velocity and momentum
    const velocityIndicator =
      powerLevel > 0.7 ? 'accelerating' : powerLevel > 0.4 ? 'stable' : 'decelerating'
    const momentumPhase = powerLevel > 0.8 ? 'peak' : powerLevel > 0.6 ? 'building' : 'sustained'

    // Predict next optimal window
    const nextOptimalHours = Math.floor(3 + planetaryPower * 5)
    const nextOptimalWindow = new Date(
      now.getTime() + nextOptimalHours * 60 * 60 * 1000
    ).toISOString()

    // Accumulation forecast
    let accumulationForecast = 'Stable'
    if (kineticMultiplier > 1.2) accumulationForecast = 'Accelerating'
    else if (kineticMultiplier < 0.8) accumulationForecast = 'Declining'

    return {
      currentRate: Math.round(currentRate * 100) / 100,
      baseRate: baseTokenRate,
      kineticMultiplier: Math.round(kineticMultiplier * 1000) / 1000,
      velocityIndicator,
      momentumPhase,
      powerLevel: Math.round(powerLevel * 1000) / 1000,
      nextOptimalWindow,
      accumulationForecast,
      solarAmplification: Math.round(solarAmplification * 1000) / 1000,
      seasonalModifier: Math.round(seasonalModifier * 1000) / 1000,
      rarityBonus: baseNFTRarity * (1 + powerLevel * 0.3),
    }
  } catch (error) {
    logger.error('Error calculating token kinetics:', error)
    throw error
  }
}

// Helper functions

function getPlanetaryPower(planet: string): number {
  const powers: Record<string, number> = {
    Sun: 1.0,
    Moon: 0.7,
    Mars: 0.8,
    Mercury: 0.6,
    Jupiter: 0.9,
    Venus: 0.75,
    Saturn: 0.5,
  }
  return powers[planet] || 0.5
}

function getSeasonalInfluence(dayOfYear: number): string {
  if (dayOfYear < 80 || dayOfYear >= 355) return 'Winter'
  if (dayOfYear < 172) return 'Spring'
  if (dayOfYear < 264) return 'Summer'
  return 'Autumn'
}

function calculateElementalDistribution(planetaryHours: string[]): {
  Fire: number
  Water: number
  Air: number
  Earth: number
} {
  const elementalMap: Record<string, string> = {
    Sun: 'Fire',
    Moon: 'Water',
    Mars: 'Fire',
    Mercury: 'Air',
    Jupiter: 'Fire',
    Venus: 'Earth',
    Saturn: 'Earth',
  }

  const counts = {
    Fire: 0,
    Water: 0,
    Air: 0,
    Earth: 0,
  }

  planetaryHours.forEach(planet => {
    const element = elementalMap[planet] as keyof typeof counts
    if (element && element in counts) {
      counts[element]++
    }
  })

  // Normalize to 0-10 scale
  counts.Fire = Math.round((counts.Fire / planetaryHours.length) * 10 * 100) / 100
  counts.Water = Math.round((counts.Water / planetaryHours.length) * 10 * 100) / 100
  counts.Air = Math.round((counts.Air / planetaryHours.length) * 10 * 100) / 100
  counts.Earth = Math.round((counts.Earth / planetaryHours.length) * 10 * 100) / 100

  return counts
}

function calculateAgentOptimization(
  elementalTotals: Record<string, number>,
  planetaryHours: string[]
): AgentOptimization {
  // Determine recommended agents based on elemental balance
  const recommendedAgents = []

  const dominantElement = Object.entries(elementalTotals).sort(([, a], [, b]) => b - a)[0][0]

  if (dominantElement === 'Fire') {
    recommendedAgents.push('mars', 'sun')
  } else if (dominantElement === 'Water') {
    recommendedAgents.push('moon', 'neptune')
  } else if (dominantElement === 'Air') {
    recommendedAgents.push('mercury', 'uranus')
  } else {
    recommendedAgents.push('venus', 'saturn')
  }

  // Calculate power amplification based on planetary alignment
  const uniquePlanets = [...new Set(planetaryHours)].length
  const powerAmplification = 1 + (uniquePlanets / 7) * 0.5

  // Calculate harmony score
  const totalElemental = Object.values(elementalTotals).reduce((sum, val) => sum + val, 0)
  const balance = totalElemental / Object.keys(elementalTotals).length
  const harmonyScore = Math.min(1.0, balance / 5)

  return {
    recommendedAgents,
    powerAmplification: Math.round(powerAmplification * 100) / 100,
    harmonyScore: Math.round(harmonyScore * 100) / 100,
  }
}

function calculatePowerPrediction(
  powerData: Array<{ hour: number; power: number; planetary: string }>,
  currentTime: Date
): PowerPrediction {
  const currentHour = currentTime.getHours()
  const futurePowers = powerData.filter(p => p.hour > currentHour)

  if (futurePowers.length === 0) {
    futurePowers.push(...powerData) // Next day's data
  }

  // Find next peak
  const peakPower = futurePowers.reduce(
    (max, p) => (p.power > max.power ? p : max),
    futurePowers[0]
  )
  const nextPeak = new Date(currentTime)
  nextPeak.setHours(peakPower.hour, 0, 0, 0)
  if (peakPower.hour <= currentHour) {
    nextPeak.setDate(nextPeak.getDate() + 1)
  }

  // Determine trend
  const currentPower = powerData[currentHour].power
  const nextHourPower = powerData[(currentHour + 1) % 24].power
  let trend: 'ascending' | 'stable' | 'descending'

  if (nextHourPower > currentPower + 0.05) trend = 'ascending'
  else if (nextHourPower < currentPower - 0.05) trend = 'descending'
  else trend = 'stable'

  // Calculate confidence based on planetary consistency
  const planetaryConsistency =
    powerData.filter(p => p.planetary === powerData[currentHour].planetary).length / 24
  const confidence = 0.5 + planetaryConsistency * 0.5

  return {
    nextPeak: nextPeak.toISOString(),
    trend,
    confidence: Math.round(confidence * 100) / 100,
  }
}

function calculateResonanceMap(
  agentIds: string[],
  elementalTotals: Record<string, number>
): Record<string, any> {
  const resonanceMap: Record<string, any> = {}

  // Agent elemental affinities
  const agentElements: Record<string, string> = {
    'leonardo-da-vinci': 'Air',
    cleopatra: 'Water',
    einstein: 'Air',
    'marie-curie': 'Earth',
    shakespeare: 'Fire',
    'joan-of-arc': 'Fire',
    tesla: 'Air',
    'maya-angelou': 'Water',
  }

  agentIds.forEach(agentId => {
    const agentElement = agentElements[agentId] || 'Earth'
    const elementalPower = elementalTotals[agentElement] || 5

    const resonance = 0.5 + (elementalPower / 10) * 0.5

    // Calculate compatibility based on elemental balance
    // Higher elemental power = higher compatibility
    // Max elemental power is around 10, normalize to 0.6-0.9 range
    const normalizedPower = Math.min(elementalPower / 10, 1)
    const compatibility = 0.6 + normalizedPower * 0.3

    resonanceMap[agentId] = {
      resonance: Math.round(resonance * 100) / 100,
      compatibility: Math.round(compatibility * 100) / 100,
    }
  })

  return resonanceMap
}
