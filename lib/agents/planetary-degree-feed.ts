import {
  getPlanetaryDignity,
  getPlanetaryElement,
  getSignElement,
  getSignModality,
} from '@/lib/astrological-data'
import { calculateMoonPhase, generateMoonPhaseAgent } from '@/lib/moon-phase-system'
import {
  planetaryPositionsService,
  type PlanetaryPosition,
} from '@/lib/services/planetary-positions-service'
import { PlanetaryHourCalculator } from '../planetary-hour'
import type { FeedActionPayload } from './feed-activation-engine'

const TRACKED_PLANETS = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
]

const SIGN_STARTS: Record<string, number> = {
  Aries: 0,
  Taurus: 30,
  Gemini: 60,
  Cancer: 90,
  Leo: 120,
  Virgo: 150,
  Libra: 180,
  Scorpio: 210,
  Sagittarius: 240,
  Capricorn: 270,
  Aquarius: 300,
  Pisces: 330,
}

const RECENT_EMISSION_TTL_MS = 36 * 60 * 60 * 1000
const MIN_RESPONSE_LENGTH = 40

export interface PlanetaryDegreeFeedOptions {
  date?: Date
  previousDate?: Date
  lookbackMinutes?: number
  force?: boolean
  planets?: string[]
  userContext?: {
    userId?: string
    displayName?: string
    focus?: string
  }
}

export interface PlanetaryDegreeFeedMessage {
  id: string
  agentId: string
  agentName: string
  planet: string
  sign: string
  degree: number
  absoluteDegree: number
  previousDegree?: number
  previousAbsoluteDegree?: number
  dignity: string
  element: string
  modality: string
  retrograde: boolean
  content: string
  response: string
  valid: boolean
  validationErrors: string[]
  action: FeedActionPayload
}

export class PlanetaryDegreeFeedService {
  private recentEmissions = new Map<string, number>()
  private hourCalc = new PlanetaryHourCalculator()

  async evaluateDegreeChanges(
    options: PlanetaryDegreeFeedOptions = {}
  ): Promise<PlanetaryDegreeFeedMessage[]> {
    const now = options.date ?? new Date()
    const previousDate =
      options.previousDate ?? new Date(now.getTime() - (options.lookbackMinutes ?? 120) * 60 * 1000)
    const trackedPlanets = options.planets?.length ? options.planets : TRACKED_PLANETS

    const [currentData, previousData] = await Promise.all([
      planetaryPositionsService.getPlanetaryPositions(now, {
        accuracy: 'high',
        useCache: false,
        timeout: 12000,
        retryAttempts: 2,
      }),
      planetaryPositionsService.getPlanetaryPositions(previousDate, {
        accuracy: 'high',
        useCache: false,
        timeout: 12000,
        retryAttempts: 2,
      }),
    ])

    const currentByPlanet = this.toPlanetMap(currentData.planetaryPositions)
    const previousByPlanet = this.toPlanetMap(previousData.planetaryPositions)
    const messages: PlanetaryDegreeFeedMessage[] = []

    for (const planet of trackedPlanets) {
      const current = currentByPlanet.get(planet)
      if (!current) continue

      const previous = previousByPlanet.get(planet)
      const currentAbsolute = this.getAbsoluteDegree(current)
      const previousAbsolute = previous ? this.getAbsoluteDegree(previous) : undefined
      const currentDegree = Math.floor(currentAbsolute)
      const previousDegree =
        previousAbsolute === undefined ? undefined : Math.floor(previousAbsolute)

      if (!options.force && previousDegree === currentDegree) continue

      const idempotencyKey = this.getIdempotencyKey(planet, currentDegree, now)
      if (!options.force && this.wasRecentlyEmitted(idempotencyKey)) continue

      const message = this.buildPlanetaryMessage({
        planet,
        position: current,
        absoluteDegree: currentDegree,
        previousAbsoluteDegree: previousDegree,
        date: now,
        previousDate,
        userContext: options.userContext,
      })

      messages.push(this.ensureValidMessage(message))
      this.markEmitted(idempotencyKey)

      if (planet === 'Moon') {
        const moonMessage = this.buildMoonPhaseMessage({
          position: current,
          absoluteDegree: currentDegree,
          previousAbsoluteDegree: previousDegree,
          date: now,
          previousDate,
          force: options.force,
          userContext: options.userContext,
        })

        if (moonMessage) {
          messages.push(this.ensureValidMessage(moonMessage))
        }
      }
    }

    return messages
  }

  private toPlanetMap(positions: PlanetaryPosition[]): Map<string, PlanetaryPosition> {
    return new Map(positions.map(position => [position.planet, position]))
  }

