import { logger } from '../utils/logger.js'

export interface AlchmKitchenFeedPayload {
  agentEmail: string
  eventType: string
  actionType?: string
  activityDetails?: Record<string, unknown>
  timestamp?: string
  agentDisplayName?: string
  metadataPayload: Record<string, unknown>
}

export interface WebhookPostResult {
  success: boolean
  status?: number
  responseBody?: string
  error?: string
  dryRun?: boolean
}

export class AlchmKitchenWebhookService {
  constructor(
    private readonly baseUrl = resolveAlchmKitchenBaseUrl(),
    private readonly internalSecret = process.env.INTERNAL_API_SECRET || '',
    private readonly dryRun = process.env.ASTRO_ACTION_DRY_RUN === 'true'
  ) {}

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.internalSecret)
  }

  async postFeedEvent(payload: AlchmKitchenFeedPayload): Promise<WebhookPostResult> {
    if (this.dryRun) {
      logger.info('Astrological action webhook dry run', payload)
      return { success: true, dryRun: true }
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ALCHM_KITCHEN_SYNC_URL/ALCHM_KITCHEN_FEED_URL and INTERNAL_API_SECRET are required',
      }
    }

    const endpoint = `${this.baseUrl.replace(/\/$/, '')}/api/feed`

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.internalSecret}`,
        },
        body: JSON.stringify(enrichFeedPayload(payload)),
      })

      const responseBody = await response.text()

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          responseBody,
          error: `Feed webhook failed with HTTP ${response.status}`,
        }
      }

      return {
        success: true,
        status: response.status,
        responseBody,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

export const alchmKitchenWebhookService = new AlchmKitchenWebhookService()

function resolveAlchmKitchenBaseUrl(): string {
  const configuredBase =
    process.env.ALCHM_KITCHEN_SYNC_URL ||
    process.env.ALCHM_KITCHEN_FEED_URL ||
    process.env.ALCHM_KITCHEN_BASE_URL ||
    process.env.WHATTOEATNEXT_URL ||
    process.env.WHATTOEATNEXT_BASE_URL

  if (configuredBase) return configuredBase

  const legacyBase = process.env.ALCHM_KITCHEN_URL
  if (legacyBase && !legacyBase.includes('railway.app')) return legacyBase

  return 'https://alchm.kitchen'
}

function enrichFeedPayload(payload: AlchmKitchenFeedPayload): AlchmKitchenFeedPayload {
  const actionType =
    payload.actionType ||
    stringFromMetadata(payload.metadataPayload, 'actionType', 'action_type') ||
    payload.eventType
  const timestamp =
    payload.timestamp ||
    stringFromMetadata(payload.metadataPayload, 'timestamp') ||
    new Date().toISOString()
  const activityDetails =
    payload.activityDetails ||
    objectFromMetadata(payload.metadataPayload, 'activityDetails', 'activity_details') ||
    payload.metadataPayload

  return {
    ...payload,
    actionType,
    activityDetails,
    timestamp,
    metadataPayload: {
      ...payload.metadataPayload,
      actionType,
      activityDetails,
      timestamp,
    },
  }
}

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

function objectFromMetadata(
  metadata: Record<string, unknown>,
  ...keys: string[]
): Record<string, unknown> | undefined {
  for (const key of keys) {
    const value = metadata[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  }
  return undefined
}
