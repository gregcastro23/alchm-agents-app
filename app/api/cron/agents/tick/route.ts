import { NextResponse } from 'next/server'
import { agentActionService } from '@/lib/services/agent-action-service'

/**
 * POST /api/cron/agents/tick
 *
 * Hourly (or per-planetary-hour) cron endpoint that:
 *  1. Evaluates every agentic user's natal chart against the current
 *     celestial weather (planetary hour, transits, elemental alignment).
 *  2. For agents whose activation score exceeds the threshold, executes
 *     an action: posting to the feed or transmuting tokens.
 *
 * Protected by CRON_SECRET in production.
 * Vercel Cron schedule: `0 * * * *` (every hour)
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Unauthorized', { status: 401 })
      }
      console.warn('[cron/agents/tick] Missing or invalid CRON_SECRET (dev mode, continuing)')
    }

    const summary = await agentActionService.runTick()

    return NextResponse.json({
      success: summary.errors.length === 0,
      ...summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[cron/agents/tick] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
