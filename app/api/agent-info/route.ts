import { NextRequest, NextResponse } from 'next/server'
import { DEMO_AGENTS } from '@/lib/demo-agents-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('id')

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 })
    }

    // Find agent in DEMO_AGENTS
    const agent = DEMO_AGENTS.find(a => a.id === agentId)

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Return minimal agent info for the client
    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        title: agent.title,
        appearance: {
          symbol: agent.appearance?.symbol || '👤',
        },
      },
    })
  } catch (error) {
    console.error('Error fetching agent info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
