/**
 * Alchemical Kinetics Client
 *
 * Client for calling backend alchemical kinetics API
 * Implements: Velocity, Momentum, Force, Flow States, Resonance, Temporal Pressure
 */

import { logger } from '../utils/logger'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ElementalValues {
  Fire: number
  Water: number
  Air: number
  Earth: number
}

export interface AlchemicalState {
  spirit: number
  essence: number
  matter: number
  substance: number
  elementals: ElementalValues
  timestamp: string
}

export interface ElementalVelocity {
  Fire: number
  Water: number
  Air: number
  Earth: number
  magnitude: number
}

export interface ElementalMomentum {
  Fire: number
  Water: number
  Air: number
  Earth: number
  magnitude: number
}

export interface ElementalForce {
  Fire: number
  Water: number
  Air: number
  Earth: number
  magnitude: number
  type: 'accelerating' | 'decelerating' | 'sustained'
}

export interface FlowState {
  expansion: number
  contraction: number
  balance: number
  type: 'expanding' | 'contracting' | 'balanced'
  description: string
}

export interface ResonanceField {
  harmonic: number
  discord: number
  purity: number
  quality: 'pure' | 'mixed' | 'chaotic'
}

export interface TemporalPressure {
  solarity: number
  lunarity: number
  pressure: number
  rhythm: 'diurnal' | 'nocturnal' | 'balanced'
}

export interface AlchemicalKinetics {
  velocity: ElementalVelocity
  momentum: ElementalMomentum
  force: ElementalForce
  flowState: FlowState
  resonance: ResonanceField
  temporalPressure: TemporalPressure
  metadata: {
    timestamp: string
    previousTimestamp: string | null
    timeInterval: number
    planetaryHour: string
  }
}

export interface KineticsResponse {
  success: boolean
  data: AlchemicalKinetics
  computeTimeMs: number
  metadata: {
    location: { lat: number; lon: number }
    timestamp: string
    hasPreviousState: boolean
    planetaryHour: string
    forceType: string
    flowType: string
    resonanceQuality: string
    temporalRhythm: string
  }
}

export interface TimelineResponse {
  success: boolean
  data: AlchemicalKinetics[]
  computeTimeMs: number
  cacheHit: boolean
  metadata: {
    dataPoints: number
    startDate: string
    endDate: string
    intervalHours: number
    location: { lat: number; lon: number }
    statistics?: {
      averageVelocity: number
      averageMomentum: number
      averageForce: number
      flowStateDistribution: Record<string, number>
    }
  }
}

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const USE_BACKEND = process.env.USE_BACKEND === 'true'
const KINETICS_BACKEND = process.env.KINETICS_BACKEND !== 'false'

// ============================================================================
// CLIENT METHODS
// ============================================================================

/**
 * Calculate alchemical kinetics for a given state
 */