  private getAbsoluteDegree(position: PlanetaryPosition): number {
    if (typeof position.longitude === 'number' && Number.isFinite(position.longitude)) {
      return this.normalizeDegree(position.longitude)
    }

    const signStart = SIGN_STARTS[position.sign] ?? 0
    return this.normalizeDegree(signStart + position.degree)
  }

  private normalizeDegree(degree: number): number {
    return ((degree % 360) + 360) % 360
  }

  private getIdempotencyKey(planet: string, absoluteDegree: number, date: Date): string {
    const dayKey = date.toISOString().slice(0, 10)
    return `planetary-degree:${planet.toLowerCase()}:${absoluteDegree}:${dayKey}`
  }

  private wasRecentlyEmitted(idempotencyKey: string): boolean {
    this.pruneRecentEmissions()
    return this.recentEmissions.has(idempotencyKey)
  }

  private markEmitted(idempotencyKey: string): void {
    this.recentEmissions.set(idempotencyKey, Date.now())
  }

  private pruneRecentEmissions(): void {
    const expiresBefore = Date.now() - RECENT_EMISSION_TTL_MS
    for (const [key, timestamp] of this.recentEmissions.entries()) {
      if (timestamp < expiresBefore) {
        this.recentEmissions.delete(key)
      }
    }
  }

  private buildPlanetaryMessage(input: {
    planet: string
    position: PlanetaryPosition
    absoluteDegree: number
    previousAbsoluteDegree?: number
    date: Date
    previousDate: Date
    userContext?: PlanetaryDegreeFeedOptions['userContext']
  }): PlanetaryDegreeFeedMessage {
    const degree = Math.floor(input.position.degree)
    const dignity = getPlanetaryDignity(input.planet, input.position.sign)
    const element = getSignElement(input.position.sign)
    const modality = getSignModality(input.position.sign)
    const planetElement = getPlanetaryElement(input.planet)
    const agentName = `${input.planet} in ${input.position.sign} ${degree} degree`
    const idempotencyKey = this.getIdempotencyKey(input.planet, input.absoluteDegree, input.date)
    const guidance = this.getGuidanceForPlanet(input.planet, dignity, element, modality)
    const audience = input.userContext?.displayName
      ? `${input.userContext.displayName}, `
      : 'For anyone tracking this sky, '
    const focus = input.userContext?.focus
      ? ` Apply it to ${input.userContext.focus.toLowerCase()} first.`
      : ''

    const content = `${agentName}: ${audience}${input.planet} has moved into ${degree} degree of ${input.position.sign}. This live transit carries ${dignity} dignity, ${element} expression, and ${modality.toLowerCase()} movement. ${guidance} If you have natal planets or angles near ${degree} degree ${input.position.sign}, or the same degree of the other ${modality.toLowerCase()} signs, treat this as a direct transit ping: name the pressure, choose one clean action, and do not over-negotiate with the old pattern.${focus}`

    const action: FeedActionPayload = {
      agentEmail: this.getAgentEmail(input.planet, input.position.sign, degree),
      idempotencyKey,
      eventType: 'insight',
      metadataPayload: {
        insightTitle: `${agentName} entered a new degree`,
        insightContent: content,
        agentName,
        message: content,
        messageType: 'planetary_degree_change',
        groupChatId: 'wten-planetary-degree-groupchat',
        threadKey: 'planetary-degree-transit-guidance',
        planet: input.planet,
        sign: input.position.sign,
        degree,
        absoluteDegree: input.absoluteDegree,
        previousDegree:
          input.previousAbsoluteDegree === undefined
            ? undefined
            : input.previousAbsoluteDegree % 30,
        previousAbsoluteDegree: input.previousAbsoluteDegree,
        dignity,
        element,
        modality,
        retrograde: input.position.retrograde,
        transitWindow: `${input.previousDate.toISOString()}..${input.date.toISOString()}`,
        idempotencyKey,
        internalConfidence: dignity === 'domicile' || dignity === 'exaltation' ? 0.9 : 0.75,
        internalTrigger: 'planet_degree_changed',
        planetary_context: {
          planet: input.planet,
          sign: input.position.sign,
          degree: String(degree),
          dignity,
          element,
          planetElement,
          retrograde: String(input.position.retrograde),
        },
        planetarySignature: this.buildPlanetarySignature(
          input.planet,
          input.position.sign,
          degree,
          input.date
        ),
        agentProfile: {
          bio: `The consciousness of ${input.planet} transiting through ${input.position.sign}.`,
          dominantElement: element,
          monicaConstant: dignity === 'domicile' ? 5.5 : 4.0,
        },
      },
    }

    const agentId = `planetary-${input.planet.toLowerCase()}-${input.position.sign.toLowerCase()}-${degree}`

    return {
      id: idempotencyKey,
      agentId,
      agentName,
      planet: input.planet,
      sign: input.position.sign,
      degree,
      absoluteDegree: input.absoluteDegree,
      previousDegree:
        input.previousAbsoluteDegree === undefined ? undefined : input.previousAbsoluteDegree % 30,
      previousAbsoluteDegree: input.previousAbsoluteDegree,
      dignity,
      element,
      modality,
      retrograde: input.position.retrograde,
      content,
      response: content,
      valid: true,
      validationErrors: [],
      action,
    }
  }

