/**
 * Knowledge Updater API Endpoint — gated by USE_RAG_GENERATION feature flag.
 * The full implementation pulls in @langchain/community + PDF loaders. Heavy.
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function disabled() {
  return NextResponse.json(
    { status: 'disabled', message: 'Knowledge updater requires RAG. Set USE_RAG_GENERATION=true.' },
    { status: 503 }
  )
}

export async function POST(req: NextRequest) {
  if (process.env.USE_RAG_GENERATION !== 'true') return disabled()
  const { updateAgentKnowledge } = await import('@/lib/langchain/knowledge-updater')
  const { ingestAstrologicalPDF } = await import('@/lib/langchain/pdf-loader')
  try {
    const body = await req.json().catch(() => ({}))
    if (body.type === 'pdf') {
      const result = await ingestAstrologicalPDF(body.path, body.options)
      return NextResponse.json(result)
    }
    const result = await updateAgentKnowledge(body.agentId, body.sources, body.options)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (process.env.USE_RAG_GENERATION !== 'true') return disabled()
  const { getRecentKnowledgeUpdates } = await import('@/lib/langchain/knowledge-updater')
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId') || 'unknown'
    const limit = parseInt(searchParams.get('limit') || '10')
    const updates = await getRecentKnowledgeUpdates(agentId, limit)
    return NextResponse.json(updates)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
