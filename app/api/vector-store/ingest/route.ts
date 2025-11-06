/**
 * Vector Store Ingestion Endpoint
 * POST /api/vector-store/ingest
 *
 * Triggers ingestion of historical agent knowledge into vector database
 */

import { NextRequest, NextResponse } from 'next/server'
import { ingestAgentKnowledge, type IngestionProgress } from '@/lib/llamaindex'

export const maxDuration = 300 // 5 minutes for ingestion

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, agentIds, forceReindex } = body

    if (action !== 'ingest') {
      return NextResponse.json(
        { error: 'Invalid action. Use action: "ingest"' },
        { status: 400 }
      )
    }

    console.log('[Ingestion API] Starting ingestion...', {
      agentIds: agentIds || 'all',
      forceReindex: forceReindex || false,
    })

    // Track progress
    const progressUpdates: IngestionProgress[] = []

    const result = await ingestAgentKnowledge({
      forceReindex: forceReindex || false,
      agentIds: agentIds || undefined,
      progressCallback: (progress) => {
        progressUpdates.push({ ...progress })
        console.log(`[Ingestion API] ${progress.stage}: ${progress.message}`)
      },
    })

    console.log('[Ingestion API] Ingestion complete:', {
      success: result.success,
      agentsProcessed: result.agentsProcessed,
      chunksCreated: result.chunksCreated,
      timeElapsed: `${(result.timeElapsed / 1000).toFixed(2)}s`,
    })

    return NextResponse.json({
      success: result.success,
      result: {
        agentsProcessed: result.agentsProcessed,
        chunksCreated: result.chunksCreated,
        embeddingsGenerated: result.embeddingsGenerated,
        documentsStored: result.documentsStored,
        timeElapsed: result.timeElapsed,
        timeElapsedSeconds: (result.timeElapsed / 1000).toFixed(2),
        errors: result.errors,
        stats: result.stats,
      },
      progress: progressUpdates,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Ingestion API] Ingestion failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return ingestion status
  try {
    const { getIngestionStatus } = await import('@/lib/llamaindex')
    const status = await getIngestionStatus()

    return NextResponse.json({
      status: status.ready ? 'ready' : 'not_ready',
      collectionName: status.collectionName,
      documentCount: status.documentCount,
      message: status.message,
      lastIngestion: status.lastIngestion,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Ingestion API] Status check failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
