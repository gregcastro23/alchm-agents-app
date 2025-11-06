/**
 * Vector Store Query Endpoint
 * POST /api/vector-store/query
 * GET /api/vector-store/query?query=...
 *
 * Performs semantic search across vector store
 */

import { NextRequest, NextResponse } from 'next/server'
import { semanticSearch } from '@/lib/llamaindex'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, topK, threshold, agentIds } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    console.log('[Query API] Searching:', { query, topK, threshold, agentIds })

    const results = await semanticSearch(query, {
      topK: topK || 5,
      threshold: threshold || 0.35, // L2 distance threshold
      agentIds,
      includeMetadata: true,
      useReranking: true,
    })

    return NextResponse.json({
      query,
      results: results.map(r => ({
        id: r.id,
        agentId: r.agentId,
        agentName: r.agentName,
        content: r.content,
        relevance: r.score,
        metadata: r.metadata,
      })),
      count: results.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Query API] Search failed:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const topK = parseInt(searchParams.get('topK') || '5')
  const threshold = parseFloat(searchParams.get('threshold') || '0.35') // L2 distance threshold
  const agentIdsParam = searchParams.get('agentIds')

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const agentIds = agentIdsParam ? agentIdsParam.split(',') : undefined

    console.log('[Query API] GET search:', { query, topK, threshold, agentIds })

    const results = await semanticSearch(query, {
      topK,
      threshold,
      agentIds,
      includeMetadata: true,
      useReranking: true,
    })

    return NextResponse.json({
      query,
      results: results.map(r => ({
        id: r.id,
        agentId: r.agentId,
        agentName: r.agentName,
        content: r.content,
        relevance: r.score,
        metadata: r.metadata,
      })),
      count: results.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Query API] GET search failed:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
