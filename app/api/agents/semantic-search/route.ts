/**
 * Semantic Agent Search API
 * Find agents by concept or topic using vector similarity
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchAgentsByConcept } from '@/lib/llamaindex/semantic-search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/agents/semantic-search
 * Search for agents by concept/topic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { concept, topK = 5, minRelevance = 0.6 } = body

    if (!concept || typeof concept !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Concept is required and must be a string',
        },
        { status: 400 }
      )
    }

    console.log(`[API] Semantic search for concept: "${concept}"`)

    // Perform semantic search
    const results = await searchAgentsByConcept(concept, {
      topK,
      minRelevance,
    })

    // Format response
    const agents = results.map((result) => ({
      id: result.agent.id,
      name: result.agent.name,
      title: result.agent.title,
      relevanceScore: result.relevanceScore,
      wisdomDomains: result.agent.abilities.wisdomDomains,
      specialty: result.agent.abilities.specialty,
      element: result.agent.consciousness.dominantElement,
      monicaConstant: result.agent.consciousness.monicaConstant,
      wisdomAlignment: result.wisdomAlignment,
      matchingSources: result.matchingDocuments.length,
    }))

    return NextResponse.json({
      success: true,
      concept,
      totalResults: agents.length,
      agents,
    })
  } catch (error) {
    console.error('[API] Semantic search error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agents/semantic-search?concept=creativity&topK=3
 * Search for agents by query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const concept = searchParams.get('concept')
    const topK = parseInt(searchParams.get('topK') || '5')

    if (!concept) {
      return NextResponse.json(
        {
          success: false,
          error: 'Concept query parameter is required',
        },
        { status: 400 }
      )
    }

    console.log(`[API] Semantic search (GET) for concept: "${concept}"`)

    const results = await searchAgentsByConcept(concept, { topK })

    const agents = results.map((result) => ({
      id: result.agent.id,
      name: result.agent.name,
      title: result.agent.title,
      relevanceScore: result.relevanceScore,
      wisdomDomains: result.agent.abilities.wisdomDomains,
      specialty: result.agent.abilities.specialty,
    }))

    return NextResponse.json({
      success: true,
      concept,
      totalResults: agents.length,
      agents,
    })
  } catch (error) {
    console.error('[API] Semantic search (GET) error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    )
  }
}
