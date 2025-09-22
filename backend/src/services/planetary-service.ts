import { logger } from '../utils/logger.js'
import { getRealPlanetaryPositions } from './alchm-client.js';

export interface PlanetPosition {
  name: string
  sign: string
  degree: number
  retrograde: boolean
  house?: number
}

export interface PlanetaryPositions {
  sun: PlanetPosition
  moon: PlanetPosition
  mercury: PlanetPosition
  venus: PlanetPosition
  mars: PlanetPosition
  jupiter: PlanetPosition
  saturn: PlanetPosition
  uranus?: PlanetPosition
  neptune?: PlanetPosition
  pluto?: PlanetPosition
}

/**
 * Gets current planetary positions
 * Simplified calculation for backend service
 */
export function getCurrentPlanetaryPositions(date: Date = new Date()): PlanetaryPositions {
  try {
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    const hour = date.getHours()

    // Zodiac signs
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

    // Calculate simplified positions based on orbital periods
    const calculatePosition = (orbitalDays: number, offset: number = 0): PlanetPosition => {
      const progress = ((dayOfYear + offset) % orbitalDays) / orbitalDays
      const signIndex = Math.floor(progress * 12)
      const degree = (progress * 360) % 30

      return {
        name: '',
        sign: signs[signIndex],
        degree: Math.round(degree * 10) / 10,
        retrograde: Math.sin(progress * Math.PI * 2) < -0.8
      }
    }

    // Approximate orbital periods in days (simplified)
    const positions: PlanetaryPositions = {
      sun: { ...calculatePosition(365, 0), name: 'Sun', retrograde: false },
      moon: { ...calculatePosition(28, hour), name: 'Moon', retrograde: false },
      mercury: { ...calculatePosition(88, 10), name: 'Mercury' },
      venus: { ...calculatePosition(225, 20), name: 'Venus' },
      mars: { ...calculatePosition(687, 30), name: 'Mars' },
      jupiter: { ...calculatePosition(4333, 40), name: 'Jupiter' },
      saturn: { ...calculatePosition(10759, 50), name: 'Saturn' },
      uranus: { ...calculatePosition(30687, 60), name: 'Uranus' },
      neptune: { ...calculatePosition(60190, 70), name: 'Neptune' },
      pluto: { ...calculatePosition(90560, 80), name: 'Pluto' }
    }

    // Add house positions based on current hour
    const houseOffset = Math.floor(hour / 2)
    Object.values(positions).forEach((planet, index) => {
      planet.house = ((index + houseOffset) % 12) + 1
    })

    return positions
  } catch (error) {
    logger.error('Error calculating planetary positions:', error)
    // Return default positions
    return getDefaultPositions()
  }
}

function getDefaultPositions(): PlanetaryPositions {
  return {
    sun: { name: 'Sun', sign: 'Aries', degree: 0, retrograde: false, house: 1 },
    moon: { name: 'Moon', sign: 'Cancer', degree: 0, retrograde: false, house: 4 },
    mercury: { name: 'Mercury', sign: 'Gemini', degree: 0, retrograde: false, house: 3 },
    venus: { name: 'Venus', sign: 'Taurus', degree: 0, retrograde: false, house: 2 },
    mars: { name: 'Mars', sign: 'Aries', degree: 0, retrograde: false, house: 1 },
    jupiter: { name: 'Jupiter', sign: 'Sagittarius', degree: 0, retrograde: false, house: 9 },
    saturn: { name: 'Saturn', sign: 'Capricorn', degree: 0, retrograde: false, house: 10 }
  }
}

/**
 * Calculate planetary hour for a given time and location
 * Returns the ruling planet for the current planetary hour
 */
export function getPlanetaryHour(date: Date, latitude: number): string {
  try {
    // Planetary hours in Chaldean order
    const dayPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
    const hourSequence = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']

    // Get day of week (0 = Sunday)
    const dayOfWeek = date.getDay()
    const dayPlanet = dayPlanets[dayOfWeek]

    // Calculate approximate sunrise/sunset (simplified)
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    const seasonalOffset = Math.sin((dayOfYear - 80) * 2 * Math.PI / 365) * 2 // ±2 hours seasonal variation

    const sunrise = 6 - seasonalOffset // Approximate sunrise
    const sunset = 18 + seasonalOffset // Approximate sunset

    const currentHour = date.getHours() + date.getMinutes() / 60

    let planetaryHour: number
    let isDay: boolean

    if (currentHour >= sunrise && currentHour < sunset) {
      // Daytime hours
      isDay = true
      const dayLength = sunset - sunrise
      const hourLength = dayLength / 12
      planetaryHour = Math.floor((currentHour - sunrise) / hourLength)
    } else {
      // Nighttime hours
      isDay = false
      const nightLength = 24 - (sunset - sunrise)
      const hourLength = nightLength / 12

      if (currentHour >= sunset) {
        planetaryHour = Math.floor((currentHour - sunset) / hourLength)
      } else {
        planetaryHour = Math.floor((currentHour + 24 - sunset) / hourLength)
      }
    }

    // Get the starting planet index for the day
    const dayPlanetIndex = hourSequence.indexOf(dayPlanet)

    // Calculate the current planetary hour ruler
    const currentPlanetIndex = (dayPlanetIndex + planetaryHour) % 7

    return hourSequence[currentPlanetIndex]
  } catch (error) {
    logger.error('Error calculating planetary hour:', error)
    // Return Sun as default
    return 'Sun'
  }
}