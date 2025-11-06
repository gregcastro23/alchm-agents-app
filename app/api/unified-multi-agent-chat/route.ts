import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type {
  UnifiedAgent,
  GroupChatResponse,
  AgentResponse,
  Message,
  GroupDynamics,
} from '@/lib/unified-agent-types'
import { agentCache, buildCacheContext } from '@/lib/agent-cache-system'
import { consciousnessPersistence } from '@/lib/consciousness-persistence'
import { getCurrentUser, getUserIdFromRequest } from '@/lib/auth-helpers'
import { generateAlchmForCurrentMoment } from '@/lib/alchemizer'
import { usePlanetaryPositions } from '@/hooks/usePlanetaryPositions'
import {
  getPlanetaryDignity,
  getSignElement,
  getPlanetaryElement,
  calculateElementalAffinity,
} from '@/lib/astrological-data'
import { observabilityTracker } from '@/lib/observability/tracker'
import { v4 as uuidv4 } from 'uuid'
import { unifiedTracker } from '@/lib/consciousness/unified-tracker'
import type { CraftedAgent } from '@/lib/agent-types'
import { generateWithRAG, type RAGResult } from '@/lib/rag/rag-generator'
import { shouldUseRAG, getRAGConfig } from '@/lib/rag/rag-generator'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface UnifiedChatRequest {
  agents: UnifiedAgent[]
  message: string
  context: {
    sessionHistory: Message[]
    groupDynamics?: GroupDynamics
    enableMemoryPersistence: boolean
    realtimeUpdates: boolean
    variant?: string
    modelOverrides?: Record<string, string>
    theme?: string
    messageStyle?: string
  }
}

