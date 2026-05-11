import { logger } from '../utils/logger.js'

export interface AlchmKitchenFeedPayload {
  agentEmail: string
  eventType: string
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
    private readonly baseUrl = process.env.WHATTOEATNEXT_URL || process.env.ALCHM_KITCHEN_URL || '',
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
        error: 'WHATTOEATNEXT_URL/ALCHM_KITCHEN_URL and INTERNAL_API_SECRET are required',
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
        body: JSON.stringify(payload),
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
