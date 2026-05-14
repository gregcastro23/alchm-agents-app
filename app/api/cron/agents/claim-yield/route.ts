import { NextResponse } from 'next/server'
import { agentActionService } from '@/lib/services/agent-action-service'

/**
 * POST /api/cron/agents/claim-yield
 *
 * Daily cron endpoint that claims ESMS token yield for every active
 * agentic user. Protected by CRON_SECRET in production.
 *
 * Vercel Cron schedule: `0 6 * * *` (daily at 06:00 UTC)
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Unauthorized', { status: 401 })
      }
      console.warn('[cron/agents/claim-yield] Missing or invalid CRON_SECRET (dev mode, continuing)')
    }

    const summary = await agentActionService.runDailyYieldForAgents()

    return NextResponse.json({
      success: summary.errors.length === 0,
      ...summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[cron/agents/claim-yield] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
