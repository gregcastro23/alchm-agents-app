/**
 * Semantic Search Service for Planetary Agents
 * Advanced vector search with metadata filtering
 */

import { vectorStoreManager } from './vector-store'
import { getEmbeddingsService } from './embeddings-service'
import type { CraftedAgent } from '../agent-types'
import { getAgentDocumentLoader } from './document-loader'

export interface SearchOptions {
  topK?: number
  minSimilarity?: number
  filterByElement?: string
  filterByWisdomDomain?: string
  filterByHistoricalPeriod?: string
  documentType?: 'profile' | 'personality' | 'abilities' | 'wisdom' | 'birth_data'
}

export interface SearchResult {
  agentId: string
  agentName: string
  content: string
  similarity: number
  metadata: {
    wisdomDomains: string[]
    historicalPeriod: string
    element: string
    documentType: string
    monicaConstant: number
  }
}

export interface AgentSearchResult {
  agent: CraftedAgent
  relevanceScore: number
  matchingDocuments: SearchResult[]
  wisdomAlignment: string[]
}

/**
 * Semantic Search Service
 */
export class SemanticSearchService {
  private embeddingsService = getEmbeddingsService()
  private documentLoader = getAgentDocumentLoader()

  /**
   * Search for relevant agent knowledge
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      topK = 10,
      minSimilarity = 0.5,
      filterByElement,
      filterByWisdomDomain,
      filterByHistoricalPeriod,
      documentType,
    } = options

    try {
      console.log(`[SemanticSearch] Searching for: "${query}"`)

      // Build filter object
      const filter: Record<string, any> = {}
      if (filterByElement) filter.element = filterByElement
      if (filterByWisdomDomain) filter.wisdomDomains = { $contains: filterByWisdomDomain }
      if (filterByHistoricalPeriod) filter.historicalPeriod = filterByHistoricalPeriod
      if (documentType) filter.documentType = documentType

      // Query vector store
      const results = await vectorStoreManager.query(query, {
        topK,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      })

      // Format results
      const searchResults: SearchResult[] = results
        .map((result: any) => ({
          agentId: result.node?.metadata?.agentId || '',
          agentName: result.node?.metadata?.agentName || '',
          content: result.node?.text || '',
          similarity: result.score || 0,
          metadata: {
            wisdomDomains: result.node?.metadata?.wisdomDomains || [],
            historicalPeriod: result.node?.metadata?.historicalPeriod || '',
            element: result.node?.metadata?.element || '',
            documentType: result.node?.metadata?.documentType || '',
            monicaConstant: result.node?.metadata?.monicaConstant || 0,
          },
        }))
        .filter((r) => r.similarity >= minSimilarity)

      console.log(`[SemanticSearch] Found ${searchResults.length} results`)
      return searchResults
    } catch (error) {
      console.error('[SemanticSearch] Search failed:', error)
      throw new Error(`Semantic search failed: ${error}`)
    }
  }

  /**
   * Find agents by concept/topic
   */
  async findAgentsByConcept(
    concept: string,
    options: { topK?: number; minRelevance?: number } = {}
  ): Promise<AgentSearchResult[]> {
    const { topK = 5, minRelevance = 0.6 } = options

    try {
      console.log(`[SemanticSearch] Finding agents for concept: "${concept}"`)

      // Search across all document types
      const results = await this.search(concept, { topK: topK * 3 })

      // Group results by agent
      const agentResults = new Map<string, SearchResult[]>()
      for (const result of results) {
        const existing = agentResults.get(result.agentId) || []
        existing.push(result)
        agentResults.set(result.agentId, existing)
      }

      // Calculate relevance scores and get agent data
      const agentSearchResults: AgentSearchResult[] = []

      for (const [agentId, documents] of agentResults.entries()) {
        const agent = this.documentLoader.getAgentById(agentId)
        if (!agent) continue

        // Calculate average relevance
        const relevanceScore =
          documents.reduce((sum, doc) => sum + doc.similarity, 0) / documents.length

        if (relevanceScore < minRelevance) continue

        // Extract wisdom alignment
        const wisdomAlignment = this.extractWisdomAlignment(concept, documents)

        agentSearchResults.push({
          agent,
          relevanceScore,
          matchingDocuments: documents,
          wisdomAlignment,
        })
      }

      // Sort by relevance
      agentSearchResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

      // Limit to topK
      const topResults = agentSearchResults.slice(0, topK)

      console.log(`[SemanticSearch] Found ${topResults.length} relevant agents`)
      return topResults
    } catch (error) {
      console.error('[SemanticSearch] Agent search failed:', error)
      throw new Error(`Agent search by concept failed: ${error}`)
    }
  }

