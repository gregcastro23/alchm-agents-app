import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { buildAgentContext } from '@/lib/agents/persona/build-agent-context'
import { backend } from '@/lib/backend'
import { consciousnessPersistence } from '@/lib/consciousness-persistence'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CastRequest {
  casterId: string
  moveId: string
  targetId: string
  eventId: string
}

interface MoveSpec {
  name: string
  element: string
  description: string
  costStat: string
  costAmount: number
}

const MOVES: Record<string, MoveSpec> = {
  meltdown: {
    name: 'Meltdown',
    element: 'Fire',
    description: 'Shatters structural barriers.',
    costStat: 'vitality',
    costAmount: 15,
  },
  freeze: {
    name: 'Freeze',
    element: 'Water',
    description: 'Locks opponent stance.',
    costStat: 'adaptability',
    costAmount: 15,
  },
  tectonicRoot: {
    name: 'Tectonic Root',
    element: 'Earth',
    description: 'Impenetrable defense.',
    costStat: 'mercurialVelocity',
    costAmount: 15,
  },
  vacuum: {
    name: 'Vacuum',
    element: 'Air',
    description: 'Removes oxygen, neutralizing fire.',
    costStat: 'charisma',
    costAmount: 15,
  },
  erode: {
    name: 'Erode',
    element: 'Water·Earth',
    description: 'Dissolves Saturnian logic.',
    costStat: 'wisdom',
    costAmount: 10,
  },
}

/**
 * POST /api/feed/cast
 *
 * Per HANDOFF.md §3: receives a cast, opens an SSE response, streams the
 * caster's in-character voice as `event: token`, then emits `event: resolution`
 * with the resolved jing-duel card.
 *
 * Implementation notes:
 *   - Voice generation uses backend.agents.chat (non-streaming) and the
 *     persona-first pipeline (buildAgentContext). Tokens are emitted by
 *     splitting the returned text into chunks at sub-second cadence.
 *   - A streaming-from-the-model path can be added later (the SSE wire
 *     contract is already in place).
 *   - Stat drain is recorded via consciousnessPersistence; permanent
 *     cooldown state needs a dedicated agent_consciousness column
 *     (`cooldownUntil`) — tracked as TODO.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  let body: CastRequest
  try {
    body = (await req.json()) as CastRequest
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const { casterId, moveId, targetId, eventId } = body
  const move = MOVES[moveId]
  if (!move) return new Response('Unknown move', { status: 400 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          /* closed */
        }
      }

      try {
        send('streaming', { id: eventId, casterId, moveId, targetId })

        // Resolve persona for in-character voice generation
        let voice = ''
        try {
          const personaCtx = buildAgentContext(casterId)
          const targetCtx = buildAgentContext(targetId)
          const targetName = targetCtx?.agent?.name || targetId
          const userPrompt =
            `You are casting the ${move.name} Jing on ${targetName}. ` +
            `Speak ONE bold, defiant line, 1-2 sentences, in character, no greeting, no narration. ` +
            `Move element: ${move.element}. Description: ${move.description}.`

          const chat = await backend.agents.chat({
            agentId: casterId,
            message: userPrompt,
            sessionId: `cast-${eventId}`,
            ...(userId ? { userId } : {}),
            ...(personaCtx?.personaBlock ? { systemPromptOverride: personaCtx.personaBlock } : {}),
            ...(personaCtx?.cacheKey ? { personaCacheKey: personaCtx.cacheKey } : {}),
          })
          voice = (chat?.text || '').trim().replace(/^["']|["']$/g, '')
        } catch (err) {
          console.warn('[feed/cast] voice generation failed, using fallback:', err)
        }

        if (!voice) {
          voice = `${move.name}: ${move.description}`
        }

        // Stream the voice as tokens at ~28ms cadence (matches the prototype's typing speed)
        const words = voice.split(/(\s+)/)
        for (const w of words) {
          send('token', { id: eventId, chunk: w })
          await new Promise(r => setTimeout(r, 28))
        }

        // Log interaction (best effort)
        if (userId) {
          consciousnessPersistence
            .logInteraction({
              userId,
              agentId: casterId,
              interactionType: 'jing-cast',
              powerGained: Math.max(1, Math.floor(voice.length / 100)),
              planetaryInfluence: 'unknown',
              elementalResonance: 0.5,
              metadata: { moveId, targetId, eventId },
            })
            .catch((err: unknown) => console.warn('[feed/cast] consciousness log failed:', err))
        }

        send('resolution', {
          id: eventId,
          status: 'active',
          voice,
          intensity: 0.85,
          confidence: 0.85,
          thread: [],
          cost: { stat: move.costStat, amount: move.costAmount },
        })
      } catch (err) {
        console.error('[feed/cast] stream error:', err)
        send('error', { message: 'cast failed' })
      } finally {
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