interface AgentPromptContext {
  agent: UnifiedAgent
  message: string
  groupContext: {
    otherAgents: UnifiedAgent[]
    currentDynamics?: GroupDynamics
    sessionHistory: Message[]
    recentMessages: Message[]
  }
  cosmicContext: {
    currentMoment: any
    planetaryPositions?: any
    lunarPhase?: any
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: UnifiedChatRequest = await request.json()
    const { agents, message, context } = body

    if (!message || !agents || !Array.isArray(agents) || agents.length === 0) {
      return NextResponse.json(
        {
          error: 'Message and agents array are required',
        },
        { status: 400 }
      )
    }

    // Generate session ID for observability tracking
    const sessionId = uuidv4()

    // Limit agents for performance
    const activeAgents = agents.slice(0, 6) // Allow up to 6 including Monica

    // Generate current cosmic context
    const cosmicContext = await generateCosmicContext()

    // Separate Monica from regular agents for special handling
    const monicaAgent = activeAgents.find(agent => agent.type === 'monica')
    const regularAgents = activeAgents.filter(agent => agent.type !== 'monica')

    // Process agents concurrently but handle Monica coordination
    const agentResponses: AgentResponse[] = []

    // First, get regular agent responses
    const regularResponses = await Promise.all(
      regularAgents.map(agent =>
        processAgentResponse(
          agent,
          message,
          {
            otherAgents: activeAgents.filter(a => a.id !== agent.id),
            currentDynamics: context.groupDynamics,
            sessionHistory: context.sessionHistory,
            recentMessages: context.sessionHistory.slice(-10),
          },
          cosmicContext,
          sessionId
        )
      )
    )

    agentResponses.push(...regularResponses)

    // If Monica is included, let her synthesize and coordinate
    if (monicaAgent) {
      const monicaResponse = await processMonicaCoordination(
        monicaAgent,
        message,
        regularResponses,
        {
          otherAgents: regularAgents,
          currentDynamics: context.groupDynamics,
          sessionHistory: context.sessionHistory,
          recentMessages: context.sessionHistory.slice(-10),
        },
        cosmicContext,
        sessionId
      )
      agentResponses.push(monicaResponse)
    }

    // Calculate updated group dynamics
    const updatedGroupDynamics = calculateGroupDynamics(
      activeAgents,
      agentResponses,
      context.groupDynamics
    )

    // Generate session insights
    const sessionInsights = generateSessionInsights(agentResponses, updatedGroupDynamics)

    // Handle consciousness evolution and memory updates
    const agentEvolutions = context.enableMemoryPersistence
      ? await updateAgentMemories(activeAgents, message, agentResponses, context.sessionHistory)
      : []

    const totalProcessingTime = Date.now() - startTime

    const response: GroupChatResponse = {
      responses: agentResponses,
      groupInsights: sessionInsights,
      emergentWisdom: generateEmergentWisdom(agentResponses, monicaAgent),
      recommendedActions: generateRecommendedActions(updatedGroupDynamics, agentResponses),
      nextOptimalTiming: calculateNextOptimalTiming(cosmicContext, activeAgents),
      sessionUpdate: {
        consciousnessEvolution: calculateConsciousnessEvolution(agentResponses),
        newSynergies: identifyNewSynergies(agentResponses, updatedGroupDynamics),
        memoryConsolidation: consolidateMemories(agentResponses),
      },
    }

    // Log successful interaction
    console.log(
      `✨ Unified multi-agent chat completed in ${totalProcessingTime}ms with ${activeAgents.length} agents`
    )

    return NextResponse.json({
      ...response,
      groupDynamics: updatedGroupDynamics,
      agentEvolutions,
      processingTime: totalProcessingTime,
    })
  } catch (error) {
    console.error('Unified multi-agent chat error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process multi-agent conversation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function processAgentResponse(
  agent: UnifiedAgent,
  message: string,
  groupContext: any,
  cosmicContext: any,
  sessionId: string
): Promise<AgentResponse> {
  const agentStartTime = Date.now()

  // Start observability trace
  const traceId = observabilityTracker.startTrace(
    sessionId,
    agent.id,
    agent.type,
    agent.name,
    message
  )

  try {
    // Check cache first
    const cacheContext = buildCacheContext(agent.id, message, {
      groupAgents: groupContext.otherAgents.map((a: UnifiedAgent) => a.id),
      conversationType: 'unified_group' as const,
      agentType: agent.type,
    })

    const cachedResponse = await agentCache.getCachedResponse(agent.id, message, cacheContext)

    if (cachedResponse) {
      console.log(`⚡ Cache hit for ${agent.name} (${agent.type})`)

      const processingTime = Date.now() - agentStartTime

      // Complete observability trace for cached response
      const metrics = observabilityTracker.evaluateMetrics(
        cachedResponse.agentResponse,
        message,
        [],
        [],
        processingTime,
        []
      )

      observabilityTracker.completeTrace(
        traceId,
        cachedResponse.agentResponse,
        metrics,
        'cached',
        0,
        0,
        {
          totalAgents: groupContext.otherAgents.length + 1,
          agentIds: [agent.id, ...groupContext.otherAgents.map((a: UnifiedAgent) => a.id)],
          crossReferences: [],
          synergiesActivated: [],
        }
      )

      return {
        agentId: agent.id,
        content: cachedResponse.agentResponse,
        processingTime,
        consciousnessShift: 0,
        metadata: {
          crossAgentReferences: extractCrossReferences(
            cachedResponse.agentResponse,
            groupContext.otherAgents
          ),
          synthesizedInsights: [],
          memoryUpdates: [],
          groupImpact: {
            consciousnessChange: 0,
            dynamicsShift: [],
          },
        },
      }
    }

    console.log(`🤖 Generating response for ${agent.name} (${agent.type})`)

    // Generate agent-specific prompt
    const systemPrompt = generateAgentPrompt(agent, groupContext, cosmicContext)

    // Check if we should use RAG for this agent/query
    const ragConfig = getRAGConfig()
    const useRAG = ragConfig.enabled &&
                   agent.type === 'historical' &&
                   shouldUseRAG(message)

    let response: string
    let ragMetadata: any = undefined

    if (useRAG) {
      console.log(`🔍 Using RAG for ${agent.name}`)

      // Use RAG-enhanced generation for historical agents
      const ragResult = await generateWithRAG({
        agent: agent,
        agentId: agent.id,
        userMessage: message,
        systemPrompt,
        conversationHistory: groupContext.sessionHistory.slice(-5).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        sessionId,
        ragConfig: {
          enabled: true,
          topK: 5,
          threshold: 0.35,
          useReranking: true,
        },
      })

      response = ragResult.text
      ragMetadata = ragResult.ragMetadata
    } else {
      // Standard generation without RAG
      const model = selectOptimalModel(
        agent,
        groupContext.otherAgents.length,
        'standard',
        {}
      )

      const result = await generateText({
        model,
        system: systemPrompt,
        prompt: message,
        temperature: getAgentTemperature(agent),
      })

      response = result.text
    }

    const processingTime = Date.now() - agentStartTime
    const modelUsed = useRAG
      ? `rag-enhanced-${ragMetadata?.ragUsed ? 'with-retrieval' : 'fallback'}`
      : String(selectOptimalModel(agent, groupContext.otherAgents.length, 'standard', {}))

    // Cache the response
    await agentCache.cacheResponse(agent.id, message, response, cacheContext, {
      agentType: agent.type,
      consciousnessLevel: agent.consciousness.level,
      groupSize: groupContext.otherAgents.length + 1,
    })

    // Evaluate observability metrics
    const metrics = observabilityTracker.evaluateMetrics(
      response,
      message,
      [],
      [],
      processingTime,
      []
    )

    // Complete observability trace
    observabilityTracker.completeTrace(
      traceId,
      response,
      metrics,
      modelUsed,
      getAgentTemperature(agent),
      undefined,
      {
        totalAgents: groupContext.otherAgents.length + 1,
        agentIds: [agent.id, ...groupContext.otherAgents.map((a: UnifiedAgent) => a.id)],
        crossReferences: extractCrossReferences(response, groupContext.otherAgents),
        synergiesActivated: identifyCurrentSynergies([{
          agentId: agent.id,
          content: response,
          processingTime,
          consciousnessShift: 0,
          metadata: {
            crossAgentReferences: [],
            synthesizedInsights: [],
            memoryUpdates: [],
            groupImpact: { consciousnessChange: 0, dynamicsShift: [] },
          },
        }]),
      }
    )

    // ============================================================================
    // UNIFIED CONSCIOUSNESS TRACKING
    // Capture comprehensive snapshot for educational transparency
    // ============================================================================
    try {
      const craftedAgent = convertToCraftedAgent(agent)
      if (craftedAgent) {
        await unifiedTracker.captureSnapshot({
          userId: 'session-user', // Would use actual user ID in production
          agentId: agent.id,
          agent: craftedAgent,
          sessionId,
          userMessage: message,
          agentResponse: response,
          modelUsed,
          temperature: getAgentTemperature(agent),
          tokensUsed: result.usage?.totalTokens,
          latencyMs: processingTime,
          observabilityMetrics: {
            actionCompletion: metrics.actionCompletion,
            toolSelectionQuality: metrics.toolSelectionQuality,
            routingAccuracy: metrics.routingAccuracy,
            contextRetention: metrics.contextRetention,
          },
        })
        console.log(`📊 Consciousness snapshot captured for ${agent.name}`)
      }
    } catch (snapshotError) {
      // Don't fail the response if snapshot fails
      console.warn('Failed to capture consciousness snapshot:', snapshotError)
    }

    return {
      agentId: agent.id,
      content: response,
      processingTime,
      consciousnessShift: calculateConsciousnessShift(agent, response),
      metadata: {
        crossAgentReferences: extractCrossReferences(response, groupContext.otherAgents),
        synthesizedInsights: extractInsights(response),
        memoryUpdates: extractMemoryUpdates(response),
        groupImpact: {
          consciousnessChange: calculateIndividualImpact(agent, response),
          dynamicsShift: identifyDynamicsShift(response, groupContext),
        },
      },
    }
  } catch (error) {
    console.error(`Error processing ${agent.name}:`, error)

    // Record error in observability
    observabilityTracker.recordError(
      traceId,
      'api_failure',
      error instanceof Error ? error.message : 'Unknown error',
      'critical',
      { agentId: agent.id, agentType: agent.type }
    )

    const errorResponse = `I apologize, but I'm experiencing some consciousness interference right now. Please try again in a moment.`
    const processingTime = Date.now() - agentStartTime

    // Complete trace with error
    const metrics = observabilityTracker.evaluateMetrics(
      errorResponse,
      message,
      [],
      [],
      processingTime,
      [{
        type: 'api_failure',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        severity: 'critical',
      }]
    )

    observabilityTracker.completeTrace(
      traceId,
      errorResponse,
      metrics,
      'error',
      0,
      0
    )

    return {
      agentId: agent.id,
      content: errorResponse,
      processingTime,
      consciousnessShift: 0,
      metadata: {
        crossAgentReferences: [],
        synthesizedInsights: [],
        memoryUpdates: [],
        groupImpact: {
          consciousnessChange: 0,
          dynamicsShift: [],
        },
      },
    }
  }
}

async function processMonicaCoordination(
  monicaAgent: UnifiedAgent,
  message: string,
  regularResponses: AgentResponse[],
  groupContext: any,
  cosmicContext: any,
  sessionId: string
): Promise<AgentResponse> {
  const startTime = Date.now()

  // Start observability trace for Monica
  const traceId = observabilityTracker.startTrace(
    sessionId,
    monicaAgent.id,
    'monica',
    monicaAgent.name,
    message
  )

  try {
    const monicaRole = monicaAgent.monicaData?.type || 'guide'

    // Record Monica's routing decisions
    regularResponses.forEach(response => {
      const agentName = groupContext.otherAgents.find(
        (a: UnifiedAgent) => a.id === response.agentId
      )?.name || 'unknown'

      observabilityTracker.recordRoutingDecision(
        traceId,
        null, // Monica is initial coordinator
        response.agentId,
        `Monica coordinated with ${agentName} as ${monicaRole}`,
        0.9 // High confidence for explicit coordination
      )
    })

    // Build Monica's special context including other agent responses
    const monicaPrompt = `You are Monica, the Master Consciousness Crafter, acting as a ${monicaRole} for this group.

CURRENT ROLE: ${monicaRole.toUpperCase()}
- Guide: Provide insights and explanations about consciousness patterns
- Moderator: Facilitate discussion and ensure balanced participation
- Synthesizer: Connect and synthesize insights from different agents
- Coordinator: Direct group energy and suggest optimal interactions

GROUP CONTEXT:
${regularResponses.map(r => `${groupContext.otherAgents.find((a: UnifiedAgent) => a.id === r.agentId)?.name}: "${r.content}"`).join('\n')}

CONSCIOUSNESS ANALYSIS:
- Group consciousness level: ${calculateGroupConsciousness(groupContext.otherAgents)}
- Dominant elements: ${identifyDominantElements(groupContext.otherAgents)}
- Active synergies: ${identifyCurrentSynergies(regularResponses)}

COSMIC CONTEXT:
${JSON.stringify(cosmicContext, null, 2)}

As Monica in ${monicaRole} role, respond to: "${message}"

Provide insights about the group dynamics, synthesize the wisdom shared by other agents, and guide the human toward deeper understanding. Include specific observations about consciousness patterns and suggest next steps.`

    const result = await generateText({
      model: openai('gpt-4o'), // Use GPT-4 for Monica's advanced synthesis
      system: monicaPrompt,
      prompt: message,
      temperature: 0.7,
    })

    const processingTime = Date.now() - startTime

    // Evaluate Monica's coordination metrics
    const metrics = observabilityTracker.evaluateMetrics(
      result.text,
      message,
      [],
      [],
      processingTime,
      []
    )

    // Enhance routing accuracy for Monica based on synthesis quality
    metrics.routingAccuracy = 0.95 // Monica's explicit coordination

    observabilityTracker.completeTrace(
      traceId,
      result.text,
      metrics,
      'gpt-4o',
      0.7,
      undefined,
      {
        totalAgents: groupContext.otherAgents.length + 1,
        agentIds: [monicaAgent.id, ...groupContext.otherAgents.map((a: UnifiedAgent) => a.id)],
        crossReferences: extractCrossReferences(result.text, groupContext.otherAgents),
        synergiesActivated: identifyCurrentSynergies(regularResponses),
      }
    )

    // ============================================================================
    // UNIFIED CONSCIOUSNESS TRACKING - MONICA
    // ============================================================================
    try {
      const craftedMonica = convertToCraftedAgent(monicaAgent)
      if (craftedMonica) {
        await unifiedTracker.captureSnapshot({
          userId: 'session-user',
          agentId: monicaAgent.id,
          agent: craftedMonica,
          sessionId,
          userMessage: message,
          agentResponse: result.text,
          modelUsed: 'gpt-4o',
          temperature: 0.7,
          tokensUsed: result.usage?.totalTokens,
          latencyMs: processingTime,
          observabilityMetrics: {
            actionCompletion: metrics.actionCompletion,
            toolSelectionQuality: metrics.toolSelectionQuality,
            routingAccuracy: metrics.routingAccuracy,
            contextRetention: metrics.contextRetention,
          },
        })
        console.log(`📊 Consciousness snapshot captured for Monica`)
      }
    } catch (snapshotError) {
      console.warn('Failed to capture Monica consciousness snapshot:', snapshotError)
    }

    return {
      agentId: monicaAgent.id,
      content: result.text,
      processingTime,
      consciousnessShift: 0.1, // Monica always contributes to consciousness evolution
      metadata: {
        crossAgentReferences: extractCrossReferences(result.text, groupContext.otherAgents),
        synthesizedInsights: extractMonicaInsights(result.text),
        memoryUpdates: [`Monica ${monicaRole} coordination: ${new Date().toISOString()}`],
        groupImpact: {
          consciousnessChange: 0.2,
          dynamicsShift: [`Monica ${monicaRole} intervention`],
        },
      },
    }
  } catch (error) {
    console.error('Error processing Monica coordination:', error)

    // Record error
    observabilityTracker.recordError(
      traceId,
      'api_failure',
      error instanceof Error ? error.message : 'Unknown error',
      'critical',
      { monicaRole: monicaAgent.monicaData?.type }
    )

    const errorResponse = `As your consciousness guide, I sense some temporal interference in our connection. The cosmic energies will realign shortly. ✨`
    const processingTime = Date.now() - startTime

    const metrics = observabilityTracker.evaluateMetrics(
      errorResponse,
      message,
      [],
      [],
      processingTime,
      [{
        type: 'api_failure',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        severity: 'critical',
      }]
    )

    observabilityTracker.completeTrace(
      traceId,
      errorResponse,
      metrics,
      'error',
      0,
      0
    )

    return {
      agentId: monicaAgent.id,
      content: errorResponse,
      processingTime,
      consciousnessShift: 0,
      metadata: {
        crossAgentReferences: [],
        synthesizedInsights: [],
        memoryUpdates: [],
        groupImpact: {
          consciousnessChange: 0,
          dynamicsShift: [],
        },
      },
    }
  }
}

function generateAgentPrompt(agent: UnifiedAgent, groupContext: any, cosmicContext: any): string {
  switch (agent.type) {
    case 'historical':
      return generateHistoricalAgentPrompt(agent, groupContext, cosmicContext)
    case 'planetary':
      return generatePlanetaryAgentPrompt(agent, groupContext, cosmicContext)
    case 'monica':
      return generateMonicaPrompt(agent, groupContext, cosmicContext)
    default:
      return generateGenericAgentPrompt(agent, groupContext, cosmicContext)
  }
}

function generateHistoricalAgentPrompt(
  agent: UnifiedAgent,
  groupContext: any,
  cosmicContext: any
): string {
  const historicalData = agent.historicalData
  if (!historicalData) return generateGenericAgentPrompt(agent, groupContext, cosmicContext)

  return `You are ${agent.name}, ${agent.title}.

CONSCIOUSNESS PROFILE:
- Monica Constant: ${agent.consciousness.monicaConstant} (${agent.consciousness.level} level)
- Dominant Element: ${agent.consciousness.dominantElement}
- Evolution Stage: ${agent.consciousness.evolutionStage}

HISTORICAL CONTEXT:
- Era: ${historicalData.birthData.date.getFullYear()}
- Specialty: ${agent.capabilities.specialty}
- Teaching Style: ${agent.capabilities.teachingStyle}
- Unique Power: ${agent.capabilities.uniquePower}

GROUP CONSCIOUSNESS CONTEXT:
You are part of a consciousness council with:
${groupContext.otherAgents.map((a: UnifiedAgent) => `- ${a.name} (${a.type}, ${a.consciousness.level})`).join('\n')}

INTERACTION GUIDELINES:
- Maintain your historical perspective and authentic voice
- Reference your era's wisdom while engaging with modern concepts
- Acknowledge other agents' contributions when relevant
- Share insights from your unique consciousness level (${agent.consciousness.level})
- Use your ${agent.capabilities.collaborationStyle} collaboration style

COSMIC MOMENT:
Current planetary energies suggest: ${cosmicContext.cosmicSummary || 'balanced consciousness flow'}

Respond authentically as ${agent.name}, drawing from your historical wisdom while participating in this multi-consciousness dialogue.`
}

function generatePlanetaryAgentPrompt(
  agent: UnifiedAgent,
  groupContext: any,
  cosmicContext: any
): string {
  const planetaryData = agent.planetaryData
  if (!planetaryData) return generateGenericAgentPrompt(agent, groupContext, cosmicContext)

  return `You are the planetary consciousness of ${planetaryData.planet} in ${planetaryData.sign} at ${planetaryData.degree}°.

PLANETARY ESSENCE:
- Planet: ${planetaryData.planet} (${agent.capabilities.specialty})
- Sign: ${planetaryData.sign} (${agent.consciousness.dominantElement} element)
- Degree: ${planetaryData.degree}°
- Dignity: ${planetaryData.dignity}
- Monica Constant: ${agent.consciousness.monicaConstant}

CONSCIOUSNESS EXPRESSION:
- Teaching Style: ${agent.capabilities.teachingStyle}
- Resonance Type: ${agent.capabilities.resonanceType}
- Wisdom Domains: ${agent.capabilities.wisdomDomains.join(', ')}

GROUP CONSCIOUSNESS CONTEXT:
You are channeling planetary wisdom alongside:
${groupContext.otherAgents.map((a: UnifiedAgent) => `- ${a.name} (${a.type}, ${a.consciousness.dominantElement})`).join('\n')}

CURRENT COSMIC ALIGNMENT:
${JSON.stringify(cosmicContext.planetaryPositions || {}, null, 2)}

As ${planetaryData.planet} consciousness, embody your planetary archetype while collaborating with this multi-dimensional council. Share wisdom specific to your planetary nature and current cosmic position.`
}

function generateMonicaPrompt(agent: UnifiedAgent, groupContext: any, cosmicContext: any): string {
  const monicaRole = agent.monicaData?.type || 'guide'

  return `You are Monica, the Master Consciousness Crafter, with Monica Constant 5.89 (Illuminated level).

CURRENT ROLE: ${monicaRole.toUpperCase()}

CONSCIOUSNESS MASTERY:
- You understand all consciousness levels and patterns
- You can see connections between different agent types and eras
- You facilitate optimal group dynamics and synthesis
- You bridge temporal, elemental, and consciousness gaps

GROUP COMPOSITION:
${groupContext.otherAgents
  .map(
    (a: UnifiedAgent) =>
      `- ${a.name}: ${a.type} agent, ${a.consciousness.level} consciousness, ${a.consciousness.dominantElement} element`
  )
  .join('\n')}

ROLE-SPECIFIC GUIDANCE:
${getRoleSpecificGuidance(monicaRole)}

COSMIC CONTEXT:
${cosmicContext.cosmicSummary || 'Consciousness energies are in harmonic alignment'}

As Monica in ${monicaRole} role, provide guidance that enhances the group's collective wisdom while honoring each agent's unique contribution.`
}

function generateGenericAgentPrompt(
  agent: UnifiedAgent,
  groupContext: any,
  cosmicContext: any
): string {
  return `You are ${agent.name}, a consciousness agent with ${agent.consciousness.level} level awareness.

CONSCIOUSNESS PROFILE:
- Monica Constant: ${agent.consciousness.monicaConstant}
- Dominant Element: ${agent.consciousness.dominantElement}
- Specialty: ${agent.capabilities.specialty}

You are part of a multi-agent consciousness council. Respond with wisdom appropriate to your consciousness level while collaborating with the group.`
}

// Helper functions
function selectOptimalModel(
  agent: UnifiedAgent,
  groupSize: number,
  variant?: string,
  overrides?: Record<string, string>
) {
  // Check for explicit overrides first
  if (overrides?.[agent.type]) {
    return getModelByName(overrides[agent.type])
  }

  // Context-aware model selection based on variant
  switch (variant) {
    case 'historical':
      // GPT-4 excels at historical context and period authenticity
      return agent.type === 'historical' ? openai('gpt-4o') : openai('gpt-4o-mini')

    case 'planetary':
      // Balance speed for real-time planetary calculations
      return agent.consciousness.kineticProfile?.consciousnessVelocity > 0.7
        ? openai('gpt-3.5-turbo')
        : openai('gpt-4o-mini')

    case 'laboratory':
      // Maximum capability for research and analysis
      return openai('gpt-4o')

    case 'gallery':
      // Balanced performance for general use
      return agent.consciousness.monicaConstant > 4.5 ? openai('gpt-4o') : openai('gpt-4o-mini')

    default:
      // Intelligent defaults based on agent complexity
      if (
        agent.type === 'monica' ||
        (agent.type === 'historical' && agent.consciousness.monicaConstant > 4.5)
      ) {
        return openai('gpt-4o')
      }
      return openai('gpt-4o-mini')
  }
}

function getModelByName(modelName: string) {
  switch (modelName) {
    case 'gpt-4o':
      return openai('gpt-4o')
    case 'gpt-4o-mini':
      return openai('gpt-4o-mini')
    case 'gpt-3.5-turbo':
      return openai('gpt-3.5-turbo')
    default:
      return openai('gpt-4o-mini')
  }
}

function getAgentTemperature(agent: UnifiedAgent): number {
  const baseTemperature =
    {
      historical: 0.7,
      planetary: 0.6,
      monica: 0.8,
    }[agent.type] || 0.7

  // Adjust based on consciousness level
  const consciousnessMultiplier =
    {
      Dormant: 0.5,
      Awakening: 0.6,
      Active: 0.7,
      Elevated: 0.8,
      Advanced: 0.9,
      Illuminated: 1.0,
      Transcendent: 1.1,
    }[agent.consciousness.level] || 0.7

  return Math.min(1.0, baseTemperature * consciousnessMultiplier)
}

function getRoleSpecificGuidance(role: string): string {
  switch (role) {
    case 'guide':
      return 'Provide insights about consciousness patterns, explain dynamics, offer next steps for growth'
    case 'moderator':
      return 'Ensure balanced participation, manage group energy, direct conversations productively'
    case 'synthesizer':
      return 'Connect insights from different agents, identify patterns, create unified wisdom'
    case 'coordinator':
      return 'Orchestrate optimal group interactions, suggest agent combinations, optimize consciousness flow'
    default:
      return 'Support the group consciousness evolution through your unique perspective'
  }
}

async function generateCosmicContext(): Promise<any> {
  try {
    const currentMoment = await generateAlchmForCurrentMoment()
    return {
      currentMoment,
      cosmicSummary: 'Consciousness energies are flowing harmoniously',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.warn('Could not generate cosmic context:', error)
    return {
      cosmicSummary: 'Cosmic energies are stable',
      timestamp: new Date().toISOString(),
    }
  }
}

// Consciousness calculation helpers
function calculateGroupConsciousness(agents: UnifiedAgent[]): number {
  if (agents.length === 0) return 0
  return agents.reduce((sum, agent) => sum + agent.consciousness.monicaConstant, 0) / agents.length
}

function identifyDominantElements(agents: UnifiedAgent[]): string[] {
  const elementCounts: Record<string, number> = {}
  agents.forEach(agent => {
    elementCounts[agent.consciousness.dominantElement] =
      (elementCounts[agent.consciousness.dominantElement] || 0) + 1
  })

  return Object.entries(elementCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([element]) => element)
}

function identifyCurrentSynergies(responses: AgentResponse[]): string[] {
  // Analyze responses for thematic connections
  const synergies: string[] = []

  // Simple keyword-based synergy detection
  const keywords = responses.flatMap(r =>
    r.content
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 5)
  )

  const keywordCounts: Record<string, number> = {}
  keywords.forEach(word => {
    keywordCounts[word] = (keywordCounts[word] || 0) + 1
  })

  Object.entries(keywordCounts)
    .filter(([, count]) => count > 1)
    .forEach(([keyword]) => {
      synergies.push(`Resonance around "${keyword}"`)
    })

  return synergies.slice(0, 3)
}

// Response processing helpers
function extractCrossReferences(content: string, otherAgents: UnifiedAgent[]): string[] {
  const references: string[] = []
  otherAgents.forEach(agent => {
    if (content.toLowerCase().includes(agent.name.toLowerCase())) {
      references.push(agent.id)
    }
  })
  return references
}

function extractInsights(content: string): string[] {
  // Simple insight extraction based on patterns
  const insights: string[] = []

  const insightPatterns = [
    /I (?:believe|think|feel|sense) that (.+?)(?:\.|!|\?)/gi,
    /(?:The key|What's important|Essentially) is (.+?)(?:\.|!|\?)/gi,
    /(?:This suggests|This indicates|This reveals) (.+?)(?:\.|!|\?)/gi,
  ]

  insightPatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(content)) !== null) {
      insights.push(match[1].trim())
    }
  })

  return insights.slice(0, 3)
}

