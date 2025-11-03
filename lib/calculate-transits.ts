import { planetInfo } from './planets'
import { signIndices } from './alchemizer'
import {
  sunData,
  moonData,
  mercuryData,
  venusData,
  marsData,
  jupiterData,
  saturnData,
  uranusData,
  neptuneData,
  plutoData,
} from './planets'
import type { PlanetData, TransitData } from './planets/types'
import {
  calculateAllPlanets,
  calculateProfessionalHouses,
  type EnhancedBirthInfo,
  toJulianDay,
  longitudeToSignDegree,
} from './enhanced-astronomical-calculator'

// Define orbital periods for planets in days
const orbitalPeriods = {
  Sun: 365.25, // Earth's orbit around the Sun
  Moon: 29.53, // Lunar month
  Mercury: 87.97,
  Venus: 224.7,
  Mars: 687,
  Jupiter: 4332.59,
  Saturn: 10759.22,
  Uranus: 30688.5,
  Neptune: 60182,
  Pluto: 90560,
}

// Removed static positions in favor of algorithmic/transit-derived calculations

// Define approximate degrees per day for each planet
const degreesPerDay = Object.entries(orbitalPeriods).reduce(
  (acc, [planet, period]) => ({
    ...acc,
    [planet]: 360 / period,
  }),
  {} as Record<string, number>
)

import { performanceCache } from './performance-cache'

// Compute mean North Node longitude (ascending) and convert to sign/degree
function getMeanNorthNode(date: Date): { sign: string; degree: number; retrograde: boolean } {
  const jd = toJulianDay(date)
  const T = (jd - 2451545.0) / 36525
  // Meeus formula for mean longitude of ascending node of the Moon (degrees)
  let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000
  // Normalize to 0-360
  omega = ((omega % 360) + 360) % 360
  // Convert to sign and degree
  const { sign, degree } = longitudeToSignDegree(omega)
  return { sign, degree: Math.max(0, Math.min(29.9999, degree)), retrograde: true }
}

// Utility function to safely convert and validate degrees with comprehensive NaN protection
function safeDegreeValue(degree: any): number {
  // Handle different input types and ensure numeric output
  if (typeof degree === 'number') {
    // Already a number, check if valid
    if (Number.isFinite(degree)) {
      return Math.max(0, Math.min(29.9999, degree))
    }
  }

  if (typeof degree === 'string') {
    // Try to parse string
    const parsed = parseFloat(degree)
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(29.9999, parsed))
    }
  }

  // Fallback to 0 for any invalid input
  console.warn(`Invalid degree value encountered: ${degree}, using fallback value 0`)
  return 0
}

// Utility function to ensure valid planetary position object
function validatePlanetaryPosition(position: any): {
  sign: string
  degree: number
  retrograde: boolean
} {
  return {
    sign: typeof position?.sign === 'string' ? position.sign : 'Aries',
    degree: safeDegreeValue(position?.degree),
    retrograde: typeof position?.retrograde === 'boolean' ? position.retrograde : false,
  }
}

// Current planetary data with transit dates
const planetDataWithTransits = {
  Sun: sunData,
  Moon: moonData,
  Mercury: mercuryData,
  Venus: venusData,
  Mars: marsData,
  Jupiter: jupiterData,
  Saturn: saturnData,
  Uranus: uranusData,
  Neptune: neptuneData,
  Pluto: plutoData,
}

