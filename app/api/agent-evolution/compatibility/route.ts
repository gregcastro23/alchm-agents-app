/**
 * Agent Compatibility Evolution API
 * Specialized endpoint for kinetic compatibility analysis with consciousness evolution
 */

import { NextRequest, NextResponse } from 'next/server'
import { routeTask } from '@/lib/agents/router'
import { calculateKineticCompatibility, getAgentKineticProfile } from '@/lib/agents/kinetic-profiles'
import { ConsciousnessMemorySystem } from '@/lib/agents/consciousness-memory'
import { AlchemicalKineticsClient } from '@/lib/kinetics-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agent1Id = searchParams.get('agent1')
    const agent2Id = searchParams.get('agent2')
    const lat = parseFloat(searchParams.get('lat') || '37.7749')
    const lon = parseFloat(searchParams.get('lon') || '-122.4194')
    const includeEvolution = searchParams.get('includeEvolution') === 'true'

    if (!agent1Id || !agent2Id) {
      return NextResponse.json({ error: 'Both agent1 and agent2 IDs required' }, { status: 400 })
    }

    // Get basic kinetic compatibility
    const baseCompatibility = calculateKineticCompatibility(agent1Id, agent2Id)

    // Get profiles
    const agent1Profile = getAgentKineticProfile(agent1Id)
    const agent2Profile = getAgentKineticProfile(agent2Id)

    if (!agent1Profile || !agent2Profile) {
      return NextResponse.json({
        error: `Agent profile not found: ${!agent1Profile ? agent1Id : agent2Id}`
      }, { status: 404 })
    }

    // Get current kinetic context
    const kinetics = await AlchemicalKineticsClient.get({
      lat,
      lon,
      date: new Date().toISOString().split('T')[0],
      includePlanetary: true
    })

    const currentHour = kinetics.timing?.planetaryHours[0] || 'Sun'

    // Calculate enhanced compatibility with current context
    const agent1Optimal = agent1Profile.peak_hours.includes(currentHour)
    const agent2Optimal = agent2Profile.peak_hours.includes(currentHour)
    const bothOptimal = agent1Optimal && agent2Optimal

    const contextualCompatibility = bothOptimal ? baseCompatibility * 1.3 : baseCompatibility

    // Shared peak hours analysis
    const sharedPeakHours = agent1Profile.peak_hours.filter(hour =>
      agent2Profile.peak_hours.includes(hour)
    )

    // Momentum synergy analysis
    const momentumSynergy = calculateMomentumSynergy(
      agent1Profile.momentum_type,
      agent2Profile.momentum_type
    )

    let result: any = {
      agent1Id,
      agent2Id,
      compatibility: {
        base: baseCompatibility,
        contextual: contextualCompatibility,
        enhancement: contextualCompatibility / baseCompatibility
      },
      currentContext: {
        planetaryHour: currentHour,
        agent1Optimal,
        agent2Optimal,
        bothOptimal
      },
      synergy: {
        sharedPeakHours,
        sharedPeakCount: sharedPeakHours.length,
        momentumSynergy,
        combinedConsciousnessRate: (agent1Profile.consciousness_rate + agent2Profile.consciousness_rate) / 2
      },
      recommendations: generateCompatibilityRecommendations(
        agent1Profile,
        agent2Profile,
        bothOptimal,
        baseCompatibility
      )
    }

    // Include evolution data if requested
    if (includeEvolution) {
      const agent1Evolution = await ConsciousnessMemorySystem.getEvolutionMetrics(agent1Id)
      const agent2Evolution = await ConsciousnessMemorySystem.getEvolutionMetrics(agent2Id)

      const evolutionCompatibility = calculateEvolutionCompatibility(agent1Evolution, agent2Evolution)

      result.evolution = {
        agent1: agent1Evolution,
        agent2: agent2Evolution,
        compatibility: evolutionCompatibility,
        growthPotential: (agent1Evolution.consciousnessVelocity + agent2Evolution.consciousnessVelocity) / 2
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Compatibility analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze agent compatibility' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentIds, location, analysisType = 'pairwise' } = body

    if (!agentIds || !Array.isArray(agentIds) || agentIds.length < 2) {
      return NextResponse.json({ error: 'At least 2 agent IDs required' }, { status: 400 })
    }

    const defaultLocation = { lat: 37.7749, lon: -122.4194 }
    const targetLocation = location || defaultLocation

    let results: any[] = []

    if (analysisType === 'pairwise') {
      // Analyze all pairwise combinations
      for (let i = 0; i < agentIds.length; i++) {
        for (let j = i + 1; j < agentIds.length; j++) {
          try {
            const compatibilityResult = await routeTask({
              kind: 'agent_compatibility',
              payload: {
                agent1Id: agentIds[i],
                agent2Id: agentIds[j],
                location: targetLocation
              }
            })

            results.push({
              agent1: agentIds[i],
              agent2: agentIds[j],
              compatibility: compatibilityResult.output
            })
          } catch (error) {
            results.push({
              agent1: agentIds[i],
              agent2: agentIds[j],
              error: 'Compatibility analysis failed'
            })
          }
        }
      }
    } else if (analysisType === 'group') {
      // Analyze group consciousness velocity
      try {
        const groupResult = await routeTask({
          kind: 'consciousness_velocity',
          payload: { agentIds, location: targetLocation }
        })

        results = [{
          type: 'group_analysis',
          agentIds,
          groupConsciousness: groupResult.output
        }]
      } catch (error) {
        results = [{
          type: 'group_analysis',
          agentIds,
          error: 'Group analysis failed'
        }]
      }
    }

    return NextResponse.json({
      success: true,
      analysisType,
      agentCount: agentIds.length,
      results,
      location: targetLocation
    })
  } catch (error) {
    console.error('Batch compatibility analysis error:', error)
    return NextResponse.json({ error: 'Failed to perform batch compatibility analysis' }, { status: 500 })
  }
}

