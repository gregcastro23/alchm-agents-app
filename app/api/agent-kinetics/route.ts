import { NextResponse } from 'next/server'
import { getAgentKineticProfile } from '@/lib/agents/kinetic-profiles'
import { sampleHourlyAlchm } from '@/lib/alchemical-kinetics-sampler'
import { DEMO_AGENTS } from '@/lib/demo-agents-data'

interface AgentKineticMetrics {
  agentId: string
  agentName: string
  timestamp: string
  momentumType: string
  powerAlignment: number
  aspectSensitivity: number
  memoryPersistence: number
  consciousnessRate: number
  powerAmplification: number
  peakHours: string[]
  nextOptimalWindow: string | null
  currentPlanetaryHour: string
  kineticVelocities: Record<string, number>
  sensitivityBreakdown: Record<string, number>
  optimalTopics: string[]
  cosmicAlignment: {
    score: number
    level: 'peak' | 'elevated' | 'moderate' | 'low' | 'challenging'
    description: string
  }
}

// Helper function to calculate comprehensive kinetic metrics for an agent
function calculateAgentKinetics(
  agentId: string,
  currentMoment: Date,
  alchemicalData: any
): AgentKineticMetrics | null {
  const agent = DEMO_AGENTS.find(a => a.id === agentId)
  if (!agent) return null

  const kineticProfile = getAgentKineticProfile(agentId)
  if (!kineticProfile) {
    // Return default metrics for agents without kinetic profiles
    return {
      agentId,
      agentName: agent.name,
      timestamp: currentMoment.toISOString(),
      momentumType: 'unknown',
      powerAlignment: 0.5,
      aspectSensitivity: 0.5,
      memoryPersistence: 0.5,
      consciousnessRate: 0.5,
      powerAmplification: 1.0,
      peakHours: [],
      nextOptimalWindow: null,
      currentPlanetaryHour: 'unknown',
      kineticVelocities: {},
      sensitivityBreakdown: {},
      optimalTopics: agent.abilities.wisdomDomains.slice(0, 3),
      cosmicAlignment: {
        score: 0.5,
        level: 'moderate',
        description: 'No kinetic profile available - standard interaction recommended',
      },
    }
  }

  const hour = currentMoment.getHours()
  const planetaryHours = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
  const currentPlanetaryHour = planetaryHours[hour % 7]

  // Calculate power alignment based on current planetary hour
  const peakHours = kineticProfile.peak_hours || []
  const powerAlignment = peakHours.includes(currentPlanetaryHour)
    ? 0.9
    : kineticProfile.power_alignment?.includes(currentPlanetaryHour)
      ? 0.7
      : 0.5

  // Calculate aspect sensitivity
  const aspectSensitivity = kineticProfile.aspect_sensitivity || 0.5

  // Extract sensitivity breakdown (create a simple object for now)
  const sensitivityBreakdown = {
    conjunction: aspectSensitivity,
    trine: aspectSensitivity * 0.8,
    square: aspectSensitivity * 0.6,
    opposition: aspectSensitivity * 0.4,
    sextile: aspectSensitivity * 0.7,
  }

  // Calculate next optimal window
  const nextOptimalWindow = calculateNextOptimalWindow(peakHours, currentMoment)

  // Extract kinetic velocities
  const kineticVelocities = {
    creative: kineticProfile.v_creative || 0,
    linguistic: kineticProfile.v_linguistic || 0,
    scientific: kineticProfile.v_scientific || 0,
    strategic: kineticProfile.v_strategic || 0,
    charismatic: kineticProfile.v_charismatic || 0,
    inventive: kineticProfile.v_inventive || 0,
    social: kineticProfile.v_social || 0,
    psychological: kineticProfile.v_psychological || 0,
    mystical: kineticProfile.v_mystical || 0,
    philosophical: kineticProfile.v_philosophical || 0,
  }

  // Calculate power amplification
  const baseAmplification = powerAlignment
  const timeBonus = peakHours.includes(currentPlanetaryHour) ? 0.3 : 0
  const alchemicalBonus = alchemicalData?.Energy > 500 ? 0.2 : 0
  const powerAmplification = Math.min(2.0, baseAmplification + timeBonus + alchemicalBonus + 0.5)

  // Calculate cosmic alignment
  const alignmentScore = powerAlignment * 0.5 + aspectSensitivity * 0.3 + (powerAmplification - 1.0)
  let alignmentLevel: 'peak' | 'elevated' | 'moderate' | 'low' | 'challenging' = 'moderate'
  let alignmentDescription = ''

  if (alignmentScore > 0.85) {
    alignmentLevel = 'peak'
    alignmentDescription =
      'Optimal cosmic alignment - perfect for profound interactions and breakthrough insights'
  } else if (alignmentScore > 0.7) {
    alignmentLevel = 'elevated'
    alignmentDescription =
      'Strong cosmic support - excellent time for meaningful dialogue and exploration'
  } else if (alignmentScore > 0.5) {
    alignmentLevel = 'moderate'
    alignmentDescription = 'Balanced conditions - suitable for regular interaction and learning'
  } else if (alignmentScore > 0.3) {
    alignmentLevel = 'low'
    alignmentDescription =
      'Gentle approach recommended - best for simple questions and basic guidance'
  } else {
    alignmentLevel = 'challenging'
    alignmentDescription = 'Cosmic resistance present - consider waiting for more favorable timing'
  }

  // Generate optimal topics based on current conditions
  const optimalTopics = [...agent.abilities.wisdomDomains.slice(0, 2)]
  if (alignmentScore > 0.7) {
    optimalTopics.push('Deep Exploration', 'Transformational Insights', 'Advanced Concepts')
  } else if (alignmentScore > 0.5) {
    optimalTopics.push('Practical Wisdom', 'Life Application', 'Personal Growth')
  } else {
    optimalTopics.push('Gentle Guidance', 'Foundational Knowledge', 'Simple Questions')
  }

  return {
    agentId,
    agentName: agent.name,
    timestamp: currentMoment.toISOString(),
    momentumType: kineticProfile.momentum_type || 'unknown',
    powerAlignment,
    aspectSensitivity,
    memoryPersistence: kineticProfile.memory_persistence || 0.5,
    consciousnessRate: kineticProfile.consciousness_rate || 0.5,
    powerAmplification,
    peakHours,
    nextOptimalWindow: nextOptimalWindow?.toISOString() || null,
    currentPlanetaryHour,
    kineticVelocities,
    sensitivityBreakdown,
    optimalTopics,
    cosmicAlignment: {
      score: alignmentScore,
      level: alignmentLevel,
      description: alignmentDescription,
    },
  }
}