  /**
   * Extract wisdom alignment from matching documents
   */
  private extractWisdomAlignment(concept: string, documents: SearchResult[]): string[] {
    const domains = new Set<string>()

    for (const doc of documents) {
      if (doc.metadata.wisdomDomains) {
        doc.metadata.wisdomDomains.forEach((domain) => domains.add(domain))
      }
    }

    return Array.from(domains)
  }

  /**
   * Find similar agents by personality
   */
  async findSimilarAgents(
    agentId: string,
    options: { topK?: number } = {}
  ): Promise<AgentSearchResult[]> {
    const { topK = 3 } = options

    try {
      const agent = this.documentLoader.getAgentById(agentId)
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`)
      }

      console.log(`[SemanticSearch] Finding agents similar to ${agent.name}`)

      // Create query from agent's core attributes
      const query = `${agent.personality.core.essence} ${agent.abilities.specialty} ${agent.abilities.wisdomDomains.join(' ')}`

      // Search and exclude the original agent
      const results = await this.findAgentsByConcept(query, { topK: topK + 1 })

      // Filter out the original agent
      const similarAgents = results.filter((r) => r.agent.id !== agentId).slice(0, topK)

      console.log(`[SemanticSearch] Found ${similarAgents.length} similar agents`)
      return similarAgents
    } catch (error) {
      console.error('[SemanticSearch] Similar agents search failed:', error)
      throw error
    }
  }

  /**
   * Search for agents by wisdom domain
   */
  async searchByWisdomDomain(
    domain: string,
    options: { topK?: number } = {}
  ): Promise<AgentSearchResult[]> {
    const { topK = 5 } = options

    return await this.findAgentsByConcept(domain, {
      topK,
      minRelevance: 0.5,
    })
  }

  /**
   * Search for conversation context
   */
  async searchConversationContext(
    query: string,
    agentId: string,
    options: { topK?: number } = {}
  ): Promise<SearchResult[]> {
    const { topK = 5 } = options

    return await this.search(query, {
      topK,
      documentType: undefined, // Search all document types
      minSimilarity: 0.4,
    })
  }

  /**
   * Get relevant knowledge for RAG
   */
  async getRelevantKnowledge(
    query: string,
    agentId: string,
    options: { maxChunks?: number; minSimilarity?: number } = {}
  ): Promise<string[]> {
    const { maxChunks = 3, minSimilarity = 0.6 } = options

    try {
      const results = await this.search(query, {
        topK: maxChunks * 2, // Get more results to filter from
        minSimilarity,
      })

      // Filter for relevant agent or general knowledge
      const relevantResults = results
        .filter((r) => r.agentId === agentId || r.similarity > 0.75) // Higher threshold for other agents
        .slice(0, maxChunks)

      return relevantResults.map((r) => r.content)
    } catch (error) {
      console.error('[SemanticSearch] Knowledge retrieval failed:', error)
      return []
    }
  }
}

/**
 * Global semantic search instance
 */
let semanticSearchInstance: SemanticSearchService | null = null

/**
 * Get or create semantic search service
 */
export function getSemanticSearchService(): SemanticSearchService {
  if (!semanticSearchInstance) {
    semanticSearchInstance = new SemanticSearchService()
  }
  return semanticSearchInstance
}

/**
 * Search for agents by concept (convenience function)
 */
export async function searchAgentsByConcept(
  concept: string,
  options?: { topK?: number }
): Promise<AgentSearchResult[]> {
  const service = getSemanticSearchService()
  return await service.findAgentsByConcept(concept, options)
}

/**
 * Get relevant knowledge for RAG (convenience function)
 */
export async function getRelevantKnowledgeForRAG(
  query: string,
  agentId: string,
  options?: { maxChunks?: number }
): Promise<string[]> {
  const service = getSemanticSearchService()
  return await service.getRelevantKnowledge(query, agentId, options)
}
