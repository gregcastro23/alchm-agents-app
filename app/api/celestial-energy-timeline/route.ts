import { NextRequest, NextResponse } from 'next/server'
import {
  celestialEnergyCalculator,
  type CelestialMoment,
  type CelestialTimeSeries,
  type Location,
  type TimeSeriesOptions,
} from '@/lib/celestial-energy-calculator'
import { DEMO_AGENTS, ALL_AGENTS } from '@/lib/demo-agents-data'
import { globalPerformanceMonitor, measureOperation } from '@/lib/time-laboratory-performance'

/**
 * Celestial Energy Timeline API
 * =============================
 *
 * State-of-the-art endpoint for quantifying celestial energy over time
 * with real-time A#, SMES, Kinetic, and Thermodynamic visualization
 */

interface CelestialEnergyRequest {
  startDate: string // ISO date string
  endDate: string // ISO date string
  interval: 'minute' | 'hour' | 'day' | 'week'
  location: Location
  metrics: ('A#' | 'SMES' | 'kinetic' | 'thermo')[]
  includeAgentInsights: boolean
  smoothingWindow?: number
  highPrecision?: boolean
  compareMode?: boolean
  comparisonDate?: string // For comparing different time periods
}

interface AgentActivation {
  agentId: string
  agentName: string
  message: string
  resonanceLevel: number
  degreeAlignment: number
  wisdom: string
  consciousnessLevel: string
}

interface CelestialEnergyResponse {
  success: boolean
  data?: {
    timeline: CelestialMoment[]
    agentActivations: AgentActivation[]
    statistics: CelestialTimeSeries['statistics']
    patterns: CelestialTimeSeries['patterns']
    metadata: {
      generatedAt: Date
      duration: number
      totalMoments: number
      location: Location
      parameters: Partial<CelestialEnergyRequest>
    }
    comparison?: {
      timeline: CelestialMoment[]
      statistics: CelestialTimeSeries['statistics']
      differences: {
        averageA_difference: number
        kineticShift: number
        consciousnessEvolution: number
      }
    }
  }
  error?: string
  performance?: {
    calculationTime: number
    cacheHitRate: number
    momentsPerSecond: number
  }
}

