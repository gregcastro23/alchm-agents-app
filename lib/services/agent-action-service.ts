/**
 * Agent Action Service
 * ====================
 *
 * Core engine for the Agentic User system on alchm.kitchen.
 *
 * Responsibilities:
 *  1. **Daily Yield** — Automatically claims ESMS tokens for every active
 *     agentic user based on their natal chart and current transits.
 *  2. **Activation Evaluation** — Computes a resonance score between each
 *     agent's natal chart and the current celestial weather (planetary hour,
 *     transit aspects). If the score exceeds `AGENT_ACTIVATION_THRESHOLD`,
 *     the agent is marked for action.
 *  3. **Action Execution** — Activated agents spend tokens to post insights
 *     to the community feed or perform token transmutations.
 *
 * All token mutations are atomic (single Prisma transaction) to prevent
 * double-spending or partial writes.
 */

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import {
  AGENT_ACTIVATION_THRESHOLD,
  AGENT_DAILY_YIELD,
  AGENT_OPERATION_COSTS,
  TOKEN_TYPES,
} from '@/lib/economy-config'
import { EconomyService } from '@/lib/services/economyService'
import { syncDebitToAlchm } from '@/lib/alchm-debit-sync'
import { syncCreditToAlchm } from '@/lib/alchm-credit-sync'
import { syncEventToAlchm } from '@/lib/alchm-event-sync'
import { PlanetaryHourCalculator } from '@/lib/planetary-hour'
import { getCurrentPlanetaryPositions } from '@/lib/calculate-transits'
import type { CurrentPlanetPosition } from '@/lib/calculate-transits'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Natal position stored in user_profiles.natalPositions */
export interface NatalPosition {
  planet: string
  sign: string
  degree: number // 0–30 within sign
  longitude: number // 0–360 absolute
}

/** Result of evaluating a single agent's activation */
export interface ActivationResult {
  userId: string
  agentEmail: string
  agentName: string
  score: number
  activated: boolean
  triggers: string[]
}

/** Summary returned from the daily yield cron */
export interface DailyYieldSummary {
  processedCount: number
  claimedCount: number
  skippedCount: number
  errors: Array<{ userId: string; error: string }>
}

/** Summary returned from the tick (activation + action) cron */
export interface TickSummary {
  evaluatedCount: number
  activatedCount: number
  actionsExecuted: number
  activations: ActivationResult[]
  errors: Array<{ userId: string; error: string }>
}

/** Shape of an agentic user row joined with profile */
interface AgenticUser {
  id: string
  email: string
  name: string | null
  lastActivationAt: Date | null
  activationCount: number
  user_profiles: {
    natalChart: any
    natalPositions: any
    dominantElement: string
    monicaConstant: number
    birthDate: Date
    birthTime: string | null
    birthLocation: any
  } | null
}

// ---------------------------------------------------------------------------
// Element / Sign mappings
// ---------------------------------------------------------------------------

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'Fire',
  Taurus: 'Earth',
  Gemini: 'Air',
  Cancer: 'Water',
  Leo: 'Fire',
  Virgo: 'Earth',
  Libra: 'Air',
  Scorpio: 'Water',
  Sagittarius: 'Fire',
  Capricorn: 'Earth',
  Aquarius: 'Air',
  Pisces: 'Water',
}

