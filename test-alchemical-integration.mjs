#!/usr/bin/env node

/**
 * Test script to verify alchemical integration with VSOP87 astronomical accuracy
 */

import { generateAccurateHoroscope } from './lib/monica/horoscope-generator.js'

console.log('🔮 Testing Alchemical Integration with VSOP87 Accuracy\n')

// Test birth info for someone born on Spring Equinox 2025 (0° Aries)
const testBirthInfo = {
  year: 2025,
  month: 3,
  day: 20,
  hour: 9,
  minute: 0,
  latitude: 40.7128,
  longitude: -74.006,
}

import { generateProfessionalHoroscope } from './lib/monica/horoscope-generator.js'

try {
  console.log('📅 Testing birth date:', testBirthInfo)
  console.log('   (Spring Equinox 2025 - should be 0° Aries)\n')

  const horoscope = generateProfessionalHoroscope(testBirthInfo, {
    useLegacyFallback: false,
    includeAccuracyMetadata: true,
  })

  console.log('✅ Horoscope generated successfully!')
  console.log('📊 Results:')
  console.log(
    '   Sun Sign:',
    horoscope.tropical.CelestialBodies.all.find(p => p.label === 'Sun')?.Sign?.label
  )
  console.log('   Ascendant:', horoscope.tropical.Ascendant?.Sign?.label)
  console.log('   Generation Method:', horoscope.metadata?.method)
  console.log('   Accuracy:', horoscope.metadata?.accuracy)
  console.log('   Julian Day:', horoscope.metadata?.julianDay?.toFixed(2))

  // Check if we're getting VSOP87 accuracy
  if (horoscope.metadata?.method?.includes('VSOP87')) {
    console.log('\n🎉 SUCCESS: VSOP87 astronomical accuracy confirmed!')
  } else {
    console.log('\n⚠️  WARNING: Not using VSOP87 calculations')
  }
} catch (error) {
  console.error('❌ Error:', error.message)
  console.error('Stack:', error.stack)
}
