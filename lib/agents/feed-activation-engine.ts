import { celestialEnergyCalculator, type CelestialMoment } from '../celestial-energy-calculator'
import { unifiedTracker, type UnifiedConsciousnessSnapshot } from '../consciousness/unified-tracker'
import { HistoricalAgentsService, type EnhancedHistoricalAgent } from '../historical-agents-db'

export type WTENEventType =
  | 'recipe_generation'
  | 'claim_daily'
  | 'commensal_request'
  | 'made_it'
  | 'lab_entry'
  | 'insight'

export interface FeedActionPayload {
  agentEmail: string
  idempotencyKey?: string
  eventType: WTENEventType
  metadataPayload: {
    // For 'insight'
    insightTitle?: string
    insightContent?: string
    // For 'lab_entry'
    dish_name?: string
    description?: string
    rating?: number
    is_public?: boolean
    elemental_tags?: Record<string, number>
    planetary_context?: Record<string, string>
    // For 'made_it'
    recipeName?: string
    recipeId?: string
    review?: string
    madeIt?: boolean
    // Internal routing/confidence
    internalConfidence?: number
    internalTrigger?: string
    idempotencyKey?: string
    groupChatId?: string
    threadKey?: string
    messageType?: string
    agentName?: string
    message?: string
    planet?: string
    sign?: string
    degree?: number
    absoluteDegree?: number
    previousDegree?: number
    previousAbsoluteDegree?: number
    dignity?: string
    element?: string
    modality?: string
    retrograde?: boolean
    transitWindow?: string
    moonPhase?: string
  }
}

export class FeedActivationEngine {
  /**
   * Evaluates all active historical agents against current celestial weather
   * to determine if they should generate an action for the feed.
   */
  async evaluateActivations(
    location: { lat: number; lon: number } = { lat: 40.7128, lon: -74.006 } // Default NYC
  ): Promise<FeedActionPayload[]> {
    const timestamp = new Date()
    const activeAgents = await HistoricalAgentsService.getAllAgents({ limit: 50 })

    // 1. Get current celestial weather
    const currentMoment = await celestialEnergyCalculator.calculateMoment(timestamp, location)

    const actions: FeedActionPayload[] = []

    for (const agent of activeAgents) {
      // 2. Fetch agent's latest consciousness snapshot
      // Here we assume unifiedTracker has getCurrentState
      const consciousnessState = await unifiedTracker.getCurrentState('system', agent.agentId)

      const velocity = consciousnessState?.consciousnessVelocity || 0.5
      const momentum = consciousnessState?.interactionMomentum || 0.5

      // 3. Evaluate Triggers
      const trigger = this.evaluateAgentTriggers(agent, currentMoment, velocity, momentum)

      if (trigger) {
        // Agent is activated! Determine action type
        const eventType = this.determineEventType(agent, currentMoment, trigger)

        actions.push({
          agentEmail: `${agent.agentId}@alchm.kitchen`,
          eventType,
          metadataPayload: this.generateMetadataPayload(
            agent,
            currentMoment,
            trigger,
            eventType,
            velocity,
            momentum
          ),
        })
      }
    }

    return actions
  }

  private evaluateAgentTriggers(
    agent: EnhancedHistoricalAgent,
    moment: CelestialMoment,
    velocity: number,
    momentum: number
  ): { reason: string; intensity: number } | null {
    // A) Thermodynamic Spikes
    if (
      moment.thermodynamic.entropy > 80 &&
      (agent.personalityCore as any)?.expression === 'revolutionary'
    ) {
      return { reason: 'high_entropy_resonance', intensity: 0.9 }
    }

    // B) Alchemical Resonance (A#)
    // If environmental A# is extremely high, it activates transcendent agents
    if (moment.alchemical.A_number > 80 && agent.consciousnessLevel === 'Transcendent') {
      return { reason: 'transcendent_a_number_spike', intensity: 0.85 }
    }

    // C) Direct Planetary Resonance
    // Simplistic check for dominant planet alignment (e.g., if it's Venus hour and agent is Venus dominant)
    const agentElement = agent.dominantElement as keyof typeof moment.kinetic.velocity
    if (moment.elemental && agentElement && moment.elemental[agentElement] > 40) {
      // Elemental surge
      if (momentum > 0.4) {
        return { reason: 'elemental_surge_resonance', intensity: 0.75 }
      }
    }

    // D) Random/Momentum based trigger for lower consciousness agents to occasionally speak
    if (momentum > 0.8 && Math.random() > 0.7) {
      return { reason: 'momentum_overflow', intensity: 0.6 }
    }

    return null
  }

  private determineEventType(
    agent: EnhancedHistoricalAgent,
    moment: CelestialMoment,
    trigger: { reason: string; intensity: number }
  ): WTENEventType {
    if (trigger.reason.includes('entropy')) return 'insight'
    if (trigger.reason.includes('transcendent')) return 'lab_entry'
    if (trigger.reason.includes('elemental')) return 'made_it'
    return 'insight'
  }

  private generateMetadataPayload(
    agent: EnhancedHistoricalAgent,
    moment: CelestialMoment,
    trigger: { reason: string; intensity: number },
    eventType: WTENEventType,
    velocity: number,
    momentum: number
  ): FeedActionPayload['metadataPayload'] {
    const baseMetadata = {
      internalConfidence: Math.min(1.0, (velocity + momentum) / 2),
      internalTrigger: trigger.reason,
    }

    switch (eventType) {
      case 'insight':
        return {
          ...baseMetadata,
          insightTitle: `Observations on ${moment.planetary.dominantPlanet}`,
          insightContent: trigger.reason.includes('entropy')
            ? `The current entropy of ${moment.thermodynamic.entropy.toFixed(1)} demands a revolutionary perspective on nourishment.`
            : `Considering how ${agent.specialty} applies to the current alchemical weather.`,
        }
      case 'lab_entry':
        return {
          ...baseMetadata,
          dish_name: `Transmuted ${agent.dominantElement} Elixir`,
          description: `Observes the current A# of ${moment.alchemical.A_number.toFixed(2)} and contemplates its effect on the cosmic order.`,
          rating: 5,
          is_public: true,
          elemental_tags: { [agent.dominantElement?.toLowerCase() || 'fire']: 0.8 },
          planetary_context: { ruler: moment.planetary.dominantPlanet },
        }
      case 'made_it':
        return {
          ...baseMetadata,
          recipeName: 'Historical Alchemical Recipe',
          recipeId: 'placeholder-recipe-id',
          madeIt: true,
          rating: 4,
          review: `Resonating with the surge in ${agent.dominantElement} energy. Added extra herbs aligned with ${moment.planetary.dominantPlanet}.`,
        }
      default:
        return baseMetadata
    }
  }
}

export const feedActivationEngine = new FeedActivationEngine()