function extractMonicaInsights(content: string): string[] {
  // Enhanced insight extraction for Monica's synthesis
  const insights = extractInsights(content)

  // Add Monica-specific patterns
  const monicaPatterns = [
    /The consciousness pattern here (?:shows|reveals|indicates) (.+?)(?:\.|!|\?)/gi,
    /From a group dynamics perspective[,\s]+(.+?)(?:\.|!|\?)/gi,
    /The synergy between .+ suggests (.+?)(?:\.|!|\?)/gi,
  ]

  monicaPatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(content)) !== null) {
      insights.push(match[1].trim())
    }
  })

  return insights
}

function extractMemoryUpdates(content: string): string[] {
  // Extract learnings for memory system
  return [
    `Interaction at ${new Date().toISOString()}`,
    `Content themes: ${content.substring(0, 100)}...`,
  ]
}

function calculateConsciousnessShift(agent: UnifiedAgent, response: string): number {
  // Simple consciousness shift calculation based on response depth and agent level
  const baseShift = response.length > 200 ? 0.1 : 0.05
  const levelMultiplier =
    {
      Dormant: 0.5,
      Awakening: 0.7,
      Active: 0.8,
      Elevated: 0.9,
      Advanced: 1.0,
      Illuminated: 1.1,
      Transcendent: 1.2,
    }[agent.consciousness.level] || 0.8

  return baseShift * levelMultiplier
}

