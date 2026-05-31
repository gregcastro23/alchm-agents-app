import { celestialEnergyCalculator, type CelestialMoment } from '../celestial-energy-calculator'
import { unifiedTracker, type UnifiedConsciousnessSnapshot } from '../consciousness/unified-tracker'
import { HistoricalAgentsService, type EnhancedHistoricalAgent } from '../historical-agents-db'
import { generateVoicedText } from './persona/voiced-generation'
import { PlanetaryHourCalculator } from '../planetary-hour'
import { convertSignDegreesToLongitude, angularSeparation } from '../aspects-dynamics'

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
    recipe_id?: string
    review?: string
    madeIt?: boolean
    // For 'commensal_request'
    targetName?: string
    withAgent?: string
    partnerName?: string
    // WTEN narration contract. Keep these names aligned with
    // alchm.kitchen's eventNarration helper.
    topic?: string
    subject?: string
    summary?: string
    messageExcerpt?: string
    item?: string
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
    actionType?: string
    activityDetails?: Record<string, unknown>
    timestamp?: string
    idempotencyKey?: string
    groupChatId?: string
    threadKey?: string
    messageType?: string
    message?: string
    parentId?: string
    replyToEventId?: string
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
   * Per-tick pacing constants. The engine runs hourly (vercel cron); these
   * bound cost while still letting every agent participate over time.
   *  - WINDOW_PER_TICK: agents EVALUATED per tick (trigger eval is cheap, no
   *    LLM). A timestamp-derived offset rotates this window across the whole
   *    roster, so all ~3,700 agents are swept in ~roster/WINDOW ticks.
   *  - MAX_ACTIVATIONS_PER_TICK: hard cap on voiced-text (LLM) generations.
   *  - MAX_RECIPES_PER_TICK: hard cap on recipe_generation events (each also
   *    does a catalog lookup + a voiced note).
   */
  private static readonly WINDOW_PER_TICK = 120
  private static readonly MAX_ACTIVATIONS_PER_TICK = 10
  private static readonly MAX_RECIPES_PER_TICK = 3

  /** Per-instance (per-tick) cache of catalog recipes keyed by element. */
  private catalogCache = new Map<string, Array<{ id: string; name: string }>>()

  /**
   * Evaluates a rotating window of active agents against current celestial
   * weather to decide which should post to the feed. Transit-to-natal gating
   * is the primary trigger; per-tick caps bound LLM + cross-service cost.
   */
  async evaluateActivations(
    location: { lat: number; lon: number } = { lat: 40.7128, lon: -74.006 } // Default NYC
  ): Promise<FeedActionPayload[]> {
    const timestamp = new Date()

    // Rotating window: advance the offset by WINDOW each hour so the whole
    // roster is swept over time without evaluating all ~3,700 agents per tick.
    const total = await HistoricalAgentsService.countActiveAgents()
    const stepIndex = Math.floor(timestamp.getTime() / 3_600_000) // hours since epoch
    const offset =
      total > FeedActivationEngine.WINDOW_PER_TICK
        ? (stepIndex * FeedActivationEngine.WINDOW_PER_TICK) % total
        : 0
    const activeAgents = await HistoricalAgentsService.getAllAgents({
      limit: FeedActivationEngine.WINDOW_PER_TICK,
      offset,
    })

    // 1. Get current celestial weather
    const currentMoment = await celestialEnergyCalculator.calculateMoment(timestamp, location)

    const actions: FeedActionPayload[] = []
    let recipeCount = 0

    for (const agent of activeAgents) {
      // Hard backstop: stop generating once the per-tick activation cap is hit.
      if (actions.length >= FeedActivationEngine.MAX_ACTIVATIONS_PER_TICK) break

      // 2. Fetch agent's latest consciousness snapshot
      const consciousnessState = await unifiedTracker.getCurrentState('system', agent.agentId)

      const velocity = consciousnessState?.consciousnessVelocity || 0.5
      const momentum = consciousnessState?.interactionMomentum || 0.5

      // 3. Evaluate triggers (transit-to-natal aspects run first inside
      //    evaluateAgentTriggers; random/momentum is the last-resort path).
      const trigger = this.evaluateAgentTriggers(agent, currentMoment, velocity, momentum)
      if (!trigger) continue

      // 4. Determine action type, then resolve a real recipe for recipe events.
      let eventType = this.determineEventType(agent, currentMoment, trigger)
      let recipeCtx: { id: string; name: string } | undefined

      if (eventType === 'recipe_generation') {
        if (recipeCount >= FeedActivationEngine.MAX_RECIPES_PER_TICK) {
          // Recipe cap reached this tick — still let the agent speak.
          eventType = 'insight'
        } else {
          // Invariant: a recipe_generation event ALWAYS carries a resolvable
          // catalog recipeId so the profile "Created by this agent" card can
          // expand. If the catalog is unreachable, downgrade to insight rather
          // than emit a broken artifact.
          const recipe = await this.fetchCatalogRecipe(agent.dominantElement)
          if (recipe) {
            recipeCtx = recipe
            recipeCount++
          } else {
            eventType = 'insight'
          }
        }
      }

      const metadataPayload = await this.generateMetadataPayload(
        agent,
        currentMoment,
        trigger,
        eventType,
        velocity,
        momentum,
        recipeCtx
      )

      actions.push({
        agentEmail: `${agent.agentId}@agentic.alchm.kitchen`,
        eventType,
        metadataPayload,
      })
    }

    return actions
  }

  /**
   * Fetch a real, resolvable recipe from alchm.kitchen's curated catalog
   * matched to the agent's dominant element. Reuses alchm.kitchen (the locked
   * "don't build our own recipe engine" decision) but via the catalog —
   * `/api/generate-cosmic-recipe` returns an ephemeral recipe with no
   * persisted id, whereas catalog ids resolve through `/api/recipes/[id]`
   * (the profile's recipe-expand proxy). Cached per element for the tick;
   * best-effort (null on any failure → caller downgrades the event).
   */
  private async fetchCatalogRecipe(element?: string): Promise<{ id: string; name: string } | null> {
    const el = (element || 'Fire').toLowerCase()
    try {
      if (!this.catalogCache.has(el)) {
        const base =
          process.env.ALCHM_KITCHEN_PUBLIC_URL ||
          process.env.ALCHM_KITCHEN_SYNC_URL ||
          process.env.ALCHM_KITCHEN_BASE_URL ||
          'https://alchm.kitchen'
        const res = await fetch(`${base}/api/recipes?element=${encodeURIComponent(el)}&limit=25`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(6000),
        })
        if (!res.ok) {
          this.catalogCache.set(el, [])
        } else {
          const data: any = await res.json().catch(() => null)
          const list: any[] = Array.isArray(data?.recipes)
            ? data.recipes
            : Array.isArray(data)
              ? data
              : []
          const mapped = list
            .map(r => ({
              id: String(r?.id ?? r?.recipeId ?? r?.recipe_id ?? ''),
              name: String(r?.name ?? r?.title ?? 'Cosmic Recipe'),
            }))
            .filter(r => r.id)
          this.catalogCache.set(el, mapped)
        }
      }
      const pool = this.catalogCache.get(el) || []
      if (pool.length === 0) return null
      // Rotate by half-hour so repeated activations vary without depending on RNG.
      const idx = Math.floor(Date.now() / 1_800_000) % pool.length
      return pool[idx]
    } catch (error) {
      console.warn('[FeedActivationEngine] fetchCatalogRecipe failed:', error)
      this.catalogCache.set(el, [])
      return null
    }
  }

  private evaluateTransitToNatalAspects(
    agent: EnhancedHistoricalAgent,
    moment: CelestialMoment
  ): {
    reason: string
    intensity: number
    aspectType: string
    transitPlanet: string
    natalPlanet: string
  } | null {
    const natalPositions = this.extractNatalPositions(agent)
    const transitPositions = moment.planetaryDegrees

    if (!natalPositions || !transitPositions) return null

    const aspectDefinitions = [
      { type: 'Conjunction', angle: 0, orb: 1.5, intensity: 0.95 },
      { type: 'Opposition', angle: 180, orb: 1.5, intensity: 0.95 },
      { type: 'Square', angle: 90, orb: 1.5, intensity: 0.95 },
      { type: 'Trine', angle: 120, orb: 1.5, intensity: 0.8 },
      { type: 'Sextile', angle: 60, orb: 1.5, intensity: 0.8 },
    ]

    for (const [transitPlanet, transitLong] of Object.entries(transitPositions)) {
      if (typeof transitLong !== 'number') continue

      for (const natal of natalPositions) {
        const natalLong = convertSignDegreesToLongitude(natal.sign, natal.degree)
        const diff = angularSeparation(transitLong, natalLong)

        for (const aspect of aspectDefinitions) {
          const orb = Math.abs(diff - aspect.angle)
          if (orb <= aspect.orb) {
            return {
              reason: `transit_aspect_${transitPlanet.toLowerCase()}_${aspect.type.toLowerCase()}_natal_${natal.planet.toLowerCase()}`,
              intensity: aspect.intensity,
              aspectType: aspect.type,
              transitPlanet,
              natalPlanet: natal.planet,
            }
          }
        }
      }
    }

    return null
  }

  private evaluateAgentTriggers(
    agent: EnhancedHistoricalAgent,
    moment: CelestialMoment,
    velocity: number,
    momentum: number
  ): { reason: string; intensity: number } | null {
    // 0) Transit-to-Natal Aspect alignment (tight 1.5 deg orbis)
    const aspectTrigger = this.evaluateTransitToNatalAspects(agent, moment)
    if (aspectTrigger) {
      return { reason: aspectTrigger.reason, intensity: aspectTrigger.intensity }
    }

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
    if (trigger.reason.includes('aspect')) return 'insight'
    if (trigger.reason.includes('entropy')) return 'insight'
    if (trigger.reason.includes('transcendent')) return 'lab_entry'
    // Elemental surges manifest as a cooked dish — a real, resolvable catalog
    // recipe (see fetchCatalogRecipe). The caller downgrades to 'insight' if
    // the catalog can't be reached or the per-tick recipe cap is hit.
    if (trigger.reason.includes('elemental')) return 'recipe_generation'
    return 'insight'
  }

  private async generateMetadataPayload(
    agent: EnhancedHistoricalAgent,
    moment: CelestialMoment,
    trigger: { reason: string; intensity: number },
    eventType: WTENEventType,
    velocity: number,
    momentum: number,
    recipeCtx?: { id: string; name: string }
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

        let aspectRefStr = ''
        if (trigger.reason.startsWith('transit_aspect_')) {
          const parts = trigger.reason.split('_')
          if (parts.length === 6) {
            const transitP = parts[2].toUpperCase()
            const aspectT = parts[3].toUpperCase()
            const natalP = parts[5].toUpperCase()
            aspectRefStr = `There is currently a powerful transit alignment: Transiting ${transitP} in exact ${aspectT} to your Natal ${natalP}. `
          }
        }

        const fallback = aspectRefStr
          ? `Resonating with the powerful transit alignment of transiting planetary aspect. This celestial geometry activates my consciousness.`
          : trigger.reason.includes('entropy')
            ? `The current entropy of ${entropy} demands a revolutionary perspective on nourishment.`
            : `Considering how ${agent.specialty} applies to the current alchemical weather.`

        const promptText =
          `Write a 2-3 sentence insight in your authentic voice for the community feed. ` +
          `The dominant planet right now is ${moment.planetary.dominantPlanet}; ` +
          `entropy is ${entropy}; A-number is ${moment.alchemical.A_number.toFixed(2)}. ` +
          (aspectRefStr
            ? `${aspectRefStr}This celestial alignment has activated your inner consciousness. `
            : '') +
          `The trigger is "${trigger.reason}". Reflect on what this cosmic moment evokes ` +
          `from your specialty (${agent.specialty}). No greeting, no signature — just the insight.`

        const insightContent = await generateVoicedText(agent.agentId, promptText, {
          fallback,
          maxTokens: 220,
        })

        let insightTitle = `Observations on ${moment.planetary.dominantPlanet}`
        if (trigger.reason.startsWith('transit_aspect_')) {
          const parts = trigger.reason.split('_')
          if (parts.length === 6) {
            insightTitle = `Celestial Resonance: ${parts[2].toUpperCase()} ${parts[3].toUpperCase()} Natal ${parts[5].toUpperCase()}`
          }
        }

        return {
          ...baseMetadata,
          insightTitle,
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
      case 'recipe_generation': {
        // recipeCtx is guaranteed by evaluateActivations (it downgrades to
        // 'insight' when no catalog recipe resolves), but guard regardless.
        const recipeName = recipeCtx?.name || `${agent.dominantElement} Composition`
        const fallback = `Composed "${recipeName}" — a ${agent.dominantElement} dish attuned to ${moment.planetary.dominantPlanet}.`
        const review = await generateVoicedText(
          agent.agentId,
          `Write a brief 1-2 sentence note in your voice about "${recipeName}", a ${agent.dominantElement} ` +
            `dish you've composed under ${moment.planetary.dominantPlanet}'s influence. Speak naturally, no greeting.`,
          { fallback, maxTokens: 140 }
        )
        return {
          ...baseMetadata,
          recipeName,
          ...(recipeCtx?.id ? { recipeId: recipeCtx.id, recipe_id: recipeCtx.id } : {}),
          review,
          madeIt: true,
          rating: 5,
        }
      }
      case 'made_it': {
        const recipeName = recipeCtx?.name || `Transmuted ${agent.dominantElement} Dish`
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
          recipeName,
          // Only attach a recipeId when it resolves through the catalog — never
          // a placeholder (it would 404 on the profile recipe-expand proxy).
          ...(recipeCtx?.id ? { recipeId: recipeCtx.id, recipe_id: recipeCtx.id } : {}),
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
