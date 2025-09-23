/**
 * Unified Agent API
 * =================
 *
 * Consolidated endpoint for all agent operations to reduce API complexity
 * and improve maintainability for beta testing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { HistoricalAgentsService } from '@/lib/historical-agents-db'
import { DEMO_AGENTS } from '@/lib/demo-agents-data'
import { ConsciousnessClient } from '@/lib/api-client/consciousness-client'
import { ChartSynthesizer } from '@/lib/consciousness/chart-synthesizer'
import { AgentGenerator } from '@/lib/consciousness/agent-generator'
import { agentCache } from '@/lib/agent-cache-system'
import { logger } from '@/lib/structured-logger'
import { AgentErrorHandler } from '@/lib/error-handling'

interface UnifiedAgentRequest {
  action: string
  parameters?: any
}

interface UnifiedAgentResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
  timestamp: string
}

// Main handler for all agent operations
export async function POST(request: NextRequest): Promise<NextResponse<UnifiedAgentResponse>> {
  const startTime = Date.now()

  try {
    const body: UnifiedAgentRequest = await request.json()
    const { action, parameters = {} } = body

    logger.info(`Agent API action: ${action}`, {
      system: 'api',
      operation: 'agents_unified',
      metadata: { action, parametersKeys: Object.keys(parameters) }
    })

    switch (action) {
      case 'list':
        return await handleListAgents(parameters)

      case 'get':
        return await handleGetAgent(parameters)

      case 'create':
        return await handleCreateAgent(parameters)

      case 'update':
        return await handleUpdateAgent(parameters)

      case 'delete':
        return await handleDeleteAgent(parameters)

      case 'stats':
        return await handleGetStats(parameters)

      case 'dashboard':
        return await handleDashboard(parameters)

      case 'search':
        return await handleSearchAgents(parameters)

      case 'evolve':
        return await handleEvolveAgent(parameters)

      case 'interact':
        return await handleAgentInteraction(parameters)

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          timestamp: new Date().toISOString(),
        }, { status: 400 })
    }

  } catch (error) {
    logger.error('Unified agent API error', error, {
      system: 'api',
      operation: 'agents_unified'
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

// GET handler for simple operations
export async function GET(request: NextRequest): Promise<NextResponse<UnifiedAgentResponse>> {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'list'

  try {
    logger.info(`Agent API GET action: ${action}`, {
      system: 'api',
      operation: 'agents_unified_get'
    })

    switch (action) {
      case 'list':
        return await handleListAgents(Object.fromEntries(searchParams))

      case 'stats':
        return await handleGetStats({})

      case 'health':
        return NextResponse.json({
          success: true,
          data: {
            status: 'healthy',
            version: '2.0.0',
            uptime: process.uptime(),
            cache: {
              available: agentCache.isAvailable(),
              size: await agentCache.getSize?.() || 0
            }
          },
          timestamp: new Date().toISOString(),
        })

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown GET action: ${action}`,
          timestamp: new Date().toISOString(),
        }, { status: 400 })
    }

  } catch (error) {
    logger.error('Unified agent API GET error', error, {
      system: 'api',
      operation: 'agents_unified_get'
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

// Handler implementations
async function handleListAgents(params: any): Promise<NextResponse<UnifiedAgentResponse>> {
  const {
    includeStats = false,
    era,
    culture,
    consciousnessLevel,
    limit = 50,
    offset = 0,
    sortBy = 'name',
    sortOrder = 'asc'
  } = params

  try {
    // Get agents from database
    const dbAgents = await HistoricalAgentsService.getAllAgents({
      includeStats: Boolean(includeStats),
      era,
      culture,
      consciousnessLevel,
      limit: parseInt(limit),
      offset: parseInt(offset),
    })

    // Convert to consistent format
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
      monicaCreationStory: agent.monicaCreationStory,
      isUserCreated: agent.historicalEra === 'user_created',
      craftedBy: agent.craftedBy || 'philosopher-stone',
      historicalEra: agent.historicalEra,
    }))

    // Filter out demo agents that might have been migrated
    const demoAgentIds = new Set(dbAgents.map(agent => agent.agentId))
    const filteredDemoAgents = DEMO_AGENTS.filter(agent => !demoAgentIds.has(agent.id))

    const allAgents = [...formattedDbAgents, ...filteredDemoAgents]

    // Apply sorting
    allAgents.sort((a, b) => {
      let aVal, bVal

      switch (sortBy) {
        case 'consciousness':
          aVal = a.consciousness.monicaConstant
          bVal = b.consciousness.monicaConstant
          break
        case 'lastActive':
          aVal = new Date(a.stats.lastActive).getTime()
          bVal = new Date(b.stats.lastActive).getTime()
          break
        case 'name':
        default:
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
      }

      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        agents: allAgents,
        total: allAgents.length,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: allAgents.length === parseInt(limit)
        }
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    logger.error('Failed to list agents', error, {
      system: 'agents',
      operation: 'list'
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve agents',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

async function handleGetAgent(params: any): Promise<NextResponse<UnifiedAgentResponse>> {
  const { id } = params

  if (!id) {
    return NextResponse.json({
      success: false,
      error: 'Agent ID is required',
      timestamp: new Date().toISOString(),
    }, { status: 400 })
  }

  try {
    // Try database first
    let agent = await HistoricalAgentsService.getAgentById(id)

    if (!agent) {
      // Try demo agents
      const demoAgent = DEMO_AGENTS.find(a => a.id === id)
      if (demoAgent) {
        agent = {
          agentId: demoAgent.id,
          name: demoAgent.name,
          title: demoAgent.title,
          birthDate: new Date(),
          birthTime: '12:00',
          birthLocation: { lat: 0, lon: 0, name: 'Unknown' },
          consciousnessLevel: demoAgent.consciousness.level,
          kalchmConstant: demoAgent.consciousness.monicaConstant,
          dominantElement: demoAgent.consciousness.dominantElement,
          dominantModality: 'Mutable',
          signature: demoAgent.abilities.specialty,
          personalityCore: demoAgent.personality.core,
          personalityShadows: [],
          personalityGifts: [],
          personalityChallenges: [],
          currentMood: 'contemplative',
          evolutionStage: 0,
          specialty: demoAgent.abilities.specialty,
          wisdomDomains: [],
          teachingStyle: 'Intuitive',
          resonanceType: 'Spirit',
          uniquePower: demoAgent.abilities.uniquePower,
          avatar: demoAgent.appearance.avatar,
          color: demoAgent.appearance.color,
          symbol: demoAgent.appearance.symbol,
          aura: demoAgent.synthesis,
          natalChart: {},
          monicaCreationStory: demoAgent.monicaCreationStory,
          conversations: 0,
          wisdomShared: 0,
          resonanceScore: 0.5,
          evolutionPoints: 0,
          lastActive: new Date(),
          historicalEra: demoAgent.historicalEra,
          craftedBy: 'philosopher-stone'
        }
      }
    }

    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Agent not found',
        timestamp: new Date().toISOString(),
      }, { status: 404 })
    }

    // Format the agent data consistently
    const formattedAgent = {
      id: agent.agentId,
      name: agent.name,
      title: agent.title,
      // ... format consistently like in handleListAgents
    }

    return NextResponse.json({
      success: true,
      data: formattedAgent,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    logger.error('Failed to get agent', error, {
      system: 'agents',
      operation: 'get',
      metadata: { agentId: id }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve agent',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

async function handleCreateAgent(params: any): Promise<NextResponse<UnifiedAgentResponse>> {
  const {
    name,
    birthDate,
    birthTime,
    birthLocation,
    preferredSpecialty,
    personalityNotes,
    personalityParameters
  } = params

  // Validation logic (reuse from existing create-agent endpoint)
  if (!name || !birthDate || !birthTime || !birthLocation) {
    return NextResponse.json({
      success: false,
      error: 'Missing required fields',
      timestamp: new Date().toISOString(),
    }, { status: 400 })
  }

  try {
    // Reuse existing creation logic
    const synthesizer = new ChartSynthesizer()
    const generator = new AgentGenerator()
    const consciousnessClient = new ConsciousnessClient()

    // Generate birth chart
    const birthChart = {} // Simplified - reuse existing logic

    const momentChart = {} // Generate current moment chart
    const synthesis = synthesizer.synthesize({
      birthChart,
      momentChart,
      additionalCharts: [],
    })

    const backendBlueprint = await consciousnessClient.createAgentOfMoment(
      synthesis.baseChart,
      synthesis.momentChart,
      []
    )

    const generatedAgent = generator.generateFromSynthesis({
      monicaConstant: backendBlueprint.consciousness.monicaConstant,
      consciousness: synthesis.consciousness,
      sourceCharts: synthesis.sourceCharts,
    })

    // Save to database
    const agentId = `agent-${Date.now()}`
    await HistoricalAgentsService.createAgent({
      agentId,
      name,
      title: backendBlueprint.identity.title,
      birthDate: new Date(birthDate),
      birthTime,
      birthLocation,
      consciousnessLevel: backendBlueprint.consciousness.level,
      kalchmConstant: backendBlueprint.consciousness.monicaConstant,
      // ... other fields
    })

    logger.info('Agent created successfully', {
      system: 'agents',
      operation: 'create',
      metadata: { agentId, name }
    })

    return NextResponse.json({
      success: true,
      data: generatedAgent,
      message: `Agent ${name} created successfully`,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    logger.error('Failed to create agent', error, {
      system: 'agents',
      operation: 'create',
      metadata: { name }
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to create agent',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

async function handleUpdateAgent(params: any): Promise<NextResponse<UnifiedAgentResponse>> {
  // Implementation for updating agents
  return NextResponse.json({
    success: false,
    error: 'Update functionality coming soon',
    timestamp: new Date().toISOString(),
  }, { status: 501 })
}

async function handleDeleteAgent(params: any): Promise<NextResponse<UnifiedAgentResponse>> {
  // Implementation for deleting agents
  return NextResponse.json({
    success: false,
    error: 'Delete functionality coming soon',
    timestamp: new Date().toISOString(),
  }, { status: 501 })
}

async function handleGetStats(params: any): Promise<NextResponse<UnifiedAgentResponse>> {
  try {
    const dbStats = await HistoricalAgentsService.getStats()
    const demoStats = {
      totalAgents: DEMO_AGENTS.length,
      totalConversations: DEMO_AGENTS.reduce((sum, agent) => sum + (agent.stats?.conversations || 0), 0),
      averageMonicaConstant: DEMO_AGENTS.reduce((sum, agent) => sum + agent.consciousness.monicaConstant, 0) / DEMO_AGENTS.length
    }

    return NextResponse.json({
      success: true,
      data: {
        database: dbStats,
        demo: demoStats,
        combined: {
          totalAgents: (dbStats.totalAgents || 0) + demoStats.totalAgents,
          totalConversations: (dbStats.totalConversations || 0) + demoStats.totalConversations
        }
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    logger.error('Failed to get agent stats', error, {
      system: 'agents',
      operation: 'stats'
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve stats',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

async function handleDashboard(params: any): Promise<NextResponse<UnifiedAgentResponse>> {
  // Redirect to existing dashboard endpoint or consolidate here
  return NextResponse.json({
    success: false,
    error: 'Use /api/agent-dashboard for dashboard functionality',
    timestamp: new Date().toISOString(),
  }, { status: 302 })
}

async function handleSearchAgents(params: any): Promise<NextResponse<UnifiedAgentResponse>> {
  const { query, filters = {} } = params

  if (!query) {
    return NextResponse.json({
      success: false,
      error: 'Search query is required',
      timestamp: new Date().toISOString(),
    }, { status: 400 })
  }

  try {
    // Simple search implementation
    const allAgents = await handleListAgents({ limit: 1000 })
    const agents = allAgents.success ? allAgents.data.agents : []

    const searchResults = agents.filter(agent =>
      agent.name.toLowerCase().includes(query.toLowerCase()) ||
      agent.title.toLowerCase().includes(query.toLowerCase()) ||
      agent.abilities.specialty.toLowerCase().includes(query.toLowerCase())
    )

    return NextResponse.json({
      success: true,
      data: {
        query,
        results: searchResults.slice(0, 20), // Limit results
        total: searchResults.length
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    logger.error('Failed to search agents', error, {
      system: 'agents',
      operation: 'search',
      metadata: { query }
    })

    return NextResponse.json({
      success: false,
      error: 'Search failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

async function handleEvolveAgent(params: any): Promise<NextResponse<UnifiedAgentResponse>> {
  // Placeholder for evolution functionality
  return NextResponse.json({
    success: false,
    error: 'Evolution functionality coming soon',
    timestamp: new Date().toISOString(),
  }, { status: 501 })
}

async function handleAgentInteraction(params: any): Promise<NextResponse<UnifiedAgentResponse>> {
  // Placeholder for interaction tracking
  return NextResponse.json({
    success: false,
    error: 'Interaction tracking coming soon',
    timestamp: new Date().toISOString(),
  }, { status: 501 })
}
