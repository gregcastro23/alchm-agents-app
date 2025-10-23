/**
 * Vector Store Infrastructure for Planetary Agents (v2)
 * Using LlamaIndex 0.12.0 with SimpleVectorStore and OpenAI embeddings
 */

import {
  VectorStoreIndex,
  Document,
  SimpleVectorStore,
  Settings,
  storageContextFromDefaults,
  StorageContext,
} from 'llamaindex'
import type { BaseNode } from 'llamaindex'
import { OpenAIEmbedding } from '@llamaindex/openai'

// Configure global embedding model
Settings.embedModel = new OpenAIEmbedding({
  model: 'text-embedding-3-small',
})

export interface VectorStoreConfig {
  persistPath?: string
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
 * Singleton Vector Store Manager using LlamaIndex
 */
class VectorStoreManager {
  private static instance: VectorStoreManager
  private index: VectorStoreIndex | null = null
  private vectorStore: SimpleVectorStore | null = null
  private storageContext: StorageContext | null = null
  private documents: Document[] = []
  private isInitialized = false
  private persistPath: string | null = null

  private constructor() {}

  static getInstance(): VectorStoreManager {
    if (!VectorStoreManager.instance) {
      VectorStoreManager.instance = new VectorStoreManager()
    }
    return VectorStoreManager.instance
  }

  /**
   * Initialize the vector store
   */
  async initialize(config: VectorStoreConfig = {}): Promise<void> {
    if (this.isInitialized) {
      console.log('[VectorStore] Already initialized')
      return
    }

    try {
      console.log('[VectorStore] Initializing LlamaIndex vector store...')

      this.persistPath = config.persistPath || null

      // Try to load from persisted storage if path provided
      if (this.persistPath) {
        const loaded = await this.loadFromPersistence(this.persistPath)
        if (loaded) {
          this.isInitialized = true
          return
        }
      }

      // Create fresh storage context
      this.storageContext = await storageContextFromDefaults({
        persistDir: this.persistPath || undefined,
      })

      console.log('[VectorStore] Initialized successfully (fresh storage)')
      this.isInitialized = true
    } catch (error) {
      console.error('[VectorStore] Initialization failed:', error)
      throw new Error(`Vector store initialization failed: ${error}`)
    }
  }

  /**
   * Load index from persisted storage
   */
  private async loadFromPersistence(persistPath: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')

      // Check if persist directory exists
      try {
        await fs.access(persistPath)
      } catch {
        console.log('[VectorStore] No persisted data found, starting fresh')
        return false
      }

      // Check for required files (at minimum need index_store and vector_store)
      const indexStorePath = path.join(persistPath, 'index_store.json')
      const vectorStorePath = path.join(persistPath, 'vector_store.json')

      try {
        await fs.access(indexStorePath)
        await fs.access(vectorStorePath)
      } catch {
        console.log('[VectorStore] Incomplete persisted data, starting fresh')
        return false
      }

      // Load storage context from persisted data
      console.log('[VectorStore] Loading from persisted storage...')
      this.storageContext = await storageContextFromDefaults({
        persistDir: persistPath,
      })

      // Load the index
      this.index = await VectorStoreIndex.init({
        storageContext: this.storageContext,
      })

      // Count documents in the index
      const docCount = Object.keys(this.storageContext.docStore.docs).length
      console.log(`[VectorStore] Loaded persisted index with ${docCount} documents`)

      return true
    } catch (error) {
      console.error('[VectorStore] Failed to load persisted data:', error)
      return false
    }
  }