// Helper function to get transit dates for a planet
function getTransitDates(planet: string): Record<string, { Start: string; End: string }> | null {
  try {
    // Special case for Moon which uses a calculation function
    if (
      planet === 'Moon' &&
      planetDataWithTransits.Moon?.PlanetSpecific?.MoonCalculations?.calculateTransits
    ) {
      const calculateTransits =
        planetDataWithTransits.Moon.PlanetSpecific.MoonCalculations.calculateTransits
      // Cast the function to the expected type and call it
      return (calculateTransits as Function)(new Date())
    }

    const planetData = planetDataWithTransits[planet as keyof typeof planetDataWithTransits]
    if (!planetData?.PlanetSpecific?.TransitDates) {
      return null
    }

    const transitData = planetData.PlanetSpecific?.TransitDates as TransitData

    // Handle different transit date formats
    // Check for decan format FIRST before simple format (since Uranus/Neptune also have sign keys)
    if (
      transitData &&
      typeof transitData === 'object' &&
      ('Pisces' in transitData ||
        ('Taurus' in transitData &&
          typeof (transitData as any).Taurus === 'object' &&
          '1stDecan' in (transitData as any).Taurus) ||
        ('Gemini' in transitData &&
          typeof (transitData as any).Gemini === 'object' &&
          '1stDecan' in (transitData as any).Gemini))
    ) {
      // Neptune/Pluto/Uranus format with decans
      // We'll simplify and use the first decan as the start and the last decan end as the end
      const simplifiedTransits: Record<string, { Start: string; End: string }> = {}

      for (const sign in transitData) {
        const signData = (transitData as any)[sign]
        if (signData && typeof signData === 'object' && '1stDecan' in signData) {
          const firstDecan = signData['1stDecan']

          // Find the last decan that exists
          let lastDecan = signData['3rdDecan']
          if (!lastDecan) lastDecan = signData['2ndDecan']
          if (!lastDecan) lastDecan = signData['1stDecan']

          // Only add if we have valid start and end dates that are strings
          if (
            firstDecan &&
            lastDecan &&
            typeof firstDecan.Start === 'string' &&
            typeof lastDecan.End === 'string' &&
            firstDecan.Start.length > 0 &&
            lastDecan.End.length > 0
          ) {
            simplifiedTransits[sign] = {
              Start: firstDecan.Start,
              End: lastDecan.End,
            }
          } else {
            // Skip signs with invalid dates
            console.warn(`Skipping ${planet} ${sign} - invalid dates`, {
              firstDecan: firstDecan?.Start,
              lastDecan: lastDecan?.End,
            })
          }
        }
      }

      return simplifiedTransits
    } else if (
      transitData &&
      typeof transitData === 'object' &&
      'DirectPhasesQ2_2024' in transitData
    ) {
      // Mercury format
      const q2Data = (transitData as any).DirectPhasesQ2_2024
      const q4Data = (transitData as any).DirectPhasesQ4_2024
      return {
        ...q2Data,
        ...q4Data,
      } as Record<string, { Start: string; End: string }>
    } else if (
      transitData &&
      typeof transitData === 'object' &&
      ('Aries' in transitData || 'Taurus' in transitData || 'Gemini' in transitData)
    ) {
      // Simple format like Mars or Venus (only if NOT decan format)
      return transitData as Record<string, { Start: string; End: string }>
    }

    return null
  } catch (error) {
    console.error(`Error getting transit dates for ${planet}:`, error)
    return null
  }
}

