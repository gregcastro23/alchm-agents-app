import 'server-only'

import { DEMO_AGENTS } from '@/lib/demo-agents-data'
import { prisma } from '@/lib/db'

type JsonRecord = Record<string, unknown>

export const ACTIVITY_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export const ACTIVITY_OPTIONS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export interface InternalAuthResult {
  ok: boolean
  status?: number
  error?: string
}

export interface AgentReference {
  slug: string
  name: string
}

export interface AgentAction {
  id: string
  type: string
  createdAt: string
  metadata: JsonRecord
  links: {
    chatThread?: string
    recipe?: string
  }
}

export interface AgentInteraction {
  id: string
  kind: 'agent_to_agent' | 'agent_to_user'
  counterparty: {
    slug?: string
    name: string
    userId?: string
  }
  topic: string
  messagePreview: string
  messageCount: number
  startedAt: string
  lastTurnAt: string
  chatThread: string
}

export interface AgentArtifact {
  id: string
  kind: 'recipe' | 'lab_entry' | 'insight'
  title: string
  createdAt: string
  summary: string
  alchmKitchenPath?: string
}

interface CursorPayload {
  createdAt?: string
  lastTurnAt?: string
  id?: string
}

const AGENTS_BASE_URL =
  process.env.AGENTS_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'https://agents.alchm.kitchen'

const ALCHM_KITCHEN_BASE_URL =
  process.env.ALCHM_KITCHEN_PUBLIC_URL ||
  process.env.ALCHM_KITCHEN_SYNC_URL ||
  process.env.ALCHM_KITCHEN_BASE_URL ||
  'https://alchm.kitchen'

const ARTIFACT_EVENT_TYPES = ['recipe_generation', 'lab_entry', 'insight'] as const

export function validateInternalBearer(request: Request): InternalAuthResult {
  const expected = process.env.INTERNAL_API_SECRET
  if (!expected) {
    return { ok: false, status: 500, error: 'INTERNAL_API_SECRET is not configured' }
  }

  const header = request.headers.get('authorization') || ''
  const token = header.replace(/^Bearer\s+/i, '').trim()
  if (token !== expected) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  return { ok: true }
}

export function parseLimit(searchParams: URLSearchParams, fallback: number, max: number): number {
  const raw = Number(searchParams.get('limit') || fallback)
  if (!Number.isFinite(raw)) return fallback
  return Math.max(1, Math.min(max, Math.floor(raw)))
}

export function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function asRecord(value: unknown): JsonRecord {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return asRecord(parsed)
    } catch {
      return {}
    }
  }
  if (typeof value === 'object' && !Array.isArray(value)) return value as JsonRecord
  return {}
}

function firstString(metadata: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function truncate(value: string, limit: number): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length <= limit) return compact
  return `${compact.slice(0, Math.max(0, limit - 3)).trim()}...`
}

function titleCaseSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function decodeCursor(cursor: string | null): CursorPayload | undefined {
  if (!cursor) return undefined
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorPayload
  } catch {
    return undefined
  }
}

function chatThreadUrl(sessionId: string): string {
  return `${AGENTS_BASE_URL.replace(/\/$/, '')}/gallery/chat/${encodeURIComponent(sessionId)}`
}

function recipeUrl(recipeId: string): string {
  return `${ALCHM_KITCHEN_BASE_URL.replace(/\/$/, '')}/recipes/${encodeURIComponent(recipeId)}`
}

function alchmKitchenPath(recipeId: string): string {
  return `/recipes/${recipeId}`
}

