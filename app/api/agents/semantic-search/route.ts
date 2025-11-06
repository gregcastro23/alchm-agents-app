/**
 * Agent Semantic Search Endpoint
 * POST /api/agents/semantic-search
 *
 * Agent-focused semantic search with support for:
 * - Single agent search
 * - Multi-agent search with grouping
 * - Finding similar agents by concept
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  searchAgentKnowledge,
  multiAgentSearch,
  findSimilarAgents,
  diverseSearch,
  searchWithFilters,
  getSearchStats,
} from '@/lib/llamaindex'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { concept, agentId, agentIds, topK, mode, filters } = body

    if (!concept) {
      return NextResponse.json(
        { error: 'Concept/query is required' },
        { status: 400 }
      )
    }

    // Determine search mode
    const searchMode = mode || 'standard'

    console.log('[Semantic Search API] Mode:', searchMode, {
      concept,
      agentId,
      agentIds: agentIds?.length || 0,
    })

    // Single agent search
    if (agentId && !agentIds) {
      const results = await searchAgentKnowledge(agentId, concept, topK)

      return NextResponse.json({
        mode: 'single-agent',
        concept,
        agentId,
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
    }

    // Multi-agent search with grouping
    if (agentIds && Array.isArray(agentIds) && agentIds.length > 0) {
      const results = await multiAgentSearch(concept, agentIds, topK || 3)

      // Convert Map to object for JSON serialization
      const resultsByAgent: Record<string, any[]> = {}
      results.resultsByAgent.forEach((agentResults, agentId) => {
        resultsByAgent[agentId] = agentResults.map(r => ({
          id: r.id,
          agentName: r.agentName,
          content: r.content,
          relevance: r.score,
          metadata: r.metadata,
        }))
      })

      return NextResponse.json({
        mode: 'multi-agent',
        concept,
        agentIds,
        totalResults: results.totalResults,
        resultsByAgent,
        topResults: results.topResults.map(r => ({
          id: r.id,
          agentId: r.agentId,
          agentName: r.agentName,
          content: r.content,
          relevance: r.score,
          metadata: r.metadata,
        })),
        timestamp: new Date().toISOString(),
      })
    }

    // Find similar agents by concept
    if (searchMode === 'similar-agents') {
      const agents = await findSimilarAgents(concept, topK || 10)

      return NextResponse.json({
        mode: 'similar-agents',
        concept,
        agents,
        count: agents.length,
        timestamp: new Date().toISOString(),
      })
    }

    // Diverse search (variety across agents)
    if (searchMode === 'diverse') {
      const results = await diverseSearch(concept, topK || 5)

      return NextResponse.json({
        mode: 'diverse',
        concept,
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
    }

    // Search with filters
    if (searchMode === 'filtered' && filters) {
      const results = await searchWithFilters(concept, filters, topK || 5)

      return NextResponse.json({
        mode: 'filtered',
        concept,
        filters,
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
    }

    // Get search statistics
    if (searchMode === 'stats') {
      const stats = await getSearchStats(concept)

      return NextResponse.json({
        mode: 'stats',
        concept,
        stats,
        timestamp: new Date().toISOString(),
      })
    }

    // Standard semantic search (no agent filtering)
    const { semanticSearch } = await import('@/lib/llamaindex')
    const results = await semanticSearch(concept, {
      topK: topK || 5,
      threshold: 0.35, // L2 distance threshold
      includeMetadata: true,
      useReranking: true,
    })

    return NextResponse.json({
      mode: 'standard',
      concept,
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
    console.error('[Semantic Search API] Search failed:', error)

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
  const concept = searchParams.get('concept')

  if (!concept) {
    return NextResponse.json(
      {
        error: 'Concept parameter is required',
        examples: [
          '/api/agents/semantic-search?concept=creativity',
          '/api/agents/semantic-search?concept=philosophy&mode=similar-agents',
        ],
      },
      { status: 400 }
    )
  }

  try {
    const mode = searchParams.get('mode') || 'standard'
    const topK = parseInt(searchParams.get('topK') || '5')

    if (mode === 'similar-agents') {
      const agents = await findSimilarAgents(concept, topK)

      return NextResponse.json({
        mode: 'similar-agents',
        concept,
        agents,
        count: agents.length,
        timestamp: new Date().toISOString(),
      })
    }

    if (mode === 'stats') {
      const stats = await getSearchStats(concept)

      return NextResponse.json({
        mode: 'stats',
        concept,
        stats,
        timestamp: new Date().toISOString(),
      })
    }

    // Standard search
    const { semanticSearch } = await import('@/lib/llamaindex')
    const results = await semanticSearch(concept, {
      topK,
      threshold: 0.35, // L2 distance threshold
      includeMetadata: true,
    })

    return NextResponse.json({
      mode: 'standard',
      concept,
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
    console.error('[Semantic Search API] GET search failed:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
