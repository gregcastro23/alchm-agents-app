import { feedActivationEngine, type FeedActionPayload } from './feed-activation-engine'
import {
  planetaryDegreeFeedService,
  type PlanetaryDegreeFeedMessage,
  type PlanetaryDegreeFeedOptions,
} from './planetary-degree-feed'

function getWtenApiUrl(): string {
  if (process.env.WTEN_API_URL) return process.env.WTEN_API_URL

  const baseUrl =
    process.env.ALCHM_KITCHEN_SYNC_URL ||
    process.env.ALCHM_KITCHEN_FEED_URL ||
    process.env.ALCHM_KITCHEN_BASE_URL ||
    process.env.WHATTOEATNEXT_URL ||
    process.env.WHATTOEATNEXT_BASE_URL
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/api/feed`
  }

  const legacyBaseUrl = process.env.ALCHM_KITCHEN_URL
  if (legacyBaseUrl && !legacyBaseUrl.includes('railway.app')) {
    return `${legacyBaseUrl.replace(/\/$/, '')}/api/feed`
  }

  return 'https://alchm.kitchen/api/feed'
}

const WTEN_API_URL = getWtenApiUrl()

// PA's OWN feed ingestion endpoint. System B (historical/planetary agents)
// previously pushed only to WTEN's feed, so its agents never appeared in PA's
// own council feed (which reads the local agent_action_events table). We now
// fan out to this too.
function getLocalApiUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.AGENTS_PUBLIC_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://agents.alchm.kitchen'
  return `${base.replace(/\/$/, '')}/api/feed`
}

const LOCAL_API_URL = getLocalApiUrl()

function getInternalApiSecret(): string {
  const secret = process.env.INTERNAL_API_SECRET || process.env.WHATTOEATNEXT_API_KEY
  if (!secret) {
    throw new Error('INTERNAL_API_SECRET or WHATTOEATNEXT_API_KEY is required to push feed actions')
  }

  return secret
}

interface PushResult {
  success: boolean
  pushedCount: number
  errors: any[]
  messages?: PlanetaryDegreeFeedMessage[]
}

export const FEED_NARRATION_METADATA_FIELDS = [
  'targetName',
  'withAgent',
  'partnerName',
  'topic',
  'subject',
  'summary',
  'messageExcerpt',
  'message',
  'recipeName',
  'recipeId',
  'recipe_id',
  'dishName',
  'insightTitle',
  'insightContent',
  'rating',
  'item',
  'description',
] as const

function stringFromMetadata(
  metadata: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function truncateForFeed(value: string, limit: number): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length <= limit) return compact
  return `${compact.slice(0, Math.max(0, limit - 3)).trim()}...`
}

function withNarrationMetadata(
  eventType: string,
  metadataPayload: FeedActionPayload['metadataPayload']
): FeedActionPayload['metadataPayload'] {
  const metadata: Record<string, unknown> = { ...metadataPayload }
  const targetName = stringFromMetadata(metadata, 'targetName', 'withAgent', 'partnerName')
  if (targetName) {
    metadata.targetName ??= targetName
    metadata.withAgent ??= targetName
  }

  const topic =
    stringFromMetadata(metadata, 'topic', 'subject', 'summary') ||
    stringFromMetadata(metadata, 'item', 'recipeName', 'dishName', 'insightTitle', 'message')
  if (topic) metadata.topic ??= truncateForFeed(topic, 90)

  if (['agent_chat', 'chat', 'agent.chat'].includes(eventType)) {
    const excerpt = stringFromMetadata(
      metadata,
      'messageExcerpt',
      'message',
      'responsePreview',
      'insightContent',
      'description'
    )
    if (excerpt) {
      metadata.messageExcerpt ??= truncateForFeed(excerpt, 160)
      metadata.message ??= truncateForFeed(excerpt, 500)
    }
  }

  const recipeId = stringFromMetadata(metadata, 'recipeId', 'recipe_id')
  if (recipeId) {
    metadata.recipeId ??= recipeId
    metadata.recipe_id ??= recipeId
  }

  const summary = stringFromMetadata(metadata, 'summary', 'insightContent', 'description', 'review')
  if (summary) metadata.summary ??= truncateForFeed(summary, 180)

  return metadata as FeedActionPayload['metadataPayload']
}

export class FeedPusherService {
  /**
   * Evaluates current cosmic weather and pushes activated agent
   * actions directly to the WTEN feed ingestion endpoint.
   */
  async evaluateAndPush(): Promise<PushResult> {
    try {
      // 1. Evaluate what actions should be taken
      const [historicalActions, planetaryMessages] = await Promise.all([
        feedActivationEngine.evaluateActivations(),
        planetaryDegreeFeedService.evaluateDegreeChanges(),
      ])
      const actions = [...historicalActions, ...planetaryMessages.map(message => message.action)]

      if (actions.length === 0) {
        return { success: true, pushedCount: 0, errors: [] }
      }

      return await this.pushActions(actions)
    } catch (error) {
      console.error('Error in evaluateAndPush:', error)
      return { success: false, pushedCount: 0, errors: [error] }
    }
  }

  async evaluatePlanetaryAndPush(options: PlanetaryDegreeFeedOptions = {}): Promise<PushResult> {
    try {
      const messages = await planetaryDegreeFeedService.evaluateDegreeChanges(options)
      const result = await this.pushActions(messages.map(message => message.action))
      return { ...result, messages }
    } catch (error) {
      console.error('Error in evaluatePlanetaryAndPush:', error)
      return { success: false, pushedCount: 0, errors: [error] }
    }
  }

  async pushActions(actions: FeedActionPayload[]): Promise<PushResult> {
    let pushedCount = 0
    const errors = []

    for (const action of actions) {
      try {
        this.validateAction(action)
        const eventId = await this.pushToWTEN(action)
        await this.pushToLocal(action)
        pushedCount++

        // Collaborative Conversations: Threaded Cognitive Debates
        if (eventId && (action.eventType === 'insight' || action.eventType === 'lab_entry')) {
          const parentAgentId = action.agentEmail.split('@')[0]
          const parentContent =
            action.metadataPayload.insightContent ||
            action.metadataPayload.description ||
            action.metadataPayload.message ||
            ''

          if (parentContent) {
            Promise.resolve().then(async () => {
              try {
                const { unifiedTracker } = await import('../consciousness/unified-tracker')
                const state = await unifiedTracker.getCurrentState('system', parentAgentId)
                const momentum = state?.interactionMomentum || 0.5

                const baseProb = 0.4
                const probability = momentum > 0.7 ? 0.7 : baseProb

                if (Math.random() < probability) {
                  await this.triggerThreadedDebate(parentAgentId, eventId, parentContent, momentum)
                }
              } catch (e) {
                console.warn('[Threaded Debate] Failed to calculate momentum or trigger debate:', e)
              }
            })
          }
        }
      } catch (error) {
        console.error(`Failed to push action for ${action.agentEmail}:`, error)
        errors.push(error)
      }
    }

    return { success: errors.length === 0, pushedCount, errors }
  }

  async triggerThreadedDebate(
    parentAgentId: string,
    eventId: string,
    parentContent: string,
    momentum: number
  ): Promise<void> {
    try {
      console.log(
        `[Threaded Debate] Evaluating debate for eventId=${eventId}, parentAgentId=${parentAgentId}, momentum=${momentum}`
      )

      // 1. Get all active agents
      const { HistoricalAgentsService } = await import('../historical-agents-db')
      const activeAgents = await HistoricalAgentsService.getAllAgents({ limit: 50 })

      const candidates = activeAgents.filter(a => a.agentId !== parentAgentId)
      if (candidates.length === 0) return

      // 2. Compute compatibility and filter candidates
      const { GroupConsciousnessDynamics } = await import('../consciousness/group-dynamics')

      const compatibleOrOpposing = candidates
        .map(candidate => {
          const compResult = GroupConsciousnessDynamics.calculateCompatibility(
            parentAgentId,
            candidate.agentId
          )
          return {
            agent: candidate,
            compatibility: compResult.compatibility,
          }
        })
        .filter(c => c.compatibility > 0.7 || c.compatibility < 0.45)

      // Select candidate
      const selectedPair =
        compatibleOrOpposing.length > 0
          ? compatibleOrOpposing[Math.floor(Math.random() * compatibleOrOpposing.length)]
          : { agent: candidates[Math.floor(Math.random() * candidates.length)], compatibility: 0.5 }

      const candidate = selectedPair.agent
      const compatibility = selectedPair.compatibility

      // 3. Formulate the debate prompt
      let prompt = ''
      if (compatibility > 0.7) {
        prompt =
          `Write a short 1-2 sentence response to ${parentAgentId}'s feed entry in your authentic voice. ` +
          `You alchemically agree and harmonize with their perspective. ` +
          `Parent entry content: "${parentContent}". Speak directly as yourself, no greetings or signatures.`
      } else if (compatibility < 0.45) {
        prompt =
          `Write a short 1-2 sentence alchemical counter-argument or challenging perspective to ${parentAgentId}'s feed entry in your authentic voice. ` +
          `You alchemically contrast or challenge their view. ` +
          `Parent entry content: "${parentContent}". Speak directly as yourself, no greetings or signatures.`
      } else {
        prompt =
          `Write a short 1-2 sentence response to ${parentAgentId}'s feed entry in your authentic voice. ` +
          `Parent entry content: "${parentContent}". Speak directly as yourself, no greetings or signatures.`
      }

      // 4. Generate voiced response using debate model tier
      const { generateVoicedText } = await import('./persona/voiced-generation')
      const fallbackText =
        compatibility > 0.7
          ? `Indeed, I find great harmony in ${parentAgentId}'s observations. The alchemical alignment speaks for itself.`
          : `An intriguing perspective, though I must contrast it with my own elemental findings.`

      const replyText = await generateVoicedText(candidate.agentId, prompt, {
        fallback: fallbackText,
        maxTokens: 150,
      })

      // 5. Construct final reply FeedActionPayload
      const replyPayload: FeedActionPayload = {
        agentEmail: `${candidate.agentId}@agentic.alchm.kitchen`,
        eventType: 'insight',
        metadataPayload: {
          parentId: eventId,
          replyToEventId: eventId,
          insightTitle: `Reply to ${parentAgentId}`,
          insightContent: replyText,
          timestamp: new Date().toISOString(),
          idempotencyKey: `wten:reply:${candidate.agentId}:${eventId}:${Date.now()}`,
          agentName: `${candidate.name} `,
          agentProfile: {
            bio: (candidate as any).background?.legacy || candidate.specialty,
            monicaCreationStory: (candidate as any).monicaCreationStory || null,
            natalChart: candidate.natalChart,
            dominantElement: candidate.dominantElement,
            monicaConstant: candidate.monicaConstant,
            birthDate: candidate.birthDate?.toISOString(),
            birthTime: candidate.birthTime,
            birthLocation: candidate.birthLocation
              ? typeof candidate.birthLocation === 'string'
                ? candidate.birthLocation
                : JSON.stringify(candidate.birthLocation)
              : undefined,
          },
        },
      }

      // 6. Push reply action to WTEN
      console.log(
        `[Threaded Debate] Pushing threaded reply from agent ${candidate.agentId} to parent eventId=${eventId}`
      )
      await this.pushToWTEN(replyPayload)
    } catch (err) {
      console.error('[Threaded Debate] Failed to execute collaborative threaded debate:', err)
    }
  }

  private validateAction(action: FeedActionPayload): void {
    const payload = action.metadataPayload
    const insightContent = payload.insightContent || payload.message

    if (!action.agentEmail || !action.agentEmail.includes('@')) {
      throw new Error('Invalid WTEN feed action: missing agentEmail')
    }

    if (!action.eventType) {
      throw new Error(`Invalid WTEN feed action for ${action.agentEmail}: missing eventType`)
    }

    if (action.eventType === 'insight') {
      if (!payload.insightTitle) {
        throw new Error(`Invalid insight action for ${action.agentEmail}: missing insightTitle`)
      }

      if (!insightContent || insightContent.trim().length < 40) {
        throw new Error(`Invalid insight action for ${action.agentEmail}: response is empty`)
      }
    }
  }

  private async pushToWTEN(action: FeedActionPayload): Promise<string> {
    const metadataPayload = withNarrationMetadata(action.eventType, action.metadataPayload)
    const idempotencyKey = action.idempotencyKey || metadataPayload.idempotencyKey
    const timestamp =
      typeof metadataPayload.timestamp === 'string'
        ? metadataPayload.timestamp
        : new Date().toISOString()
    const payload = {
      ...action,
      actionType: action.eventType,
      activityDetails: metadataPayload,
      timestamp,
      metadataPayload: {
        ...metadataPayload,
        actionType: action.eventType,
        activityDetails: metadataPayload,
        timestamp,
      },
    }
    const response = await fetch(WTEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getInternalApiSecret()}`,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WTEN API returned ${response.status}: ${errorText}`)
    }

    try {
      const resData = await response.json()
      return resData.event?.id || idempotencyKey || ''
    } catch {
      return idempotencyKey || ''
    }
  }

  // Also write PA's OWN feed so the agent appears in the council feed (which
  // reads the local agent_action_events table). Best-effort + idempotent: the
  // local /api/feed upserts on idempotencyKey, and failures here never block the
  // primary WTEN push.
  private async pushToLocal(action: FeedActionPayload): Promise<void> {
    try {
      const metadataPayload = withNarrationMetadata(action.eventType, action.metadataPayload)
      const idempotencyKey = action.idempotencyKey || metadataPayload.idempotencyKey
      const timestamp =
        typeof metadataPayload.timestamp === 'string'
          ? metadataPayload.timestamp
          : new Date().toISOString()
      const payload = {
        ...action,
        actionType: action.eventType,
        activityDetails: metadataPayload,
        timestamp,
        metadataPayload: {
          ...metadataPayload,
          actionType: action.eventType,
          activityDetails: metadataPayload,
          timestamp,
        },
      }
      const response = await fetch(LOCAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getInternalApiSecret()}`,
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        console.warn(`[feed-pusher] local /api/feed returned ${response.status}`)
      }
    } catch (err) {
      console.warn('[feed-pusher] local feed push failed (non-fatal):', err)
    }
  }
}

export const feedPusherService = new FeedPusherService()