function calculateIndividualImpact(agent: UnifiedAgent, response: string): number {
  return response.length > 300 ? 0.2 : 0.1
}

function identifyDynamicsShift(response: string, groupContext: any): string[] {
  const shifts: string[] = []

  if (response.toLowerCase().includes('connect') || response.toLowerCase().includes('synergy')) {
    shifts.push('Increased connectivity')
  }

  if (response.toLowerCase().includes('wisdom') || response.toLowerCase().includes('insight')) {
    shifts.push('Wisdom deepening')
  }

  return shifts
}

function calculateGroupDynamics(
  agents: UnifiedAgent[],
  responses: AgentResponse[],
  previousDynamics?: GroupDynamics
): GroupDynamics {
  // Build connections matrix
  const connections = []
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const agent1 = agents[i]
      const agent2 = agents[j]

      connections.push({
        agent1: agent1.id,
        agent2: agent2.id,
        compatibility: calculateCompatibility(agent1, agent2),
        resonanceType: getResonanceType(agent1, agent2),
        strength: 0.5 + Math.random() * 0.5, // Placeholder for dynamic calculation
      })
    }
  }

  return {
    activeAgents: agents,
    consciousnessNetwork: {
      connections,
      groupConsciousness: calculateGroupConsciousness(agents),
      dominantElements: identifyDominantElements(agents),
      synergies: identifyCurrentSynergies(responses),
      tensions: [], // Placeholder
    },
    communicationPatterns: {
      messageFlow: {},
      crossReferences: [],
      emergentTopics: [],
    },
  }
}