// Function to find the current sign based on transit dates
function findSignFromTransitDates(
  planet: string,
  date: Date = new Date()
): { sign: string; degree: number } | null {
  try {
    const transitDates = getTransitDates(planet)
    if (!transitDates) return null

    // Normalize provided Start/End strings to the current year using month/day only
    const currentYear = date.getFullYear()

    const parseMonthDay = (s: any): { month: number; day: number } | null => {
      // More defensive validation to prevent split errors
      if (!s) return null
      if (typeof s !== 'string') return null
      if (s.length === 0) return null

      try {
        const parts = s.split('-')
        if (!parts || parts.length < 3) return null

        const month = Number(parts[1])
        const day = Number(parts[2])

        if (isNaN(month) || isNaN(day)) return null
        if (month < 1 || month > 12) return null
        if (day < 1 || day > 31) return null

        return { month, day }
      } catch (error) {
        console.warn(`Error parsing month/day from: ${s}`, error)
        return null
      }
    }

    for (const [sign, dates] of Object.entries(transitDates)) {
      // Strict validation: both Start and End must be non-empty strings
      if (!dates || typeof dates !== 'object') continue
      if (!dates.Start || typeof dates.Start !== 'string' || dates.Start.length === 0) continue
      if (!dates.End || typeof dates.End !== 'string' || dates.End.length === 0) continue

      const s = parseMonthDay(dates.Start)
      const e = parseMonthDay(dates.End)

      if (!s || !e) continue
      const startYear = currentYear
      const endYear =
        s.month > e.month || (s.month === e.month && s.day > e.day) ? currentYear + 1 : currentYear
      const startDate = new Date(startYear, s.month - 1, s.day)
      const endDate = new Date(endYear, e.month - 1, e.day)

      if (date >= startDate && date <= endDate) {
        // Found the current sign!

        // Calculate how far we are into this transit as a percentage
        const transitDuration = endDate.getTime() - startDate.getTime()
        const timeElapsed = date.getTime() - startDate.getTime()
        const transitProgress = timeElapsed / transitDuration

        // Convert to degrees (each sign is 30 degrees)
        const degree = Math.min(transitProgress * 30, 29.99)

        return {
          sign,
          degree: Math.round(degree * 100) / 100,
        }
      }
    }

    // If we're here and we're checking the Moon, it means our hardcoded data doesn't cover
    // the requested date. We'll use the mathematical calculation as fallback.
    if (planet === 'Moon') {
      return calculateMoonPosition(date)
    }

    return null
  } catch (error) {
    console.error(`Error finding sign from transit dates for ${planet}:`, error)
    return null
  }
}

// Calculate Moon position based on a simple mathematical model
function calculateMoonPosition(date: Date): { sign: string; degree: number } {
  try {
    // Reference point: May 19, 2024 - Moon in Sagittarius at 16.22 degrees
    const referenceDate = new Date(2024, 4, 19)
    const referenceDegree = 16.22
    const referenceSignIndex = 8 // Sagittarius

    // Calculate days since reference
    const daysSinceReference = (date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)

    // Moon moves about 13.2 degrees per day (360 / 27.3 days)
    const degreesMoved = daysSinceReference * 13.2

    // Calculate absolute position
    const absoluteReferencePosition = referenceSignIndex * 30 + referenceDegree
    let newAbsolutePosition = (absoluteReferencePosition + degreesMoved) % 360

    // Handle negative values
    if (newAbsolutePosition < 0) {
      newAbsolutePosition += 360
    }

    // Calculate new sign and degree
    const newSignIndex = Math.floor(newAbsolutePosition / 30)
    const newDegree = newAbsolutePosition % 30

    // Get sign name
    const signs = Object.entries(signIndices).reduce(
      (acc, [sign, index]) => ({ ...acc, [index]: sign }),
      {} as Record<number, string>
    )

    return {
      sign: signs[newSignIndex] || 'Aries',
      degree: Math.round(newDegree * 100) / 100,
    }
  } catch (error) {
    console.error('Error calculating Moon position:', error)
    // Fallback to Sagittarius
    return { sign: 'Sagittarius', degree: 0 }
  }
}

// Function to get transit position from dates
function getTransitPositionFromDates(
  planet: string,
  date: Date = new Date()
): { sign: string; degree: string; retrograde: boolean } | null {
  try {
    const transitPosition = findSignFromTransitDates(planet, date)
    if (!transitPosition) return null

    return {
      sign: transitPosition.sign,
      degree: transitPosition.degree.toString(),
      retrograde: transitPosition.retrograde || false,
    }
  } catch (error) {
    console.error(`Error getting transit position for ${planet}:`, error)
    return null
  }
}

/**
 * Calculates the current positions of planets based on reference positions and orbital speeds
 * Optionally accepts a timestamp to prevent caching
 * @param timestamp Optional timestamp to force recalculation
 * @returns Object with planet names as keys and their current sign, degree, and retrograde status
 */
