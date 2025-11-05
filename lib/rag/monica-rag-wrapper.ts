/**
 * RAG (Retrieval-Augmented Generation) Wrapper - STUB VERSION
 *
 * This is a stub implementation since RAG features are disabled by default.
 * The full RAG implementation requires llamaindex which has compatibility issues.
 *
 * Feature flag: USE_RAG_GENERATION=false (default)
 */

interface RAGGenerateOptions {
  agent: any
  agentId: string
  conversationHistory?: any[]
  requestData?: any
  [key: string]: any
}

interface RAGResult {
  text: string
  ragMetadata: {
    enabled: boolean
    retrievedDocs?: number
    ragUsed?: boolean
  }
}

/**
 * Stub function for RAG-enhanced generation
 * Always returns empty response since RAG is disabled
 */
export async function generateWithRAG(options: RAGGenerateOptions): Promise<RAGResult> {
  // RAG is disabled, return stub response
  return {
    text: '',
    ragMetadata: {
      enabled: false,
      ragUsed: false,
    },
  }
}

/**
 * Returns RAG system status
 */
export function getRAGStatus(): {
  enabled: boolean
  vectorStoreReady: boolean
  message: string
} {
  return {
    enabled: false,
    vectorStoreReady: false,
    message: 'RAG features are disabled (USE_RAG_GENERATION=false)',
  }
}