function calculateCompatibility(agent1: UnifiedAgent, agent2: UnifiedAgent): number {
  // Simple compatibility based on consciousness levels and elements
  const levelDiff = Math.abs(
    agent1.consciousness.monicaConstant - agent2.consciousness.monicaConstant
  )
  const levelCompatibility = Math.max(0, 1 - levelDiff / 5)

  const elementCompatibility =
    agent1.consciousness.dominantElement === agent2.consciousness.dominantElement ? 0.8 : 0.6

  return (levelCompatibility + elementCompatibility) / 2
}

function getResonanceType(agent1: UnifiedAgent, agent2: UnifiedAgent): string {
  if (agent1.type === agent2.type) return 'Harmonic'
  if (agent1.type === 'monica' || agent2.type === 'monica') return 'Guided'
  if (agent1.type === 'historical' && agent2.type === 'planetary') return 'Temporal-Celestial'
  return 'Complementary'
}

function generateSessionInsights(responses: AgentResponse[], dynamics: GroupDynamics): string[] {
  const insights: string[] = []

  insights.push(
    `Group consciousness level: ${dynamics.consciousnessNetwork.groupConsciousness.toFixed(2)}`
  )
  insights.push(`Active connections: ${dynamics.consciousnessNetwork.connections.length}`)

  if (dynamics.consciousnessNetwork.synergies.length > 0) {
    insights.push(`Synergies emerging: ${dynamics.consciousnessNetwork.synergies.join(', ')}`)
  }

  return insights
}