export async function calculateKinetics(
  current: AlchemicalState,
  previous: AlchemicalState | null,
  location: { lat: number; lon: number }
): Promise<AlchemicalKinetics> {
  if (!USE_BACKEND || !KINETICS_BACKEND) {
    throw new Error('Alchemical kinetics backend is not enabled')
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/kinetics/alchemical`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current,
        previous,
        location,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to calculate kinetics')
    }

    const result: KineticsResponse = await response.json()
    return result.data
  } catch (error) {
    logger.error('Error calling kinetics API:', error)
    throw error
  }
}

/**
 * Calculate alchemical kinetics timeline for a date range
 */
export async function calculateKineticsTimeline(
  startDate: string,
  endDate: string,
  location: { lat: number; lon: number },
  intervalHours: number = 1
): Promise<AlchemicalKinetics[]> {
  if (!USE_BACKEND || !KINETICS_BACKEND) {
    throw new Error('Alchemical kinetics backend is not enabled')
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/kinetics/alchemical-timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        location,
        intervalHours,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to calculate timeline')
    }

    const result: TimelineResponse = await response.json()
    return result.data
  } catch (error) {
    logger.error('Error calling timeline API:', error)
    throw error
  }
}

/**
 * Get kinetics system status
 */
export async function getKineticsStatus(): Promise<{
  system: string
  version: string
  features: Record<string, boolean>
  capabilities: string[]
}> {
  if (!USE_BACKEND || !KINETICS_BACKEND) {
    return {
      system: 'offline',
      version: '0.0.0',
      features: {},
      capabilities: [],
    }
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/kinetics/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get status')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    logger.error('Error getting kinetics status:', error)
    return {
      system: 'error',
      version: '0.0.0',
      features: {},
      capabilities: [],
    }
  }
}

/**
 * Helper: Create alchemical state from birth chart data
 */
export function createAlchemicalState(
  spirit: number,
  essence: number,
  matter: number,
  substance: number,
  elementals: ElementalValues,
  timestamp?: Date
): AlchemicalState {
  return {
    spirit,
    essence,
    matter,
    substance,
    elementals,
    timestamp: (timestamp || new Date()).toISOString(),
  }
}

/**
 * Helper: Analyze kinetics for consciousness insights
 */
export function analyzeKinetics(kinetics: AlchemicalKinetics): {
  summary: string
  insights: string[]
  recommendations: string[]
} {
  const insights: string[] = []
  const recommendations: string[] = []

  // Analyze velocity
  if (kinetics.velocity.magnitude > 0.5) {
    insights.push('High velocity indicates rapid transformation and change')
    recommendations.push('Channel this energy into focused spiritual practice')
  } else if (kinetics.velocity.magnitude < 0.1) {
    insights.push('Low velocity suggests a period of stability and consolidation')
    recommendations.push('Use this time for integration and reflection')
  }

  // Analyze force type
  if (kinetics.force.type === 'accelerating') {
    insights.push('Accelerating force - consciousness is gaining momentum')
    recommendations.push('Set clear intentions to direct this growing power')
  } else if (kinetics.force.type === 'decelerating') {
    insights.push('Decelerating force - energy is slowing or shifting direction')
    recommendations.push('Review current path and adjust course if needed')
  }

  // Analyze flow state
  insights.push(kinetics.flowState.description)
  if (kinetics.flowState.type === 'expanding') {
    recommendations.push('Embrace new experiences and opportunities for growth')
  } else if (kinetics.flowState.type === 'contracting') {
    recommendations.push('Focus on deepening existing practices and commitments')
  }

  // Analyze resonance
  if (kinetics.resonance.quality === 'pure') {
    insights.push('Pure resonance - elements are in perfect alignment')
    recommendations.push('This is an optimal time for major spiritual work')
  } else if (kinetics.resonance.quality === 'chaotic') {
    insights.push('Chaotic resonance - elements are in discord')
    recommendations.push('Ground yourself and seek balance before major decisions')
  }

  // Analyze temporal pressure
  if (kinetics.temporalPressure.rhythm === 'diurnal') {
    insights.push('Solar energy dominates - active, yang energy')
    recommendations.push('Engage in outward-facing activities and manifestation')
  } else if (kinetics.temporalPressure.rhythm === 'nocturnal') {
    insights.push('Lunar energy dominates - receptive, yin energy')
    recommendations.push('Focus on inner work, intuition, and dreamwork')
  }

  const summary = `${kinetics.force.type.charAt(0).toUpperCase() + kinetics.force.type.slice(1)} ${kinetics.flowState.type} state with ${kinetics.resonance.quality} resonance under ${kinetics.temporalPressure.rhythm} influence`

  return {
    summary,
    insights,
    recommendations,
  }
}

// ============================================================================
// EXPORT CLIENT OBJECT
// ============================================================================

export const AlchemicalKineticsClient = {
  calculateKinetics,
  calculateKineticsTimeline,
  getKineticsStatus,
  createAlchemicalState,
  analyzeKinetics,
}

export default AlchemicalKineticsClient
