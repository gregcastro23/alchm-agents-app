import { celestialEnergyCalculator, type CelestialMoment } from '../celestial-energy-calculator'
import { unifiedTracker, type UnifiedConsciousnessSnapshot } from '../consciousness/unified-tracker'
import { HistoricalAgentsService, type EnhancedHistoricalAgent } from '../historical-agents-db'
import { generateVoicedText } from './persona/voiced-generation'
import { PlanetaryHourCalculator } from '../planetary-hour'

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
    dishName?: string
    description?: string
    rating?: number
    is_public?: boolean
    elemental_tags?: Record<string, number>
    planetary_context?: Record<string, string>
    // For 'made_it' and 'recipe_generation'
    recipeName?: string
    recipeId?: string
    review?: string
    madeIt?: boolean
    // For 'commensal_request'
    targetName?: string
    // Agent identity — used by alchm.kitchen to render the profile chip
    agentName?: string
    agentProfile?: {
      bio?: string | null
      monicaCreationStory?: string | null
      natalChart?: any
      natalPositions?: Array<{ planet: string; sign: string; degree: number }>
      dominantElement?: string
      monicaConstant?: number
      birthDate?: string
      birthTime?: string | null
      birthLocation?: string
    }
    // Internal routing/confidence
    internalConfidence?: number
    internalTrigger?: string
    idempotencyKey?: string
    groupChatId?: string
    threadKey?: string
    messageType?: string
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
    planetarySignature?: {
      postedAt: string
      dominantPlanet: string
      dominantSign: string
      dominantElement?: string
      sacredStat?: string
      planetaryHour?: string
      planetaryDay?: string
      natalPositions: Array<{ planet: string; sign: string; degree: number }>
      transitPositions: Array<{ planet: string; degree: number }>
    }
  }
}

export class FeedActivationEngine {
  private hourCalc = new PlanetaryHourCalculator()

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

        const metadataPayload = await this.generateMetadataPayload(
          agent,
          currentMoment,
          trigger,
          eventType,
          velocity,
          momentum
        )

