/**
 * Agent Compatibility Evolution API
 * Specialized endpoint for kinetic compatibility analysis with consciousness evolution
 */

import { NextRequest, NextResponse } from 'next/server'
import { routeTask } from '@/lib/agents/router'
import { agentKineticProfiles, type KineticProfile } from '@/lib/agents/kinetic-profiles'
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

    // Get profiles
    const agent1Profile = agentKineticProfiles[agent1Id]
    const agent2Profile = agentKineticProfiles[agent2Id]

    if (!agent1Profile || !agent2Profile) {
      return NextResponse.json(
        {
          error: `Agent profile not found: ${!agent1Profile ? agent1Id : agent2Id}`,
        },
        { status: 404 }
      )
    }

    // Get current kinetic context
    const kinetics = await AlchemicalKineticsClient.get({
      lat,
      lon,
      date: new Date().toISOString().split('T')[0],
      includePlanetary: true,
    })

    const currentHour = kinetics.timing?.planetaryHours[0] || 'Sun'

    // Calculate basic kinetic compatibility (element compatibility)
    const elementCompatibility = calculateElementCompatibility(
      agent1Profile.elements,
      agent2Profile.elements
    )
    const astrologyCompatibility = calculateAstrologyCompatibility(
      agent1Profile.astrology,
      agent2Profile.astrology
    )
    const baseCompatibility = (elementCompatibility + astrologyCompatibility) / 2

    // Calculate enhanced compatibility with current context
    const agent1Optimal = agent1Profile.alignment.includes(currentHour)
    const agent2Optimal = agent2Profile.alignment.includes(currentHour)
    const bothOptimal = agent1Optimal && agent2Optimal

    const contextualCompatibility = bothOptimal ? baseCompatibility * 1.3 : baseCompatibility

    // Shared peak hours analysis
    const sharedPeakHours = agent1Profile.alignment.filter(hour =>
      agent2Profile.alignment.includes(hour)
    )

    // Momentum synergy analysis
    const momentumSynergy = calculateMomentumSynergy(
      agent1Profile.momentum || 'steady',
      agent2Profile.momentum || 'steady'
    )

    const result: any = {
      agent1Id,
      agent2Id,
      compatibility: {
        base: baseCompatibility,
        contextual: contextualCompatibility,
        enhancement: contextualCompatibility / baseCompatibility,
      },
      currentContext: {
        planetaryHour: currentHour,
        agent1Optimal,
        agent2Optimal,
        bothOptimal,
      },
      synergy: {
        sharedPeakHours,
        sharedPeakCount: sharedPeakHours.length,
        momentumSynergy,
        combinedConsciousnessRate: (agent1Profile.evolutionRate + agent2Profile.evolutionRate) / 2,
      },
      recommendations: generateCompatibilityRecommendations(
        agent1Profile,
        agent2Profile,
        bothOptimal,
        baseCompatibility
      ),
    }

    // Include evolution data if requested
    if (includeEvolution) {
      const agent1Evolution = await ConsciousnessMemorySystem.getEvolutionMetrics(agent1Id)
      const agent2Evolution = await ConsciousnessMemorySystem.getEvolutionMetrics(agent2Id)

      const evolutionCompatibility = calculateEvolutionCompatibility(
        agent1Evolution,
        agent2Evolution
      )

      result.evolution = {
        agent1: agent1Evolution,
        agent2: agent2Evolution,
        compatibility: evolutionCompatibility,
        growthPotential:
          (agent1Evolution.consciousnessVelocity + agent2Evolution.consciousnessVelocity) / 2,
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
                location: targetLocation,
              },
            })

            results.push({
              agent1: agentIds[i],
              agent2: agentIds[j],
              compatibility: compatibilityResult.output,
            })
          } catch (error) {
            results.push({
              agent1: agentIds[i],
              agent2: agentIds[j],
              error: 'Compatibility analysis failed',
            })
          }
        }
      }
    } else if (analysisType === 'group') {
      // Analyze group consciousness velocity
      try {
        const groupResult = await routeTask({
          kind: 'consciousness_velocity',
          payload: { agentIds, location: targetLocation },
        })

        results = [
          {
            type: 'group_analysis',
            agentIds,
            groupConsciousness: groupResult.output,
          },
        ]
      } catch (error) {
        results = [
          {
            type: 'group_analysis',
            agentIds,
            error: 'Group analysis failed',
          },
        ]
      }
    }

    return NextResponse.json({
      success: true,
      analysisType,
      agentCount: agentIds.length,
      results,
      location: targetLocation,
    })
  } catch (error) {
    console.error('Batch compatibility analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to perform batch compatibility analysis' },
      { status: 500 }
    )
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
      gradual: 'Steady Progress',
    },
    building: {
      sustained: 'Stable Foundation',
      building: 'Exponential Growth',
      oscillating: 'Creative Tension',
      explosive: 'Breakthrough Potential',
      gradual: 'Patient Development',
    },
    oscillating: {
      sustained: 'Stabilizing Force',
      building: 'Adaptive Growth',
      oscillating: 'Resonant Frequency',
      explosive: 'Chaotic Creativity',
      gradual: 'Rhythmic Flow',
    },
    explosive: {
      sustained: 'Grounding Power',
      building: 'Accelerated Momentum',
      oscillating: 'Electric Synergy',
      explosive: 'Revolutionary Force',
      gradual: 'Focused Intensity',
    },
    gradual: {
      sustained: 'Enduring Wisdom',
      building: 'Methodical Progress',
      oscillating: 'Gentle Waves',
      explosive: 'Patient Power',
      gradual: 'Deep Resonance',
    },
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
    const sharedHours = agent1.alignment.filter((hour: string) => agent2.alignment.includes(hour))
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
  const momentum1 = agent1.momentum || 'steady'
  const momentum2 = agent2.momentum || 'steady'
  if (momentum1 === momentum2) {
    recommendations.push(`🎯 Matched ${momentum1} momentum - consistent energy`)
  } else {
    recommendations.push(`🌊 Complementary momentum types - diverse perspectives`)
  }

  return recommendations
}