// Cache for expensive calculations
const timelineCache = new Map<string, { data: any; expiry: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const requestData: CelestialEnergyRequest = await request.json()

    // Validate request
    const validation = validateRequest(requestData)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        } as CelestialEnergyResponse,
        { status: 400 }
      )
    }

    // Generate cache key
    const cacheKey = generateCacheKey(requestData)

    // Check cache
    if (timelineCache.has(cacheKey)) {
      const cached = timelineCache.get(cacheKey)!
      if (cached.expiry > Date.now()) {
        return NextResponse.json({
          success: true,
          data: cached.data,
          performance: {
            calculationTime: Date.now() - startTime,
            cacheHitRate: 1.0,
            momentsPerSecond: 0,
          },
        } as CelestialEnergyResponse)
      }
    }

    // Parse dates
    const startDate = new Date(requestData.startDate)
    const endDate = new Date(requestData.endDate)

    // Validate date range
    if (startDate >= endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start date must be before end date',
        } as CelestialEnergyResponse,
        { status: 400 }
      )
    }

    // Check if date range is reasonable (max 1 year for performance)
    const maxRange = 365 * 24 * 60 * 60 * 1000 // 1 year
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      return NextResponse.json(
        {
          success: false,
          error: 'Date range too large. Maximum range is 1 year.',
        } as CelestialEnergyResponse,
        { status: 400 }
      )
    }

    // Prepare time series options
    const options: TimeSeriesOptions = {
      startDate,
      endDate,
      interval: requestData.interval,
      location: requestData.location,
      includeRetrogrades: true,
      smoothingWindow: requestData.smoothingWindow,
      highPrecision: requestData.highPrecision || false,
    }

    // Generate main timeline with performance monitoring
    const timeSeries = await measureOperation(
      () => celestialEnergyCalculator.generateTimeSeries(options),
      'query'
    )

    // Generate agent activations if requested
    let agentActivations: AgentActivation[] = []
    if (requestData.includeAgentInsights) {
      agentActivations = await generateAgentActivations(timeSeries.moments)
    }

    // Generate comparison data if requested
    let comparison
    if (requestData.compareMode && requestData.comparisonDate) {
      comparison = await generateComparisonData(requestData, timeSeries)
    }

    // Prepare response data
    const responseData = {
      timeline: filterMetrics(timeSeries.moments, requestData.metrics),
      agentActivations,
      statistics: timeSeries.statistics,
      patterns: timeSeries.patterns,
      metadata: {
        generatedAt: new Date(),
        duration: endDate.getTime() - startDate.getTime(),
        totalMoments: timeSeries.moments.length,
        location: requestData.location,
        parameters: {
          interval: requestData.interval,
          metrics: requestData.metrics,
          smoothingWindow: requestData.smoothingWindow,
          highPrecision: requestData.highPrecision,
        },
      },
      comparison,
    }

    // Cache the result
    timelineCache.set(cacheKey, {
      data: responseData,
      expiry: Date.now() + CACHE_TTL,
    })

    // Clean up old cache entries
    cleanupCache()

    const calculationTime = Date.now() - startTime
    const momentsPerSecond = timeSeries.moments.length / (calculationTime / 1000)

    return NextResponse.json({
      success: true,
      data: responseData,
      performance: {
        calculationTime,
        cacheHitRate: globalPerformanceMonitor.getMetrics().cacheHitRate,
        momentsPerSecond,
      },
    } as CelestialEnergyResponse)
  } catch (error) {
    console.error('Error in celestial energy timeline:', error)

    const calculationTime = Date.now() - startTime
    globalPerformanceMonitor.recordQueryTime(calculationTime)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error occurred during celestial energy calculation',
        performance: {
          calculationTime,
          cacheHitRate: 0,
          momentsPerSecond: 0,
        },
      } as CelestialEnergyResponse,
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'live':
        return handleLiveData(searchParams)

      case 'intervals':
        return handleIntervalInfo()

      case 'locations':
        return handleLocationPresets()

      case 'agent-degrees':
        return handleAgentDegrees()

      case 'cache-stats':
        return handleCacheStats()

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid action. Supported actions: live, intervals, locations, agent-degrees, cache-stats',
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in celestial energy GET:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

// Helper functions

