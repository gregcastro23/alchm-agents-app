/**
 * RAG Generator - Retrieval-Augmented Generation
 *
 * Integrates semantic search with AI generation to enhance responses
 * with retrieved agent knowledge. Works with both Claude and GPT models.
 */

import { semanticSearch, type SearchResult } from '@/lib/llamaindex/semantic-search'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

// Configuration
const MAX_CONTEXT_TOKENS = parseInt(process.env.RAG_MAX_CONTEXT_TOKENS || '1500')
const CHARS_PER_TOKEN = 4

export interface RAGGenerateOptions {
  agent: any // Historical or planetary agent
  agentId: string
  userMessage: string
  systemPrompt: string
  conversationHistory?: Array<{ role: string; content: string }>
  sessionId?: string
  ragConfig?: {
    enabled: boolean
    topK: number
    threshold: number
    useReranking: boolean
  }
}

export interface RAGSource {
  agentId: string
  agentName: string
  excerpt: string
  relevance: number
}

export interface RAGMetadata {
  enabled: boolean
  ragUsed: boolean
  retrievedDocs?: number
  sources?: RAGSource[]
  queryTime?: number
  totalTime?: number
  error?: string
}

export interface RAGResult {
  text: string // AI-generated response
  ragMetadata: RAGMetadata
}

/**
 * Generate with RAG enhancement
 * Performs semantic search, builds context, and generates response
 */
