/**
 * RAG Generator for Planetary Agents
 * Complete RAG pipeline with context retrieval and generation
 */

import { generateText, streamText } from 'ai'
import { openai as openaiProvider } from '@ai-sdk/openai'
import { Anthropic as AnthropicSDK } from '@anthropic-ai/sdk'
import { getSemanticSearchService } from '../llamaindex/semantic-search'
import { getMemoryManager } from '../langchain/memory-manager'
import type { CraftedAgent } from '../agent-types'

export interface RAGContext {
  retrievedKnowledge: string[]
  conversationMemory: string[]
  synergyData?: any
  agentProfile: any
}

export interface RAGGenerationOptions {
  agentId: string
  agent: CraftedAgent
  userMessage: string
  sessionId?: string
  includeMemory?: boolean
  includeSynergy?: boolean
  maxKnowledgeChunks?: number
  model?: 'openai' | 'anthropic'
  temperature?: number
}

export interface RAGResponse {
  response: string
  context: RAGContext
  metadata: {
    knowledgeChunksUsed: number
    memoryMessagesUsed: number
    generationTime: number
  }
}

/**
 * RAG Generator Class
 */
export class RAGGenerator {
  private semanticSearch = getSemanticSearchService()
  private memoryManager = getMemoryManager()

  /**
   * Step 1: Analyze Query
   */
  async analyzeQuery(userMessage: string, agentId: string): Promise<{ intent: string; topics: string[] }> {
    // Simple intent analysis (in production, use NLP)
    const intent = userMessage.includes('?') ? 'question' : 'statement'

    // Extract topics (simple keyword extraction)
    const topics = userMessage
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 4)
      .slice(0, 5)

