import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { feedStreamBus } from '@/lib/agents/feed-stream-bus'
import { normalizeDbActionToFeedEvent } from '@/lib/agents/feed-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PAGE_SIZE = 30

/**
 * GET /api/feed?since=<iso>&before=<iso>
 *
 * Returns chronological events from the database (agent_action_events).
 *
 * Query params:
 *   `since`  — ISO timestamp; only return events newer than this (SSE catch-up)
 *   `before` — ISO timestamp; only return events older than this (cursor pagination)
 *
 * Response: { events, cursor, hasMore }
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const since = url.searchParams.get('since')
  const before = url.searchParams.get('before')

  const whereClause: any = {
    status: { in: ['executed', 'posted'] },
  }

  if (since) {
    whereClause.createdAt = { ...(whereClause.createdAt || {}), gt: new Date(since) }
  }
  if (before) {
    whereClause.createdAt = { ...(whereClause.createdAt || {}), lt: new Date(before) }
  }

  let dbEvents: any[] = []
  try {
    dbEvents = await prisma.agent_action_events.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1, // fetch one extra to detect hasMore
    })
  } catch (err) {
    console.error('[feed/GET] failed to query agent_action_events:', err)
  }

  const hasMore = dbEvents.length > PAGE_SIZE
  if (hasMore) dbEvents = dbEvents.slice(0, PAGE_SIZE)

  const events = dbEvents.map(normalizeDbActionToFeedEvent)
  const oldest = events[events.length - 1]

  return NextResponse.json({
    events,
    cursor: oldest?.timestamp || null,
    hasMore,
  })
}

/**
 * POST /api/feed
 *
 * SECURE Webhook ingestion endpoint. Validates internally using internal secret
 * and persists the pushed action to `agent_action_events` table before
 * broadcasting it over SSE to live clients.
 */
export async function POST(req: Request) {
  try {
    const expected = process.env.INTERNAL_API_SECRET
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (expected && token !== expected) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { agentEmail, eventType, metadataPayload } = body

    if (!agentEmail || !eventType) {
      return new Response('Missing agentEmail or eventType', { status: 400 })
    }

    const metadata = (metadataPayload || {}) as Record<string, any>
    const timestamp = metadata.timestamp || new Date().toISOString()
    const idempotencyKey =
      req.headers.get('idempotency-key') ||
      metadata.idempotencyKey ||
      `wten:feed:${agentEmail}:${eventType}:${new Date(timestamp).getTime()}`

    const agentId = agentEmail.split('@')[0]
    const triggerType = metadata.triggerType || 'webhook_push'
    const triggerSummary =
      metadata.transitTrigger ||
      metadata.triggerSummary ||
      metadata.internalTrigger ||
      'Manual Push'
    const score = Number(metadata.internalConfidence || metadata.score || 0.85)

    const eventRow = await prisma.agent_action_events.upsert({
      where: { idempotencyKey },
      create: {
        agentId,
        agentEmail,
        eventType,
        triggerType,
        triggerSummary,
        metadataPayload: metadata,
        score,
        idempotencyKey,
        status: 'posted',
        evaluatedAt: new Date(timestamp),
        postedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        status: 'posted',
        postedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    const normalizedEvent = normalizeDbActionToFeedEvent(eventRow)
    feedStreamBus.publish({ event: 'feed', data: normalizedEvent })

    return NextResponse.json({ success: true, event: normalizedEvent })
  } catch (error: any) {
    console.error('[feed/POST] failed to ingest feed event:', error)
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    )
  }
}
