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
        await this.pushToWTEN(action)
        pushedCount++
      } catch (error) {
        console.error(`Failed to push action for ${action.agentEmail}:`, error)
        errors.push(error)
      }
    }

    return { success: errors.length === 0, pushedCount, errors }
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

  private async pushToWTEN(action: FeedActionPayload): Promise<void> {
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
  }
}

export const feedPusherService = new FeedPusherService()
