/**
 * Railway Backend Client — single source of truth for all alchm.kitchen API calls.
 *
 * Generated from the FastAPI OpenAPI schema at
 *   https://whattoeatnext-production.up.railway.app/openapi.json
 *
 * Usage:
 *   import { backend } from '@/lib/backend'
 *   const positions = await backend.planetary.positions(new Date())
 *
 * In Server Components, you can call this directly:
 *   export default async function Page() {
 *     const positions = await backend.planetary.positions()
 *     return <PlanetaryView data={positions} />
 *   }
 *
 * In Client Components, wrap in a Server Action.
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  'https://whattoeatnext-production.up.railway.app'

const INTERNAL_API_SECRET =
  process.env.INTERNAL_API_SECRET || '882133EA-3D06-4DF2-A63C-F4114AB4EFBC'

// ============================================================================
// Types — mirrors of FastAPI schemas
// ============================================================================

/**
 * Flattened planetary position shape used by legacy UI components.
 * Adapter `getLegacyPlanetaryPositions()` below converts the raw Railway
 * response (`PlanetaryPositionsResponse.planetary_positions`) into this array.
 */
export interface LegacyPlanetaryPosition {
  name: string
  sign: string
  degree: number
  minute: number
  longitude: number
  isRetrograde: boolean
  retrogradeSymbol: string
  longitudeSpeed: number
  arcminutesPerDay: number
  speedDisplay: string
}

export interface PlanetaryPositionsRequest {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  latitude: number
  longitude: number
  zodiacSystem?: 'tropical' | 'sidereal'
}

export interface PlanetaryBody {
  sign: string
  degree: number
  minute: number
  exactLongitude: number
  isRetrograde: boolean
  retrogradeSymbol?: string
  longitudeSpeed: number
  arcminutesPerDay: number
  speedDisplay: string
}

export interface PlanetaryPositionsResponse {
  birth_info: {
    year: number
    month: number
    date: number
    hour: number
    minute: number
  }
  planetary_positions: Record<string, PlanetaryBody>
}

export interface AlchemizeRequest extends PlanetaryPositionsRequest {
  date?: number // FastAPI uses 'date' not 'day' for alchemize
  planetaryPositions?: Record<string, unknown>
}

export interface AlchemizeResponse {
  elementalProperties: Record<string, number>
  thermodynamicProperties: Record<string, number>
  esms: Record<string, number>
  kalchm: number
  monica: number
  score: number
  normalized: boolean
  confidence: number
  totalEffectValue?: number
  dominantElement?: string
  dominantModality?: string
  aspects?: Array<{
    planet1: string
    planet2: string
    aspect: string
    angle: number
    orb: number
    exactness: number
  }>
  metadata: Record<string, unknown>
}

export interface AlchemicalQuantitiesRequest {
  recipe: Record<string, unknown>
  kinetic_rating: number
  planetary_hour_ruler: string
  thermo_rating: number
  city_name?: string
}

export interface AlchemicalQuantitiesResponse {
  spirit_score?: number
  essence_score?: number
  matter_score?: number
  substance_score?: number
  kinetic_val?: number
  thermo_val?: number
  [key: string]: unknown
}

export interface OnboardingRequest {
  birth_date: string
  birth_time: string
  latitude: number
  longitude: number
  city_name?: string
  state_country?: string
}

export interface RitualRequest {
  recipe_id: string
  secondary_chart_ids?: string[]
  collective_smes_scores?: Record<string, number>
}

export interface AstroBlueprintRequest extends PlanetaryPositionsRequest {}

export interface AstroBlueprintResponse {
  sun_sign: string
  moon_sign: string
  ascendant: string
  target_elemental_balance: Record<string, number>
  cosmic_instructions: string[]
}

export interface RecipeGeneratorRequest {
  birthDate: string
  birthTime: string
}

export interface RecipeRecommendationRequest extends PlanetaryPositionsRequest {
  include_lunar_data?: boolean
  secondary_chart_ids?: string[]
}

export interface GroupMemberChart {
  user_id?: string
  name?: string
  year: number
  month: number
  day: number
  hour: number
  minute: number
  latitude: number
  longitude: number
  timezone_str?: string
}

export interface GroupRecommendationRequest {
  members: GroupMemberChart[]
  strategy?: 'consensus' | 'majority' | 'rotation'
  cuisine_filter?: string
  max_results?: number
}

// ============================================================================
// Helpers
// ============================================================================