export function getCurrentPlanetaryPositions(
  timestamp?: number
): Record<string, { sign: string; degree: number; retrograde: boolean }> {
  // Check cache first (unless forced timestamp is provided)
  if (!timestamp) {
    const cachedPositions =
      performanceCache.getPlanetaryPositions<
        Record<string, { sign: string; degree: number; retrograde: boolean }>
      >()
    if (cachedPositions) {
      return cachedPositions
    }
  }

  if (timestamp) {
    console.log(`Using current positions with timestamp: ${timestamp}`)
  }

  // Use enhanced professional calculator for current UTC time to unify sources
  const now = new Date()
  const birthInfo: EnhancedBirthInfo = {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
    hour: now.getUTCHours(),
    minute: now.getUTCMinutes(),
    second: now.getUTCSeconds(),
    // Longitudes/latitudes do not affect planetary longitudes; use neutral defaults
    latitude: 0,
    longitude: 0,
  }

  const enhanced = calculateAllPlanets(birthInfo)

  const calculatedPositions: Record<string, { sign: string; degree: number; retrograde: boolean }> =
    {}

  // Map enhanced planets (Sun..Pluto) - use accurate Swiss Ephemeris calculations
  ;[
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
  ].forEach(planet => {
    const pos = enhanced.planets[planet]
    if (pos) {
      calculatedPositions[planet] = {
        sign: pos.sign,
        degree: Math.max(0, Math.min(29.9999, pos.signDegree)),
        retrograde: !!pos.retrograde,
      }
    }
  })

  // Note: We use Swiss Ephemeris calculations exclusively for accuracy
  // Transit date files are not used as they are approximations and can have data gaps

  // For points not produced by enhanced calc: compute Node mean; approximate Chiron and angles
  const node = getMeanNorthNode(now)
  calculatedPositions['North Node'] = validatePlanetaryPosition(node)

  // Approximate Chiron via transit dates if available (fallback to Aries 0°)
  const chironTransit = getTransitPositionFromDates('Chiron' as any, now)
  calculatedPositions['Chiron'] = chironTransit
    ? validatePlanetaryPosition({
        sign: chironTransit.sign,
        degree: chironTransit.degree,
        retrograde: true,
      })
    : validatePlanetaryPosition({ sign: 'Aries', degree: 0, retrograde: true })

  // Derive Ascendant and MC from enhanced calculator when possible
  // Asc already available via enhanced, compute MC as Ascendant + 90° on ecliptic
  const ascSign = enhanced.ascendant.sign
  const ascDeg = enhanced.ascendant.signDegree
  const signs = [
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
  const ascIndex = signs.indexOf(ascSign)
  const ascAbs = ascIndex * 30 + ascDeg
  const mcAbs = (ascAbs + 90) % 360
  const mcSD = longitudeToSignDegree(mcAbs)
  calculatedPositions['Ascendant'] = validatePlanetaryPosition({
    sign: ascSign,
    degree: ascDeg,
    retrograde: false,
  })
  calculatedPositions['MC'] = validatePlanetaryPosition({
    sign: mcSD.sign,
    degree: mcSD.degree,
    retrograde: false,
  })

  performanceCache.setPlanetaryPositions(calculatedPositions)
  console.log(`[Planetary Positions] Enhanced calculation complete at: ${new Date().toISOString()}`)
  return calculatedPositions
}

/**
 * Gets the raw planetary positions directly from calculations
 * This is used for debugging purposes
 */
export function getRawPlanetaryPositions() {
  const now = new Date()

  // Force a timestamp to prevent caching
  const timestamp = now.getTime()

  // Get calculated positions
  const calculatedPositions = getCurrentPlanetaryPositions(timestamp)

  // Get transit data for comparison
  const transitData: Record<string, any> = {}
  ;[
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
  ].forEach(planet => {
    transitData[planet] = getTransitDates(planet)
  })

  return {
    timestamp,
    currentPositions: calculatedPositions,
    lastUpdated: now.toISOString(),
    calculationMethod: 'Using transit data with mathematical calculations',
    referenceDate: now.toISOString(),
    transitData,
  }
}
