/**
 * Vector Store Health Check Endpoint
 * GET /api/vector-store/health
 *
 * Returns health status of ChromaDB and vector store system
 */

import { NextResponse } from 'next/server'
import { healthCheck, listCollections, getCollectionCount, getOrCreateCollection } from '@/lib/llamaindex'

export async function GET() {
  try {
    // Check ChromaDB health
    const health = await healthCheck()

    if (!health.healthy) {
      return NextResponse.json(
        {
          healthy: false,
          message: health.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    // Get collections info
    const collections = await listCollections()

    // Get document count for main collection
    let documentCount = 0
    try {
      const mainCollection = await getOrCreateCollection('historical_agents')
      documentCount = await getCollectionCount(mainCollection)
    } catch (error) {
      console.warn('[Health] Could not get document count:', error)
    }

    return NextResponse.json({
      healthy: true,
      message: 'Vector store is operational',
      url: health.url,
      collections: collections.length,
      documentCount,
      timestamp: new Date().toISOString(),
      features: {
        ragGeneration: process.env.USE_RAG_GENERATION === 'true',
        vectorSearch: process.env.USE_VECTOR_SEARCH === 'true',
      },
    })
  } catch (error) {
    console.error('[Health] Health check failed:', error)

    return NextResponse.json(
      {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