function dateToParts(d: Date) {
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  }
}

function buildPositionsPayload(
  date: Date,
  latitude = 40.7128,
  longitude = -74.006,
  zodiacSystem: 'tropical' | 'sidereal' = 'tropical'
): PlanetaryPositionsRequest {
  return {
    ...dateToParts(date),
    latitude,
    longitude,
    zodiacSystem,
  }
}

class BackendError extends Error {
  constructor(
    public status: number,
    public path: string,
    message: string
  ) {
    super(`[Backend] ${path} → HTTP ${status}: ${message}`)
    this.name = 'BackendError'
  }
}

async function request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const {
    auth,
    headers,
    signal: callerSignal,
    ...rest
  } = init as RequestInit & {
    auth?: boolean
    signal?: AbortSignal
  }
  const url = `${BACKEND_URL}${path}`

  if (auth !== false && !INTERNAL_API_SECRET) {
    throw new BackendError(500, path, 'INTERNAL_API_SECRET is not configured')
  }

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(INTERNAL_API_SECRET ? { INTERNAL_API_SECRET } : {}),
    ...((headers as Record<string, string>) || {}),
  }

  if (auth === false) delete finalHeaders.INTERNAL_API_SECRET

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)
  if (callerSignal) callerSignal.addEventListener('abort', () => controller.abort())

  let res: Response
  try {
    res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    let msg = res.statusText
    try {
      const body = await res.text()
      msg = body || msg
    } catch {}
    throw new BackendError(res.status, path, msg)
  }

  return (await res.json()) as T
}

// ============================================================================
// Typed API surface — organized by domain
// ============================================================================