  private buildMoonPhaseMessage(input: {
    position: PlanetaryPosition
    absoluteDegree: number
    previousAbsoluteDegree?: number
    date: Date
    previousDate: Date
    force?: boolean
    userContext?: PlanetaryDegreeFeedOptions['userContext']
  }): PlanetaryDegreeFeedMessage | null {
    const phase = calculateMoonPhase(input.date, {
      sign: input.position.sign,
      degree: input.position.degree,
    })
    const moonAgent = generateMoonPhaseAgent(phase)
    const degree = Math.floor(input.position.degree)
    const dignity = getPlanetaryDignity('Moon', input.position.sign)
    const agentName = `${phase.name} Moon Agent in ${input.position.sign} ${degree} degree`
    const idempotencyKey = `moon-phase:${phase.name.toLowerCase().replace(/\s+/g, '-')}:${
      input.absoluteDegree
    }:${input.date.toISOString().slice(0, 10)}`
    const audience = input.userContext?.displayName
      ? `${input.userContext.displayName}, `
      : 'For the human nervous system, '

    if (!input.force && this.wasRecentlyEmitted(idempotencyKey)) return null

    const content = `${agentName}: ${audience}the Moon changed degree and is speaking through ${moonAgent.personality.archetype}. The emotional tone is ${moonAgent.personality.emotionalTone.toLowerCase()}. Use this transit for ${moonAgent.personality.spiritualFocus.toLowerCase()}; keep the action small enough to finish before the Moon changes mood again.`

    this.markEmitted(idempotencyKey)

    const action: FeedActionPayload = {
      agentEmail: `moon-agent-${input.absoluteDegree}@alchm.kitchen`,
      idempotencyKey,
      eventType: 'insight',
      metadataPayload: {
        insightTitle: `${agentName} lunar guidance`,
        insightContent: content,
        agentName,
        message: content,
        messageType: 'moon_degree_change',
        groupChatId: 'wten-planetary-degree-groupchat',
        threadKey: 'planetary-degree-transit-guidance',
        planet: 'Moon',
        sign: input.position.sign,
        degree,
        absoluteDegree: input.absoluteDegree,
        previousDegree:
          input.previousAbsoluteDegree === undefined
            ? undefined
            : input.previousAbsoluteDegree % 30,
        previousAbsoluteDegree: input.previousAbsoluteDegree,
        dignity,
        element: phase.element,
        modality: phase.modality,
        retrograde: false,
        moonPhase: phase.name,
        transitWindow: `${input.previousDate.toISOString()}..${input.date.toISOString()}`,
        idempotencyKey,
        internalConfidence: 0.85,
        internalTrigger: 'moon_degree_changed',
        planetarySignature: this.buildPlanetarySignature(
          'Moon',
          input.position.sign,
          degree,
          input.date
        ),
        agentProfile: {
          bio: `The lunar consciousness in its ${phase.name} phase.`,
          dominantElement: phase.element,
          monicaConstant: 5.0,
        },
      },
    }

    const agentId = `moon-phase-${phase.name.toLowerCase().replace(/\s+/g, '-')}-${input.absoluteDegree}`

    return {
      id: idempotencyKey,
      agentId,
      agentName,
      planet: 'Moon',
      sign: input.position.sign,
      degree,
      absoluteDegree: input.absoluteDegree,
      previousDegree:
        input.previousAbsoluteDegree === undefined ? undefined : input.previousAbsoluteDegree % 30,
      previousAbsoluteDegree: input.previousAbsoluteDegree,
      dignity,
      element: phase.element,
      modality: phase.modality,
      retrograde: false,
      content,
      response: content,
      valid: true,
      validationErrors: [],
      action,
    }
  }