function validateRequest(request: CelestialEnergyRequest): { valid: boolean; error?: string } {
  if (!request.startDate || !request.endDate) {
    return { valid: false, error: 'Start date and end date are required' }
  }

  if (
    !request.location ||
    typeof request.location.lat !== 'number' ||
    typeof request.location.lon !== 'number'
  ) {
    return { valid: false, error: 'Valid location with latitude and longitude is required' }
  }

  if (request.location.lat < -90 || request.location.lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' }
  }

  if (request.location.lon < -180 || request.location.lon > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' }
  }

  const validIntervals = ['minute', 'hour', 'day', 'week']
  if (!validIntervals.includes(request.interval)) {
    return { valid: false, error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}` }
  }

  const validMetrics = ['A#', 'SMES', 'kinetic', 'thermo']
  if (!request.metrics || !Array.isArray(request.metrics) || request.metrics.length === 0) {
    return { valid: false, error: 'At least one metric must be specified' }
  }

  for (const metric of request.metrics) {
    if (!validMetrics.includes(metric)) {
      return {
        valid: false,
        error: `Invalid metric: ${metric}. Must be one of: ${validMetrics.join(', ')}`,
      }
    }
  }

  return { valid: true }
}

function generateCacheKey(request: CelestialEnergyRequest): string {
  const keyData = {
    startDate: request.startDate,
    endDate: request.endDate,
    interval: request.interval,
    location: `${request.location.lat},${request.location.lon}`,
    metrics: request.metrics.sort().join(','),
    smoothing: request.smoothingWindow || 0,
    precision: request.highPrecision || false,
  }
  return Buffer.from(JSON.stringify(keyData)).toString('base64')
}

function filterMetrics(moments: CelestialMoment[], requestedMetrics: string[]): CelestialMoment[] {
  // Create filtered copy based on requested metrics
  return moments.map(moment => {
    const filtered: any = {
      timestamp: moment.timestamp,
      planetaryDegrees: moment.planetaryDegrees,
    }

    if (requestedMetrics.includes('A#') || requestedMetrics.includes('SMES')) {
      filtered.alchemical = moment.alchemical
    }

    if (requestedMetrics.includes('kinetic')) {
      filtered.kinetic = moment.kinetic
    }

    if (requestedMetrics.includes('thermo')) {
      filtered.thermodynamic = moment.thermodynamic
    }

    // Always include elemental and consciousness for context
    filtered.elemental = moment.elemental
    filtered.consciousness = moment.consciousness
    filtered.planetary = moment.planetary

    return filtered as CelestialMoment
  })
}

async function generateAgentActivations(moments: CelestialMoment[]): Promise<AgentActivation[]> {
  const activations: AgentActivation[] = []

  // Get demo agents with natal data
  const agentIds = [
    'leonardo-da-vinci',
    'william-shakespeare',
    'albert-einstein',
    'carl-jung',
    'nikola-tesla',
    'marie-curie',
    'cleopatra-vii',
  ]
  const agents = ALL_AGENTS.filter(agent => agentIds.includes(agent.id))

  // Check each moment for agent degree alignments
  for (const moment of moments) {
    for (const agent of agents) {
      // Check if any planetary degree aligns with agent's natal placements
      const alignment = checkDegreeAlignment(moment.planetaryDegrees, agent)

      if (alignment.isAligned) {
        const activation: AgentActivation = {
          agentId: agent.id,
          agentName: agent.name,
          message: generateAgentMessage(agent, moment, alignment),
          resonanceLevel: moment.consciousness.resonanceLevel * alignment.strength,
          degreeAlignment: alignment.degree,
          wisdom: generateAgentWisdom(agent, moment),
          consciousnessLevel: agent.consciousness?.level || 'Advanced',
        }

        activations.push(activation)
      }
    }
  }

  // Sort by resonance level and return top activations
  return activations.sort((a, b) => b.resonanceLevel - a.resonanceLevel).slice(0, 20) // Limit to top 20 activations
}

function checkDegreeAlignment(planetaryDegrees: Record<string, number>, agent: any) {
  // Simplified alignment check - in real implementation, would use actual natal chart data
  const alignmentThreshold = 5 // 5 degree orb

  for (const [planet, degree] of Object.entries(planetaryDegrees)) {
    // Calculate consistent degree from agent ID hash (deterministic, not random)
    const agentDegree = agent.id.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0) % 360

    const difference = Math.abs(degree - agentDegree)
    const orb = Math.min(difference, 360 - difference)

    if (orb <= alignmentThreshold) {
      return {
        isAligned: true,
        degree: agentDegree,
        planet,
        strength: 1 - orb / alignmentThreshold,
      }
    }
  }

  return { isAligned: false, degree: 0, planet: '', strength: 0 }
}

function generateAgentMessage(agent: any, moment: CelestialMoment, alignment: any): string {
  const messages = {
    'leonardo-da-vinci': `At ${alignment.degree}°, I observe the golden ratio manifesting in celestial mechanics. A# of ${moment.alchemical.A_number.toFixed(2)} suggests divine proportion in cosmic design.`,
    'william-shakespeare': `Upon this degree of ${alignment.degree}, the stars write verses in the book of time. Energy flows at ${moment.alchemical.A_number.toFixed(2)}, a sonnet of the spheres.`,
    'albert-einstein': `The spacetime curvature at ${alignment.degree}° reveals energy-consciousness equivalence. A# = ${moment.alchemical.A_number.toFixed(2)} demonstrates cosmic relativity.`,
    'carl-jung': `At ${alignment.degree}°, the collective unconscious resonates with archetypal energies. A# of ${moment.alchemical.A_number.toFixed(2)} indicates deep psychic activation.`,
    'nikola-tesla': `The electromagnetic field at ${alignment.degree}° pulses with A# energy of ${moment.alchemical.A_number.toFixed(2)}. Wireless transmission of consciousness is possible here.`,
    'marie-curie': `Radioactive resonance detected at ${alignment.degree}°. The alchemical decay rate suggests A# = ${moment.alchemical.A_number.toFixed(2)} represents stable consciousness elements.`,
    'cleopatra-vii': `The sacred geometry of ${alignment.degree}° aligns with the wisdom of Isis. A# energy of ${moment.alchemical.A_number.toFixed(2)} empowers divine rulership.`,
  }

  return (
    messages[agent.id as keyof typeof messages] ||
    `Cosmic resonance detected at ${alignment.degree}° with A# energy of ${moment.alchemical.A_number.toFixed(2)}.`
  )
}