export async function generateWithRAG(
  options: RAGGenerateOptions
): Promise<RAGResult> {
  const startTime = Date.now()

  // Check if RAG is enabled
  const ragEnabled = options.ragConfig?.enabled !== false &&
    (process.env.USE_RAG_GENERATION === 'true' || process.env.USE_VECTOR_SEARCH === 'true')

  if (!ragEnabled) {
    return {
      text: '',
      ragMetadata: {
        enabled: false,
        ragUsed: false,
      },
    }
  }

  try {
    console.log(`[RAG] Generating with RAG for agent ${options.agentId}`)

    // Stage 1: Semantic Search
    const searchStartTime = Date.now()

    const searchResults = await semanticSearch(options.userMessage, {
      topK: options.ragConfig?.topK || 5,
      threshold: options.ragConfig?.threshold || 0.7,
      agentIds: options.agentId ? [options.agentId] : undefined,
      includeMetadata: true,
      useReranking: options.ragConfig?.useReranking !== false,
    })

    const queryTime = Date.now() - searchStartTime

    console.log(`[RAG] Retrieved ${searchResults.length} relevant documents in ${queryTime}ms`)

    // If no results, fall back to standard generation
    if (searchResults.length === 0) {
      console.log('[RAG] No relevant documents found, falling back to standard generation')
      return {
        text: '',
        ragMetadata: {
          enabled: true,
          ragUsed: false,
          retrievedDocs: 0,
          queryTime,
        },
      }
    }

    // Stage 2: Build Enhanced Context
    const enhancedContext = buildEnhancedContext(searchResults, MAX_CONTEXT_TOKENS)

    // Stage 3: Generate with Claude
    const enhancedSystemPrompt = buildEnhancedPrompt(
      options.systemPrompt,
      enhancedContext,
      options.agent
    )

    const messages = [
      ...(options.conversationHistory || []),
      { role: 'user' as const, content: options.userMessage },
    ]

    const response = await generateText({
      model: anthropic(process.env.CLAUDE_DEFAULT_MODEL || 'claude-3-sonnet-20240229'),
      system: enhancedSystemPrompt,
      messages,
      temperature: 0.7,
    })

    const totalTime = Date.now() - startTime

    // Build sources for metadata
    const sources: RAGSource[] = searchResults.map(r => ({
      agentId: r.agentId,
      agentName: r.agentName,
      excerpt: r.content.substring(0, 100) + (r.content.length > 100 ? '...' : ''),
      relevance: r.score,
    }))

    console.log(`[RAG] Generated response in ${totalTime}ms (search: ${queryTime}ms)`)

    return {
      text: response.text,
      ragMetadata: {
        enabled: true,
        ragUsed: true,
        retrievedDocs: searchResults.length,
        sources,
        queryTime,
        totalTime,
      },
    }
  } catch (error) {
    console.error('[RAG] Generation failed:', error)

    // Graceful fallback
    return {
      text: '',
      ragMetadata: {
        enabled: true,
        ragUsed: false,
        error: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

/**
 * Build enhanced context from search results
 * Formats retrieved knowledge for inclusion in system prompt
 */
export function buildEnhancedContext(
  results: SearchResult[],
  maxTokens: number = MAX_CONTEXT_TOKENS
): string {
  const sections: string[] = []
  const maxChars = maxTokens * CHARS_PER_TOKEN
  let currentLength = 0

  sections.push('## Retrieved Knowledge Context\n')
  sections.push('The following wisdom has been retrieved from related agents:\n')

  for (const result of results) {
    const agentSection = `\n### From ${result.agentName} (Relevance: ${(result.score * 100).toFixed(0)}%)\n${result.content}\n`

    // Check if adding this would exceed limit
    if (currentLength + agentSection.length > maxChars) {
      break
    }

    sections.push(agentSection)
    currentLength += agentSection.length
  }

  sections.push('\nUse the above context to enhance your response, but maintain your unique personality and voice.')

  return sections.join('')
}

/**
 * Build enhanced system prompt with retrieved context
 */
export function buildEnhancedPrompt(
  basePrompt: string,
  retrievedContext: string,
  agent: any
): string {
  const sections: string[] = []

  // Original system prompt
  sections.push(basePrompt)

  // Add retrieved context
  sections.push('\n---\n')
  sections.push(retrievedContext)

  // Guidance for using retrieved context
  sections.push('\n---\n')
  sections.push('## Guidance for Using Retrieved Context\n')
  sections.push('1. Use the retrieved knowledge to provide deeper, more informed responses')
  sections.push('2. Cite or reference other agents when their wisdom is relevant')
  sections.push('3. Maintain your unique personality - don\'t simply parrot the retrieved content')
  sections.push('4. Synthesize insights from multiple sources when applicable')
  sections.push('5. If retrieved context contradicts your perspective, acknowledge it thoughtfully')

  return sections.join('\n')
}

/**
 * Generate summary of retrieved context for logging/debugging
 */
export function summarizeRetrievedContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant context retrieved'
  }

  const agentNames = [...new Set(results.map(r => r.agentName))]
  const avgRelevance = results.reduce((sum, r) => sum + r.score, 0) / results.length

  return `Retrieved ${results.length} passages from ${agentNames.length} agent(s): ${agentNames.join(', ')} ` +
    `(avg relevance: ${(avgRelevance * 100).toFixed(0)}%)`
}

/**
 * Check if RAG should be used for a given query
 * Some queries might not benefit from RAG (e.g., greetings)
 */
export function shouldUseRAG(userMessage: string): boolean {
  const message = userMessage.toLowerCase().trim()

  // Skip RAG for simple greetings
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good evening']
  if (greetings.some(g => message === g)) {
    return false
  }

  // Skip RAG for very short queries (likely not substantive)
  if (message.length < 10) {
    return false
  }

  // Use RAG for questions and substantive statements
  return true
}

/**
 * Get RAG configuration from environment
 */
export function getRAGConfig(): {
  enabled: boolean
  topK: number
  threshold: number
  useReranking: boolean
  maxContextTokens: number
} {
  return {
    enabled: process.env.USE_RAG_GENERATION === 'true' || process.env.USE_VECTOR_SEARCH === 'true',
    topK: parseInt(process.env.RAG_TOP_K || '5'),
    threshold: parseFloat(process.env.RAG_RELEVANCE_THRESHOLD || '0.7'),
    useReranking: process.env.RAG_USE_RERANKING !== 'false',
    maxContextTokens: parseInt(process.env.RAG_MAX_CONTEXT_TOKENS || '1500'),
  }
}