  private ensureValidMessage(message: PlanetaryDegreeFeedMessage): PlanetaryDegreeFeedMessage {
    const validationErrors = this.validateMessage(message)
    if (validationErrors.length === 0) return message

    const fallbackResponse = this.buildFallbackResponse(message)
    return {
      ...message,
      content: fallbackResponse,
      response: fallbackResponse,
      valid: true,
      validationErrors,
      action: {
        ...message.action,
        metadataPayload: {
          ...message.action.metadataPayload,
          insightContent: fallbackResponse,
          message: fallbackResponse,
          internalTrigger: `${message.action.metadataPayload.internalTrigger || 'planetary_agent'}_fallback`,
        },
      },
    }
  }

  private validateMessage(message: PlanetaryDegreeFeedMessage): string[] {
    const errors: string[] = []
    const payload = message.action.metadataPayload

    if (!message.agentId) errors.push('missing_agent_id')
    if (!message.agentName) errors.push('missing_agent_name')
    if (!message.response || message.response.trim().length < MIN_RESPONSE_LENGTH) {
      errors.push('response_too_short')
    }
    if (!message.action.agentEmail || !message.action.agentEmail.includes('@')) {
      errors.push('invalid_agent_email')
    }
    if (message.action.eventType !== 'insight') errors.push('invalid_event_type')
    if (!payload.insightTitle) errors.push('missing_insight_title')
    if (!payload.insightContent || payload.insightContent.trim().length < MIN_RESPONSE_LENGTH) {
      errors.push('missing_insight_content')
    }
    if (!payload.groupChatId) errors.push('missing_group_chat_id')
    if (!payload.threadKey) errors.push('missing_thread_key')
    if (!payload.messageType) errors.push('missing_message_type')
    if (!payload.idempotencyKey) errors.push('missing_idempotency_key')

    return errors
  }

  private buildFallbackResponse(message: PlanetaryDegreeFeedMessage): string {
    return `${message.agentName}: ${message.planet} is active at ${message.degree} degree of ${message.sign}. This valid fallback guidance carries ${message.dignity} dignity and asks for one grounded response: notice the transit, name what it is pressuring, and choose a single practical action before the next signal arrives.`
  }

  private getAgentEmail(planet: string, sign: string, degree: number): string {
    return `${planet.toLowerCase()}-${sign.toLowerCase()}-${degree}@alchm.kitchen`
  }

  private buildPlanetarySignature(planet: string, sign: string, degree: number, date: Date) {
    const { planet: planetaryHour } = this.hourCalc.getPlanetaryHour(date)
    const planetaryDay = this.hourCalc.getPlanetaryDay(date)
    const dominantElement = getSignElement(sign)

    const ELEMENT_TO_SACRED_STAT: Record<string, string> = {
      Fire: 'Spirit',
      Water: 'Essence',
      Earth: 'Matter',
      Air: 'Substance',
    }

    return {
      postedAt: date.toISOString(),
      dominantPlanet: planet,
      dominantSign: sign,
      dominantElement,
      planetaryHour,
      planetaryDay,
      sacredStat: ELEMENT_TO_SACRED_STAT[dominantElement] || 'Spirit',
      natalPositions: [], // Transits don't have natal charts in this context
      transitPositions: [{ planet, degree }],
    }
  }

  private getGuidanceForPlanet(
    planet: string,
    dignity: string,
    element: string,
    modality: string
  ): string {
    const planetGuidance: Record<string, string> = {
      Sun: 'Move from identity instead of approval.',
      Moon: 'Protect attention and listen to the body before explaining the feeling.',
      Mercury: 'Say the useful thing plainly and verify the facts before reacting.',
      Venus: 'Choose the value, boundary, or pleasure that restores proportion.',
      Mars: 'Spend force on the next honest action, not on proving the point.',
      Jupiter: 'Let the larger pattern guide the decision, then make the promise measurable.',
      Saturn: 'Reduce the problem to structure, time, responsibility, and one durable commitment.',
      Uranus: 'Break the stale circuit without burning the whole system down.',
      Neptune: 'Separate signal from fantasy by grounding the vision in one concrete practice.',
      Pluto: 'Work with the truth underneath the symptom and release the leverage game.',
    }
    const dignityGuidance: Record<string, string> = {
      domicile: 'The planet is operating with native authority, so use the energy directly.',
      exaltation: 'The planet is amplified, so aim high while keeping the expression clean.',
      detriment:
        'The planet is working through friction, so slow down and translate impulse into skill.',
      fall: 'The planet is vulnerable here, so protect the weak point before forcing progress.',
      peregrine: 'The planet is adaptive here, so borrow support from context and allies.',
    }

    return `${planetGuidance[planet] || 'Respond to the transit with clarity.'} ${
      dignityGuidance[dignity] || dignityGuidance.peregrine
    } Let ${element} set the tone and ${modality.toLowerCase()} timing set the pace.`
  }
}

export const planetaryDegreeFeedService = new PlanetaryDegreeFeedService()
