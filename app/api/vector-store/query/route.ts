/**
 * Vector Store Query API
 * Query the vector store for knowledge retrieval
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSemanticSearchService } from '@/lib/llamaindex/semantic-search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/vector-store/query
 * Query vector store for relevant knowledge
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query,
      agentId,
      topK = 5,
      minSimilarity = 0.5,
      filterByElement,
      filterByWisdomDomain,
      documentType,
    } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required and must be a string',
        },
        { status: 400 }
      )
    }

    console.log(`[API] Vector store query: "${query}"`)

    const searchService = getSemanticSearchService()
    const results = await searchService.search(query, {
      topK,
      minSimilarity,
      filterByElement,
      filterByWisdomDomain,
      documentType,
    })

    // If agentId provided, filter results
    const filteredResults = agentId
      ? results.filter((r) => r.agentId === agentId)
      : results

    return NextResponse.json({
      success: true,
      query,
      totalResults: filteredResults.length,
      results: filteredResults.map((r) => ({
        agentId: r.agentId,
        agentName: r.agentName,
        content: r.content,
        similarity: r.similarity,
        metadata: r.metadata,
      })),
    })
  } catch (error) {
    console.error('[API] Vector query error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Query failed',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/vector-store/query?query=creativity&topK=5
 * Query vector store via GET
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const agentId = searchParams.get('agentId')
    const topK = parseInt(searchParams.get('topK') || '5')

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter is required',
        },
        { status: 400 }
      )
    }

    console.log(`[API] Vector store query (GET): "${query}"`)

    const searchService = getSemanticSearchService()
    const results = await searchService.search(query, { topK })

    const filteredResults = agentId
      ? results.filter((r) => r.agentId === agentId)
      : results

    return NextResponse.json({
      success: true,
      query,
      totalResults: filteredResults.length,
      results: filteredResults,
    })
  } catch (error) {
    console.error('[API] Vector query (GET) error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Query failed',
      },
      { status: 500 }
    )
  }
}
