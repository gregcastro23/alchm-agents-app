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
import { calculateAllPlanets, type EnhancedBirthInfo } from './enhanced-astronomical-calculator'

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

// Define the fixed, accurate current planetary positions
// These were verified from reliable astronomical sources
// All degrees converted to numbers with proper validation
const CURRENT_PLANETARY_POSITIONS = {
  Sun: { sign: 'Libra', degree: 0.6666667, retrograde: false },
  Moon: { sign: 'Libra', degree: 18.8333333, retrograde: false },
  Mercury: { sign: 'Libra', degree: 8.7666667, retrograde: false },
  Venus: { sign: 'Virgo', degree: 4.7833333, retrograde: false },
  Mars: { sign: 'Scorpio', degree: 0.75, retrograde: false },
  Jupiter: { sign: 'Cancer', degree: 21.4666667, retrograde: false },
  Saturn: { sign: 'Pisces', degree: 28.3333333, retrograde: true },
  Uranus: { sign: 'Gemini', degree: 1.3333333, retrograde: true },
  Neptune: { sign: 'Aries', degree: 0.75, retrograde: true },
  Pluto: { sign: 'Aquarius', degree: 1.45, retrograde: true },
  'North Node': { sign: 'Pisces', degree: 17.4333333, retrograde: true },
  Chiron: { sign: 'Aries', degree: 25.9333333, retrograde: true },
  Ascendant: { sign: 'Virgo', degree: 29.8166667, retrograde: false },
  MC: { sign: 'Gemini', degree: 29.8, retrograde: false },
}

// Add last updated timestamp
const POSITIONS_LAST_UPDATED = new Date().toISOString() // Updated with latest positions

// Define approximate degrees per day for each planet
const degreesPerDay = Object.entries(orbitalPeriods).reduce(
  (acc, [planet, period]) => ({
    ...acc,
    [planet]: 360 / period,
  }),
  {} as Record<string, number>
)

import { performanceCache } from './performance-cache'

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
function validatePlanetaryPosition(position: any): { sign: string; degree: number; retrograde: boolean } {
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
    if (
      transitData &&
      typeof transitData === 'object' &&
      ('Aries' in transitData || 'Taurus' in transitData || 'Gemini' in transitData)
    ) {
      // Simple format like Mars or Venus
      return transitData as Record<string, { Start: string; End: string }>
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
      ('Pisces' in transitData ||
        ('Taurus' in transitData &&
          typeof (transitData as any).Taurus === 'object' &&
          '1stDecan' in (transitData as any).Taurus))
    ) {
      // Neptune/Pluto/Uranus format with decans
      // We'll simplify and use the first decan as the start and the last decan end as the end
      const simplifiedTransits: Record<string, { Start: string; End: string }> = {}

      for (const sign in transitData) {
        const signData = (transitData as any)[sign]
        if (signData && typeof signData === 'object' && '1stDecan' in signData) {
          const decans = ['1stDecan', '2ndDecan', '3rdDecan']
          const firstDecan = signData['1stDecan']
          const lastDecan = signData[decans.find(d => d in signData) || '3rdDecan']

          simplifiedTransits[sign] = {
            Start: firstDecan.Start,
            End: lastDecan.End,
          }
        }
      }

      return simplifiedTransits
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

    const currentDateStr = date.toISOString().split('T')[0]

    for (const [sign, dates] of Object.entries(transitDates)) {
      const startDate = new Date(dates.Start)
      const endDate = new Date(dates.End)

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
      performanceCache.getPlanetaryPositions<Record<string, { sign: string; degree: number; retrograde: boolean }>>()
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

  const calculatedPositions: Record<string, { sign: string; degree: number; retrograde: boolean }> = {}

  // Map enhanced planets (Sun..Pluto)
  ;['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].forEach(planet => {
    const pos = enhanced.planets[planet]
    if (pos) {
      calculatedPositions[planet] = {
        sign: pos.sign,
        degree: Math.max(0, Math.min(29.9999, pos.signDegree)),
        retrograde: !!pos.retrograde,
      }
    }
  })

  // For points not produced by enhanced calc (Node, Chiron, angles), use CURRENT_PLANETARY_POSITIONS
  calculatedPositions['North Node'] = validatePlanetaryPosition({
    ...CURRENT_PLANETARY_POSITIONS['North Node'],
    retrograde: !!CURRENT_PLANETARY_POSITIONS['North Node'].retrograde,
  })
  if ((CURRENT_PLANETARY_POSITIONS as any)['Chiron']) {
    calculatedPositions['Chiron'] = validatePlanetaryPosition({
      ...(CURRENT_PLANETARY_POSITIONS as any)['Chiron'],
      retrograde: !!(CURRENT_PLANETARY_POSITIONS as any)['Chiron'].retrograde,
    })
  }
  calculatedPositions['Ascendant'] = validatePlanetaryPosition(CURRENT_PLANETARY_POSITIONS['Ascendant'])
  if ((CURRENT_PLANETARY_POSITIONS as any)['MC']) {
    calculatedPositions['MC'] = validatePlanetaryPosition((CURRENT_PLANETARY_POSITIONS as any)['MC'])
  }

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
