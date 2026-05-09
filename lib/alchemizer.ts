import {
  backend,
  getAlchemicalQuantitiesLegacy,
  type PlanetaryPositionsResponse,
} from '@/lib/backend'

type SupportedBirthInput =
  | {
      year?: number
      month?: number
      day?: number
      hour?: number
      minute?: number
      latitude?: number
      longitude?: number
      birthDate?: string
      birthTime?: string
      date?: string
      time?: string
      location?: string
      birthLocation?: string
      name?: string
    }
  | Date

interface LegacyAlchemicalResult {
  'Alchemy Effects': {
    'Total Spirit': number
    'Total Essence': number
    'Total Matter': number
    'Total Substance': number
    'A#': number
  }
  'A-Number': number
  A_number: number
  ANumber: number
  Spirit: number
  Essence: number
  Matter: number
  Substance: number
  DayEssence: number
  NightEssence: number
  Fire: number
  Water: number
  Earth: number
  Air: number
  Heat: number
  Entropy: number
  Reactivity: number
  Energy: number
  Dominant_Element: 'Fire' | 'Water' | 'Earth' | 'Air'
  'Total Effect Value': {
    Fire: number
    Water: number
    Earth: number
    Air: number
  }
  spirit_score: number
  essence_score: number
  matter_score: number
  substance_score: number
  kinetic_val: number
  thermo_val: number
}

function parseDateAndTime(dateString?: string, timeString?: string): Date {
  if (!dateString) return new Date()

  const safeTime = timeString && /^\d{1,2}:\d{2}/.test(timeString) ? timeString : '12:00'
  const normalized = `${dateString}T${safeTime.length === 5 ? `${safeTime}:00` : safeTime}`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? new Date(dateString) : parsed
}

function toDate(input: SupportedBirthInput): Date {
  if (input instanceof Date) return input

  if (input.date) {
    return parseDateAndTime(input.date, input.time)
  }

  if (input.birthDate) {
    return parseDateAndTime(input.birthDate, input.birthTime)
  }

  if (
    typeof input.year === 'number' &&
    typeof input.month === 'number' &&
    typeof input.day === 'number'
  ) {
    return new Date(
      Date.UTC(
        input.year,
        input.month - 1,
        input.day,
        input.hour ?? 12,
        input.minute ?? 0,
        0
      )
    )
  }

  return new Date()
}

function extractCoordinates(input: SupportedBirthInput): {
  latitude: number | undefined
  longitude: number | undefined
} {
  if (input instanceof Date) {
    return { latitude: undefined, longitude: undefined }
  }

  return {
    latitude: typeof input.latitude === 'number' ? input.latitude : undefined,
    longitude: typeof input.longitude === 'number' ? input.longitude : undefined,
  }
}

function signToElement(sign: string): 'Fire' | 'Water' | 'Earth' | 'Air' {
  const mapping: Record<string, 'Fire' | 'Water' | 'Earth' | 'Air'> = {
    Aries: 'Fire',
    Leo: 'Fire',
    Sagittarius: 'Fire',
    Taurus: 'Earth',
    Virgo: 'Earth',
    Capricorn: 'Earth',
    Gemini: 'Air',
    Libra: 'Air',
    Aquarius: 'Air',
    Cancer: 'Water',
    Scorpio: 'Water',
    Pisces: 'Water',
  }

  return mapping[sign] || 'Earth'
}

function deriveElementalBalance(positions: PlanetaryPositionsResponse | null) {
  const totals = {
    Fire: 0,
    Water: 0,
    Earth: 0,
    Air: 0,
  }

  for (const position of Object.values(positions?.planetary_positions || {})) {
    totals[signToElement(position.sign)] += 1
  }

  const totalPlanets = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1
  const dominantElement = (Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    'Earth') as 'Fire' | 'Water' | 'Earth' | 'Air'

  return {
    totals,
    normalized: {
      Fire: totals.Fire / totalPlanets,
      Water: totals.Water / totalPlanets,
      Earth: totals.Earth / totalPlanets,
      Air: totals.Air / totalPlanets,
    },
    dominantElement,
  }
}

async function createLegacyResult(
  input: SupportedBirthInput,
  _horoscopeData?: unknown
): Promise<LegacyAlchemicalResult> {
  const date = toDate(input)
  const { latitude, longitude } = extractCoordinates(input)

  const [legacy, positions] = await Promise.all([
    getAlchemicalQuantitiesLegacy(date, latitude, longitude),
    backend.planetary.positions(date, latitude, longitude),
  ])

  const spirit = Number(legacy?.['Alchemy Effects']?.['Total Spirit'] ?? legacy?.spirit_score ?? 0)
  const essence = Number(
    legacy?.['Alchemy Effects']?.['Total Essence'] ?? legacy?.essence_score ?? 0
  )
  const matter = Number(legacy?.['Alchemy Effects']?.['Total Matter'] ?? legacy?.matter_score ?? 0)
  const substance = Number(
    legacy?.['Alchemy Effects']?.['Total Substance'] ?? legacy?.substance_score ?? 0
  )
  const aNumber =
    Number(legacy?.['A-Number'] ?? legacy?.A_number ?? legacy?.['Alchemy Effects']?.['A#']) ||
    spirit + essence + matter + substance

  const elemental = deriveElementalBalance(positions)

  return {
    'Alchemy Effects': {
      'Total Spirit': spirit,
      'Total Essence': essence,
      'Total Matter': matter,
      'Total Substance': substance,
      'A#': aNumber,
    },
    'A-Number': aNumber,
    A_number: aNumber,
    ANumber: aNumber,
    Spirit: spirit,
    Essence: essence,
    Matter: matter,
    Substance: substance,
    DayEssence: essence,
    NightEssence: substance,
    Fire: elemental.normalized.Fire,
    Water: elemental.normalized.Water,
    Earth: elemental.normalized.Earth,
    Air: elemental.normalized.Air,
    Heat: Number(legacy?.Heat ?? legacy?.thermo_val ?? 0),
    Entropy: Number(legacy?.Entropy ?? legacy?.kinetic_val ?? 0),
    Reactivity: Number(legacy?.Reactivity ?? legacy?.kinetic_val ?? 0),
    Energy: Number(legacy?.Energy ?? Number(legacy?.thermo_val ?? 0) * 1000),
    Dominant_Element: elemental.dominantElement,
    'Total Effect Value': elemental.totals,
    spirit_score: spirit,
    essence_score: essence,
    matter_score: matter,
    substance_score: substance,
    kinetic_val: Number(legacy?.kinetic_val ?? 0),
    thermo_val: Number(legacy?.thermo_val ?? 0),
  }
}

export async function generateAlchmForCurrentMoment(
  date: Date = new Date(),
  latitude?: number,
  longitude?: number
): Promise<LegacyAlchemicalResult> {
  return createLegacyResult({ date: date.toISOString(), latitude, longitude })
}

export async function generateAlchmForBirthInfo(
  birthInfo: SupportedBirthInput
): Promise<LegacyAlchemicalResult> {
  return createLegacyResult(birthInfo)
}

export async function alchemize(
  input: SupportedBirthInput,
  horoscopeData?: unknown
): Promise<LegacyAlchemicalResult> {
  return createLegacyResult(input, horoscopeData)
}
