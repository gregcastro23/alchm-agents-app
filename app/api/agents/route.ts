import { NextRequest, NextResponse } from 'next/server'
import { backend } from '@/lib/backend'
import { DEMO_AGENTS } from '@/lib/demo-agents-data'

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
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get agents from Railway backend
    const dbAgents = await backend.agents.list({ skip: offset, limit })

    console.log(`Railway backend returned ${dbAgents.length} agents`)

    // Convert backend agents to formatted format for compatibility
    const formattedDbAgents = dbAgents.map((agent: any) => ({
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
        monicaConstant: agent.monicaConstant || 0,
        level: agent.consciousnessLevel || 'Novice',
        dominantElement: agent.dominantElement || 'Earth',
        dominantModality: agent.dominantModality || 'Fixed',
        signature: agent.signature || 'Standard',
      },
      personality: {
        core: agent.personalityCore || {},
        shadows: agent.personalityShadows || [],
        gifts: agent.personalityGifts || [],
        challenges: agent.personalityChallenges || [],
        currentMood: agent.currentMood || 'Neutral',
        evolutionStage: agent.evolutionStage || 0,
      },
      abilities: {
        specialty: agent.specialty,
        wisdomDomains: agent.wisdomDomains || [],
        teachingStyle: agent.teachingStyle || 'Standard',
        resonanceType: agent.resonanceType || 'Standard',
        uniquePower: agent.uniquePower || '',
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
      isUserCreated: agent.historicalEra === 'user_created',
      craftedBy: agent.craftedBy || 'philosopher-stone',
      historicalEra: agent.historicalEra,
    }))

    // Combine with demo agents for full collection
    const demoAgentIds = new Set(dbAgents.map((agent: any) => agent.agentId))
    const filteredDemoAgents = DEMO_AGENTS.filter(agent => !demoAgentIds.has(agent.id))

    const allAgents = [...formattedDbAgents, ...filteredDemoAgents]

    return NextResponse.json({
      success: true,
      agents: allAgents,
      total: allAgents.length,
    })
  } catch (error: any) {
    console.warn('Backend agent fetch unavailable, using demo fallback:', error.message)

    // Fallback to demo agents if backend fails
    return NextResponse.json({
      success: true,
      agents: DEMO_AGENTS,
      total: DEMO_AGENTS.length,
      error: `Backend error, falling back to demo data: ${error.message}`,
    })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const result = await backend.agents.create(body)

    return NextResponse.json({
      success: true,
      agent: result,
    })
  } catch (error: any) {
    console.error('Failed to create agent via backend:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create agent' },
      { status: 500 }
    )
  }
}