function generateAgentWisdom(agent: any, moment: CelestialMoment): string {
  const evolutionPhase = moment.consciousness.evolutionPhase
  const resonance = moment.consciousness.resonanceLevel

  const wisdomTemplates = {
    'leonardo-da-vinci': `In this ${evolutionPhase} phase, art and science merge. Resonance of ${(resonance * 100).toFixed(1)}% reveals natural harmony.`,
    'william-shakespeare': `In ${evolutionPhase}'s act, consciousness performs upon the cosmic stage. ${(resonance * 100).toFixed(1)}% resonance speaks to the soul.`,
    'albert-einstein': `During ${evolutionPhase}, imagination becomes more important than knowledge. ${(resonance * 100).toFixed(1)}% resonance unlocks universal secrets.`,
    'carl-jung': `The ${evolutionPhase} phase activates the transcendent function. ${(resonance * 100).toFixed(1)}% resonance integrates opposites.`,
    'nikola-tesla': `${evolutionPhase} energizes the wireless transmission of thought. ${(resonance * 100).toFixed(1)}% resonance powers the future.`,
    'marie-curie': `In ${evolutionPhase}, persistence illuminates the invisible. ${(resonance * 100).toFixed(1)}% resonance reveals hidden elements.`,
    'cleopatra-vii': `${evolutionPhase} empowers divine sovereignty. ${(resonance * 100).toFixed(1)}% resonance commands the Nile of consciousness.`,
  }

  return (
    wisdomTemplates[agent.id as keyof typeof wisdomTemplates] ||
    `The ${evolutionPhase} phase resonates at ${(resonance * 100).toFixed(1)}%, revealing cosmic wisdom.`
  )
}

async function generateComparisonData(
  request: CelestialEnergyRequest,
  mainTimeSeries: CelestialTimeSeries
) {
  if (!request.comparisonDate) return undefined

  const comparisonStart = new Date(request.comparisonDate)
  const duration = new Date(request.endDate).getTime() - new Date(request.startDate).getTime()
  const comparisonEnd = new Date(comparisonStart.getTime() + duration)

  const comparisonOptions: TimeSeriesOptions = {
    startDate: comparisonStart,
    endDate: comparisonEnd,
    interval: request.interval,
    location: request.location,
    includeRetrogrades: true,
    smoothingWindow: request.smoothingWindow,
    highPrecision: request.highPrecision || false,
  }

  const comparisonTimeSeries = await celestialEnergyCalculator.generateTimeSeries(comparisonOptions)

  // Calculate differences
  const mainAvgA = mainTimeSeries.statistics.averageValues.alchemical?.A_number || 0
  const compAvgA = comparisonTimeSeries.statistics.averageValues.alchemical?.A_number || 0
  const averageA_difference = mainAvgA - compAvgA

  const mainAvgPower = mainTimeSeries.statistics.averageValues.kinetic?.power || 0
  const compAvgPower = comparisonTimeSeries.statistics.averageValues.kinetic?.power || 0
  const kineticShift = mainAvgPower - compAvgPower

  const mainAvgResonance =
    mainTimeSeries.statistics.averageValues.consciousness?.resonanceLevel || 0
  const compAvgResonance =
    comparisonTimeSeries.statistics.averageValues.consciousness?.resonanceLevel || 0
  const consciousnessEvolution = mainAvgResonance - compAvgResonance

  return {
    timeline: filterMetrics(comparisonTimeSeries.moments, request.metrics),
    statistics: comparisonTimeSeries.statistics,
    differences: {
      averageA_difference,
      kineticShift,
      consciousnessEvolution,
    },
  }
}