function normalizeMetadata(eventType: string, metadata: JsonRecord): JsonRecord {
  const normalized: JsonRecord = { ...metadata }
  const targetName = firstString(normalized, 'targetName', 'withAgent', 'partnerName')
  if (targetName) {
    normalized.targetName ??= targetName
    normalized.withAgent ??= targetName
  }

  const topic =
    firstString(normalized, 'topic', 'subject', 'summary') ||
    firstString(normalized, 'item', 'recipeName', 'dishName', 'insightTitle', 'message')
  if (topic) normalized.topic ??= truncate(topic, 90)

  if (['agent_chat', 'chat', 'agent.chat'].includes(eventType)) {
    const excerpt = firstString(
      normalized,
      'messageExcerpt',
      'message',
      'responsePreview',
      'insightContent',
      'description'
    )
    if (excerpt) {
      normalized.messageExcerpt ??= truncate(excerpt, 160)
      normalized.message ??= truncate(excerpt, 500)
    }
  }

  const recipeId = firstString(normalized, 'recipeId', 'recipe_id')
  if (recipeId) {
    normalized.recipeId ??= recipeId
    normalized.recipe_id ??= recipeId
  }

  const summary = firstString(normalized, 'summary', 'insightContent', 'description', 'review')
  if (summary) normalized.summary ??= truncate(summary, 180)

  return normalized
}

function linksForMetadata(metadata: JsonRecord) {
  const sessionId = firstString(metadata, 'sessionId', 'groupChatId', 'threadKey')
  const recipeId = firstString(metadata, 'recipeId', 'recipe_id')

  return {
    ...(sessionId ? { chatThread: chatThreadUrl(sessionId) } : {}),
    ...(recipeId ? { recipe: recipeUrl(recipeId) } : {}),
  }
}

function conversationMetadata(row: {
  sessionId: string
  userId: string | null
  userMessage: string
  agentResponse: string
  contextData: unknown
}): JsonRecord {
  const context = asRecord(row.contextData)
  const nested = asRecord(context.metadata)
  const metadata = normalizeMetadata('agent_chat', {
    ...nested,
    ...context,
    sessionId: row.sessionId,
    targetName:
      firstString(context, 'targetName', 'withAgent', 'partnerName', 'targetAgentName') ||
      firstString(nested, 'targetName', 'withAgent', 'partnerName', 'targetAgentName'),
    topic:
      firstString(context, 'topic', 'subject', 'summary') ||
      firstString(nested, 'topic', 'subject', 'summary') ||
      truncate(row.userMessage, 90),
    userMessageExcerpt: truncate(row.userMessage, 160),
    messageExcerpt: truncate(row.agentResponse, 160),
    message: row.agentResponse,
    ...(row.userId ? { userId: row.userId } : {}),
  })

  return metadata
}

function actionKind(eventType: string): 'recipe' | 'lab_entry' | 'insight' | null {
  if (eventType === 'recipe_generation') return 'recipe'
  if (eventType === 'lab_entry') return 'lab_entry'
  if (eventType === 'insight') return 'insight'
  return null
}

function artifactFromAction(row: {
  id: string
  eventType: string
  createdAt: Date
  metadataPayload: unknown
}): AgentArtifact | null {
  const kind = actionKind(row.eventType)
  if (!kind) return null

  const metadata = normalizeMetadata(row.eventType, asRecord(row.metadataPayload))
  const recipeId = firstString(metadata, 'recipeId', 'recipe_id')
  const title =
    firstString(metadata, 'recipeName', 'dishName', 'insightTitle', 'title') ||
    titleCaseSlug(row.eventType)
  const summary =
    firstString(
      metadata,
      'summary',
      'description',
      'insightContent',
      'messageExcerpt',
      'message',
      'review'
    ) || ''

  return {
    id: row.id,
    kind,
    title,
    createdAt: row.createdAt.toISOString(),
    summary: truncate(summary, 220),
    ...(recipeId ? { alchmKitchenPath: alchmKitchenPath(recipeId) } : {}),
  }
}

export async function resolveAgent(slug: string): Promise<AgentReference> {
  const dbAgent = await prisma.historical_agents.findUnique({
    where: { agentId: slug },
    select: { agentId: true, name: true },
  })

  if (dbAgent) return { slug: dbAgent.agentId, name: dbAgent.name }

  const demoAgent = DEMO_AGENTS.find(agent => agent.id === slug)
  return { slug, name: demoAgent?.name || titleCaseSlug(slug) }
}

