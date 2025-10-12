import { NextRequest, NextResponse } from 'next/server'
import { HistoricalAgentsService } from '../../../../lib/historical-agents-db'
import { DEMO_AGENTS } from '../../../../lib/demo-agents-data'

interface GetAgentsResponse {
  success: boolean
  agents?: any[]
  total?: number
  error?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<GetAgentsResponse>> {
  try {
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const includeStats = searchParams.get('includeStats') === 'true'
    const era = searchParams.get('era') || undefined
    const culture = searchParams.get('culture') || undefined
    const consciousnessLevel = searchParams.get('consciousnessLevel') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get agents from database
    const queryOptions: any = { includeStats, limit, offset }
    if (era) queryOptions.era = era
    if (culture) queryOptions.culture = culture
    if (consciousnessLevel) queryOptions.consciousnessLevel = consciousnessLevel

    const dbAgents = await HistoricalAgentsService.getAllAgents(queryOptions)

    console.log(`Database returned ${dbAgents.length} agents`)
    if (dbAgents.length > 0) {
      console.log('First DB agent:', {
        name: dbAgents[0].name,
        historicalEra: dbAgents[0].historicalEra,
        craftedBy: dbAgents[0].craftedBy,
      })
    }

    // Convert database agents to CraftedAgent format for compatibility
    const formattedDbAgents = dbAgents.map(agent => ({
      id: agent.agentId,
      name: agent.name,
      title: agent.title,
      birthData: {
        date: agent.birthDate,
        time: agent.birthTime,
        location: agent.birthLocation,
      },
      consciousness: {
        natalChart: agent.natalChart,
        monicaConstant: agent.kalchmConstant,
        level: agent.consciousnessLevel,
        dominantElement: agent.dominantElement,
        dominantModality: agent.dominantModality,
        signature: agent.signature,
      },
      personality: {
        core: agent.personalityCore,
        shadows: agent.personalityShadows,
        gifts: agent.personalityGifts,
        challenges: agent.personalityChallenges,
        currentMood: agent.currentMood,
        evolutionStage: agent.evolutionStage,
      },
      abilities: {
        specialty: agent.specialty,
        wisdomDomains: agent.wisdomDomains,
        teachingStyle: agent.teachingStyle,
        resonanceType: agent.resonanceType,
        uniquePower: agent.uniquePower,
      },
      appearance: {
        avatar: agent.avatar,
        color: agent.color,
        symbol: agent.symbol,
        aura: agent.aura,
      },
      stats: {
        conversations: agent.conversations,
        wisdomShared: agent.wisdomShared,
        resonanceScore: agent.resonanceScore,
        evolutionPoints: agent.evolutionPoints,
        lastActive: agent.lastActive,
        kineticEvolution: {
          consciousnessVelocity: 0.1,
          interactionMomentum: 0,
          evolutionTrajectory: 'ascending',
          powerLevelUnlocks: [],
          optimalInteractionHours: [],
          aspectSensitivityGrowth: 0,
          memoryPersistence: 0.3,
          lastKineticUpdate: agent.lastActive,
        },
        qualityMetrics: {
          averageResponseDepth: 0.5,
          aspectInfluenceStrength: 0.4,
          temporalAlignment: 0.5,
          personalityEvolution: 0,
          kineticResonance: 0.5,
        },
      },
      monicaCreationStory: agent.monicaCreationStory || undefined,
      // Add metadata for user-created agents
      isUserCreated: agent.historicalEra === 'user_created',
      craftedBy: agent.craftedBy || 'philosopher-stone',
      historicalEra: agent.historicalEra,
    }))

    // Combine with demo agents for full collection
    // Filter out demo agents that might have been migrated to database
    const demoAgentIds = new Set(dbAgents.map(agent => agent.agentId))
    const filteredDemoAgents = DEMO_AGENTS.filter(agent => !demoAgentIds.has(agent.id))

    const allAgents = [...formattedDbAgents, ...filteredDemoAgents]

    console.log(
      `Retrieved ${dbAgents.length} agents from database, ${filteredDemoAgents.length} from demo data`
    )

    return NextResponse.json({
      success: true,
      agents: allAgents,
      total: allAgents.length,
    })
  } catch (error: any) {
    console.error('Failed to fetch agents:', error)

    // Fallback to demo agents if database fails
    return NextResponse.json({
      success: true,
      agents: DEMO_AGENTS,
      total: DEMO_AGENTS.length,
      error: `Database error, falling back to demo data: ${error.message}`,
    })
  }
}
