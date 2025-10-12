import { NextResponse } from 'next/server'
import { getAgentKineticProfile } from '../../../../lib/agents/kinetic-profiles'
import { sampleHourlyAlchm } from '../../../../lib/alchemical-kinetics-sampler'
import { demoCraftedAgents } from '../../../../lib/demo-agents-data'

interface RecommendationScore {
  agentId: string
  score: number
  category: 'optimal' | 'enhanced' | 'compatible' | 'challenging' | 'neutral'
  reasoning: string
  powerAlignment: number
  aspectSensitivity: number
  momentumCompatibility: number
  optimalTopics: string[]
  nextOptimalWindow?: Date
}

// Helper function to calculate moment score for an agent
function calculateMomentScore(
  agentId: string,
  currentMoment: Date,
  alchemicalData: any,
  selectedAgents: string[] = []
) {
  const agent = demoCraftedAgents.find(a => a.id === agentId)
  if (!agent) return null

  const kineticProfile = getAgentKineticProfile(agentId)
  if (!kineticProfile) return null

  const hour = currentMoment.getHours()
  const planetaryHours = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
  const currentPlanetaryHour = planetaryHours[hour % 7]

  // Calculate base alignment score
  const peakHours = kineticProfile.peak_hours || []
  const powerAlignment = peakHours.includes(currentPlanetaryHour)
    ? 0.9
    : kineticProfile.power_alignment?.includes(currentPlanetaryHour)
      ? 0.7
      : 0.5

  // Calculate aspect sensitivity based on current aspects
  const aspectSensitivity = kineticProfile.aspect_sensitivity
    ? Object.values(kineticProfile.aspect_sensitivity).reduce((a: number, b: any) => a + b, 0) / 6
    : 0.5

  // Momentum compatibility - higher for unique momentum types not in selected agents
  const selectedMomentumTypes = selectedAgents
    .map(id => {
      const profile = getAgentKineticProfile(id)
      return profile?.momentum_type
    })
    .filter(Boolean)

  const isUniqueMomentum = !selectedMomentumTypes.includes(kineticProfile.momentum_type)
  const momentumCompatibility = isUniqueMomentum ? 0.8 : 0.4

  // Factor in alchemical resonance
  const alchemicalBonus = alchemicalData?.Energy > 500 ? 0.1 : 0
  const elementalBonus = alchemicalData?.totals
    ? Math.max(...Object.values(alchemicalData.totals as Record<string, number>)) > 50
      ? 0.1
      : 0
    : 0

  // Calculate final score
  const baseScore = powerAlignment * 0.4 + aspectSensitivity * 0.3 + momentumCompatibility * 0.3
  const bonusScore = alchemicalBonus + elementalBonus
  const finalScore = Math.min(1, baseScore + bonusScore)

  // Determine recommendation category
  let category: RecommendationScore['category'] = 'neutral'
  const isOptimalTime = peakHours.includes(currentPlanetaryHour)

  if (isOptimalTime && finalScore > 0.8) category = 'optimal'
  else if (finalScore > 0.75) category = 'enhanced'
  else if (finalScore > 0.6) category = 'compatible'
  else if (finalScore < 0.4) category = 'challenging'

  // Generate reasoning
  let reasoning = `${agent.name} shows ${Math.round(finalScore * 100)}% compatibility with current cosmic conditions.`
  if (isOptimalTime) reasoning += ` Currently in peak planetary hour (${currentPlanetaryHour}).`
  if (isUniqueMomentum) reasoning += ` Offers unique ${kineticProfile.momentum_type} momentum.`
  if (aspectSensitivity > 0.7) reasoning += ` Highly responsive to current aspects.`

  // Calculate next optimal window
  const nextOptimalWindow = calculateNextOptimalWindow(peakHours, currentMoment)

  // Generate optimal topics based on agent abilities and moment
  const optimalTopics = [...agent.abilities.wisdomDomains.slice(0, 2)]
  if (finalScore > 0.7) {
    optimalTopics.push('Deep Exploration', 'Advanced Concepts')
  } else if (finalScore > 0.5) {
    optimalTopics.push('Practical Wisdom', 'Life Application')
  } else {
    optimalTopics.push('Gentle Guidance', 'Foundational Knowledge')
  }

  return {
    agentId,
    score: finalScore,
    category,
    reasoning,
    powerAlignment,
    aspectSensitivity,
    momentumCompatibility,
    optimalTopics,
    nextOptimalWindow: nextOptimalWindow || undefined,
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
    const lat = parseFloat(searchParams.get('lat') || '37.7749')
    const lon = parseFloat(searchParams.get('lon') || '-122.4194')
    const selectedAgentsParam = searchParams.get('selectedAgents')
    const limitParam = searchParams.get('limit')
    const categoryFilter = searchParams.get('category')

    const selectedAgents = selectedAgentsParam ? selectedAgentsParam.split(',') : []
    const limit = limitParam ? parseInt(limitParam) : 10

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'Invalid lat/lon' }, { status: 400 })
    }

    const currentMoment = new Date()

    // Get current alchemical conditions
    const samples = await sampleHourlyAlchm({ latitude: lat, longitude: lon }, currentMoment, {
      hoursToSample: 1,
      startHour: currentMoment.getHours(),
      includePlanetaryHours: true,
    })

    const alchemicalData = samples && samples.length > 0 ? samples[0] : null

    // Calculate recommendations for all agents
    const recommendations: RecommendationScore[] = []

    for (const agent of demoCraftedAgents) {
      const recommendation = calculateMomentScore(
        agent.id,
        currentMoment,
        alchemicalData,
        selectedAgents
      )
      if (recommendation) {
        recommendations.push(recommendation)
      }
    }

    // Filter by category if specified
    let filteredRecommendations = recommendations
    if (
      categoryFilter &&
      ['optimal', 'enhanced', 'compatible', 'challenging', 'neutral'].includes(categoryFilter)
    ) {
      filteredRecommendations = recommendations.filter(r => r.category === categoryFilter)
    }

    // Sort by score (highest first) and apply limit
    const sortedRecommendations = filteredRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // Calculate moment summary
    const hour = currentMoment.getHours()
    const planetaryHours = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
    const currentPlanetaryHour = planetaryHours[hour % 7]

    const momentSummary = {
      timestamp: currentMoment.toISOString(),
      planetaryHour: currentPlanetaryHour,
      location: { latitude: lat, longitude: lon },
      alchemicalConditions: alchemicalData
        ? {
            energy: alchemicalData.Energy,
            heat: alchemicalData.Heat,
            entropy: alchemicalData.Entropy,
            reactivity: alchemicalData.Reactivity,
            dominantElement: Object.entries(alchemicalData.totals).reduce((a, b) =>
              alchemicalData.totals[a[0]] > alchemicalData.totals[b[0]] ? a : b
            )[0],
          }
        : null,
      recommendationCounts: {
        optimal: recommendations.filter(r => r.category === 'optimal').length,
        enhanced: recommendations.filter(r => r.category === 'enhanced').length,
        compatible: recommendations.filter(r => r.category === 'compatible').length,
        challenging: recommendations.filter(r => r.category === 'challenging').length,
        neutral: recommendations.filter(r => r.category === 'neutral').length,
      },
    }

    return NextResponse.json({
      momentSummary,
      recommendations: sortedRecommendations,
      totalAgents: demoCraftedAgents.length,
      selectedAgents,
    })
  } catch (error) {
    console.error('moment-recommendations API error:', error)
    return NextResponse.json({ error: 'Failed to compute moment recommendations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const lat = parseFloat(String(body.lat ?? '37.7749'))
    const lon = parseFloat(String(body.lon ?? '-122.4194'))
    const agentIds = (body.agentIds as string[]) || []
    const moment = body.moment ? new Date(body.moment) : new Date()

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'Invalid lat/lon' }, { status: 400 })
    }

    if (!Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json({ error: 'agentIds array is required' }, { status: 400 })
    }

    // Get current alchemical conditions
    const samples = await sampleHourlyAlchm({ latitude: lat, longitude: lon }, moment, {
      hoursToSample: 1,
      startHour: moment.getHours(),
      includePlanetaryHours: true,
    })

    const alchemicalData = samples && samples.length > 0 ? samples[0] : null

    // Calculate detailed recommendations for specific agents
    const detailedRecommendations = []

    for (const agentId of agentIds) {
      const recommendation = calculateMomentScore(agentId, moment, alchemicalData, agentIds)
      if (recommendation) {
        const agent = demoCraftedAgents.find(a => a.id === agentId)
        const kineticProfile = getAgentKineticProfile(agentId)

        detailedRecommendations.push({
          ...recommendation,
          agentName: agent?.name,
          agentTitle: agent?.title,
          kineticProfile: {
            momentumType: kineticProfile?.momentum_type,
            peakHours: kineticProfile?.peak_hours,
            velocities: {
              creative: kineticProfile?.v_creative || 0,
              linguistic: kineticProfile?.v_linguistic || 0,
              scientific: kineticProfile?.v_scientific || 0,
              strategic: kineticProfile?.v_strategic || 0,
              charismatic: kineticProfile?.v_charismatic || 0,
              inventive: kineticProfile?.v_inventive || 0,
              social: kineticProfile?.v_social || 0,
              psychological: kineticProfile?.v_psychological || 0,
              mystical: kineticProfile?.v_mystical || 0,
              philosophical: kineticProfile?.v_philosophical || 0,
            },
          },
        })
      }
    }

    return NextResponse.json({
      moment: moment.toISOString(),
      location: { latitude: lat, longitude: lon },
      alchemicalConditions: alchemicalData,
      recommendations: detailedRecommendations.sort((a, b) => b.score - a.score),
    })
  } catch (error) {
    console.error('moment-recommendations POST error:', error)
    return NextResponse.json(
      { error: 'Failed to compute detailed recommendations' },
      { status: 500 }
    )
  }
}
