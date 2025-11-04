/**
 * RAG Wrapper for Monica Agent API
 * Integrates RAG generation with existing Monica/Historical agent system
 */

import { generateRAGResponse, type RAGGenerationOptions } from './rag-generator'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { CraftedAgent } from '../agent-types'

/**
 * Check if RAG should be used based on feature flags
 */
export function shouldUseRAG(): boolean {
  const useRAG = process.env.USE_RAG_GENERATION === 'true'
  const vectorSearchEnabled = process.env.USE_VECTOR_SEARCH === 'true'

  return useRAG && vectorSearchEnabled
}

/**
 * Generate response with RAG or fallback to direct generation
 */
export async function generateWithRAG(options: {
  agent: CraftedAgent
  agentId: string
  userMessage: string
  systemPrompt: string
  sessionId?: string
  model?: string
  temperature?: number
  maxTokens?: number
}): Promise<{ text: string; ragMetadata?: any }> {
  const {
    agent,
    agentId,
    userMessage,
    systemPrompt,
    sessionId,
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 800,
  } = options

  // Check if RAG should be used
  const useRAG = shouldUseRAG()

  if (!useRAG) {
    console.log('[RAG] Feature disabled, using direct generation')

    // Direct generation (existing behavior)
    // Try OpenAI first, fallback to environment check
    try {
      console.log('[AI] Attempting OpenAI generation with model:', model)
      const { text } = await generateText({
        model: openai(model),
        system: systemPrompt,
        prompt: userMessage,
        maxTokens,
        temperature,
      })
      console.log('[AI] OpenAI generation successful, response length:', text.length)
      return { text }
    } catch (openaiError) {
      console.error('[AI] OpenAI generation failed with error:', openaiError)
      console.error('[AI] Error details:', {
        name: openaiError instanceof Error ? openaiError.name : 'Unknown',
        message: openaiError instanceof Error ? openaiError.message : String(openaiError),
        stack: openaiError instanceof Error ? openaiError.stack?.substring(0, 200) : 'No stack',
      })
      
      // If OpenAI fails and we have Anthropic key, try that
      if (process.env.ANTHROPIC_API_KEY) {
        console.log('[AI] Attempting Anthropic fallback with claude-3-5-haiku')
        try {
          const { anthropic } = await import('@ai-sdk/anthropic')
          const { text } = await generateText({
            model: anthropic('claude-3-5-haiku-20241022'),
            system: systemPrompt,
            prompt: userMessage,
            maxTokens,
            temperature,
          })
          console.log('[AI] Anthropic fallback successful, response length:', text.length)
          return { text }
        } catch (anthropicError) {
          console.error('[AI] Anthropic fallback also failed:', anthropicError)
          console.error('[AI] Anthropic error details:', {
            name: anthropicError instanceof Error ? anthropicError.name : 'Unknown',
            message: anthropicError instanceof Error ? anthropicError.message : String(anthropicError),
          })
          throw anthropicError // Throw Anthropic error if both fail
        }
      }
      throw openaiError
    }
  }

  try {
    console.log(`[RAG] Using RAG generation for ${agent.name}`)

    // RAG-enhanced generation
    const ragOptions: RAGGenerationOptions = {
      agentId,
      agent,
      userMessage,
      sessionId,
      includeMemory: !!sessionId,
      includeSynergy: false, // Can be enabled based on request
      maxKnowledgeChunks: parseInt(process.env.RAG_MAX_KNOWLEDGE_CHUNKS || '3'),
      model: model.includes('gpt') ? 'openai' : 'anthropic',
      temperature,
    }

    const ragResponse = await generateRAGResponse(ragOptions)

    console.log(`[RAG] Generated response with ${ragResponse.metadata.knowledgeChunksUsed} knowledge chunks`)

    return {
      text: ragResponse.response,
      ragMetadata: {
        knowledgeChunksUsed: ragResponse.metadata.knowledgeChunksUsed,
        memoryMessagesUsed: ragResponse.metadata.memoryMessagesUsed,
        generationTime: ragResponse.metadata.generationTime,
        ragEnabled: true,
      },
    }
  } catch (error) {
    console.error('[RAG] RAG generation failed, falling back to direct generation:', error)

    // Fallback to direct generation
    try {
      const { text } = await generateText({
        model: openai(model),
        system: systemPrompt,
        prompt: userMessage,
        maxTokens,
        temperature,
      })

      return {
        text,
        ragMetadata: {
          ragEnabled: false,
          error: error instanceof Error ? error.message : 'RAG generation failed',
          fallback: true,
        },
      }
    } catch (openaiError) {
      console.error('[AI] OpenAI fallback also failed, trying Anthropic:', openaiError)
      console.error('[AI] OpenAI fallback error details:', {
        name: openaiError instanceof Error ? openaiError.name : 'Unknown',
        message: openaiError instanceof Error ? openaiError.message : String(openaiError),
      })
      
      // Last resort: try Anthropic if available
      if (process.env.ANTHROPIC_API_KEY) {
        console.log('[AI] Attempting final Anthropic fallback')
        try {
          const { anthropic } = await import('@ai-sdk/anthropic')
          const { text } = await generateText({
            model: anthropic('claude-3-5-haiku-20241022'),
            system: systemPrompt,
            prompt: userMessage,
            maxTokens,
            temperature,
          })
          console.log('[AI] Final Anthropic fallback successful')
          return {
            text,
            ragMetadata: {
              ragEnabled: false,
              error: 'OpenAI failed, used Anthropic fallback',
              fallback: true,
              modelUsed: 'claude-3-5-haiku',
            },
          }
        } catch (finalAnthropicError) {
          console.error('[AI] Final Anthropic fallback also failed:', finalAnthropicError)
          throw new Error(
            `All AI providers failed. OpenAI: ${openaiError instanceof Error ? openaiError.message : String(openaiError)}. Anthropic: ${finalAnthropicError instanceof Error ? finalAnthropicError.message : String(finalAnthropicError)}`
          )
        }
      }
      throw new Error(`Both OpenAI and Anthropic failed. OpenAI: ${openaiError}. RAG: ${error}`)
    }
  }
}

/**
 * Get RAG status for API responses
 */
export function getRAGStatus(): {
  enabled: boolean
  vectorSearchEnabled: boolean
  maxKnowledgeChunks: number
  minSimilarity: number
} {
  return {
    enabled: process.env.USE_RAG_GENERATION === 'true',
    vectorSearchEnabled: process.env.USE_VECTOR_SEARCH === 'true',
    maxKnowledgeChunks: parseInt(process.env.RAG_MAX_KNOWLEDGE_CHUNKS || '3'),
    minSimilarity: parseFloat(process.env.RAG_MIN_SIMILARITY || '0.6'),
  }
}