  /**
   * Add documents to vector store and build index
   */
  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Vector store not initialized. Call initialize() first.')
    }

    try {
      console.log(`[VectorStore] Adding ${documents.length} documents...`)

      if (!this.index) {
        // Build initial index with storage context
        this.index = await VectorStoreIndex.fromDocuments(documents, {
          storageContext: this.storageContext!,
        })
      } else {
        // Insert nodes into existing index
        for (const doc of documents) {
          await this.index.insert(doc)
        }
      }

      this.documents.push(...documents)
      console.log('[VectorStore] Documents added and index built successfully')
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
    } = {}
  ): Promise<any[]> {
    if (!this.index) {
      console.warn('[VectorStore] No index built yet, returning empty results')
      return []
    }

    try {
      const { topK = 5 } = options

      // Use retriever directly (doesn't require LLM)
      const retriever = this.index.asRetriever({
        similarityTopK: topK,
      })

      // Retrieve similar nodes
      const nodes = await retriever.retrieve(queryText)

      return nodes.map((node: any) => ({
        node: {
          text: node.node?.text || node.node?.getContent?.() || '',
          metadata: node.node?.metadata || {},
        },
        score: node.score || 0,
      }))
    } catch (error) {
      console.error('[VectorStore] Query failed:', error)
      throw error
    }
  }

  /**
   * Persist index to disk
   */
  async persist(persistPath?: string): Promise<void> {
    const targetPath = persistPath || this.persistPath

    if (!targetPath) {
      console.warn('[VectorStore] No persist path configured, skipping persistence')
      return
    }

    if (!this.storageContext) {
      throw new Error('No storage context to persist')
    }

    try {
      console.log(`[VectorStore] Persisting index to ${targetPath}...`)

      // Create directory if it doesn't exist
      const fs = await import('fs/promises')
      const path = await import('path')
      await fs.mkdir(targetPath, { recursive: true })

      // Persist each component of the storage context with proper file paths
      const docStorePath = path.join(targetPath, 'docstore.json')
      const indexStorePath = path.join(targetPath, 'index_store.json')
      const vectorStorePath = path.join(targetPath, 'vector_store.json')

      await this.storageContext.docStore.persist(docStorePath)
      await this.storageContext.indexStore.persist(indexStorePath)

      // Note: vectorStores is an object/map in the storage context
      if (this.storageContext.vectorStores) {
        for (const [, vectorStore] of Object.entries(this.storageContext.vectorStores)) {
          if (vectorStore && typeof vectorStore.persist === 'function') {
            await vectorStore.persist(vectorStorePath)
          }
        }
      }

      console.log('[VectorStore] Index persisted successfully')
      console.log(`  - Location: ${targetPath}`)
      console.log(`  - Documents: ${this.documents.length}`)
    } catch (error) {
      console.error('[VectorStore] Failed to persist:', error)
      throw error
    }
  }

  /**
   * Check if vector store is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.index !== null
  }

  /**
   * Clear entire collection
   */
  async clear(): Promise<void> {
    console.log('[VectorStore] Clearing all documents...')
    this.documents = []
    this.index = null

    // Recreate storage context
    if (this.persistPath) {
      this.storageContext = await storageContextFromDefaults({
        persistDir: this.persistPath,
      })
    } else {
      this.storageContext = await storageContextFromDefaults({})
    }

    console.log('[VectorStore] Collection cleared successfully')
  }

  /**
   * Get collection stats
   */
  async getStats(): Promise<{
    documentCount: number
    isIndexed: boolean
    isPersisted: boolean
  }> {
    let docCount = this.documents.length

    // If loaded from persistence, get actual doc count from storage
    if (this.storageContext && docCount === 0) {
      docCount = Object.keys(this.storageContext.docStore.docs).length
    }

    return {
      documentCount: docCount,
      isIndexed: this.index !== null,
      isPersisted: this.persistPath !== null,
    }
  }

  /**
   * Get all documents
   */
  getDocuments(): Document[] {
    return this.documents
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
  const persistPath = process.env.LLAMAINDEX_PERSIST_DIR || '.cache/llamaindex'
  await vectorStoreManager.initialize({ persistPath })
}

/**
 * Get embeddings instance
 */
export function getEmbeddings(): OpenAIEmbedding {
  return new OpenAIEmbedding({
    model: 'text-embedding-3-small',
  })
}

/**
 * Check if ready
 */
export function isVectorStoreReady(): boolean {
  return vectorStoreManager.isReady()
}