export async function getAgentActions(
  slug: string,
  searchParams: URLSearchParams
): Promise<{ agent: AgentReference; actions: AgentAction[]; nextCursor: string | null }> {
  const agent = await resolveAgent(slug)
  const limit = parseLimit(searchParams, 50, 100)
  const cursor = decodeCursor(searchParams.get('cursor'))
  const since = parseDateParam(searchParams.get('since'))
  const until = parseDateParam(searchParams.get('until'))
  const createdAt: { gte?: Date; lte?: Date; lt?: Date } = {}
  if (since) createdAt.gte = since
  if (until) createdAt.lte = until
  if (cursor?.createdAt) {
    const cursorDate = parseDateParam(cursor.createdAt)
    if (cursorDate) createdAt.lt = cursorDate
  }

  const createdAtFilter = Object.keys(createdAt).length ? { createdAt } : {}
  const [eventRows, conversationRows] = await Promise.all([
    prisma.agent_action_events.findMany({
      where: { agentId: slug, ...createdAtFilter },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    }),
    prisma.agentConversation.findMany({
      where: { agentId: slug, ...createdAtFilter },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    }),
  ])

  const actionRows: AgentAction[] = eventRows.map(row => {
    const metadata = normalizeMetadata(row.eventType, asRecord(row.metadataPayload))
    return {
      id: row.id,
      type: row.eventType,
      createdAt: row.createdAt.toISOString(),
      metadata,
      links: linksForMetadata(metadata),
    }
  })

  const chatRows: AgentAction[] = conversationRows.map(row => {
    const metadata = conversationMetadata(row)
    return {
      id: row.id,
      type: 'chat',
      createdAt: row.createdAt.toISOString(),
      metadata,
      links: linksForMetadata(metadata),
    }
  })

  const actions = [...actionRows, ...chatRows].sort((a, b) => {
    const delta = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return delta || b.id.localeCompare(a.id)
  })
  const page = actions.slice(0, limit)
  const last = page[page.length - 1]
  const hasMore =
    actions.length > limit || eventRows.length > limit || conversationRows.length > limit

  return {
    agent,
    actions: page,
    nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
  }
}