    return { intent, topics }
  }

  /**
   * Step 2: Retrieve Relevant Context (LlamaIndex)
   */
  async retrieveRelevantContext(
    query: string,
    agentId: string,
    limit: number = 3
  ): Promise<string[]> {
    try {
      const knowledge = await this.semanticSearch.getRelevantKnowledge(query, agentId, {
        maxChunks: limit,
        minSimilarity: 0.6,
      })

      console.log(`[RAG] Retrieved ${knowledge.length} knowledge chunks`)
      return knowledge
    } catch (error) {
      console.error('[RAG] Context retrieval failed:', error)
      return []
    }
  }

  /**
   * Step 3: Enhance with Synergy (if applicable)
   */
  async enhanceWithSynergy(context: any[], currentMoment?: Date): Promise<any> {
    // Placeholder for synergy enhancement
    // In production, integrate with calculateCurrentMomentSynergy
    return {
      synergyScore: 0.8,
      moment: currentMoment || new Date(),
      enhancement: 'Cosmic alignment favorable',
    }
  }

  /**
   * Step 4: Integrate Memory
   */
  async retrieveConversationMemory(sessionId: string, agentId: string, windowSize: number = 5): Promise<string[]> {
    if (!sessionId) return []

    try {
      const history = await this.memoryManager.getConversationHistory(sessionId, agentId, {
        limit: windowSize,
      })

      return history.map(msg => `${msg.constructor.name}: ${msg.content}`)
    } catch (error) {
      console.error('[RAG] Memory retrieval failed:', error)
      return []
    }
  }

  /**
   * Step 5: Build Enhanced Prompt
   */
  buildEnhancedPrompt(
    userMessage: string,
    context: RAGContext,
    agent: CraftedAgent
  ): string {
    const { retrievedKnowledge, conversationMemory, agentProfile } = context

    let prompt = `You are ${agent.name}, ${agent.title}.

Core Essence: ${agent.personality.core.essence}
Specialty: ${agent.abilities.specialty}
Teaching Style: ${agent.abilities.teachingStyle}
Wisdom Domains: ${agent.abilities.wisdomDomains.join(', ')}

`

    // Add retrieved knowledge
    if (retrievedKnowledge.length > 0) {
      prompt += `\nRelevant Knowledge from your wisdom:\n`
      retrievedKnowledge.forEach((knowledge, idx) => {
        prompt += `\n${idx + 1}. ${knowledge}\n`
      })
    }

    // Add conversation memory
    if (conversationMemory.length > 0) {
      prompt += `\nRecent Conversation:\n`
      conversationMemory.forEach(msg => {
        prompt += `${msg}\n`
      })
    }

    prompt += `\nUser Message: ${userMessage}\n`
    prompt += `\nRespond as ${agent.name}, drawing upon your wisdom and the context provided. Be authentic to your personality and teaching style.`

    return prompt
  }

  /**
   * Step 6: Generate Response with RAG
   */
  async generateResponse(
    prompt: string,
    options: { model?: 'openai' | 'anthropic'; temperature?: number } = {}
  ): Promise<string> {
    const { model = 'openai', temperature = 0.7 } = options

    try {
      if (model === 'anthropic') {
        // Use Anthropic Claude (route via AI Gateway when enabled)
        const aiGatewayEnabled = String(process.env.AI_GATEWAY_ENABLED).toLowerCase() === 'true'
        const client = new AnthropicSDK({
          apiKey: aiGatewayEnabled
            ? process.env.AI_GATEWAY_API_KEY
            : process.env.ANTHROPIC_API_KEY,
          baseURL: aiGatewayEnabled ? process.env.AI_GATEWAY_URL : undefined,
        })

        const message = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          temperature,
          messages: [{ role: 'user', content: prompt }],
        })

        return message.content[0].type === 'text' ? message.content[0].text : ''
      } else {
        // Use OpenAI (route via AI Gateway when enabled)
        const aiGatewayEnabled = String(process.env.AI_GATEWAY_ENABLED).toLowerCase() === 'true'
        const provider = openaiProvider({
          apiKey: aiGatewayEnabled ? (process.env.AI_GATEWAY_API_KEY as string) : (process.env.OPENAI_API_KEY as string),
          baseURL: aiGatewayEnabled ? process.env.AI_GATEWAY_URL : undefined,
        })

        const result = await generateText({
          model: provider('gpt-4-turbo-preview'),
          prompt,
          temperature,
        })

        return result.text
      }
    } catch (error) {
      console.error('[RAG] Generation failed:', error)
      throw new Error(`Response generation failed: ${error}`)
    }
  }

  /**
   * Step 7: Enrich Response (post-processing)
   */
  async enrichResponse(response: string, metadata: any): Promise<string> {
    // Post-processing: add citations, format, etc.
    // For now, return as-is
    return response
  }

  /**
   * Main RAG Generation Pipeline
   */
  async generate(options: RAGGenerationOptions): Promise<RAGResponse> {
    const startTime = Date.now()
    const {
      agentId,
      agent,
      userMessage,
      sessionId,
      includeMemory = true,
      includeSynergy = false,
      maxKnowledgeChunks = 3,
      model = 'openai',
      temperature = 0.7,
    } = options

    try {
      console.log(`[RAG] Generating response for ${agent.name}`)

      // Step 1: Analyze Query
      const analysis = await this.analyzeQuery(userMessage, agentId)
      console.log('[RAG] Query analysis:', analysis)

      // Step 2: Retrieve Context
      const retrievedKnowledge = await this.retrieveRelevantContext(
        userMessage,
        agentId,
        maxKnowledgeChunks
      )

      // Step 3: Synergy Enhancement (if enabled)
      const synergyData = includeSynergy
        ? await this.enhanceWithSynergy(retrievedKnowledge)
        : undefined

      // Step 4: Memory Integration
      const conversationMemory = includeMemory && sessionId
        ? await this.retrieveConversationMemory(sessionId, agentId)
        : []

      // Build context
      const context: RAGContext = {
        retrievedKnowledge,
        conversationMemory,
        synergyData,
        agentProfile: {
          name: agent.name,
          title: agent.title,
          element: agent.consciousness.dominantElement,
          monicaConstant: agent.consciousness.monicaConstant,
        },
      }

      // Step 5: Build Prompt
      const prompt = this.buildEnhancedPrompt(userMessage, context, agent)

      // Step 6: Generate Response
      const response = await this.generateResponse(prompt, { model, temperature })

      // Step 7: Enrich Response
      const enrichedResponse = await this.enrichResponse(response, {
        agent: agent.name,
        knowledgeUsed: retrievedKnowledge.length,
      })

      // Save to memory
      if (sessionId && includeMemory) {
        await this.memoryManager.saveConversation(sessionId, agentId, userMessage, enrichedResponse)
      }

      const generationTime = Date.now() - startTime

      return {
        response: enrichedResponse,
        context,
        metadata: {
          knowledgeChunksUsed: retrievedKnowledge.length,
          memoryMessagesUsed: conversationMemory.length,
          generationTime,
        },
      }
    } catch (error) {
      console.error('[RAG] Generation pipeline failed:', error)
      throw new Error(`RAG generation failed: ${error}`)
    }
  }

  /**
   * Generate with streaming
   */
  async generateStream(
    options: RAGGenerationOptions,
    onToken: (token: string) => void
  ): Promise<RAGResponse> {
    const startTime = Date.now()
    const {
      agentId,
      agent,
      userMessage,
      sessionId,
      includeMemory = true,
      maxKnowledgeChunks = 3,
    } = options

    try {
      // Retrieve context (same as non-streaming)
      const retrievedKnowledge = await this.retrieveRelevantContext(
        userMessage,
        agentId,
        maxKnowledgeChunks
      )

      const conversationMemory = includeMemory && sessionId
        ? await this.retrieveConversationMemory(sessionId, agentId)
        : []

      const context: RAGContext = {
        retrievedKnowledge,
        conversationMemory,
        agentProfile: {
          name: agent.name,
          title: agent.title,
        },
      }

      const prompt = this.buildEnhancedPrompt(userMessage, context, agent)

      // Stream response
      const aiGatewayEnabled = String(process.env.AI_GATEWAY_ENABLED).toLowerCase() === 'true'
      const provider = openaiProvider({
        apiKey: aiGatewayEnabled ? (process.env.AI_GATEWAY_API_KEY as string) : (process.env.OPENAI_API_KEY as string),
        baseURL: aiGatewayEnabled ? process.env.AI_GATEWAY_URL : undefined,
      })

      const result = await streamText({
        model: provider('gpt-4-turbo-preview'),
        prompt,
      })

      let fullResponse = ''
      for await (const chunk of result.textStream) {
        fullResponse += chunk
        onToken(chunk)
      }

      // Save to memory
      if (sessionId && includeMemory) {
        await this.memoryManager.saveConversation(sessionId, agentId, userMessage, fullResponse)
      }

      return {
        response: fullResponse,
        context,
        metadata: {
          knowledgeChunksUsed: retrievedKnowledge.length,
          memoryMessagesUsed: conversationMemory.length,
          generationTime: Date.now() - startTime,
        },
      }
    } catch (error) {
      console.error('[RAG] Streaming generation failed:', error)
      throw error
    }
  }
}

/**
 * Global RAG generator instance
 */
let ragGeneratorInstance: RAGGenerator | null = null

/**
 * Get or create RAG generator
 */
export function getRAGGenerator(): RAGGenerator {
  if (!ragGeneratorInstance) {
    ragGeneratorInstance = new RAGGenerator()
  }
  return ragGeneratorInstance
}

/**
 * Generate RAG response (convenience function)
 */
export async function generateRAGResponse(options: RAGGenerationOptions): Promise<RAGResponse> {
  const generator = getRAGGenerator()
  return await generator.generate(options)
}
