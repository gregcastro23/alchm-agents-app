import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { backend } from '@/lib/backend'
import { consciousnessPersistence } from '@/lib/consciousness-persistence'

interface UnifiedAgentRequest {
  action: string
  parameters?: any
}

interface UnifiedAgentResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
  timestamp: string
}

// Main handler for all agent operations proxied to Railway backend
export async function POST(request: NextRequest): Promise<NextResponse<UnifiedAgentResponse>> {
  try {
    const body: UnifiedAgentRequest = await request.json()
    const { action, parameters = {} } = body

    const timestamp = new Date().toISOString()

    switch (action) {
      case 'list':
        const listData = await backend.agents.list(parameters)
        return NextResponse.json({ success: true, data: listData, timestamp })

      case 'get':
        if (!parameters.agentId) throw new Error('Missing agentId')
        const getData = await backend.agents.get(parameters.agentId)
        return NextResponse.json({ success: true, data: getData, timestamp })

      case 'create':
        const createData = await backend.agents.create(parameters)
        return NextResponse.json({ success: true, data: createData, timestamp })

      case 'interact':
      case 'chat': {
        const session = await getServerSession()
        const userId = (session?.user as any)?.id

        const chatData = await backend.agents.chat({
          agentId: parameters.agentId,
          message: parameters.message || parameters.userMessage,
          sessionId: parameters.sessionId,
          userId: parameters.userId || userId,
          context: parameters.context,
        })

        // Conserve interaction logging
        if (userId && chatData.text) {
          const powerGained = Math.max(1, Math.floor(chatData.text.length / 100))
          consciousnessPersistence.logInteraction({
            userId,
            agentId: parameters.agentId,
            interactionType: 'historical-chat',
            powerGained,
            planetaryInfluence: 'unknown',
            elementalResonance: 0.5,
            metadata: {
              userMessage: parameters.message || parameters.userMessage,
            },
          }).catch(err => console.warn('Failed to log unified agent interaction:', err))
        }

        return NextResponse.json({ success: true, data: chatData, timestamp })
      }

      // Extended actions placeholder for further backend endpoints
      case 'update':
      case 'delete':
      case 'stats':
      case 'dashboard':
      case 'search':
      case 'evolve':
        return NextResponse.json({
          success: false,
          error: `Action ${action} is pending Python backend migration.`,
          timestamp,
        }, { status: 501 })

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            timestamp,
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Unified agent API proxy error', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<UnifiedAgentResponse>> {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'list'
  const timestamp = new Date().toISOString()

  try {
    switch (action) {
      case 'list':
        const listData = await backend.agents.list(Object.fromEntries(searchParams))
        return NextResponse.json({ success: true, data: listData, timestamp })

      case 'health':
        return NextResponse.json({
          success: true,
          data: {
            status: 'healthy',
            mode: 'proxy-to-backend',
            version: '2.0.0',
          },
          timestamp,
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown GET action: ${action}`,
            timestamp,
          },
          { status: 400 }
        )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp,
      },
      { status: 500 }
    )
  }
}
