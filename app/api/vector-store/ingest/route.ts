/**
 * Vector Store Ingestion API
 * Populate vector store with agent knowledge
 */

import { NextRequest, NextResponse } from 'next/server'
import { ingestAllAgents, reindexAgent, rebuildIndex } from '@/lib/llamaindex/ingestion-pipeline'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for ingestion

/**
 * POST /api/vector-store/ingest
 * Ingest agent knowledge into vector store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'ingest', agentId } = body

    console.log(`[API] Vector store ingestion action: ${action}`)

    let result: any

    switch (action) {
      case 'ingest':
        // Ingest all agents
        result = await ingestAllAgents()
        return NextResponse.json({
          success: true,
          action: 'ingest',
          stats: result,
        })

      case 'reindex':
        // Reindex specific agent
        if (!agentId) {
          return NextResponse.json(
            {
              success: false,
              error: 'agentId is required for reindex action',
            },
            { status: 400 }
          )
        }

        const reindexSuccess = await reindexAgent(agentId)
        return NextResponse.json({
          success: reindexSuccess,
          action: 'reindex',
          agentId,
        })

      case 'rebuild':
        // Rebuild entire index
        result = await rebuildIndex()
        return NextResponse.json({
          success: true,
          action: 'rebuild',
          stats: result,
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}. Use 'ingest', 'reindex', or 'rebuild'.`,
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[API] Ingestion error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ingestion failed',
      },
      { status: 500 }
    )
  }
}
