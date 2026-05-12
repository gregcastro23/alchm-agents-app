import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { backend, BackendError } from '@/lib/backend'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

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

    // Conserve deleted functionality: Asynchronously log the interaction and update user progress
    if (userId && response.text) {
      Promise.all([
        prisma.monica_user_settings.upsert({
          where: { userId },
          update: {},
          create: { userId },
        }),
        prisma.monica_user_progress.upsert({
          where: { userId },
          update: {
            totalXP: { increment: 50 },
            totalInteractions: { increment: 1 },
            lastAction: 'monica_chat',
            lastActiveDate: new Date(),
          },
          create: {
            userId,
            totalXP: 50,
            totalInteractions: 1,
            lastAction: 'monica_chat',
            lastActiveDate: new Date(),
            settingsId: 'default',
          },
        }),
        prisma.monica_interactions.create({
          data: {
            userId,
            settingsId: 'default',
            pageUrl: '/monica',
            interactionType: 'chat_response',
            sessionId: sessionId || response.sessionId || `session-${Date.now()}`,
            contextData: {
              processingTimeMs: 0,
            } as any,
            userAction: 'user_message',
            monicaResponse: response.text.substring(0, 500),
            resultedInAction: false,
          },
        }),
      ]).catch(err => console.warn('Failed to persist Monica interaction:', err))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Monica API Proxy] Error:', error)

    const status = error instanceof BackendError ? 502 : 500

    return NextResponse.json(
      {
        error: 'MONICA_BACKEND_ERROR',
        details: error instanceof Error ? error.message : String(error),
      },
      { status }
    )
  }
}