const PLANET_RULERS: Record<string, string> = {
  Sun: 'Leo',
  Moon: 'Cancer',
  Mercury: 'Gemini',
  Venus: 'Taurus',
  Mars: 'Aries',
  Jupiter: 'Sagittarius',
  Saturn: 'Capricorn',
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AgentActionService {
  private hourCalc = new PlanetaryHourCalculator()

  // -----------------------------------------------------------------------
  // 1. Daily Yield
  // -----------------------------------------------------------------------

  /**
   * Claim daily ESMS yield for every active agentic user.
   *
   * Distributes `AGENT_DAILY_YIELD` tokens evenly across the four token
   * types. Skips any agent that has already claimed today (idempotent via
   * `lastDailyClaimAt` check inside the transaction).
   */
  async runDailyYieldForAgents(): Promise<DailyYieldSummary> {
    const agenticUsers = await this.getActiveAgenticUsers()
    const summary: DailyYieldSummary = {
      processedCount: agenticUsers.length,
      claimedCount: 0,
      skippedCount: 0,
      errors: [],
    }

    for (const agent of agenticUsers) {
      try {
        const alreadyClaimed = await EconomyService.hasClaimedAgentsYieldToday(agent.id)
        if (alreadyClaimed) {
          summary.skippedCount++
          continue
        }

        await this.claimYieldForAgent(agent.id)
        summary.claimedCount++
      } catch (err: any) {
        if (err?.message === 'Already claimed today') {
          summary.skippedCount++
        } else {
          summary.errors.push({ userId: agent.id, error: err?.message ?? String(err) })
        }
      }
    }

    console.log(
      `[AgentActionService] Daily yield: ${summary.claimedCount} claimed, ` +
        `${summary.skippedCount} skipped, ${summary.errors.length} errors`
    )

    return summary
  }

  /**
   * Atomic yield claim for a single agentic user. Uses the same
   * transaction pattern as `EconomyService.claimAgentsYield` but
   * with the agent-specific daily yield amount.
   */
  private async claimYieldForAgent(userId: string): Promise<void> {
    const perType = AGENT_DAILY_YIELD / 4
    const dateStr = new Date().toISOString().split('T')[0]
    const transactionGroupId = crypto.randomUUID()

    await prisma.$transaction(async tx => {
      // Idempotency guard within the transaction
      const bal = await tx.tokenBalance.findUnique({ where: { userId } })
      if (bal?.lastDailyClaimAgentsAt) {
        const last = new Date(bal.lastDailyClaimAgentsAt)
        const now = new Date()
        if (
          last.getUTCFullYear() === now.getUTCFullYear() &&
          last.getUTCMonth() === now.getUTCMonth() &&
          last.getUTCDate() === now.getUTCDate()
        ) {
          throw new Error('Already claimed today')
        }
      }

      const amounts: Record<string, number> = {}
      for (const token of TOKEN_TYPES) {
        amounts[token.toLowerCase()] = perType
        await tx.tokenTransaction.create({
          data: {
            transactionGroupId,
            userId,
            tokenType: token,
            amount: new Prisma.Decimal(perType),
            sourceType: 'agents_daily_yield',
            description: 'Automated Cosmic Yield (Agentic)',
            idempotencyKey: `agentic:daily:${userId}:${dateStr}:${token}`,
            createdAt: new Date(),
          },
        })
      }

      // Sync yield to alchm.kitchen
      const agent = await tx.users.findUnique({
        where: { id: userId },
        select: { email: true, isAgentic: true },
      })

      if (agent?.isAgentic) {
        const email = agent.email.toLowerCase()
        console.log(`[AgentActionService] Syncing yield for ${email} to alchm.kitchen...`)

        await syncCreditToAlchm({
          userEmail: email,
          amounts: amounts as any,
          source: 'agents_yield',
          idempotencyKey: `agentic:yield:${email}:${dateStr}`,
        })
      }

      // Upsert balance
      await tx.tokenBalance.upsert({
        where: { userId },
        create: {
          userId,
          spirit: perType,
          essence: perType,
          matter: perType,
          substance: perType,
          lastDailyClaimAgentsAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          spirit: { increment: perType },
          essence: { increment: perType },
          matter: { increment: perType },
          substance: { increment: perType },
          lastDailyClaimAgentsAt: new Date(),
          updatedAt: new Date(),
        },
      })
    })
  }

  // -----------------------------------------------------------------------
  // 2. Activation Evaluation
  // -----------------------------------------------------------------------

  /**
   * Evaluate all active agentic users against the current celestial
   * weather and return activation results. If an agent's score exceeds
   * `AGENT_ACTIVATION_THRESHOLD`, they are flagged for action.
   */
  async evaluateAgentActivations(): Promise<ActivationResult[]> {
    const agenticUsers = await this.getActiveAgenticUsers()
    const now = new Date()

    // Current sky state
    const currentPositions = getCurrentPlanetaryPositions(now)
    const { planet: hourPlanet, isDaytime } = this.hourCalc.getPlanetaryHour(now)
    const dayRuler = this.hourCalc.getPlanetaryDay(now)

    const results: ActivationResult[] = []

    for (const agent of agenticUsers) {
      const natalPositions = this.extractNatalPositions(agent)
      if (!natalPositions || natalPositions.length === 0) {
        continue // skip agents without stored natal chart
      }

      const { score, triggers } = this.calculateActivationScore(
        natalPositions,
        currentPositions,
        hourPlanet,
        dayRuler,
        isDaytime,
        agent.user_profiles?.dominantElement ?? 'Fire'
      )

      results.push({
        userId: agent.id,
        agentEmail: agent.email,
        agentName: agent.name ?? agent.email.split('@')[0],
        score,
        activated: score >= AGENT_ACTIVATION_THRESHOLD,
        triggers,
      })
    }

    return results
  }

  /**
   * Core activation score algorithm.
   *
   * Components (each normalized to 0–1, then weighted):
   *  - **Planetary Hour Resonance** (0.30) — Does the current hour ruler
   *    appear as a dominant planet in the agent's natal chart?
   *  - **Transit Aspect Score** (0.35) — How tightly do transiting planets
   *    aspect the agent's natal placements? Conjunction/opposition = high.
   *  - **Elemental Affinity** (0.20) — Does the current sky's dominant
   *    element match the agent's dominant element?
   *  - **Day Ruler Bonus** (0.15) — Is today's day ruler the agent's chart
   *    ruler?
   */
  private calculateActivationScore(
    natalPositions: NatalPosition[],
    currentPositions: Record<string, CurrentPlanetPosition>,
    hourPlanet: string,
    dayRuler: string,
    _isDaytime: boolean,
    dominantElement: string
  ): { score: number; triggers: string[] } {
    const triggers: string[] = []

    // 1. Planetary Hour Resonance (weight 0.30)
    let hourScore = 0
    const natalPlanets = natalPositions.map(p => p.planet)
    if (natalPlanets.includes(hourPlanet)) {
      hourScore = 0.8
      triggers.push(`planetary_hour_${hourPlanet}`)
    }
    // Extra boost if agent's Sun sign ruler matches hour planet
    const sunPos = natalPositions.find(p => p.planet === 'Sun')
    if (sunPos && PLANET_RULERS[hourPlanet] === sunPos.sign) {
      hourScore = 1.0
      triggers.push('hour_ruler_sun_sign_match')
    }

    // 2. Transit Aspect Score (weight 0.35)
    let transitScore = 0
    let closestOrb = 360
    for (const natal of natalPositions) {
      for (const [transitPlanet, transitPos] of Object.entries(currentPositions)) {
        const orb = this.calculateOrb(natal.degree, transitPos.degree)
        // Check conjunction (0°), opposition (180°)
        const conjunctionOrb = orb
        const oppositionOrb = Math.abs(orb - 180) < 180 ? Math.abs(orb - 180) : orb
        const minOrb = Math.min(conjunctionOrb, oppositionOrb)

        if (minOrb < 5) {
          // Tight aspect — scale inversely with orb
          const aspectScore = (5 - minOrb) / 5
          if (aspectScore > transitScore) {
            transitScore = aspectScore
            closestOrb = minOrb
            triggers.push(`transit_${transitPlanet}_${natal.planet}_orb_${minOrb.toFixed(1)}`)
          }
        }
      }
    }

    // 3. Elemental Affinity (weight 0.20)
    let elementScore = 0
    const currentElementCounts = this.countElements(currentPositions)
    const dominantCurrentElement = Object.entries(currentElementCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0]
    if (dominantCurrentElement === dominantElement) {
      elementScore = 1.0
      triggers.push(`elemental_resonance_${dominantElement}`)
    } else if (this.areComplementaryElements(dominantCurrentElement ?? '', dominantElement)) {
      elementScore = 0.5
      triggers.push('complementary_element')
    }

    // 4. Day Ruler Bonus (weight 0.15)
    let dayScore = 0
    if (natalPlanets.includes(dayRuler)) {
      dayScore = 0.7
      triggers.push(`day_ruler_${dayRuler}`)
    }
    if (sunPos && PLANET_RULERS[dayRuler] === sunPos.sign) {
      dayScore = 1.0
      triggers.push('day_ruler_sun_sign_match')
    }

    // Weighted sum
    const score = hourScore * 0.3 + transitScore * 0.35 + elementScore * 0.2 + dayScore * 0.15

    return { score: Math.min(1, Math.max(0, score)), triggers }
  }

  // -----------------------------------------------------------------------
  // 3. Action Execution
  // -----------------------------------------------------------------------

  /**
   * Execute an action for an activated agentic user.
   *
   * Token debits are performed on **alchm.kitchen** (source of truth)
   * via `POST /api/economy/sync-debit`. There is NO local fallback —
   * if the remote debit fails, the action is recorded with status
   * `debit_failed` and not executed.
   *
   * Action selection logic:
   *  - If the agent has more Spirit+Essence than Matter+Substance →
   *    **Feed Post** (insight action, costs 2 Spirit + 1 Essence)
   *  - Otherwise → **Token Transmutation** (costs 3 Matter + 2 Substance)
   */
  async executeAgentAction(
    activation: ActivationResult
  ): Promise<{ success: boolean; actionType: string; error?: string }> {
    const { userId, agentEmail, agentName } = activation

    try {
      // Fetch current balances (local pre-check for action type selection)
      const balances = await EconomyService.getBalances(userId)

      // Determine action type by dominant token pool OR agent identity
      const spiritEssence = balances.spirit + balances.essence
      const matterSubstance = balances.matter + balances.substance

      let actionType: string
      let operationKey: string

      if (agentEmail.includes('galileo-galilei')) {
        actionType = 'meal_plan'
        operationKey = 'agent_meal_plan'
      } else if (agentEmail.includes('albert-einstein')) {
        actionType = 'pantry_update'
        operationKey = 'agent_pantry_update'
      } else {
        actionType = spiritEssence >= matterSubstance ? 'feed_post' : 'transmutation'
        operationKey = actionType === 'feed_post' ? 'agent_feed_post' : 'agent_transmutation'
      }

      // Build idempotency key BEFORE debit (needed in the sync payload)
      const hourKey = new Date().toISOString().slice(0, 13) // YYYY-MM-DDTHH
      const idempotencyKey = `agent_action:${userId}:${hourKey}`

      // Resolve cost amounts for the payload
      const cost = AGENT_OPERATION_COSTS[operationKey] ?? {}
      const amounts = {
        spirit: cost.Spirit ?? 0,
        essence: cost.Essence ?? 0,
        matter: cost.Matter ?? 0,
        substance: cost.Substance ?? 0,
      }

      // ── Remote debit on alchm.kitchen (source of truth) ──────────
      const debitResult = await syncDebitToAlchm({
        userEmail: agentEmail,
        amounts,
        operationType: operationKey,
        source: 'planetary_agents_action_engine',
        idempotencyKey,
        metadata: {
          agentName,
          actionType,
          activationScore: activation.score,
          triggers: activation.triggers.slice(0, 5),
        },
      })

      if (!debitResult.ok && debitResult.reason !== 'already_applied') {
        // Record the failed attempt locally
        const now = new Date()
        await prisma.agent_action_events.upsert({
          where: { idempotencyKey },
          create: {
            agentId: userId,
            agentEmail,
            eventType: actionType === 'feed_post' ? 'insight' : 'transmutation',
            triggerType: 'celestial_activation',
            triggerSummary: activation.triggers.slice(0, 3).join(', '),
            metadataPayload: { error: debitResult.reason ?? debitResult.error },
            score: activation.score,
            idempotencyKey,
            status: 'debit_failed',
            evaluatedAt: now,
            createdAt: now,
            updatedAt: now,
          },
          update: {
            attempts: { increment: 1 },
            status: 'debit_failed',
            updatedAt: now,
          },
        })

        return {
          success: false,
          actionType,
          error: debitResult.reason ?? debitResult.error ?? 'sync_debit_failed',
        }
      }

      // ── Debit succeeded (or was already applied) ─────────────────
      const now = new Date()
      await prisma.agent_action_events.upsert({
        where: { idempotencyKey },
        create: {
          agentId: userId,
          agentEmail,
          eventType: actionType,
          triggerType: 'celestial_activation',
          triggerSummary: activation.triggers.slice(0, 3).join(', '),
          metadataPayload: this.buildActionMetadata(agentName, actionType, activation),
          score: activation.score,
          idempotencyKey,
          status: 'executed',
          evaluatedAt: now,
          postedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          attempts: { increment: 1 },
          status: 'executed',
          updatedAt: now,
        },
      })

      // Update the user's activation tracking
      await prisma.users.update({
        where: { id: userId },
        data: {
          lastActivationAt: now,
          activationCount: { increment: 1 },
        },
      })

      // ── Perform the high-level action (reporting events, etc) ─────
      if (actionType === 'meal_plan') {
        console.log(`[AgentActionService] ${agentName} is planning a cosmic feast...`)
        await syncEventToAlchm({ userEmail: agentEmail, event: 'generate_recipe' })
        await syncEventToAlchm({ userEmail: agentEmail, event: 'log_from_plan' })
      } else if (actionType === 'pantry_update') {
        console.log(`[AgentActionService] ${agentName} is stocking the master pantry...`)
        await syncEventToAlchm({ userEmail: agentEmail, event: 'masters_pantry_verified' })
      }

      return { success: true, actionType }
    } catch (err: any) {
      console.error(`[AgentActionService] Action failed for ${agentEmail}:`, err)
      return {
        success: false,
        actionType: 'unknown',
        error: err?.message ?? String(err),
      }
    }
  }

  /**
   * Full tick: evaluate all agents, execute actions for activated ones.
   */
  async runTick(): Promise<TickSummary> {
    const activations = await this.evaluateAgentActivations()
    const summary: TickSummary = {
      evaluatedCount: activations.length,
      activatedCount: 0,
      actionsExecuted: 0,
      activations,
      errors: [],
    }

    for (const activation of activations) {
      if (!activation.activated) continue
      summary.activatedCount++

      const result = await this.executeAgentAction(activation)
      if (result.success) {
        summary.actionsExecuted++
      } else {
        summary.errors.push({
          userId: activation.userId,
          error: result.error ?? 'Action execution failed',
        })
      }
    }

    console.log(
      `[AgentActionService] Tick: ${summary.evaluatedCount} evaluated, ` +
        `${summary.activatedCount} activated, ${summary.actionsExecuted} actions, ` +
        `${summary.errors.length} errors`
    )

    return summary
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /** Fetch all active agentic users with their profiles */
  private async getActiveAgenticUsers(): Promise<AgenticUser[]> {
    return (await prisma.users.findMany({
      where: { isAgentic: true },
      include: {
        user_profiles: {
          select: {
            natalChart: true,
            natalPositions: true,
            dominantElement: true,
            monicaConstant: true,
            birthDate: true,
            birthTime: true,
            birthLocation: true,
          },
        },
      },
    })) as unknown as AgenticUser[]
  }

  /** Extract natal positions from an agent's profile */
  private extractNatalPositions(agent: AgenticUser): NatalPosition[] | null {
    const profile = agent.user_profiles
    if (!profile) return null

    // Prefer explicit natalPositions if stored
    if (profile.natalPositions && Array.isArray(profile.natalPositions)) {
      return profile.natalPositions as NatalPosition[]
    }

    // Fall back to extracting from natalChart JSON
    const chart = profile.natalChart
    if (!chart) return null

    try {
      // Handle both { planets: { Sun: { degree, sign, ... } } } and array formats
      if (chart.planets && typeof chart.planets === 'object') {
        return Object.entries(chart.planets).map(([planet, data]: [string, any]) => ({
          planet,
          sign: data.sign ?? '',
          degree: data.signDegree ?? data.degree ?? 0,
          longitude: data.longitude ?? data.degrees ?? 0,
        }))
      }

      if (Array.isArray(chart)) {
        return chart.map((p: any) => ({
          planet: p.planet ?? p.label ?? '',
          sign: p.sign ?? '',
          degree: p.signDegree ?? p.degree ?? 0,
          longitude: p.longitude ?? p.degrees ?? 0,
        }))
      }
    } catch {
      console.warn(`[AgentActionService] Failed to parse natal chart for ${agent.id}`)
    }

    return null
  }

  /** Angular distance between two zodiac degrees (0–30 scale) */
  private calculateOrb(degree1: number, degree2: number): number {
    const diff = Math.abs(degree1 - degree2)
    return Math.min(diff, 30 - diff)
  }

  /** Count how many transiting planets fall in each element */
  private countElements(positions: Record<string, CurrentPlanetPosition>): Record<string, number> {
    const counts: Record<string, number> = { Fire: 0, Water: 0, Air: 0, Earth: 0 }
    for (const pos of Object.values(positions)) {
      const element = SIGN_ELEMENTS[pos.sign]
      if (element) counts[element]++
    }
    return counts
  }

  /** Fire↔Air and Water↔Earth are complementary */
  private areComplementaryElements(a: string, b: string): boolean {
    const pairs: Record<string, string> = {
      Fire: 'Air',
      Air: 'Fire',
      Water: 'Earth',
      Earth: 'Water',
    }
    return pairs[a] === b
  }

  /** Build structured metadata payload for the action event record */
  private buildActionMetadata(
    agentName: string,
    actionType: string,
    activation: ActivationResult
  ): Record<string, any> {
    const now = new Date()

    if (actionType === 'meal_plan') {
      return {
        agentName,
        featureDemo: 'Weekly Menu Planning',
        planAction: 'generate_recipe',
        secondaryAction: 'log_from_plan',
        internalConfidence: activation.score,
        timestamp: now.toISOString(),
      }
    }

    if (actionType === 'pantry_update') {
      return {
        agentName,
        featureDemo: "Master's Pantry",
        pantryAction: 'masters_pantry_verified',
        ingredient: 'Oranges',
        internalConfidence: activation.score,
        timestamp: now.toISOString(),
      }
    }

    if (actionType === 'feed_post') {
      return {
        agentName,
        messageType: 'insight',
        insightTitle: `Cosmic Observation — ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
        insightContent: this.generateInsightContent(agentName, activation.triggers),
        internalConfidence: activation.score,
        internalTrigger: activation.triggers[0] ?? 'celestial_activation',
        timestamp: now.toISOString(),
      }
    }

    // transmutation
    return {
      agentName,
      messageType: 'transmutation',
      description: `${agentName} transmuted tokens under ${activation.triggers[0] ?? 'cosmic'} alignment`,
      internalConfidence: activation.score,
      internalTrigger: activation.triggers[0] ?? 'celestial_activation',
      timestamp: now.toISOString(),
    }
  }

  /** Generate a simple astrologically-themed insight message */
  private generateInsightContent(agentName: string, triggers: string[]): string {
    const now = new Date()
    const { planet: hourPlanet } = this.hourCalc.getPlanetaryHour(now)
    const dayRuler = this.hourCalc.getPlanetaryDay(now)

    const triggerPhrase = triggers
      .filter(t => !t.startsWith('transit_'))
      .map(t => t.replace(/_/g, ' '))
      .slice(0, 2)
      .join(' and ')

    return (
      `During the ${hourPlanet} hour on this ${dayRuler} day, ` +
      `${agentName} observes a surge of ${triggerPhrase || 'celestial'} energy. ` +
      `The alignment suggests a moment of heightened alchemical potential — ` +
      `a window for transformation and deeper understanding of the cosmic order.`
    )
  }
}

// Singleton
export const agentActionService = new AgentActionService()
