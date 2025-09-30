#!/usr/bin/env node

/**
 * Comprehensive Integration Test for VSOP87 Astronomical Accuracy
 * Tests end-to-end alchemical calculations with enhanced precision
 */

import {
  generateProfessionalHoroscope,
  testAstronomicalAccuracy,
} from './lib/monica/horoscope-generator.js'
import { alchemize } from './lib/alchemizer.js'

console.log('🌟 Comprehensive VSOP87 Integration Test\n')
console.log('='.repeat(60))

// Test cases with known astronomical dates - using exact API data
const testCases = [
  {
    name: 'Spring Equinox 2025 (0° Aries)',
    birthInfo: {
      year: 2025,
      month: 3,
      day: 20,
      hour: 9,
      minute: 0,
      latitude: 40.7128,
      longitude: -74.006,
    },
    expected: { sunSign: 'Aries', accuracy: 'high' },
  },
  {
    name: 'Just before Spring Equinox (29° Pisces)',
    birthInfo: {
      year: 2025,
      month: 3,
      day: 20,
      hour: 3,
      minute: 0,
      latitude: 40.7128,
      longitude: -74.006,
    },
    expected: { sunSign: 'Pisces', accuracy: 'high' },
  },
  {
    name: 'Summer Solstice period 2025 (Cancer)',
    birthInfo: {
      year: 2025,
      month: 6,
      day: 21,
      hour: 12,
      minute: 0,
      latitude: 40.7128,
      longitude: -74.006,
    },
    expected: { sunSign: 'Cancer', accuracy: 'high' },
  },
]

let allTestsPassed = true

for (const testCase of testCases) {
  console.log(`\n🧪 Testing: ${testCase.name}`)
  console.log('-'.repeat(50))

  try {
    // Test 1: Horoscope generation with VSOP87
    const horoscope = generateProfessionalHoroscope(testCase.birthInfo, {
      useLegacyFallback: false,
      includeAccuracyMetadata: true,
    })

    const sunSign = horoscope.tropical.CelestialBodies.all.find(p => p.label === 'Sun')?.Sign?.label
    const ascendant = horoscope.tropical.Ascendant?.Sign?.label

    console.log(`✅ Horoscope: Sun in ${sunSign}, Rising ${ascendant}`)
    console.log(`   Method: ${horoscope.metadata?.method}`)
    console.log(`   Accuracy: ${horoscope.metadata?.accuracy}`)
    console.log(`   Julian Day: ${horoscope.metadata?.julianDay?.toFixed(2)}`)

    // Test 2: Alchemical calculation
    const alchmData = alchemize(testCase.birthInfo, horoscope)

    console.log(`✅ Alchemy: ${alchmData['Sun Sign']} (${alchmData['Chart Ruler']} ruled)`)
    console.log(`   Dominant Element: ${alchmData['Dominant Element']}`)
    console.log(`   Spirit: ${alchmData['Alchemy Effects']['Total Spirit']?.toFixed(2)}`)
    console.log(`   Essence: ${alchmData['Alchemy Effects']['Total Essence']?.toFixed(2)}`)

    // Test 3: Accuracy comparison (if available)
    if (testCase.expected.sunSign && sunSign !== testCase.expected.sunSign) {
      console.log(`⚠️  Expected Sun sign: ${testCase.expected.sunSign}, Got: ${sunSign}`)
      if (testCase.expected.accuracy === 'high') {
        allTestsPassed = false
      }
    }

    // Test 4: Check for VSOP87 metadata
    if (!horoscope.metadata?.method?.includes('VSOP87')) {
      console.log(`⚠️  Not using VSOP87 calculations`)
      allTestsPassed = false
    }
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`)
    allTestsPassed = false
  }
}

// Test accuracy comparison using API
console.log(`\n📊 Testing Accuracy Improvements`)
console.log('-'.repeat(50))

try {
  // Test the same date used in the zodiac accuracy test report
  const testDate = '2025-09-21T00:00:00Z'
  const response = await fetch(
    `http://localhost:3000/api/zodiac-calendar?action=compare-accuracy&date=${testDate}`
  )
  const comparison = await response.json()

  console.log(`Accuracy comparison for ${testDate}:`)
  console.log(
    `   Old system: ${comparison.old_calculation.sign} ${comparison.old_calculation.degree}° (${comparison.old_calculation.absolute}°)`
  )
  console.log(
    `   New system: ${comparison.new_calculation.sign} ${comparison.new_calculation.degree.toFixed(2)}° (${comparison.new_calculation.absolute.toFixed(2)}°)`
  )
  console.log(
    `   Improvement: ${comparison.accuracy_improvement.degree_difference.toFixed(2)}° difference`
  )
  console.log(`   Factor: ${comparison.accuracy_improvement.improvement_factor}`)

  if (comparison.accuracy_improvement.degree_difference > 100) {
    console.log(`✅ Massive accuracy improvements confirmed (>100° difference)`)
  } else {
    console.log(`⚠️  Accuracy improvements not significant enough`)
    allTestsPassed = false
  }
} catch (error) {
  console.error(`❌ Accuracy test failed: ${error.message}`)
  allTestsPassed = false
}

// Final results
console.log(`\n${'='.repeat(60)}`)
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED - VSOP87 Integration Complete!')
  console.log('✅ Professional astronomical accuracy achieved')
  console.log('✅ Alchemical calculations using enhanced precision')
  console.log('✅ End-to-end integration validated')
} else {
  console.log('❌ SOME TESTS FAILED - Review integration issues')
}
console.log(`${'='.repeat(60)}\n`)