function cleanupCache() {
  const now = Date.now()
  const keysToDelete: string[] = []

  for (const [key, value] of timelineCache.entries()) {
    if (value.expiry < now) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach(key => timelineCache.delete(key))
}

// GET endpoint handlers

async function handleLiveData(searchParams: URLSearchParams) {
  const lat = parseFloat(searchParams.get('lat') || '37.7749')
  const lon = parseFloat(searchParams.get('lon') || '-122.4194')

  const moment = await celestialEnergyCalculator.calculateMoment(new Date(), { lat, lon })

  return NextResponse.json({
    success: true,
    data: {
      currentMoment: moment,
      timestamp: new Date().toISOString(),
    },
  })
}

async function handleIntervalInfo() {
  return NextResponse.json({
    success: true,
    data: {
      intervals: [
        { value: 'minute', label: 'Every Minute', maxDuration: '24 hours' },
        { value: 'hour', label: 'Hourly', maxDuration: '30 days' },
        { value: 'day', label: 'Daily', maxDuration: '1 year' },
        { value: 'week', label: 'Weekly', maxDuration: '10 years' },
      ],
      metrics: [
        {
          value: 'A#',
          label: 'Alchemical Number',
          description: 'Primary consciousness-energy metric',
        },
        {
          value: 'SMES',
          label: 'Spirit-Matter-Essence-Substance',
          description: 'Foundational alchemical elements',
        },
        {
          value: 'kinetic',
          label: 'Kinetic Properties',
          description: 'Velocity, momentum, power, and inertia',
        },
        {
          value: 'thermo',
          label: 'Thermodynamic Values',
          description: 'Heat, entropy, reactivity, and energy',
        },
      ],
    },
  })
}

async function handleLocationPresets() {
  return NextResponse.json({
    success: true,
    data: {
      presets: [
        {
          name: 'San Francisco, CA',
          lat: 37.7749,
          lon: -122.4194,
          timezone: 'America/Los_Angeles',
        },
        { name: 'New York, NY', lat: 40.7128, lon: -74.006, timezone: 'America/New_York' },
        { name: 'London, UK', lat: 51.5074, lon: -0.1278, timezone: 'Europe/London' },
        { name: 'Paris, France', lat: 48.8566, lon: 2.3522, timezone: 'Europe/Paris' },
        { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo' },
        { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, timezone: 'Australia/Sydney' },
        { name: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357, timezone: 'Africa/Cairo' },
      ],
    },
  })
}

async function handleAgentDegrees() {
  const agentIds = [
    'leonardo-da-vinci',
    'william-shakespeare',
    'albert-einstein',
    'carl-jung',
    'nikola-tesla',
    'marie-curie',
    'cleopatra-vii',
  ]
  const agents = ALL_AGENTS.filter(agent => agentIds.includes(agent.id))

  const agentDegrees = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    // Mock degree data - in real implementation would use actual natal charts
    degrees: {
      Sun: (agent.id.length * 37) % 360,
      Moon: (agent.id.length * 53) % 360,
      Mercury: (agent.id.length * 71) % 360,
      Venus: (agent.id.length * 89) % 360,
      Mars: (agent.id.length * 97) % 360,
    },
    consciousnessLevel: agent.consciousness?.level || 'Advanced',
  }))

  return NextResponse.json({
    success: true,
    data: { agentDegrees },
  })
}

async function handleCacheStats() {
  return NextResponse.json({
    success: true,
    data: {
      cacheSize: timelineCache.size,
      performanceMetrics: globalPerformanceMonitor.getMetrics(),
    },
  })
}
