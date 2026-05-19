import { NextResponse } from 'next/server'
import { SEED_FEED_EVENTS } from '@/components/cosmic-agents/seed-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/feed?since=<iso>
 *
 * Bootstrap endpoint for the Council Feed. Returns chronological events.
 *
 * Per the handoff doc, this should aggregate from:
 *   - created_agents interaction log (jing-duel)
 *   - PlanetaryDegreeFeedService.evaluateDegreeChanges (planetary-degree)
 *   - lib/aspects-dynamics (aspect-activation)
 *   - feed-pusher.ts WTEN events (lab-entry, evolution)
 *   - agent_consciousness transitions (evolution)
 *   - FeedActivationEngine.evaluateActivations (insight)
 *
 * For now, returns the seed events so the UI is fully populated for the design pass.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const since = url.searchParams.get('since')
  const sinceMs = since ? new Date(since).getTime() : 0

  const events = SEED_FEED_EVENTS.filter(e => new Date(e.timestamp).getTime() > sinceMs)

  return NextResponse.json({
    events,
    cursor: events[0]?.timestamp || new Date().toISOString(),
  })
}
