// Historical Agents Database Service
// Manages all database operations for Philosopher's Stone crafted beings

import { prisma } from './db'
import { DEMO_AGENTS } from './demo-agents-data'
import type { CraftedAgent } from './agent-types'
import type { HistoricalAgent, AgentConversation, AgentEvolution, AgentKnowledge } from './generated/prisma'

// Enhanced agent interface with database fields
export interface EnhancedHistoricalAgent extends HistoricalAgent {
  recentConversations?: AgentConversation[]
  evolutionHistory?: AgentEvolution[]
  knowledgeBase?: AgentKnowledge[]
}

export class HistoricalAgentsService {
  
  /**
   * Migrate static demo agents to database
   * This will populate the database with all existing agents
   */
  static async migrateStaticAgents(): Promise<{ success: boolean; migrated: number; errors: string[] }> {
    const results = { success: true, migrated: 0, errors: [] as string[] }
    
    console.log('Starting migration of', DEMO_AGENTS.length, 'historical agents...')
    
    for (const agent of DEMO_AGENTS) {
      try {
        // Check if agent already exists
        const existing = await prisma.historicalAgent.findUnique({
          where: { agentId: agent.id }
        })
        
        if (existing) {
          console.log(`Agent ${agent.name} already exists, skipping...`)
          continue
        }
        
        // Transform CraftedAgent to HistoricalAgent format
        const historicalAgent = {
          agentId: agent.id,
          name: agent.name,
          title: agent.title,
          
          // Birth data
          birthDate: agent.birthData.date,
          birthTime: agent.birthData.time,
          birthLocation: agent.birthData.location,
          
          // Consciousness profile
          consciousnessLevel: agent.consciousness.level,
          monicaConstant: agent.consciousness.monicaConstant,
          dominantElement: agent.consciousness.dominantElement,
          dominantModality: agent.consciousness.dominantModality || null,
          signature: agent.consciousness.signature,
          
          // Personality data
          personalityCore: agent.personality.core,
          personalityShadows: agent.personality.shadows,
          personalityGifts: agent.personality.gifts,
          personalityChallenges: agent.personality.challenges,
          currentMood: agent.personality.currentMood,
          evolutionStage: agent.personality.evolutionStage || 0,
          
          // Abilities
          specialty: agent.abilities.specialty,
          wisdomDomains: agent.abilities.wisdomDomains,
          skills: agent.abilities.skills || [],
          teachingStyle: agent.abilities.teachingStyle,
          resonanceType: agent.abilities.resonanceType,
          uniquePower: agent.abilities.uniquePower,
          
          // Appearance
          avatar: agent.appearance.avatar || null,
          color: agent.appearance.color,
          symbol: agent.appearance.symbol,
          aura: agent.appearance.aura || null,
          
          // Birth chart
          natalChart: agent.consciousness.natalChart,
          
          // Traits
          traits: agent.personality.traits || {},
          
          // Statistics
          conversations: agent.stats?.conversations || 0,
          wisdomShared: agent.stats?.wisdomShared || 0,
          resonanceScore: agent.stats?.resonanceScore || 0.5,
          evolutionPoints: agent.stats?.evolutionPoints || 0,
          lastActive: agent.stats?.lastActive || new Date(),
          
          // Metadata
          version: '1.0.0',
          craftedBy: 'philosopher-stone'
        }
        
        await prisma.historicalAgent.create({
          data: historicalAgent
        })
        
        results.migrated++
        console.log(`✓ Migrated ${agent.name} (${agent.id})`)
        
      } catch (error) {
        const errorMsg = `Failed to migrate ${agent.name}: ${error instanceof Error ? error.message : String(error)}`
        results.errors.push(errorMsg)
        console.error('✗', errorMsg)
      }
    }
    
    results.success = results.errors.length === 0
    console.log(`Migration complete: ${results.migrated} agents migrated, ${results.errors.length} errors`)
    
    return results
  }
  
