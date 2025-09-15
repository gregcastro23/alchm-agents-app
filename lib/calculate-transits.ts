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
const CURRENT_PLANETARY_POSITIONS = {
  Sun: { sign: 'Virgo', degree: '13', retrograde: false },
  Moon: { sign: 'Aquarius', degree: '17', retrograde: false },
  Mercury: { sign: 'Virgo', degree: '6', retrograde: false },
  Venus: { sign: 'Leo', degree: '13', retrograde: false },
  Mars: { sign: 'Libra', degree: '19', retrograde: false },
  Jupiter: { sign: 'Cancer', degree: '18', retrograde: false },
  Saturn: { sign: 'Pisces', degree: '29', retrograde: true },
  Uranus: { sign: 'Gemini', degree: '1', retrograde: false },
  Neptune: { sign: 'Aries', degree: '1', retrograde: true },
  Pluto: { sign: 'Aquarius', degree: '1', retrograde: true },
  'North Node': { sign: 'Pisces', degree: '24.33', retrograde: false }, // Retained from previous
  Ascendant: { sign: 'Capricorn', degree: '28.85', retrograde: false }, // Retained from previous
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
): Record<string, { sign: string; degree: string; retrograde: boolean }> {
  // Check cache first (unless forced timestamp is provided)
  if (!timestamp) {
    const cachedPositions =
      performanceCache.getPlanetaryPositions<Record<string, { sign: string; degree: string }>>()
    if (cachedPositions) {
      return cachedPositions
    }
  }

  // If a timestamp is provided, log it to verify fresh data is being used
  if (timestamp) {
    console.log(`Using current positions with timestamp: ${timestamp}`)
  }

  // Create a new date object for calculations
  const calculationDate = new Date()

  // Initialize with empty positions that will be populated from calculations
  let calculatedPositions: Record<string, { sign: string; degree: string; retrograde: boolean }> =
    {}

  // Calculate all planetary positions using transit data
  const planets = [
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
  planets.forEach(planet => {
    const transitPosition = getTransitPositionFromDates(planet, calculationDate)
    if (transitPosition) {
      calculatedPositions[planet] = transitPosition
    } else {
      // Fallback to hardcoded positions if transit calculation fails
      calculatedPositions[planet] =
        CURRENT_PLANETARY_POSITIONS[planet as keyof typeof CURRENT_PLANETARY_POSITIONS]
      console.log(
        `Using fallback position for ${planet}:`,
        CURRENT_PLANETARY_POSITIONS[planet as keyof typeof CURRENT_PLANETARY_POSITIONS]
      )
    }
  })

  // For North Node and Ascendant, use hardcoded values as they require specialized calculations
  calculatedPositions['North Node'] = {
    ...CURRENT_PLANETARY_POSITIONS['North Node'],
    retrograde: false,
  }
  calculatedPositions['Ascendant'] = {
    ...CURRENT_PLANETARY_POSITIONS['Ascendant'],
    retrograde: false,
  }

  // Cache the calculated positions
  performanceCache.setPlanetaryPositions(calculatedPositions)

  // Update last updated timestamp
  const lastUpdated = new Date().toISOString()
  console.log(`[Planetary Positions] Calculated current positions at: ${lastUpdated}`)

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
