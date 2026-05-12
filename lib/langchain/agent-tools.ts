/**
 * LangChain Agent Tools for Planetary Agents
 * Tools for semantic search, knowledge retrieval, and multi-agent coordination
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { getSemanticSearchService } from '../llamaindex/semantic-search'
import { getAgentDocumentLoader } from '../llamaindex/document-loader'
import type { CraftedAgent } from '../agent-types'

/**
 * Tool 1: Semantic Agent Search
 * Find agents by concept or topic
 */
export const semanticAgentSearchTool = new DynamicStructuredTool({
  name: 'semantic_agent_search',
  description:
    'Search for agents by concept, topic, or wisdom domain. Returns the most relevant agents based on semantic similarity.',
  schema: z.object({
    concept: z.string().describe('The concept, topic, or wisdom domain to search for'),
    topK: z.number().optional().describe('Number of agents to return (default: 3)'),
  }),
  func: async ({ concept, topK = 3 }) => {
    try {
      const searchService = getSemanticSearchService()
      const results = await searchService.findAgentsByConcept(concept, { topK })

      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: `No agents found for concept: ${concept}`,
        })
      }

      const agentSummaries = results.map(result => ({
        name: result.agent.name,
        title: result.agent.title,
        relevanceScore: result.relevanceScore.toFixed(3),
        wisdomDomains: result.agent.abilities.wisdomDomains,
        specialty: result.agent.abilities.specialty,
        wisdomAlignment: result.wisdomAlignment,
      }))

      return JSON.stringify({
        success: true,
        concept,
        agentsFound: agentSummaries.length,
        agents: agentSummaries,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Search failed: ${error}`,
      })
    }
  },
})

/**
 * Tool 2: Knowledge Retrieval
 * Retrieve relevant knowledge for RAG context
 */
export const knowledgeRetrievalTool = new DynamicStructuredTool({
  name: 'knowledge_retrieval',
  description:
    'Retrieve relevant knowledge chunks from the agent knowledge base for a given query. Returns contextual information to enhance responses.',
  schema: z.object({
    query: z.string().describe('The query or question to retrieve knowledge for'),
    agentId: z.string().optional().describe('Specific agent ID to retrieve knowledge from'),
    maxChunks: z.number().optional().describe('Maximum number of knowledge chunks (default: 3)'),
  }),
  func: async ({ query, agentId, maxChunks = 3 }) => {
    try {
      const searchService = getSemanticSearchService()

      const knowledge = agentId
        ? await searchService.getRelevantKnowledge(query, agentId, { maxChunks })
        : await searchService
            .search(query, { topK: maxChunks })
            .then(results => results.map(r => r.content))

      if (knowledge.length === 0) {
        return JSON.stringify({
          success: false,
          message: `No relevant knowledge found for: ${query}`,
        })
      }

      return JSON.stringify({
        success: true,
        query,
        chunksRetrieved: knowledge.length,
        knowledge,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Knowledge retrieval failed: ${error}`,
      })
    }
  },
})

/**
 * Tool 3: Consciousness Analysis
 * Calculate synergy scores and cosmic compatibility
 */