function calculateNextOptimalWindow(peakHours: string[], currentMoment: Date): Date | null {
  const hour = currentMoment.getHours()
  const planetaryHours = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']

  // Find next peak hour
  for (let i = 1; i <= 24; i++) {
    const nextHour = (hour + i) % 24
    const planetaryHour = planetaryHours[nextHour % 7]
    if (peakHours.includes(planetaryHour)) {
      const nextOptimal = new Date(currentMoment)
      nextOptimal.setHours(nextHour, 0, 0, 0)
      if (nextOptimal <= currentMoment) {
        nextOptimal.setDate(nextOptimal.getDate() + 1)
      }
      return nextOptimal
    }
  }

  return null
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')
    const lat = parseFloat(searchParams.get('lat') || '37.7749')
    const lon = parseFloat(searchParams.get('lon') || '-122.4194')
    const moment = searchParams.get('moment')

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'Invalid lat/lon' }, { status: 400 })
    }

    const currentMoment = moment ? new Date(moment) : new Date()

    // Get current alchemical conditions
    const samples = await sampleHourlyAlchm({ latitude: lat, longitude: lon }, currentMoment, {
      hoursToSample: 1,
      startHour: currentMoment.getHours(),
      includePlanetaryHours: true,
    })

    const alchemicalData = samples && samples.length > 0 ? samples[0] : null

    // Calculate kinetic metrics for the agent
    const metrics = calculateAgentKinetics(agentId, currentMoment, alchemicalData)

    if (!metrics) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({
      metrics,
      alchemicalConditions: alchemicalData
        ? {
            energy: alchemicalData.Energy,
            heat: alchemicalData.Heat,
            entropy: alchemicalData.Entropy,
            reactivity: alchemicalData.Reactivity,
            elementalTotals: alchemicalData.totals,
            planetaryHour: alchemicalData.planetaryHour,
          }
        : null,
      location: { latitude: lat, longitude: lon },
    })
  } catch (error) {
    console.error('agent-kinetics API error:', error)
    return NextResponse.json({ error: 'Failed to compute agent kinetics' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const agentIds = (body.agentIds as string[]) || []
    const lat = parseFloat(String(body.lat ?? '37.7749'))
    const lon = parseFloat(String(body.lon ?? '-122.4194'))
    const moment = body.moment ? new Date(body.moment) : new Date()

    if (!Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json({ error: 'agentIds array is required' }, { status: 400 })
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'Invalid lat/lon' }, { status: 400 })
    }

    // Get current alchemical conditions
    const samples = await sampleHourlyAlchm({ latitude: lat, longitude: lon }, moment, {
      hoursToSample: 1,
      startHour: moment.getHours(),
      includePlanetaryHours: true,
    })

    const alchemicalData = samples && samples.length > 0 ? samples[0] : null

    // Calculate kinetic metrics for all requested agents
    const agentMetrics = []

    for (const agentId of agentIds) {
      const metrics = calculateAgentKinetics(agentId, moment, alchemicalData)
      if (metrics) {
        agentMetrics.push(metrics)
      }
    }

    // Sort by cosmic alignment score (highest first)
    const sortedMetrics = agentMetrics.sort(
      (a, b) => b.cosmicAlignment.score - a.cosmicAlignment.score
    )

    // Calculate group dynamics
    const groupSummary = {
      totalAgents: agentMetrics.length,
      averageAlignment:
        agentMetrics.reduce((sum, m) => sum + m.cosmicAlignment.score, 0) / agentMetrics.length,
      momentumDistribution: agentMetrics.reduce(
        (acc, m) => {
          acc[m.momentumType] = (acc[m.momentumType] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
      peakAgents: agentMetrics.filter(m => m.cosmicAlignment.level === 'peak').length,
      optimalWindows: agentMetrics
        .filter(m => m.nextOptimalWindow)
        .map(m => ({
          agentId: m.agentId,
          agentName: m.agentName,
          nextOptimal: m.nextOptimalWindow,
        }))
        .sort((a, b) => new Date(a.nextOptimal!).getTime() - new Date(b.nextOptimal!).getTime()),
    }

    return NextResponse.json({
      moment: moment.toISOString(),
      location: { latitude: lat, longitude: lon },
      alchemicalConditions: alchemicalData,
      agentMetrics: sortedMetrics,
      groupSummary,
    })
  } catch (error) {
    console.error('agent-kinetics POST error:', error)
    return NextResponse.json({ error: 'Failed to compute batch agent kinetics' }, { status: 500 })
  }
}
