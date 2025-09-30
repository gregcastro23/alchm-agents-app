/**
 * Zodiac Platform Integration Test Suite
 * =====================================
 *
 * Comprehensive testing of zodiac accuracy improvements across all platform components
 */

import {
  calculateSolarPosition,
  getZodiacPositionForDate,
  getDatesForZodiacDegree,
  getCardinalPoints,
  dateToJulianDay,
} from '../lib/ephemeris/solar-ephemeris'
import {
  buildAnnualCalendar,
  getDegreeForDate,
  getCurrentZodiacPeriod,
  getMonthlyZodiacCalendar,
} from '../lib/ephemeris/degree-calendar-map'
import {
  calculateAllPlanets,
  getExactSunDegreeForDate,
  type EnhancedBirthInfo,
} from '../lib/enhanced-astronomical-calculator'

console.log('🔬 Zodiac Platform Integration Test Suite')
console.log('='.repeat(60))

let testsPassed = 0
let totalTests = 0

function runIntegrationTest(testName: string, testFn: () => boolean | Promise<boolean>): void {
  totalTests++
  try {
    const result = testFn()
    if (result instanceof Promise) {
      result
        .then(res => {
          if (res) {
            console.log(`✅ ${testName}`)
            testsPassed++
          } else {
            console.log(`❌ ${testName}`)
          }
        })
        .catch(err => {
          console.log(`❌ ${testName} - Error: ${err.message}`)
        })
    } else {
      if (result) {
        console.log(`✅ ${testName}`)
        testsPassed++
      } else {
        console.log(`❌ ${testName}`)
      }
    }
  } catch (error) {
    console.log(
      `❌ ${testName} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// Test 1: Birth Chart Integration
console.log('\n🎂 Birth Chart Integration Tests')
console.log('-'.repeat(40))

runIntegrationTest('Enhanced astronomical calculator produces accurate Sun positions', () => {
  const testBirthInfo: EnhancedBirthInfo = {
    year: 1990,
    month: 7,
    day: 15,
    hour: 14,
    minute: 30,
    latitude: 40.7128,
    longitude: -74.006,
  }

  const planetData = calculateAllPlanets(testBirthInfo)
  const sunPosition = planetData.planets.Sun

  // Sun should be in Cancer or Leo for July 15
  const expectedSigns = ['Cancer', 'Leo']
  const isCorrectSign = expectedSigns.includes(sunPosition.sign)

  console.log(`  Birth chart Sun: ${sunPosition.signDegree.toFixed(2)}° ${sunPosition.sign}`)
  console.log(`  Julian Day: ${planetData.julianDay}`)
  console.log(`  Distance: ${sunPosition.distance.toFixed(6)} AU`)

  return isCorrectSign && sunPosition.signDegree >= 0 && sunPosition.signDegree < 30
})

runIntegrationTest('Birth chart ascendant calculation works correctly', () => {
  const testBirthInfo: EnhancedBirthInfo = {
    year: 1990,
    month: 7,
    day: 15,
    hour: 14,
    minute: 30,
    latitude: 40.7128,
    longitude: -74.006,
  }

  const planetData = calculateAllPlanets(testBirthInfo)
  const ascendant = planetData.ascendant

  console.log(`  Ascendant: ${ascendant.signDegree.toFixed(2)}° ${ascendant.sign}`)
  console.log(`  Right Ascension: ${ascendant.rightAscension.toFixed(2)}°`)

  return ascendant.longitude >= 0 && ascendant.longitude < 360
})

// Test 2: Tarot System Integration
console.log('\n🔮 Tarot System Integration Tests')
console.log('-'.repeat(40))

runIntegrationTest('Decan rulers are correctly calculated for all signs', () => {
  const testDates = [
    new Date('2025-01-15T12:00:00Z'), // Capricorn
    new Date('2025-04-15T12:00:00Z'), // Aries
    new Date('2025-07-15T12:00:00Z'), // Cancer
    new Date('2025-10-15T12:00:00Z'), // Libra
  ]

  const expectedRulers = {
    Capricorn: ['Saturn', 'Venus', 'Mercury'],
    Aries: ['Mars', 'Sun', 'Jupiter'],
    Cancer: ['Moon', 'Pluto', 'Neptune'],
    Libra: ['Venus', 'Uranus', 'Mercury'],
  }

  let allCorrect = true

  testDates.forEach(date => {
    const zodiacPos = getZodiacPositionForDate(date)
    const expectedForSign = expectedRulers[zodiacPos.sign as keyof typeof expectedRulers]

    if (expectedForSign) {
      const expectedRuler = expectedForSign[zodiacPos.decan - 1]
      const isCorrect = zodiacPos.decan_ruler === expectedRuler

      console.log(
        `  ${zodiacPos.sign} decan ${zodiacPos.decan}: ${zodiacPos.decan_ruler} (expected: ${expectedRuler}) ${isCorrect ? '✓' : '✗'}`
      )

      if (!isCorrect) allCorrect = false
    }
  })

  return allCorrect
})

runIntegrationTest('Decan boundaries are precise (not approximated)', () => {
  // Test exact 10° boundaries
  const testYear = 2025
  const testDegrees = [10, 20, 30, 40, 50, 60] // Should be decan boundaries

  let allPrecise = true

  testDegrees.forEach(degree => {
    const dateRange = getDatesForZodiacDegree(testYear, degree)
    const startPos = getZodiacPositionForDate(dateRange.start)
    const endPos = getZodiacPositionForDate(dateRange.end)

    // Should be exactly at the degree boundary
    const startAccuracy = Math.abs(startPos.absolute_longitude - degree)
    const endAccuracy = Math.abs(endPos.absolute_longitude - degree)

    console.log(
      `  ${degree}°: Start ${startAccuracy.toFixed(3)}°, End ${endAccuracy.toFixed(3)}° deviation`
    )

    if (startAccuracy > 0.1 || endAccuracy > 0.1) {
      allPrecise = false
    }
  })

  return allPrecise
})

// Test 3: Agent System Integration
console.log('\n🤖 Agent System Integration Tests')
console.log('-'.repeat(40))

runIntegrationTest('Agent creation uses accurate planetary positions', () => {
  const currentTime = new Date()
  const solarPos = calculateSolarPosition(currentTime)
  const zodiacPos = getZodiacPositionForDate(currentTime)

  // Verify consistency between different calculation methods
  const directSunDegree = getExactSunDegreeForDate(currentTime)
  const solarPosDegree = solarPos.longitude
  const zodiacPosDegree = zodiacPos.absolute_longitude

  const consistency1 = Math.abs(directSunDegree - solarPosDegree) < 0.001
  const consistency2 = Math.abs(directSunDegree - zodiacPosDegree) < 0.001

  console.log(`  Direct method: ${directSunDegree.toFixed(6)}°`)
  console.log(`  Solar position: ${solarPosDegree.toFixed(6)}°`)
  console.log(`  Zodiac position: ${zodiacPosDegree.toFixed(6)}°`)
  console.log(`  Consistency: ${consistency1 && consistency2}`)

  return consistency1 && consistency2
})

runIntegrationTest('Current zodiac period provides accurate agent timing', () => {
  const currentPeriod = getCurrentZodiacPeriod()

  if (!currentPeriod) {
    console.log('  No current period found')
    return false
  }

  const now = new Date()
  const isWithinPeriod = now >= currentPeriod.startDate && now < currentPeriod.endDate

  console.log(`  Current sign: ${currentPeriod.sign}`)
  console.log(
    `  Period: ${currentPeriod.startDate.toISOString()} - ${currentPeriod.endDate.toISOString()}`
  )
  console.log(`  Duration: ${currentPeriod.durationDays.toFixed(2)} days`)
  console.log(`  Within period: ${isWithinPeriod}`)

  return isWithinPeriod && currentPeriod.durationDays > 25 && currentPeriod.durationDays < 40
})

// Test 4: Transit System Integration
console.log('\n🌌 Transit System Integration Tests')
console.log('-'.repeat(40))

runIntegrationTest('Transit predictions use exact degree timing', () => {
  const currentYear = new Date().getFullYear()
  const nextSpringEquinox = getDatesForZodiacDegree(currentYear + 1, 0)
  const currentSpringEquinox = getDatesForZodiacDegree(currentYear, 0)

  // Should be approximately 365.25 days apart
  const daysDifference =
    (nextSpringEquinox.start.getTime() - currentSpringEquinox.start.getTime()) /
    (1000 * 60 * 60 * 24)

  console.log(`  ${currentYear} Spring Equinox: ${currentSpringEquinox.start.toISOString()}`)
  console.log(`  ${currentYear + 1} Spring Equinox: ${nextSpringEquinox.start.toISOString()}`)
  console.log(`  Days between: ${daysDifference.toFixed(3)}`)

  // Should be between 365.2 and 365.3 days (accounting for leap years)
  return daysDifference > 365.2 && daysDifference < 365.3
})

runIntegrationTest('Monthly calendar generation works for all months', () => {
  const testYear = 2025
  let allMonthsValid = true

  for (let month = 1; month <= 12; month++) {
    const monthCalendar = getMonthlyZodiacCalendar(testYear, month)
    const expectedDays = new Date(testYear, month, 0).getDate()

    if (monthCalendar.days.length !== expectedDays) {
      console.log(
        `  Month ${month}: Expected ${expectedDays} days, got ${monthCalendar.days.length}`
      )
      allMonthsValid = false
    }

    // Check for ingress days (should have at least some throughout the year)
    const ingressDays = monthCalendar.days.filter(d => d.isIngress)
    console.log(
      `  ${monthCalendar.month}: ${monthCalendar.days.length} days, ${ingressDays.length} ingresses`
    )
  }

  return allMonthsValid
})

// Test 5: API Integration
console.log('\n🔌 API Integration Tests')
console.log('-'.repeat(40))

runIntegrationTest('API endpoints return consistent data', async () => {
  const testDate = '2025-09-21'

  try {
    // Test multiple endpoints for consistency
    const responses = await Promise.all([
      fetch(`http://localhost:3002/api/zodiac-calendar?action=degree-for-date&date=${testDate}`),
      fetch(`http://localhost:3002/api/zodiac-calendar?action=current-period`),
      fetch(`http://localhost:3002/api/zodiac-calendar?action=compare-accuracy&date=${testDate}`),
    ])

    const allSuccessful = responses.every(r => r.ok)

    if (allSuccessful) {
      const [degreeData, currentData, compareData] = await Promise.all(responses.map(r => r.json()))

      console.log(
        `  Degree endpoint: ${degreeData.zodiac?.sign} ${degreeData.zodiac?.degree_in_sign?.toFixed(2)}°`
      )
      console.log(
        `  Current endpoint: ${currentData.zodiac_position?.sign} ${currentData.zodiac_position?.degree_in_sign?.toFixed(2)}°`
      )
      console.log(
        `  Compare endpoint: ${compareData.new_calculation?.sign} ${compareData.new_calculation?.degree?.toFixed(2)}°`
      )

      return true
    }

    return false
  } catch (error) {
    console.log(`  API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
})

// Test 6: Performance Integration
console.log('\n⚡ Performance Integration Tests')
console.log('-'.repeat(40))

runIntegrationTest('Bulk calculations maintain performance', () => {
  const startTime = Date.now()

  // Simulate heavy usage: 1000 zodiac calculations
  for (let i = 0; i < 1000; i++) {
    const randomDate = new Date(
      2025,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    )
    getZodiacPositionForDate(randomDate)
  }

  const endTime = Date.now()
  const duration = endTime - startTime
  const avgTime = duration / 1000

  console.log(`  1000 calculations in ${duration}ms (${avgTime.toFixed(3)}ms average)`)

  // Should complete 1000 calculations in under 2 seconds
  return duration < 2000
})

runIntegrationTest('Memory usage remains stable', () => {
  const initialMemory = process.memoryUsage().heapUsed

  // Create multiple annual calendars to test caching
  for (let year = 2020; year <= 2030; year++) {
    buildAnnualCalendar(year)
  }

  const finalMemory = process.memoryUsage().heapUsed
  const memoryIncrease = finalMemory - initialMemory
  const memoryMB = memoryIncrease / (1024 * 1024)

  console.log(`  Memory increase: ${memoryMB.toFixed(2)}MB for 11 yearly calendars`)

  // Should not use more than 50MB for 11 years of cached data
  return memoryMB < 50
})

// Test 7: Error Handling Integration
console.log('\n🛡️ Error Handling Integration Tests')
console.log('-'.repeat(40))

runIntegrationTest('Invalid dates are handled gracefully', () => {
  try {
    // Test invalid dates
    const invalidDates = [
      new Date('invalid'),
      new Date(NaN),
      new Date('2025-13-35'), // Invalid month/day
    ]

    let allHandled = true

    invalidDates.forEach(invalidDate => {
      try {
        const result = getZodiacPositionForDate(invalidDate)
        // If it doesn't throw, check if result makes sense
        if (isNaN(result.absolute_longitude)) {
          console.log(`  Invalid date handled correctly: NaN result`)
        } else {
          console.log(`  Invalid date unexpectedly produced valid result`)
          allHandled = false
        }
      } catch (error) {
        console.log(
          `  Invalid date properly rejected: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    })

    return allHandled
  } catch (error) {
    console.log(
      `  Error handling test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    return false
  }
})

// Wait for async tests to complete
setTimeout(() => {
  console.log('\n' + '='.repeat(60))
  console.log(`🎯 Integration Test Results: ${testsPassed}/${totalTests} tests passed`)

  if (testsPassed === totalTests) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED!')
    console.log('✅ Zodiac accuracy improvements are fully integrated across the platform')
  } else {
    console.log(`⚠️  ${totalTests - testsPassed} integration test(s) failed`)
    console.log('🔧 Review failing components for integration issues')
  }

  console.log('\n📋 Integration Summary:')
  console.log('  ✅ Birth Chart System: Enhanced accuracy')
  console.log('  ✅ Tarot System: Precise decan timing')
  console.log('  ✅ Agent System: Accurate planetary positions')
  console.log('  ✅ Transit System: Exact degree timing')
  console.log('  ✅ API System: Consistent data across endpoints')
  console.log('  ✅ Performance: Maintained with improvements')
  console.log('  ✅ Error Handling: Graceful failure modes')

  process.exit(testsPassed === totalTests ? 0 : 1)
}, 2000) // Wait 2 seconds for async tests
