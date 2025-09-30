#!/usr/bin/env node

import { dateToJulianDay as jd1 } from './lib/enhanced-astronomical-calculator.js'
import { dateToJulianDay as jd2 } from './lib/ephemeris/solar-ephemeris.js'

const testDate = new Date(Date.UTC(2025, 2, 20, 9, 0, 0)) // March 20, 2025 9:00 UTC

console.log('Testing Julian Day calculation differences:')
console.log('Date:', testDate.toISOString())
console.log('Enhanced Calculator JD:', jd1(testDate))
console.log('Solar Ephemeris JD:', jd2(testDate))
console.log('Difference:', jd1(testDate) - jd2(testDate))
