/**
 * Ingestion Pipeline for Agent Knowledge
 * Populates vector store with agent documents
 */

import dotenv from 'dotenv'
import { initializeVectorStore, vectorStoreManager } from './vector-store'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })
import { getAgentDocumentLoader } from './document-loader'
import { getEmbeddingsService } from './embeddings-service'

export interface IngestionStats {
  totalAgents: number
  totalDocuments: number
  successfulIngestions: number
  failedIngestions: number
  duration: number
  errors: string[]
}

/**
 * Ingest all agent knowledge into vector store
 */
export async function ingestAllAgents(): Promise<IngestionStats> {
  const startTime = Date.now()
  const stats: IngestionStats = {
    totalAgents: 0,
    totalDocuments: 0,
    successfulIngestions: 0,
    failedIngestions: 0,
    duration: 0,
    errors: [],
  }

  try {
    console.log('[Ingestion] Starting agent knowledge ingestion...')

    // Initialize vector store
    await initializeVectorStore()
    console.log('[Ingestion] Vector store initialized')

    // Load documents
    const loader = getAgentDocumentLoader()
    const documents = await loader.loadAllAgents()

    stats.totalDocuments = documents.length
    stats.totalAgents = documents.length / 5 // 5 documents per agent

    console.log(`[Ingestion] Loaded ${documents.length} documents from ${stats.totalAgents} agents`)

    // Ingest documents in batches
    const batchSize = 10
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)

      try {
        await vectorStoreManager.addDocuments(batch)
        stats.successfulIngestions += batch.length
        console.log(`[Ingestion] Processed ${stats.successfulIngestions}/${documents.length} documents`)
      } catch (error) {
        stats.failedIngestions += batch.length
        stats.errors.push(`Batch ${i / batchSize + 1} failed: ${error}`)
        console.error(`[Ingestion] Batch failed:`, error)
      }
    }

    stats.duration = Date.now() - startTime

    // Persist the index
    const persistPath = process.env.LLAMAINDEX_PERSIST_DIR || '.cache/llamaindex'
    try {
      await vectorStoreManager.persist(persistPath)
      console.log(`[Ingestion] Index persisted to ${persistPath}`)
    } catch (error) {
      console.error('[Ingestion] Failed to persist index:', error)
    }

    console.log('[Ingestion] Completed!')
    console.log(`  - Total Documents: ${stats.totalDocuments}`)
    console.log(`  - Successful: ${stats.successfulIngestions}`)
    console.log(`  - Failed: ${stats.failedIngestions}`)
    console.log(`  - Duration: ${stats.duration}ms`)

    return stats
  } catch (error) {
    console.error('[Ingestion] Fatal error:', error)
    stats.errors.push(`Fatal error: ${error}`)
    stats.duration = Date.now() - startTime
    throw error
  }
}

/**
 * Re-index a single agent
 */
export async function reindexAgent(agentId: string): Promise<boolean> {
  try {
    console.log(`[Ingestion] Re-indexing agent: ${agentId}`)

    const loader = getAgentDocumentLoader()
    const agent = loader.getAgentById(agentId)

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    // Delete existing documents for this agent
    await vectorStoreManager.delete({ agentId })

    // Load new documents
    const documents = await loader.loadAgent(agent)

    // Add to vector store
    await vectorStoreManager.addDocuments(documents)

    console.log(`[Ingestion] Re-indexed ${documents.length} documents for ${agent.name}`)
    return true
  } catch (error) {
    console.error(`[Ingestion] Failed to re-index agent ${agentId}:`, error)
    return false
  }
}

/**
 * Clear and rebuild entire index
 */
export async function rebuildIndex(): Promise<IngestionStats> {
  console.log('[Ingestion] Rebuilding entire index...')

  try {
    // Clear existing index
    await vectorStoreManager.clear()
    console.log('[Ingestion] Cleared existing index')

    // Ingest all agents
    return await ingestAllAgents()
  } catch (error) {
    console.error('[Ingestion] Failed to rebuild index:', error)
    throw error
  }
}

/**
 * Verify index health
 */
export async function verifyIndex(): Promise<{
  isHealthy: boolean
  documentCount: number
  errors: string[]
}> {
  const result = {
    isHealthy: true,
    documentCount: 0,
    errors: [] as string[],
  }

  try {
    console.log('[Ingestion] Verifying index health...')

    if (!vectorStoreManager.isReady()) {
      result.isHealthy = false
      result.errors.push('Vector store not initialized')
      return result
    }

    const stats = await vectorStoreManager.getStats()
    result.documentCount = stats.documentCount

    console.log(`[Ingestion] Index contains ${result.documentCount} documents`)

    // Check if we have expected number of documents (31 agents × 5 docs)
    const expectedDocs = 31 * 5 // 155 documents
    if (result.documentCount < expectedDocs * 0.9) {
      // Allow 10% tolerance
      result.isHealthy = false
      result.errors.push(
        `Document count (${result.documentCount}) is below expected (${expectedDocs})`
      )
    }

    return result
  } catch (error) {
    result.isHealthy = false
    result.errors.push(`Verification failed: ${error}`)
    return result
  }
}

/**
 * CLI interface for running ingestion
 */
export async function runIngestionCLI() {
  console.log('='.repeat(60))
  console.log('Planetary Agents - Vector Store Ingestion')
  console.log('='.repeat(60))

  try {
    const stats = await ingestAllAgents()

    console.log('\n' + '='.repeat(60))
    console.log('Ingestion Summary')
    console.log('='.repeat(60))
    console.log(`Total Agents: ${stats.totalAgents}`)
    console.log(`Total Documents: ${stats.totalDocuments}`)
    console.log(`Successful: ${stats.successfulIngestions}`)
    console.log(`Failed: ${stats.failedIngestions}`)
    console.log(`Duration: ${(stats.duration / 1000).toFixed(2)}s`)

    if (stats.errors.length > 0) {
      console.log('\nErrors:')
      stats.errors.forEach((error) => console.log(`  - ${error}`))
    }

    console.log('='.repeat(60))

    // Verify index
    const verification = await verifyIndex()
    console.log(`\nIndex Health: ${verification.isHealthy ? '✓ HEALTHY' : '✗ UNHEALTHY'}`)
    console.log(`Document Count: ${verification.documentCount}`)

    if (!verification.isHealthy) {
      console.log('Verification Errors:')
      verification.errors.forEach((error) => console.log(`  - ${error}`))
    }
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error)
    process.exit(1)
  }
}

// Run if executed directly (ESM compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  runIngestionCLI().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