export async function getAgentInteractions(
  slug: string,
  searchParams: URLSearchParams
): Promise<{ interactions: AgentInteraction[]; nextCursor: string | null }> {
  const limit = parseLimit(searchParams, 20, 50)
  const cursor = decodeCursor(searchParams.get('cursor'))
  const withFilter = searchParams.get('with')?.trim().toLowerCase()
  const createdAt: { lt?: Date } = {}
  if (cursor?.lastTurnAt) {
    const cursorDate = parseDateParam(cursor.lastTurnAt)
    if (cursorDate) createdAt.lt = cursorDate
  }
  const createdAtFilter = Object.keys(createdAt).length ? { createdAt } : {}
  const rows = await prisma.agentConversation.findMany({
    where: { agentId: slug, ...createdAtFilter },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: Math.max(limit * 8, 50),
  })

  const sessionIds = Array.from(new Set(rows.map(row => row.sessionId)))
  const peerRows = sessionIds.length
    ? await prisma.agentConversation.findMany({
        where: {
          sessionId: { in: sessionIds },
          agentId: { not: slug },
        },
        select: {
          agentId: true,
          sessionId: true,
          userId: true,
          agentResponse: true,
          createdAt: true,
        },
      })
    : []

  const peerAgentIds = Array.from(new Set(peerRows.map(row => row.agentId)))
  const peerAgents = peerAgentIds.length
    ? await prisma.historical_agents.findMany({
        where: { agentId: { in: peerAgentIds } },
        select: { agentId: true, name: true },
      })
    : []
  const peerAgentNames = new Map(peerAgents.map(agent => [agent.agentId, agent.name]))

  const bySession = new Map<string, typeof rows>()
  for (const row of rows) {
    const list = bySession.get(row.sessionId) || []
    list.push(row)
    bySession.set(row.sessionId, list)
  }

  const peersBySession = new Map<string, typeof peerRows>()
  for (const row of peerRows) {
    const list = peersBySession.get(row.sessionId) || []
    list.push(row)
    peersBySession.set(row.sessionId, list)
  }

  const interactions = Array.from(bySession.entries())
    .map(([sessionId, sessionRows]): AgentInteraction => {
      const sorted = [...sessionRows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const peers = peersBySession.get(sessionId) || []
      const peer = peers[0]
      const metadata = conversationMetadata(last)
      const targetName = firstString(metadata, 'targetName', 'withAgent', 'partnerName')
      const userId = last.userId || firstString(metadata, 'userId')
      const topic =
        firstString(metadata, 'topic', 'subject', 'summary') || truncate(last.userMessage, 90)

      if (peer) {
        const name = peerAgentNames.get(peer.agentId) || titleCaseSlug(peer.agentId)
        return {
          id: sessionId,
          kind: 'agent_to_agent',
          counterparty: { slug: peer.agentId, name },
          topic,
          messagePreview: truncate(last.agentResponse, 160),
          messageCount: sorted.length + peers.length,
          startedAt: first.createdAt.toISOString(),
          lastTurnAt: last.createdAt.toISOString(),
          chatThread: chatThreadUrl(sessionId),
        }
      }

      return {
        id: sessionId,
        kind: 'agent_to_user',
        counterparty: {
          name: targetName || userId || 'Alchm Kitchen user',
          ...(userId ? { userId } : {}),
        },
        topic,
        messagePreview: truncate(last.agentResponse, 160),
        messageCount: sorted.length,
        startedAt: first.createdAt.toISOString(),
        lastTurnAt: last.createdAt.toISOString(),
        chatThread: chatThreadUrl(sessionId),
      }
    })
    .filter(interaction => {
      if (!withFilter) return true
      return (
        interaction.counterparty.slug?.toLowerCase() === withFilter ||
        interaction.counterparty.userId?.toLowerCase() === withFilter ||
        interaction.counterparty.name.toLowerCase() === withFilter
      )
    })
    .sort((a, b) => {
      const delta = new Date(b.lastTurnAt).getTime() - new Date(a.lastTurnAt).getTime()
      return delta || b.id.localeCompare(a.id)
    })

  const page = interactions.slice(0, limit)
  const last = page[page.length - 1]

  return {
    interactions: page,
    nextCursor:
      interactions.length > limit && last
        ? encodeCursor({ lastTurnAt: last.lastTurnAt, id: last.id })
        : null,
  }
}

export async function getAgentArtifacts(
  slug: string,
  searchParams: URLSearchParams
): Promise<{ artifacts: AgentArtifact[]; nextCursor: string | null }> {
  const limit = parseLimit(searchParams, 20, 50)
  const cursor = decodeCursor(searchParams.get('cursor'))
  const kind = searchParams.get('kind') as AgentArtifact['kind'] | null
  const eventTypes =
    kind === 'recipe'
      ? ['recipe_generation']
      : kind === 'lab_entry'
        ? ['lab_entry']
        : kind === 'insight'
          ? ['insight']
          : [...ARTIFACT_EVENT_TYPES]
  const createdAt: { lt?: Date } = {}
  if (cursor?.createdAt) {
    const cursorDate = parseDateParam(cursor.createdAt)
    if (cursorDate) createdAt.lt = cursorDate
  }
  const createdAtFilter = Object.keys(createdAt).length ? { createdAt } : {}

  const rows = await prisma.agent_action_events.findMany({
    where: {
      agentId: slug,
      eventType: { in: eventTypes },
      ...createdAtFilter,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  })

  const artifacts = rows
    .map(artifactFromAction)
    .filter((item): item is AgentArtifact => Boolean(item))
  const page = artifacts.slice(0, limit)
  const last = page[page.length - 1]

  return {
    artifacts: page,
    nextCursor:
      artifacts.length > limit && last
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null,
  }
}
