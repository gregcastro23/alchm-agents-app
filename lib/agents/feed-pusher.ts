import { feedActivationEngine, type FeedActionPayload } from './feed-activation-engine'

const WTEN_API_URL = process.env.WTEN_API_URL || 'http://localhost:3000/api/feed'
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || 'dev_secret'

export class FeedPusherService {
  /**
   * Evaluates current cosmic weather and pushes activated agent
   * actions directly to the WTEN feed ingestion endpoint.
   */
  async evaluateAndPush(): Promise<{ success: boolean; pushedCount: number; errors: any[] }> {
    try {
      // 1. Evaluate what actions should be taken
      const actions = await feedActivationEngine.evaluateActivations()
      
      if (actions.length === 0) {
        return { success: true, pushedCount: 0, errors: [] }
      }

      // 2. Push each action to WTEN
      let pushedCount = 0
      const errors = []

      for (const action of actions) {
        try {
          await this.pushToWTEN(action)
          pushedCount++
        } catch (error) {
          console.error(`Failed to push action for ${action.agentEmail}:`, error)
          errors.push(error)
        }
      }

      return { success: errors.length === 0, pushedCount, errors }
    } catch (error) {
      console.error('Error in evaluateAndPush:', error)
      return { success: false, pushedCount: 0, errors: [error] }
    }
  }

  private async pushToWTEN(action: FeedActionPayload): Promise<void> {
    const response = await fetch(WTEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERNAL_API_SECRET}`
      },
      body: JSON.stringify(action)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WTEN API returned ${response.status}: ${errorText}`)
    }
  }
}

export const feedPusherService = new FeedPusherService()
