import { feedActivationEngine, type FeedActionPayload } from './feed-activation-engine'
import {
  planetaryDegreeFeedService,
  type PlanetaryDegreeFeedMessage,
  type PlanetaryDegreeFeedOptions,
} from './planetary-degree-feed'

function getWtenApiUrl(): string {
  if (process.env.WTEN_API_URL) return process.env.WTEN_API_URL

  const baseUrl =
    process.env.WHATTOEATNEXT_URL ||
    process.env.ALCHM_KITCHEN_URL ||
    process.env.WHATTOEATNEXT_BASE_URL
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/api/feed`
  }

  return 'http://localhost:3000/api/feed'
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
    const idempotencyKey = action.idempotencyKey || action.metadataPayload.idempotencyKey
    const response = await fetch(WTEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getInternalApiSecret()}`,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify(action),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WTEN API returned ${response.status}: ${errorText}`)
    }
  }
}

export const feedPusherService = new FeedPusherService()