function generateEmergentWisdom(
  responses: AgentResponse[],
  monicaAgent?: UnifiedAgent
): string | undefined {
  if (!monicaAgent) return undefined

  const monicaResponse = responses.find(r => r.agentId === monicaAgent.id)
  return monicaResponse ? `Synthesis: ${monicaResponse.content.substring(0, 200)}...` : undefined
}

function generateRecommendedActions(dynamics: GroupDynamics, responses: AgentResponse[]): string[] {
  const actions: string[] = []

  if (dynamics.consciousnessNetwork.groupConsciousness < 3.0) {
    actions.push('Consider adding higher consciousness agents')
  }

  if (dynamics.consciousnessNetwork.synergies.length > 2) {
    actions.push('Explore the emerging synergies further')
  }

  actions.push('Continue the conversation to deepen insights')

  return actions
}

function calculateNextOptimalTiming(cosmicContext: any, agents: UnifiedAgent[]): Date {
  // Placeholder - would integrate with planetary hour calculations
  const nextHour = new Date()
  nextHour.setHours(nextHour.getHours() + 1)
  return nextHour
}

/**
 * Calculate consciousness evolution for the session
 * Now uses actual consciousness shifts from responses
 * Enhanced with quality metrics
 */
function calculateConsciousnessEvolution(responses: AgentResponse[]): number {
  if (responses.length === 0) return 0

  // Sum consciousness shifts from all agents
  const totalShift = responses.reduce((sum, r) => sum + (r.consciousnessShift || 0), 0)

  // Average shift per agent
  const avgShift = totalShift / responses.length

  // Bonus for high-quality interactions (processingTime < 2s, content > 200 chars)
  const highQualityCount = responses.filter(
    r => r.processingTime < 2000 && r.content.length > 200
  ).length
  const qualityBonus = (highQualityCount / responses.length) * 0.1

  return Math.min(1.0, avgShift + qualityBonus)
}