  /**
   * Get historical agent by ID from database
   */
  static async getAgent(agentId: string, includeRelations = false): Promise<EnhancedHistoricalAgent | null> {
    const include = includeRelations ? {
      agentConversations: {
        take: 10,
        orderBy: { createdAt: 'desc' as const }
      },
      agentEvolutions: {
        take: 5,
        orderBy: { evolutionDate: 'desc' as const }
      },
      agentKnowledge: {
        take: 20,
        orderBy: { confidence: 'desc' as const }
      }
    } : undefined
    
    const agent = await prisma.historicalAgent.findUnique({
      where: { agentId },
      include
    }) as EnhancedHistoricalAgent | null
    
    if (agent && includeRelations) {
      agent.recentConversations = agent.agentConversations
      agent.evolutionHistory = agent.agentEvolutions
      agent.knowledgeBase = agent.agentKnowledge
    }
    
    return agent
  }
  
  /**
   * Get all active historical agents
   */
  static async getAllAgents(includeStats = false): Promise<HistoricalAgent[]> {
    return await prisma.historicalAgent.findMany({
      where: { isActive: true },
      orderBy: [
        { consciousnessLevel: 'desc' },
        { monicaConstant: 'desc' },
        { name: 'asc' }
      ]
    })
  }
  
  /**
   * Record a conversation with an agent
   */
  static async recordConversation(
    agentId: string,
    sessionId: string,
    userMessage: string,
    agentResponse: string,
    metadata: {
      userId?: string
      responseTime?: number
      modelUsed?: string
      temperature?: number
      tokenCount?: number
    } = {}
  ): Promise<AgentConversation> {
    // Get current agent state
    const agent = await prisma.historicalAgent.findUnique({
      where: { agentId }
    })
    
    const conversation = await prisma.agentConversation.create({
      data: {
        agentId,
        sessionId,
        userId: metadata.userId || null,
        userMessage,
        agentResponse,
        contextData: {
          timestamp: new Date().toISOString(),
          metadata
        },
        responseTime: metadata.responseTime || null,
        modelUsed: metadata.modelUsed || null,
        temperature: metadata.temperature || null,
        tokenCount: metadata.tokenCount || null,
        agentMood: agent?.currentMood || null,
        evolutionStage: agent?.evolutionStage || null,
        consciousnessLevel: agent?.consciousnessLevel || null
      }
    })
    
    // Update agent statistics
    await prisma.historicalAgent.update({
      where: { agentId },
      data: {
        conversations: { increment: 1 },
        lastActive: new Date()
      }
    })
    
    return conversation
  }
  
  /**
   * Record agent evolution/learning
   */
  static async recordEvolution(
    agentId: string,
    evolutionData: {
      fromStage: number
      toStage: number
      evolutionType: string
      trigger: string
      description?: string
      consciousnessGain?: number
      wisdomGained?: any
      traitsChanged?: any
      conversationId?: string
      xpGained?: number
    }
  ): Promise<AgentEvolution> {
    const evolution = await prisma.agentEvolution.create({
      data: {
        agentId,
        ...evolutionData,
        consciousnessGain: evolutionData.consciousnessGain || 0,
        xpGained: evolutionData.xpGained || 0
      }
    })
    
    // Update agent's evolution stage
    await prisma.historicalAgent.update({
      where: { agentId },
      data: {
        evolutionStage: evolutionData.toStage,
        evolutionPoints: { increment: evolutionData.xpGained || 0 }
      }
    })
    
    return evolution
  }
  
  /**
   * Add knowledge to agent's knowledge base
   */
  static async addKnowledge(
    agentId: string,
    knowledgeData: {
      category: string
      topic: string
      content: string
      source?: string
      confidence?: number
      usefulness?: number
      contextTags?: any
      relatedTopics?: any
    }
  ): Promise<AgentKnowledge> {
    return await prisma.agentKnowledge.create({
      data: {
        agentId,
        ...knowledgeData,
        confidence: knowledgeData.confidence || 0.5,
        usefulness: knowledgeData.usefulness || 0.5
      }
    })
  }
  
  /**
   * Update agent's consciousness level and Monica Constant
   */
  static async updateConsciousness(
    agentId: string,
    updates: {
      consciousnessLevel?: string
      monicaConstant?: number
      evolutionStage?: number
      currentMood?: string
    }
  ): Promise<HistoricalAgent> {
    return await prisma.historicalAgent.update({
      where: { agentId },
      data: updates
    })
  }
  
  /**
   * Get agent conversation history
   */
  static async getConversationHistory(
    agentId: string,
    sessionId?: string,
    limit = 50
  ): Promise<AgentConversation[]> {
    const where = sessionId 
      ? { agentId, sessionId }
      : { agentId }
      
    return await prisma.agentConversation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }
  