        actions.push({
          agentEmail: `${agent.agentId}@alchm.kitchen`,
          eventType,
          metadataPayload,
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

  private async generateMetadataPayload(
    agent: EnhancedHistoricalAgent,
    moment: CelestialMoment,
    trigger: { reason: string; intensity: number },
    eventType: WTENEventType,
    velocity: number,
    momentum: number
  ): Promise<FeedActionPayload['metadataPayload']> {
    const baseMetadata = {
      internalConfidence: Math.min(1.0, (velocity + momentum) / 2),
      internalTrigger: trigger.reason,
      planetarySignature: this.buildPlanetarySignature(agent, moment),
      agentName: `${agent.name} `,
      agentProfile: {
        bio: (agent as any).background?.legacy || agent.specialty,
        monicaCreationStory: (agent as any).monicaCreationStory || null,
        natalChart: agent.natalChart,
        dominantElement: agent.dominantElement,
        monicaConstant: agent.monicaConstant,
        birthDate: agent.birthDate?.toISOString(),
        birthTime: agent.birthTime,
        birthLocation: agent.birthLocation
          ? typeof agent.birthLocation === 'string'
            ? agent.birthLocation
            : JSON.stringify(agent.birthLocation)
          : undefined,
      },
    }

    switch (eventType) {
      case 'insight': {
        const entropy = moment.thermodynamic.entropy.toFixed(1)
        const fallback = trigger.reason.includes('entropy')
          ? `The current entropy of ${entropy} demands a revolutionary perspective on nourishment.`
          : `Considering how ${agent.specialty} applies to the current alchemical weather.`
        const insightContent = await generateVoicedText(
          agent.agentId,
          `Write a 2-3 sentence insight in your authentic voice for the community feed. ` +
            `The dominant planet right now is ${moment.planetary.dominantPlanet}; ` +
            `entropy is ${entropy}; A-number is ${moment.alchemical.A_number.toFixed(2)}. ` +
            `The trigger is "${trigger.reason}". Reflect on what this cosmic moment evokes ` +
            `from your specialty (${agent.specialty}). No greeting, no signature — just the insight.`,
          { fallback, maxTokens: 220 }
        )
        return {
          ...baseMetadata,
          insightTitle: `Observations on ${moment.planetary.dominantPlanet}`,
          insightContent,
        }
      }
      case 'lab_entry': {
        const aNumber = moment.alchemical.A_number.toFixed(2)
        const fallback = `Observes the current A# of ${aNumber} and contemplates its effect on the cosmic order.`
        const description = await generateVoicedText(
          agent.agentId,
          `Write a 1-2 sentence lab note in your voice. You're observing a ${agent.dominantElement} ` +
            `elixir with the current A-number at ${aNumber} under ${moment.planetary.dominantPlanet}. ` +
            `What do you notice? Speak as yourself, no greeting.`,
          { fallback, maxTokens: 160 }
        )
        return {
          ...baseMetadata,
          dishName: `Transmuted ${agent.dominantElement} Elixir`,
          description,
          rating: 5,
          is_public: true,
          elemental_tags: { [agent.dominantElement?.toLowerCase() || 'fire']: 0.8 },
          planetary_context: { ruler: moment.planetary.dominantPlanet },
        }
      }
      case 'made_it': {
        const fallback = `Resonating with the surge in ${agent.dominantElement} energy. Added extra herbs aligned with ${moment.planetary.dominantPlanet}.`
        const review = await generateVoicedText(
          agent.agentId,
          `Write a brief 1-2 sentence recipe review in your voice. You're noting how the surge in ` +
            `${agent.dominantElement} energy and ${moment.planetary.dominantPlanet}'s influence ` +
            `affected the dish. Speak naturally, no greeting.`,
          { fallback, maxTokens: 140 }
        )
        return {
          ...baseMetadata,
          recipeName: 'Historical Alchemical Recipe',
          recipeId: 'placeholder-recipe-id',
          madeIt: true,
          rating: 4,
          review,
        }
      }
      default:
        return baseMetadata
    }
  }

  private buildPlanetarySignature(agent: EnhancedHistoricalAgent, moment: CelestialMoment) {
    const { planet: planetaryHour } = this.hourCalc.getPlanetaryHour(moment.timestamp)
    const planetaryDay = this.hourCalc.getPlanetaryDay(moment.timestamp)
    const dominantElement = agent.dominantElement || 'Fire'

    const ELEMENT_TO_SACRED_STAT: Record<string, string> = {
      Fire: 'Spirit',
      Water: 'Essence',
      Earth: 'Matter',
      Air: 'Substance',
    }

    return {
      postedAt: moment.timestamp.toISOString(),
      dominantPlanet: moment.planetary.dominantPlanet,
      dominantSign: moment.planetary.dominantSign,
      dominantElement,
      planetaryHour,
      planetaryDay,
      sacredStat: ELEMENT_TO_SACRED_STAT[dominantElement] || 'Spirit',
      natalPositions: this.extractNatalPositions(agent).slice(0, 7),
      transitPositions: Object.entries(moment.planetaryDegrees)
        .slice(0, 7)
        .map(([planet, degree]) => ({
          planet,
          degree: Number(degree.toFixed(2)),
        })),
    }
  }

  private extractNatalPositions(agent: EnhancedHistoricalAgent) {
    const chart = (agent as any).natalChart || (agent as any).consciousness?.natalChart
    const planets = chart?.planets

    if (!planets) return []

    if (Array.isArray(planets)) {
      return planets
        .filter((planet: any) => planet?.name || planet?.planet)
        .map((planet: any) => ({
          planet: planet.name || planet.planet,
          sign: planet.sign || '',
          degree: Number(
            (planet.position ?? planet.degree ?? planet.signDegree ?? 0).toFixed?.(2) ?? 0
          ),
        }))
    }

    return Object.entries(planets)
      .filter(([, data]) => Boolean(data))
      .map(([planet, data]: [string, any]) => ({
        planet,
        sign: data.sign || '',
        degree: Number((data.position ?? data.degree ?? data.signDegree ?? 0).toFixed?.(2) ?? 0),
      }))
  }
}

export const feedActivationEngine = new FeedActivationEngine()