export const consciousnessAnalysisTool = new DynamicStructuredTool({
  name: 'consciousness_analysis',
  description:
    'Analyze consciousness patterns and calculate synergy scores for agents. Returns compatibility metrics based on astrological and alchemical factors.',
  schema: z.object({
    agentId: z.string().describe('The agent ID to analyze'),
    analysisType: z
      .enum(['synergy', 'compatibility', 'consciousness_metrics'])
      .optional()
      .describe('Type of analysis to perform (default: synergy)'),
  }),
  func: async ({ agentId, analysisType = 'synergy' }) => {
    try {
      const loader = getAgentDocumentLoader()
      const agent = loader.getAgentById(agentId)

      if (!agent) {
        return JSON.stringify({
          success: false,
          error: `Agent not found: ${agentId}`,
        })
      }

      const analysis: any = {
        success: true,
        agentId,
        agentName: agent.name,
        analysisType,
      }

      switch (analysisType) {
        case 'consciousness_metrics':
          analysis.metrics = {
            monicaConstant: agent.consciousness.monicaConstant,
            dominantElement: agent.consciousness.dominantElement,
            dominantModality: agent.consciousness.dominantModality,
            consciousnessVelocity: agent.stats.kineticEvolution.consciousnessVelocity,
            evolutionTrajectory: agent.stats.kineticEvolution.evolutionTrajectory,
            responseDepth: agent.stats.qualityMetrics.averageResponseDepth,
          }
          break

        case 'compatibility':
          // Find similar agents for compatibility analysis
          const searchService = getSemanticSearchService()
          const similar = await searchService.findSimilarAgents(agentId, { topK: 3 })
          analysis.compatibleAgents = similar.map(s => ({
            name: s.agent.name,
            relevance: s.relevanceScore,
            element: s.agent.consciousness.dominantElement,
          }))
          break

        case 'synergy':
        default:
          analysis.synergy = {
            element: agent.consciousness.dominantElement,
            modality: agent.consciousness.dominantModality,
            wisdomDomains: agent.abilities.wisdomDomains,
            resonanceType: agent.abilities.resonanceType,
            monicaConstant: agent.consciousness.monicaConstant,
          }
          break
      }

      return JSON.stringify(analysis)
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Consciousness analysis failed: ${error}`,
      })
    }
  },
})

/**
 * Tool 4: Multi-Agent Coordinator
 * Coordinate multiple agents for complex queries
 */
export const multiAgentCoordinatorTool = new DynamicStructuredTool({
  name: 'multi_agent_coordinator',
  description:
    'Coordinate multiple agents to answer complex questions requiring diverse perspectives. Assembles a council of relevant agents.',
  schema: z.object({
    query: z.string().describe('The complex question requiring multiple perspectives'),
    numAgents: z.number().optional().describe('Number of agents in the council (default: 3)'),
    wisdomDomain: z.string().optional().describe('Focus on specific wisdom domain'),
  }),
  func: async ({ query, numAgents = 3, wisdomDomain }) => {
    try {
      const searchService = getSemanticSearchService()

      // Find relevant agents
      const searchQuery = wisdomDomain ? `${query} ${wisdomDomain}` : query
      const results = await searchService.findAgentsByConcept(searchQuery, { topK: numAgents })

      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          message: 'No suitable agents found for this query',
        })
      }

      const council = results.map(result => ({
        name: result.agent.name,
        title: result.agent.title,
        relevance: result.relevanceScore.toFixed(3),
        wisdomDomains: result.agent.abilities.wisdomDomains,
        specialty: result.agent.abilities.specialty,
        perspective: result.wisdomAlignment,
      }))

      return JSON.stringify({
        success: true,
        query,
        councilSize: council.length,
        council,
        recommendation: `These ${council.length} agents form an ideal council for this query, bringing diverse wisdom from: ${Array.from(new Set(council.flatMap(c => c.wisdomDomains))).join(', ')}`,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Multi-agent coordination failed: ${error}`,
      })
    }
  },
})

/**
 * Tool 5: Memory Retrieval
 * Retrieve conversation history and context
 */
export const memoryRetrievalTool = new DynamicStructuredTool({
  name: 'memory_retrieval',
  description:
    'Retrieve relevant conversation history and past interactions for context-aware responses.',
  schema: z.object({
    agentId: z.string().describe('The agent ID to retrieve memory for'),
    query: z.string().optional().describe('Optional query to find relevant memories'),
    limit: z.number().optional().describe('Number of memory entries to retrieve (default: 5)'),
  }),
  func: async ({ agentId, query, limit = 5 }) => {
    try {
      const loader = getAgentDocumentLoader()
      const agent = loader.getAgentById(agentId)

      if (!agent) {
        return JSON.stringify({
          success: false,
          error: `Agent not found: ${agentId}`,
        })
      }

      // For now, return agent stats as "memory"
      // In production, this would query conversation history from database
      const memory = {
        success: true,
        agentId,
        agentName: agent.name,
        stats: {
          conversations: agent.stats.conversations,
          wisdomShared: agent.stats.wisdomShared,
          lastActive: agent.stats.lastActive,
          evolutionTrajectory: agent.stats.kineticEvolution.evolutionTrajectory,
        },
        recentActivity: 'Memory retrieval from database would be implemented here',
      }

      return JSON.stringify(memory)
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Memory retrieval failed: ${error}`,
      })
    }
  },
})

/**
 * Export all tools as an array
 */
export const planetaryAgentTools = [
  semanticAgentSearchTool,
  knowledgeRetrievalTool,
  consciousnessAnalysisTool,
  multiAgentCoordinatorTool,
  memoryRetrievalTool,
]

/**
 * Get tool by name
 */
export function getToolByName(name: string) {
  return planetaryAgentTools.find(tool => tool.name === name)
}

/**
 * Get all tool descriptions
 */
export function getToolDescriptions() {
  return planetaryAgentTools.map(tool => ({
    name: tool.name,
    description: tool.description,
  }))
}