export const backend = {
  /** Health check — public endpoint */
  health: () =>
    request<{ status: string; database: string; service: string }>('/health', {
      method: 'GET',
      auth: false,
    }),

  planetary: {
    /** Calculate planetary positions via Swiss Ephemeris */
    positions: (date: Date = new Date(), latitude?: number, longitude?: number) =>
      request<PlanetaryPositionsResponse>('/api/planetary/positions', {
        method: 'POST',
        body: JSON.stringify(buildPositionsPayload(date, latitude, longitude)),
      }),

    /** Current planetary positions (no params, fast) */
    current: () => request<PlanetaryPositionsResponse>('/planetary/current', { method: 'GET' }),

    /**
     * Bulk planetary positions over a date range.
     * Native implementation calling the Railway backend's bulk endpoint.
     */
    bulk: (
      startDate: Date,
      endDate: Date,
      intervalHours: number,
      latitude?: number,
      longitude?: number
    ) =>
      request<{
        samples: Array<{ timestamp: string; positions: PlanetaryPositionsResponse }>
        count: number
        degraded: boolean
      }>('/api/planetary/positions/bulk', {
        method: 'POST',
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          intervalHours,
          latitude: latitude || 0,
          longitude: longitude || 0,
        }),
      }),
  },

  alchemy: {
    /** Alchemize current moment (returns full alchemical state) */
    alchemize: (date: Date = new Date(), latitude?: number, longitude?: number) => {
      const p = buildPositionsPayload(date, latitude, longitude)
      // /alchemize uses 'date' rather than 'day'
      return request<AlchemizeResponse>('/alchemize', {
        method: 'POST',
        body: JSON.stringify({ ...p, date: p.day }),
      })
    },

    /** Calculate alchemical quantities (Spirit/Essence/Matter/Substance) */
    quantities: (req: AlchemicalQuantitiesRequest) =>
      request<AlchemicalQuantitiesResponse>('/api/alchemical/quantities', {
        method: 'POST',
        body: JSON.stringify(req),
      }),

    /** Default quantities call with sensible defaults */
    defaultQuantities: (date: Date = new Date(), latitude?: number, longitude?: number) =>
      request<AlchemicalQuantitiesResponse>('/api/alchemical/quantities', {
        method: 'POST',
        body: JSON.stringify({
          ...buildPositionsPayload(date, latitude, longitude),
          recipe: {},
          kinetic_rating: 0,
          planetary_hour_ruler: 'Sun',
          thermo_rating: 0,
        }),
        auth: false,
      }),
  },

  rituals: {
    /** Generate cooking ritual based on transit */
    generateCookingInstruction: (req: RitualRequest) =>
      request<unknown>('/api/rituals/generate-cooking-instruction', {
        method: 'POST',
        body: JSON.stringify(req),
      }),
  },

  astro: {
    /** Lightweight context blueprint (Sun/Moon/Asc + element ratios) */
    contextBlueprint: (req: AstroBlueprintRequest) =>
      request<AstroBlueprintResponse>('/api/astrological/context-blueprint', {
        method: 'POST',
        body: JSON.stringify(req),
      }),

    /** Recipe recommendations by full astrological chart */
    recipesByChart: (req: RecipeRecommendationRequest) =>
      request<unknown>('/api/astrological/recipe-recommendations-by-chart', {
        method: 'POST',
        body: JSON.stringify(req),
      }),

    /** Personalized cooking plan combining zodiac + season */
    personalizedCooking: (zodiacSign?: string, season?: string, limit = 3) => {
      const params = new URLSearchParams()
      if (zodiacSign) params.set('zodiac_sign', zodiacSign)
      if (season) params.set('season', season)
      params.set('limit', String(limit))
      return request<unknown>(`/astrological/personalized-cooking?${params}`, {
        method: 'GET',
      })
    },
  },

  recipes: {
    /** Generate personalized recipe from birth chart */
    generate: (req: RecipeGeneratorRequest) =>
      request<unknown>('/api/recipe-generator', {
        method: 'POST',
        body: JSON.stringify(req),
      }),

    /** Generic recipe recommendations */
    recommend: (req: {
      current_time: string
      location?: { lat: number; lon: number }
      cuisine_preferences?: string[]
      dietary_restrictions?: string[]
      limit?: number
    }) =>
      request<unknown>('/recommend/recipes', {
        method: 'POST',
        body: JSON.stringify(req),
      }),

    /** Cuisine recommendations for current moment */
    cuisinesForNow: (
      params: { zodiacSign?: string; season?: string; mealType?: string; limit?: number } = {}
    ) => {
      const q = new URLSearchParams()
      if (params.zodiacSign) q.set('zodiac_sign', params.zodiacSign)
      if (params.season) q.set('season', params.season)
      if (params.mealType) q.set('meal_type', params.mealType)
      q.set('limit', String(params.limit ?? 3))
      return request<unknown>(`/cuisines/recommend?${q}`, { method: 'GET' })
    },
  },

  catalog: {
    cuisines: () => request<unknown[]>('/api/v1/cuisines', { method: 'GET' }),
    cuisine: (id: string) =>
      request<unknown>(`/api/v1/cuisines/${encodeURIComponent(id)}`, { method: 'GET' }),
    sauces: () => request<unknown[]>('/api/v1/sauces', { method: 'GET' }),
    ingredients: () => request<unknown[]>('/api/v1/ingredients', { method: 'GET' }),
  },

  user: {
    /** Onboarding (auth required) */
    onboarding: (req: OnboardingRequest, bearerToken: string) =>
      request<unknown>('/api/user/onboarding', {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearerToken}` },
        body: JSON.stringify(req),
      }),

    /** Get current user info (auth required) */
    me: (bearerToken: string) =>
      request<unknown>('/api/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${bearerToken}` },
      }),
  },

  groups: {
    recommendations: (req: GroupRecommendationRequest, bearerToken: string) =>
      request<unknown>('/api/group/recommendations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearerToken}` },
        body: JSON.stringify(req),
      }),

    compatibility: (members: GroupMemberChart[], bearerToken: string) =>
      request<unknown>('/api/group/compatibility', {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearerToken}` },
        body: JSON.stringify({ members }),
      }),
  },

  images: {
    generateAlchemical: (req: {
      recipe_id?: string
      title?: string
      description?: string
      elemental_properties?: Record<string, number>
    }) =>
      request<{ url: string; prompt: string }>('/api/generate-alchemical-image', {
        method: 'POST',
        body: JSON.stringify(req),
      }),
  },

  agents: {
    /** Get all agents with optional filtering */
    list: (params: { skip?: number; limit?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.skip !== undefined) q.set('skip', String(params.skip))
      if (params.limit !== undefined) q.set('limit', String(params.limit))
      return request<any[]>('/api/agents?' + q.toString(), { method: 'GET' })
    },

    /** Get a specific agent by ID */
    get: (agentId: string) => request<any>(`/api/agents/${agentId}`, { method: 'GET' }),

    /** Create a new agent */
    create: (agent: any) =>
      request<any>('/api/agents', {
        method: 'POST',
        body: JSON.stringify(agent),
      }),

    /** Chat with an agent */
    chat: (req: {
      agentId: string
      message: string
      sessionId?: string
      userId?: string
      context?: any
      /**
       * Verbatim system prompt to use in place of the backend's template.
       * When present, the FastAPI backend skips its `get_agent_system_prompt`
       * template and uses this string directly. RAG augmentation still runs
       * on top.
       */
      systemPromptOverride?: string
      /**
       * Stable hash of the persona content. Used by the backend as a
       * prompt-cache breakpoint key so identical personas across turns
       * share an Anthropic prompt-cache slot.
       */
      personaCacheKey?: string
      /** Preferred model tier. Server default is `free` (Groq → Cerebras → Gemini → OpenRouter → OpenAI last-ditch). */
      modelTier?: 'free' | 'cheap_fast' | 'primary' | 'reflective'
    }) =>
      request<{ text: string; agentId: string; sessionId: string; metadata: any }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify(req),
        auth: false,
      }),
  },
  moment: {
    recommendations: (limit: number = 5) =>
      request<{ recommendations: any[]; summary: string }>(
        `/api/moment-recommendations?limit=${limit}`,
        { method: 'GET' }
      ),
    detailed: (agentIds: string[], alchmData: any, currentPlanets: any) =>
      request<{ scores: any[] }>('/api/moment-recommendations', {
        method: 'POST',
        body: JSON.stringify({ agentIds, alchmData, currentPlanets }),
      }),
  },
}

// ============================================================================
// Legacy adapters — preserve the existing planetaryAPI shape for migration
// ============================================================================

/**
 * Returns alchemical quantities mapped to the legacy shape consumers expected
 * from generateAlchmForCurrentMoment(). Older fields (Energy, Heat, Entropy,
 * A-Number) are derived locally so legacy UI keeps working.
 */
export async function getAlchemicalQuantitiesLegacy(
  date: Date = new Date(),
  latitude?: number,
  longitude?: number
) {
  const raw = await backend.alchemy.defaultQuantities(date, latitude, longitude)
  const spirit = Number(raw?.spirit_score ?? 0)
  const essence = Number(raw?.essence_score ?? 0)
  const matter = Number(raw?.matter_score ?? 0)
  const substance = Number(raw?.substance_score ?? 0)
  const kineticVal = Number(raw?.kinetic_val ?? 0)
  const thermoVal = Number(raw?.thermo_val ?? 0)
  const aNumber = matter + substance > 0 ? (spirit + essence) / (matter + substance) : 2
  return {
    'Alchemy Effects': {
      'Total Spirit': spirit,
      'Total Essence': essence,
      'Total Matter': matter,
      'Total Substance': substance,
    },
    'A-Number': aNumber,
    A_number: aNumber,
    Energy: thermoVal * 1000,
    Heat: thermoVal,
    Entropy: kineticVal,
    Reactivity: kineticVal,
    spirit_score: spirit,
    essence_score: essence,
    matter_score: matter,
    substance_score: substance,
    kinetic_val: kineticVal,
    thermo_val: thermoVal,
  }
}

/**
 * Returns positions in the legacy array shape consumers expected from
 * `getCurrentPlanetaryPositions()`. Adapter over `backend.planetary.positions()`.
 * Use this for any UI migrating from the old `planetaryAPI` client.
 */
export async function getLegacyPlanetaryPositions(
  date: Date = new Date(),
  latitude?: number,
  longitude?: number
): Promise<LegacyPlanetaryPosition[]> {
  const raw = await backend.planetary.positions(date, latitude, longitude)
  const positions = (raw as any)?.planetary_positions || {}
  return Object.entries(positions).map(([name, body]: [string, any]) => ({
    name,
    sign: body?.sign ?? '',
    degree: typeof body?.degree === 'number' ? body.degree : 0,
    minute: typeof body?.minute === 'number' ? body.minute : 0,
    longitude: typeof body?.exactLongitude === 'number' ? body.exactLongitude : 0,
    isRetrograde: Boolean(body?.isRetrograde),
    retrogradeSymbol: body?.retrogradeSymbol ?? '',
    longitudeSpeed: typeof body?.longitudeSpeed === 'number' ? body.longitudeSpeed : 0,
    arcminutesPerDay: typeof body?.arcminutesPerDay === 'number' ? body.arcminutesPerDay : 0,
    speedDisplay: body?.speedDisplay ?? '',
  }))
}

export { BackendError }