function calculateEvolutionCompatibility(
  evolution1: any,
  evolution2: any
): {
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
  const stage1 = ['Initial', 'Developing', 'Maturing', 'Advanced', 'Transcendent'].indexOf(
    evolution1.evolutionStage
  )
  const stage2 = ['Initial', 'Developing', 'Maturing', 'Advanced', 'Transcendent'].indexOf(
    evolution2.evolutionStage
  )
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
    factors,
  }
}

// Helper functions for compatibility calculation
function calculateElementCompatibility(elements1: string[], elements2: string[]): number {
  if (!elements1 || !elements2) return 0.5

  const shared = elements1.filter(el => elements2.includes(el))
  const totalUnique = new Set([...elements1, ...elements2]).size

  return shared.length / Math.max(totalUnique, 1)
}

function calculateAstrologyCompatibility(astrology1: any, astrology2: any): number {
  if (!astrology1 || !astrology2) return 0.5

  let compatibility = 0.5

  // Planet compatibility
  if (astrology1.planet && astrology2.planet) {
    const planetCompatibility = calculatePlanetCompatibility(astrology1.planet, astrology2.planet)
    compatibility += planetCompatibility * 0.3
  }

  // Sign compatibility
  if (astrology1.sign && astrology2.sign) {
    const signCompatibility = calculateSignCompatibility(astrology1.sign, astrology2.sign)
    compatibility += signCompatibility * 0.2
  }

  return Math.min(compatibility, 1)
}

function calculatePlanetCompatibility(planet1: string, planet2: string): number {
  const planetaryAffinities: Record<string, string[]> = {
    Sun: ['Mars', 'Jupiter', 'Venus'],
    Moon: ['Venus', 'Jupiter', 'Mercury'],
    Mercury: ['Moon', 'Venus', 'Uranus'],
    Venus: ['Sun', 'Moon', 'Mercury', 'Jupiter'],
    Mars: ['Sun', 'Pluto', 'Jupiter'],
    Jupiter: ['Sun', 'Moon', 'Venus', 'Mars'],
    Saturn: ['Capricorn', 'Aquarius'],
    Uranus: ['Mercury', 'Aquarius'],
    Neptune: ['Pisces', 'Jupiter'],
    Pluto: ['Mars', 'Scorpio'],
  }

  if (planet1 === planet2) return 0.8
  if (planetaryAffinities[planet1]?.includes(planet2)) return 0.6
  return 0.4
}

function calculateSignCompatibility(sign1: string, sign2: string): number {
  const signAffinities: Record<string, string[]> = {
    Aries: ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
    Taurus: ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
    Gemini: ['Libra', 'Aquarius', 'Aries', 'Leo'],
    Cancer: ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
    Leo: ['Aries', 'Sagittarius', 'Gemini', 'Libra'],
    Virgo: ['Taurus', 'Capricorn', 'Cancer', 'Scorpio'],
    Libra: ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
    Scorpio: ['Cancer', 'Pisces', 'Virgo', 'Capricorn'],
    Sagittarius: ['Aries', 'Leo', 'Libra', 'Aquarius'],
    Capricorn: ['Taurus', 'Virgo', 'Scorpio', 'Pisces'],
    Aquarius: ['Gemini', 'Libra', 'Aries', 'Sagittarius'],
    Pisces: ['Cancer', 'Scorpio', 'Taurus', 'Capricorn'],
  }

  if (sign1 === sign2) return 0.9
  if (signAffinities[sign1]?.includes(sign2)) return 0.7
  return 0.4
}