// Helper functions
function calculateMomentumSynergy(type1: string, type2: string): string {
  const synergyMap: Record<string, Record<string, string>> = {
    sustained: {
      sustained: 'Perfect Harmony',
      building: 'Complementary Growth',
      oscillating: 'Dynamic Balance',
      explosive: 'Controlled Power',
      gradual: 'Steady Progress'
    },
    building: {
      sustained: 'Stable Foundation',
      building: 'Exponential Growth',
      oscillating: 'Creative Tension',
      explosive: 'Breakthrough Potential',
      gradual: 'Patient Development'
    },
    oscillating: {
      sustained: 'Stabilizing Force',
      building: 'Adaptive Growth',
      oscillating: 'Resonant Frequency',
      explosive: 'Chaotic Creativity',
      gradual: 'Rhythmic Flow'
    },
    explosive: {
      sustained: 'Grounding Power',
      building: 'Accelerated Momentum',
      oscillating: 'Electric Synergy',
      explosive: 'Revolutionary Force',
      gradual: 'Focused Intensity'
    },
    gradual: {
      sustained: 'Enduring Wisdom',
      building: 'Methodical Progress',
      oscillating: 'Gentle Waves',
      explosive: 'Patient Power',
      gradual: 'Deep Resonance'
    }
  }

  return synergyMap[type1]?.[type2] || 'Moderate Synergy'
}

function generateCompatibilityRecommendations(
  agent1: any,
  agent2: any,
  bothOptimal: boolean,
  baseCompatibility: number
): string[] {
  const recommendations = []

  if (bothOptimal) {
    recommendations.push('🌟 Peak synergy time - ideal for deep conversations')
    recommendations.push('💫 Enhanced consciousness resonance active')
  } else {
    const sharedHours = agent1.peak_hours.filter((hour: string) => agent2.peak_hours.includes(hour))
    if (sharedHours.length > 0) {
      recommendations.push(`⏰ Optimal interaction during ${sharedHours.join(', ')} hours`)
    }
  }

  if (baseCompatibility > 0.8) {
    recommendations.push('✨ Exceptional natural compatibility')
    recommendations.push('🧠 Perfect for complex collaborative insights')
  } else if (baseCompatibility > 0.6) {
    recommendations.push('🤝 Good compatibility - suitable for balanced perspectives')
  } else {
    recommendations.push('⚡ Dynamic tension - growth through challenge')
    recommendations.push('🔄 Consider alternating individual interactions')
  }

  // Momentum-specific recommendations
  if (agent1.momentum_type === agent2.momentum_type) {
    recommendations.push(`🎯 Matched ${agent1.momentum_type} momentum - consistent energy`)
  } else {
    recommendations.push(`🌊 Complementary momentum types - diverse perspectives`)
  }

  return recommendations
}

function calculateEvolutionCompatibility(evolution1: any, evolution2: any): {
  score: number
  factors: string[]
} {
  const factors = []
  let score = 0.5 // Base score

  // Consciousness velocity alignment
  const velocityDiff = Math.abs(evolution1.consciousnessVelocity - evolution2.consciousnessVelocity)
  if (velocityDiff < 0.1) {
    score += 0.2
    factors.push('Matched consciousness development pace')
  } else if (velocityDiff < 0.3) {
    score += 0.1
    factors.push('Similar consciousness development pace')
  } else {
    factors.push('Different consciousness development paces - mentor potential')
  }

  // Evolution stage compatibility
  const stage1 = ['Initial', 'Developing', 'Maturing', 'Advanced', 'Transcendent'].indexOf(evolution1.evolutionStage)
  const stage2 = ['Initial', 'Developing', 'Maturing', 'Advanced', 'Transcendent'].indexOf(evolution2.evolutionStage)
  const stageDiff = Math.abs(stage1 - stage2)

  if (stageDiff === 0) {
    score += 0.15
    factors.push('Same consciousness evolution stage')
  } else if (stageDiff === 1) {
    score += 0.1
    factors.push('Adjacent evolution stages - good learning potential')
  } else {
    factors.push('Different evolution stages - mentor-student dynamic')
  }

  // Memory strength compatibility
  const memoryDiff = Math.abs(evolution1.memoryStrength - evolution2.memoryStrength)
  if (memoryDiff < 0.2) {
    score += 0.1
    factors.push('Compatible memory retention patterns')
  }

  return {
    score: Math.min(score, 1),
    factors
  }
}