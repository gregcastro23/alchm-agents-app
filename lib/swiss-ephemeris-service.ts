/**
 * Swiss Ephemeris Service
 * =======================
 *
 * High-accuracy planetary position calculations using Swiss Ephemeris
 * Provides ±0.001° accuracy for all planetary positions
 *
 * Uses swisseph-v2 - modern native module with node-gyp v10
 * Works on Vercel with Python 3.12+ and all modern Node.js environments
 *
 * SERVER-ONLY - For API routes and server components
 */

import swisseph from 'swisseph-v2'

export interface SwissEphemPlanetPosition {
  planet: string
  sign: string
  degree: number // 0-29.9999 within sign
  longitude: number // 0-360 absolute longitude
  latitude: number
  distance: number
  speed: number
  retrograde: boolean
}

// Swiss Ephemeris planet IDs
const PLANET_IDS = {
  Sun: swisseph.SE_SUN,
  Moon: swisseph.SE_MOON,
  Mercury: swisseph.SE_MERCURY,
  Venus: swisseph.SE_VENUS,
  Mars: swisseph.SE_MARS,
  Jupiter: swisseph.SE_JUPITER,
  Saturn: swisseph.SE_SATURN,
  Uranus: swisseph.SE_URANUS,
  Neptune: swisseph.SE_NEPTUNE,
  Pluto: swisseph.SE_PLUTO,
  'North Node': swisseph.SE_TRUE_NODE,
  Chiron: swisseph.SE_CHIRON,
} as const

const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
]

/**
 * Convert JavaScript Date to Julian Day Number
 */
function dateToJulianDay(date: Date): number {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hour = date.getUTCHours()
  const minute = date.getUTCMinutes()
  const second = date.getUTCSeconds()

  const decimalHour = hour + minute / 60 + second / 3600

  const result = swisseph.swe_julday(
    year,
    month,
    day,
    decimalHour,
    swisseph.SE_GREG_CAL
  )

  return result
}

/**
 * Convert longitude to sign and degree
 */
function longitudeToSignDegree(longitude: number): { sign: string; degree: number } {
  // Normalize longitude to 0-360
  let normalizedLongitude = ((longitude % 360) + 360) % 360

  // Calculate sign index (0-11)
  const signIndex = Math.floor(normalizedLongitude / 30)

  // Calculate degree within sign (0-29.9999)
  const degree = normalizedLongitude % 30

  return {
    sign: ZODIAC_SIGNS[signIndex],
    degree: Math.max(0, Math.min(29.9999, degree)),
  }
}

/**
 * Calculate planet position using Swiss Ephemeris
 */
function calculatePlanetPosition(
  planetId: number,
  julianDay: number,
  planetName: string
): SwissEphemPlanetPosition {
  // Calculate position with speed using MOSHIER ephemeris (built-in, no files needed)
  const flags = swisseph.SEFLG_MOSEPH | swisseph.SEFLG_SPEED

  const result = swisseph.swe_calc_ut(julianDay, planetId, flags)

  // Check if calculation succeeded (result should have data even if flag doesn't match exactly)
  if (!result || result.error || result.longitude === undefined) {
    console.error('Swiss Ephemeris error:', result)
    throw new Error(`Swiss Ephemeris calculation failed for ${planetName}: ${result?.error || 'Unknown error'}`)
  }

  const longitude = result.longitude
  const latitude = result.latitude || 0
  const distance = result.distance || 0
  const speed = result.longitudeSpeed || 0

  const { sign, degree } = longitudeToSignDegree(longitude)

  // Planet is retrograde if speed is negative
  const retrograde = speed < 0

  return {
    planet: planetName,
    sign,
    degree,
    longitude,
    latitude,
    distance,
    speed,
    retrograde,
  }
}

/**
 * Calculate Ascendant (Rising Sign)
 */
function calculateAscendant(
  julianDay: number,
  latitude: number,
  longitude: number
): SwissEphemPlanetPosition {
  const flags = swisseph.SEFLG_SWIEPH

  const result = swisseph.swe_houses(
    julianDay,
    latitude,
    longitude,
    'P' // Placidus house system
  )

  const ascendantLongitude = result.ascendant
  const { sign, degree } = longitudeToSignDegree(ascendantLongitude)

  return {
    planet: 'Ascendant',
    sign,
    degree,
    longitude: ascendantLongitude,
    latitude: 0,
    distance: 0,
    speed: 0,
    retrograde: false,
  }
}

/**
 * Calculate Midheaven (MC)
 */
function calculateMidheaven(
  julianDay: number,
  latitude: number,
  longitude: number
): SwissEphemPlanetPosition {
  const flags = swisseph.SEFLG_SWIEPH

  const result = swisseph.swe_houses(
    julianDay,
    latitude,
    longitude,
    'P' // Placidus house system
  )

  const mcLongitude = result.mc
  const { sign, degree } = longitudeToSignDegree(mcLongitude)

  return {
    planet: 'MC',
    sign,
    degree,
    longitude: mcLongitude,
    latitude: 0,
    distance: 0,
    speed: 0,
    retrograde: false,
  }
}

/**
 * Get all planetary positions for a given date
 */
export function getAllPlanetaryPositions(
  date: Date,
  latitude: number = 0,
  longitude: number = 0
): Record<string, SwissEphemPlanetPosition> {
  const julianDay = dateToJulianDay(date)

  const positions: Record<string, SwissEphemPlanetPosition> = {}

  // Calculate all planet positions
  for (const [planetName, planetId] of Object.entries(PLANET_IDS)) {
    try {
      positions[planetName] = calculatePlanetPosition(planetId, julianDay, planetName)
    } catch (error) {
      // Silently skip planets that require additional ephemeris files (Chiron, asteroids)
      // Log only for main planets
      if (!planetName.includes('Chiron') && !planetName.includes('Node')) {
        console.error(`Failed to calculate position for ${planetName}:`, error)
      }
      // Continue with other planets even if one fails
    }
  }

  // Calculate Ascendant and MC (requires latitude/longitude)
  if (latitude !== 0 || longitude !== 0) {
    try {
      positions['Ascendant'] = calculateAscendant(julianDay, latitude, longitude)
      positions['MC'] = calculateMidheaven(julianDay, latitude, longitude)
    } catch (error) {
      console.error('Failed to calculate Ascendant/MC:', error)
    }
  }

  return positions
}

/**
 * Get planetary position for a specific planet
 */
export function getPlanetPosition(
  planetName: string,
  date: Date
): SwissEphemPlanetPosition | null {
  const planetId = PLANET_IDS[planetName as keyof typeof PLANET_IDS]

  if (planetId === undefined) {
    console.error(`Unknown planet: ${planetName}`)
    return null
  }

  const julianDay = dateToJulianDay(date)

  try {
    return calculatePlanetPosition(planetId, julianDay, planetName)
  } catch (error) {
    console.error(`Failed to calculate position for ${planetName}:`, error)
    return null
  }
}

/**
 * Close Swiss Ephemeris (cleanup)
 */
export function closeSwissEphemeris(): void {
  swisseph.swe_close()
}

// Export singleton instance
export const swissEphemerisService = {
  getAllPlanetaryPositions,
  getPlanetPosition,
  close: closeSwissEphemeris,
}
