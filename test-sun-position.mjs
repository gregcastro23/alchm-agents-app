#!/usr/bin/env node

import { calculateSolarPosition } from './lib/ephemeris/solar-ephemeris.js'
import {
  calculateEnhancedPlanetPosition,
  dateToJulianDay,
  centuriesSinceJ2000,
} from './lib/enhanced-astronomical-calculator.js'

const testDate = new Date(Date.UTC(2025, 2, 20, 9, 0, 0)) // March 20, 2025 9:00 UTC

console.log('Testing Sun position calculation differences:')
console.log('Date:', testDate.toISOString())
console.log()

const pos1 = calculateSolarPosition(testDate)
console.log('Solar Ephemeris (API):')
console.log('  Longitude:', pos1.longitude.toFixed(6) + '°')
console.log('  Sign:', Math.floor(pos1.longitude / 30))
console.log()

const jd = dateToJulianDay(testDate)
const T = centuriesSinceJ2000(jd)
const pos2 = calculateEnhancedPlanetPosition('Sun', jd)

console.log('Enhanced Calculator:')
console.log('  Longitude:', pos2.longitude.toFixed(6) + '°')
console.log('  Sign:', Math.floor(pos2.longitude / 30))
console.log()

console.log('Difference:', (pos1.longitude - pos2.longitude).toFixed(6) + '°')