  /**
   * Search agents by various criteria
   */
  static async searchAgents(criteria: {
    name?: string
    consciousnessLevel?: string
    specialty?: string
    dominantElement?: string
    isActive?: boolean
  }): Promise<HistoricalAgent[]> {
    const where: any = {}
    
    if (criteria.name) {
      where.name = { contains: criteria.name, mode: 'insensitive' }
    }
    if (criteria.consciousnessLevel) {
      where.consciousnessLevel = criteria.consciousnessLevel
    }
    if (criteria.specialty) {
      where.specialty = { contains: criteria.specialty, mode: 'insensitive' }
    }
    if (criteria.dominantElement) {
      where.dominantElement = criteria.dominantElement
    }
    if (criteria.isActive !== undefined) {
      where.isActive = criteria.isActive
    }
    
    return await prisma.historicalAgent.findMany({
      where,
      orderBy: { monicaConstant: 'desc' }
    })
  }
  
  /**
   * Get agent statistics and performance metrics
   */
  static async getAgentStats(agentId: string): Promise<{
    totalConversations: number
    averageResponseTime: number | null
    evolutionHistory: AgentEvolution[]
    knowledgeCategories: { [key: string]: number }
    consciousnessProgression: number
  }> {
    const [agent, conversations, evolutions, knowledge] = await Promise.all([
      prisma.historicalAgent.findUnique({ where: { agentId } }),
      prisma.agentConversation.findMany({ where: { agentId } }),
      prisma.agentEvolution.findMany({ 
        where: { agentId },
        orderBy: { evolutionDate: 'asc' }
      }),
      prisma.agentKnowledge.findMany({ where: { agentId } })
    ])
    
    const averageResponseTime = conversations.length > 0
      ? conversations.reduce((sum, conv) => sum + (conv.responseTime || 0), 0) / conversations.length
      : null
      
    const knowledgeCategories = knowledge.reduce((acc, k) => {
      acc[k.category] = (acc[k.category] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    return {
      totalConversations: conversations.length,
      averageResponseTime,
      evolutionHistory: evolutions,
      knowledgeCategories,
      consciousnessProgression: agent?.evolutionStage || 0
    }
  }
  
  /**
   * Clean up old conversations (data maintenance)
   */
  static async cleanupOldConversations(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    const result = await prisma.agentConversation.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    })
    
    return result.count
  }
}

// Legacy compatibility - convert database agent to CraftedAgent format
export function dbAgentToCraftedAgent(dbAgent: HistoricalAgent): CraftedAgent {
  return {
    id: dbAgent.agentId,
    name: dbAgent.name,
    title: dbAgent.title,
    birthData: {
      date: dbAgent.birthDate,
      time: dbAgent.birthTime,
      location: dbAgent.birthLocation as any
    },
    consciousness: {
      natalChart: dbAgent.natalChart as any,
      monicaConstant: dbAgent.monicaConstant,
      level: dbAgent.consciousnessLevel as any,
      dominantElement: dbAgent.dominantElement as any,
      dominantModality: (dbAgent.dominantModality as any) || 'Fixed',
      signature: dbAgent.signature
    },
    personality: {
      core: dbAgent.personalityCore as any,
      shadows: dbAgent.personalityShadows as any,
      gifts: dbAgent.personalityGifts as any,
      challenges: dbAgent.personalityChallenges as any,
      currentMood: dbAgent.currentMood as any,
      evolutionStage: dbAgent.evolutionStage,
      traits: dbAgent.traits as any
    },
    abilities: {
      specialty: dbAgent.specialty,
      wisdomDomains: dbAgent.wisdomDomains as any,
      skills: dbAgent.skills as any,
      teachingStyle: dbAgent.teachingStyle as any,
      resonanceType: dbAgent.resonanceType as any,
      uniquePower: dbAgent.uniquePower
    },
    appearance: {
      avatar: dbAgent.avatar || '/avatars/default.png',
      color: dbAgent.color,
      symbol: dbAgent.symbol,
      aura: dbAgent.aura as any
    },
    stats: {
      conversations: dbAgent.conversations,
      wisdomShared: dbAgent.wisdomShared,
      resonanceScore: dbAgent.resonanceScore,
      evolutionPoints: dbAgent.evolutionPoints,
      lastActive: dbAgent.lastActive
    }
  }
}