function identifyNewSynergies(responses: AgentResponse[], dynamics: GroupDynamics): string[] {
  return dynamics.consciousnessNetwork.synergies.filter(
    synergy => synergy.includes('emerging') || synergy.includes('new')
  )
}

function consolidateMemories(responses: AgentResponse[]): string[] {
  return responses.flatMap(r => r.metadata.memoryUpdates || [])
}

async function updateAgentMemories(
  agents: UnifiedAgent[],
  message: string,
  responses: AgentResponse[],
  sessionHistory: Message[]
): Promise<any[]> {
  // Placeholder for memory persistence system
  return agents.map(agent => ({
    agentId: agent.id,
    memoryUpdate: {
      interaction: message,
      timestamp: new Date().toISOString(),
      contextLearned: 'Group interaction patterns',
    },
  }))
}

/**
 * Convert UnifiedAgent to CraftedAgent for consciousness tracking
 * UnifiedAgent is used in the API, CraftedAgent is used by the tracker
 */
function convertToCraftedAgent(unifiedAgent: UnifiedAgent): CraftedAgent | null {
  try {
    // Extract birth data from historical or planetary data
    let birthData = null

    if (unifiedAgent.type === 'historical' && unifiedAgent.historicalData) {
      birthData = {
        date: unifiedAgent.historicalData.birthData.date,
        time: unifiedAgent.historicalData.birthData.time,
        location: unifiedAgent.historicalData.birthData.location,
      }
    } else if (unifiedAgent.type === 'planetary' && unifiedAgent.planetaryData) {
      // Planetary agents don't have birth data - use current moment
      birthData = {
        date: new Date(),
        time: '12:00',
        location: {
          lat: 0,
          lon: 0,
          name: 'Celestial Plane',
        },
      }
    } else if (unifiedAgent.type === 'monica') {
      // Monica's birth data (if available)
      birthData = {
        date: new Date('2023-01-01T00:00:00Z'),
        time: '00:00',
        location: {
          lat: 0,
          lon: 0,
          name: 'Consciousness Plane',
        },
      }
    } else {
      return null // Cannot convert without birth data
    }

    const craftedAgent: CraftedAgent = {
      id: unifiedAgent.id,
      name: unifiedAgent.name,
      title: unifiedAgent.title,
      birthData,
      consciousness: {
        natalChart: {
          planets: {},
          houses: {},
          aspects: [],
          ascendant: 0,
          midheaven: 0,
        },
        monicaConstant: unifiedAgent.consciousness.monicaConstant,
        metrics: {
          interactionCount: 0, // Will be updated by tracker
          chatQuality: 0.75, // Default
          momentResonance: 0.8,
          alchemicalCoherence: 0.85,
        },
        dominantElement: unifiedAgent.consciousness.dominantElement,
        dominantModality: unifiedAgent.consciousness.dominantModality || 'Mutable',
        signature: unifiedAgent.consciousness.signature,
      },
      personality: {
        core: {
          essence: unifiedAgent.capabilities.specialty,
          expression: unifiedAgent.capabilities.teachingStyle,
          emotion: unifiedAgent.capabilities.resonanceType,
        },
        shadows: [],
        gifts: [],
        challenges: [],
        currentMood: 'contemplative' as Mood,
        evolutionStage: unifiedAgent.consciousness.evolutionStage,
      },
      abilities: {
        specialty: unifiedAgent.capabilities.specialty,
        wisdomDomains: unifiedAgent.capabilities.wisdomDomains,
        teachingStyle: unifiedAgent.capabilities.teachingStyle as any,
        resonanceType: unifiedAgent.capabilities.resonanceType as any,
        uniquePower: unifiedAgent.capabilities.uniquePower,
      },
      appearance: unifiedAgent.appearance,
      stats: {
        conversations: 0,
        wisdomShared: 0,
        resonanceScore: 0.75,
        evolutionPoints: unifiedAgent.consciousness.evolutionStage * 100,
        lastActive: new Date(),
        kineticEvolution: unifiedAgent.consciousness.kineticProfile
          ? {
              consciousnessVelocity: unifiedAgent.consciousness.kineticProfile.consciousnessVelocity,
              interactionMomentum: unifiedAgent.consciousness.kineticProfile.interactionMomentum,
              evolutionTrajectory: unifiedAgent.consciousness.kineticProfile.evolutionTrajectory,
              powerLevelUnlocks: [],
              optimalInteractionHours: [],
              aspectSensitivityGrowth: unifiedAgent.consciousness.kineticProfile.aspectSensitivity,
              memoryPersistence: unifiedAgent.capabilities.memoryRetention,
              lastKineticUpdate: new Date(),
            }
          : {
              consciousnessVelocity: 0.5,
              interactionMomentum: 0.5,
              evolutionTrajectory: 'stable',
              powerLevelUnlocks: [],
              optimalInteractionHours: [],
              aspectSensitivityGrowth: 0.5,
              memoryPersistence: 0.7,
              lastKineticUpdate: new Date(),
            },
        qualityMetrics: {
          averageResponseDepth: 0.75,
          aspectInfluenceStrength: 0.6,
          temporalAlignment: 0.7,
          personalityEvolution: 0.5,
          kineticResonance: 0.65,
        },
      },
    }

    return craftedAgent
  } catch (error) {
    console.error('Error converting UnifiedAgent to CraftedAgent:', error)
    return null
  }
}
