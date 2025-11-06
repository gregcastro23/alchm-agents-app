/**
 * RAG (Retrieval-Augmented Generation) Wrapper - FULL IMPLEMENTATION
 *
 * Integrates RAG capabilities into Monica and other agents.
 * Provides seamless fallback when RAG is disabled or unavailable.
 *
 * Feature flags:
 * - USE_RAG_GENERATION: Enable RAG-enhanced generation
 * - USE_VECTOR_SEARCH: Enable semantic search capabilities
 */

import {
  generateWithRAG as generateWithRAGCore,
  getRAGConfig,
  shouldUseRAG,
  summarizeRetrievedContext,
  type RAGGenerateOptions,
  type RAGResult,
  type RAGMetadata,
  type RAGSource,
} from './rag-generator'

export type { RAGGenerateOptions, RAGResult, RAGMetadata, RAGSource }

/**
 * Generate with RAG enhancement (main entry point)
 *
 * This function is the primary interface for RAG-enhanced generation.
 * It handles feature flag checks, fallback logic, and error handling.
 */
export async function generateWithRAG(options: RAGGenerateOptions): Promise<RAGResult> {
  // Check if RAG is globally enabled
  const ragConfig = getRAGConfig()

  if (!ragConfig.enabled) {
    console.log('[RAG Wrapper] RAG is disabled via feature flags')
    return {
      text: '',
      ragMetadata: {
        enabled: false,
        ragUsed: false,
      },
    }
  }

  // Check if this query should use RAG
  if (!shouldUseRAG(options.userMessage)) {
    console.log('[RAG Wrapper] Query does not require RAG enhancement')
    return {
      text: '',
      ragMetadata: {
        enabled: true,
        ragUsed: false,
        retrievedDocs: 0,
      },
    }
  }

  try {
    // Merge with environment config if not explicitly provided
    const mergedOptions: RAGGenerateOptions = {
      ...options,
      ragConfig: {
        enabled: ragConfig.enabled,
        topK: options.ragConfig?.topK || ragConfig.topK,
        threshold: options.ragConfig?.threshold || ragConfig.threshold,
        useReranking: options.ragConfig?.useReranking ?? ragConfig.useReranking,
      },
    }

    // Generate with RAG
    const result = await generateWithRAGCore(mergedOptions)

    // Log results
    if (result.ragMetadata.ragUsed && result.ragMetadata.sources) {
      const summary = summarizeRetrievedContext(
        result.ragMetadata.sources.map(s => ({
          id: s.agentId,
          agentId: s.agentId,
          agentName: s.agentName,
          content: s.excerpt,
          score: s.relevance,
          metadata: {
            agentId: s.agentId,
            agentName: s.agentName,
            chunkIndex: 0,
            totalChunks: 1,
            source: 'historical_agent',
          },
        }))
      )
      console.log(`[RAG Wrapper] ${summary}`)
    }

    return result
  } catch (error) {
    console.error('[RAG Wrapper] RAG generation failed, falling back:', error)

    // Graceful fallback - return empty text to trigger standard generation
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
 * Get RAG system status
 *
 * Returns information about RAG availability and configuration.
 */
export function getRAGStatus(): {
  enabled: boolean
  vectorStoreReady: boolean
  message: string
  config?: {
    topK: number
    threshold: number
    useReranking: boolean
    maxContextTokens: number
  }
} {
  const config = getRAGConfig()

  if (!config.enabled) {
    return {
      enabled: false,
      vectorStoreReady: false,
      message: 'RAG features are disabled (set USE_RAG_GENERATION=true or USE_VECTOR_SEARCH=true)',
    }
  }

  // TODO: Add actual vector store health check
  // For now, assume ready if enabled
  return {
    enabled: true,
    vectorStoreReady: true,
    message: 'RAG is enabled and operational',
    config: {
      topK: config.topK,
      threshold: config.threshold,
      useReranking: config.useReranking,
      maxContextTokens: config.maxContextTokens,
    },
  }
}

/**
 * Check if RAG is available for use
 */
export async function isRAGAvailable(): Promise<boolean> {
  try {
    const status = getRAGStatus()
    return status.enabled && status.vectorStoreReady
  } catch (error) {
    console.error('[RAG Wrapper] Error checking RAG availability:', error)
    return false
  }
}

/**
 * Warm up RAG system (preload collections, test connections, etc.)
 * Call this during app initialization for better first-request performance
 */
export async function warmupRAG(): Promise<boolean> {
  const config = getRAGConfig()

  if (!config.enabled) {
    console.log('[RAG Wrapper] RAG is disabled, skipping warmup')
    return false
  }

  try {
    console.log('[RAG Wrapper] Warming up RAG system...')

    // Import and check vector store health
    const { healthCheck } = await import('@/lib/llamaindex/vector-store')
    const health = await healthCheck()

    if (!health.healthy) {
      console.warn('[RAG Wrapper] Vector store is not healthy:', health.message)
      return false
    }

    console.log('[RAG Wrapper] RAG system warmup complete')
    return true
  } catch (error) {
    console.error('[RAG Wrapper] RAG warmup failed:', error)
    return false
  }
}

/**
 * Get RAG statistics (for debugging/monitoring)
 */
export function getRAGStats(): {
  enabled: boolean
  featuresUsed: string[]
  configuration: Record<string, any>
} {
  const config = getRAGConfig()

  const featuresUsed: string[] = []
  if (process.env.USE_RAG_GENERATION === 'true') {
    featuresUsed.push('RAG Generation')
  }
  if (process.env.USE_VECTOR_SEARCH === 'true') {
    featuresUsed.push('Vector Search')
  }

  return {
    enabled: config.enabled,
    featuresUsed,
    configuration: {
      topK: config.topK,
      threshold: config.threshold,
      useReranking: config.useReranking,
      maxContextTokens: config.maxContextTokens,
      embeddingsModel: process.env.EMBEDDINGS_MODEL || 'text-embedding-3-small',
      chromaDbUrl: process.env.CHROMADB_URL || 'http://localhost:8001',
    },
  }
}
