/**
 * Agent Semantic Search Endpoint — gated by USE_RAG_GENERATION feature flag.
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (process.env.USE_RAG_GENERATION !== 'true') {
    return NextResponse.json(
      { status: 'disabled', message: 'RAG features disabled. Set USE_RAG_GENERATION=true.' },
      { status: 503 }
    )
  }
  const { searchAgentKnowledge, multiAgentSearch, findSimilarAgents } =
    await import('@/lib/llamaindex')
  try {
    const body = await req.json().catch(() => ({}))
    const { mode = 'single', concept, agentId, agentIds, options } = body
    let result
    if (mode === 'multi') result = await multiAgentSearch(agentIds || [], concept, options)
    else if (mode === 'similar') result = await findSimilarAgents(concept, options)
    else result = await searchAgentKnowledge(agentId, concept, options)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
