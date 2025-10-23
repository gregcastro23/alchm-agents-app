/**
 * Vector Store Infrastructure for Planetary Agents
 * ChromaDB-based vector storage with OpenAI embeddings
 */

import { ChromaVectorStore } from 'llamaindex'
import { OpenAIEmbedding } from 'llamaindex'
import type { VectorStoreIndex, Document } from 'llamaindex'

export interface VectorStoreConfig {
  collectionName: string
  chromaUrl?: string
  persistDirectory?: string
}

export interface AgentDocumentMetadata {
  agentId: string
  agentName: string
  wisdomDomains: string[]
  historicalPeriod: string
  element: string
  modality: string
  consciousnessLevel: number
  monicaConstant: number
  documentType: 'profile' | 'personality' | 'abilities' | 'conversation'
}

/**
 * Singleton Vector Store Manager
 */
class VectorStoreManager {
  private static instance: VectorStoreManager
  private vectorStore: ChromaVectorStore | null = null
  private embeddings: OpenAIEmbedding | null = null
  private isInitialized = false

  private constructor() {}

  static getInstance(): VectorStoreManager {
    if (!VectorStoreManager.instance) {
      VectorStoreManager.instance = new VectorStoreManager()
    }
    return VectorStoreManager.instance
  }

  /**
   * Initialize the vector store with ChromaDB
   */
  async initialize(config: VectorStoreConfig): Promise<void> {
    if (this.isInitialized) {
      console.log('[VectorStore] Already initialized')
      return
    }

    try {
      console.log('[VectorStore] Initializing ChromaDB connection...')

      // Initialize OpenAI embeddings
      this.embeddings = new OpenAIEmbedding({
        model: 'text-embedding-3-small',
        dimensions: 1536,
      })

      // Initialize ChromaDB vector store
      this.vectorStore = await ChromaVectorStore.fromParams({
        collectionName: config.collectionName,
        url: config.chromaUrl || process.env.CHROMADB_URL || 'http://localhost:8000',
      })

      this.isInitialized = true
      console.log('[VectorStore] Initialized successfully')
    } catch (error) {
      console.error('[VectorStore] Initialization failed:', error)
      throw new Error(`Vector store initialization failed: ${error}`)
    }
  }

  /**
   * Get the vector store instance
   */
  getVectorStore(): ChromaVectorStore {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized. Call initialize() first.')
    }
    return this.vectorStore
  }

  /**
   * Get embeddings instance
   */
  getEmbeddings(): OpenAIEmbedding {
    if (!this.embeddings) {
      throw new Error('Embeddings not initialized. Call initialize() first.')
    }
    return this.embeddings
  }

  /**
   * Check if vector store is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.vectorStore !== null
  }

  /**
   * Add documents to vector store
   */
  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Vector store not ready')
    }

    try {
      console.log(`[VectorStore] Adding ${documents.length} documents...`)
      await this.vectorStore!.add(documents)
      console.log('[VectorStore] Documents added successfully')
    } catch (error) {
      console.error('[VectorStore] Failed to add documents:', error)
      throw error
    }
  }

  /**
   * Query vector store for similar documents
   */
  async query(
    queryText: string,
    options: {
      topK?: number
      filter?: Record<string, any>
    } = {}
  ): Promise<any[]> {
    if (!this.isReady()) {
      throw new Error('Vector store not ready')
    }

    try {
      const { topK = 5, filter } = options

      // Generate embedding for query
      const queryEmbedding = await this.embeddings!.getQueryEmbedding(queryText)

      // Query vector store
      const results = await this.vectorStore!.query({
        queryEmbedding,
        similarityTopK: topK,
        filters: filter,
      })

      return results.nodes || []
    } catch (error) {
      console.error('[VectorStore] Query failed:', error)
      throw error
    }
  }

  /**
   * Delete documents by filter
   */
  async delete(filter: Record<string, any>): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Vector store not ready')
    }

    try {
      console.log('[VectorStore] Deleting documents with filter:', filter)
      await this.vectorStore!.delete(filter)
      console.log('[VectorStore] Documents deleted successfully')
    } catch (error) {
      console.error('[VectorStore] Delete failed:', error)
      throw error
    }
  }

  /**
   * Clear entire collection
   */
  async clear(): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Vector store not ready')
    }

    try {
      console.log('[VectorStore] Clearing all documents...')
      await this.vectorStore!.clearStore()
      console.log('[VectorStore] Collection cleared successfully')
    } catch (error) {
      console.error('[VectorStore] Clear failed:', error)
      throw error
    }
  }

  /**
   * Get collection stats
   */
  async getStats(): Promise<{
    documentCount: number
    collectionName: string
  }> {
    if (!this.isReady()) {
      throw new Error('Vector store not ready')
    }

    try {
      // ChromaDB-specific stats retrieval would go here
      // For now, return basic info
      return {
        documentCount: 0, // Would need to query ChromaDB for actual count
        collectionName: 'planetary-agents',
      }
    } catch (error) {
      console.error('[VectorStore] Failed to get stats:', error)
      throw error
    }
  }
}

/**
 * Global vector store instance
 */
export const vectorStoreManager = VectorStoreManager.getInstance()

/**
 * Initialize vector store with default config
 */
export async function initializeVectorStore(): Promise<void> {
  await vectorStoreManager.initialize({
    collectionName: 'planetary-agents',
    chromaUrl: process.env.CHROMADB_URL || 'http://localhost:8000',
  })
}

/**
 * Get vector store instance
 */
export function getVectorStore(): ChromaVectorStore {
  return vectorStoreManager.getVectorStore()
}

/**
 * Get embeddings instance
 */
export function getEmbeddings(): OpenAIEmbedding {
  return vectorStoreManager.getEmbeddings()
}
