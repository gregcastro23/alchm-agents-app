import { NextRequest, NextResponse } from 'next/server'
import { backend } from '@/lib/backend'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, context, sessionId } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const response = await backend.agents.chat({
      agentId: 'monica-001',
      message,
      sessionId,
      context: {
        ...context,
        // Any Next.js specific context augmentation could go here
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Monica API Proxy] Error:', error)
    return NextResponse.json(
      {
        response: 'I apologize, but I encountered a technical error. Please try again.',
        error: 'MONICA_API_ERROR',
        details: error instanceof Error ? error.message : String(error),
        monicaNote: 'My practical Taurus nature suggests checking the backend connection!',
      },
      { status: 500 }
    )
  }
}
