// Test script for the historical transit system

const { identifyPlanetaryThemes, findHistoricalPatterns } = require('./lib/transit-patterns')
const { getTransitsByPlanet, getCurrentTransits } = require('./lib/historical-transit-data')
const { findLastOccurrence, findNextOccurrence } = require('./lib/historical-transits')

async function testHistoricalSystem() {
  console.log('🧪 Testing Historical Transit System\n')
  
  // Test 1: Get Jupiter transits
  console.log('📅 Test 1: Jupiter Historical Transits')
  try {
    const jupiterTransits = getTransitsByPlanet('Jupiter')
    console.log(`Found ${jupiterTransits.length} Jupiter transits`)
    console.log('Recent Jupiter transit:', jupiterTransits[jupiterTransits.length - 1])
  } catch (error) {
    console.error('❌ Error getting Jupiter transits:', error.message)
  }
  console.log('')
  
  // Test 2: Current transits
  console.log('⏰ Test 2: Current Transits')
  try {
    const currentTransits = getCurrentTransits()
    console.log(`Found ${currentTransits.length} active transits:`)
    currentTransits.forEach(transit => {
      console.log(`- ${transit.planet} in ${transit.sign} (${transit.startDate} to ${transit.endDate})`)
    })
  } catch (error) {
    console.error('❌ Error getting current transits:', error.message)
  }
  console.log('')
  
  // Test 3: Planetary themes
  console.log('🎭 Test 3: Planetary Themes')
  try {
    const themes = identifyPlanetaryThemes('Jupiter', 'Gemini')
    console.log('Jupiter in Gemini themes:')
    console.log('- Themes:', themes.themes?.slice(0, 3))
    console.log('- Archetypes:', themes.archetypes?.slice(0, 2))
    console.log('- Historical examples:', themes.historicalExamples?.slice(0, 2))
  } catch (error) {
    console.error('❌ Error getting themes:', error.message)
  }
  console.log('')
  
  // Test 4: Historical patterns
  console.log('📊 Test 4: Historical Patterns')
  try {
    const patterns = findHistoricalPatterns('Saturn', 'Aquarius')
    console.log('Saturn in Aquarius patterns:')
    patterns.forEach(pattern => {
      console.log(`- ${pattern.pattern}: ${pattern.frequency}`)
      console.log(`  Examples: ${pattern.examples.slice(0, 2).join(', ')}`)
    })
  } catch (error) {
    console.error('❌ Error getting patterns:', error.message)
  }
  console.log('')
  
  // Test 5: Last/Next occurrences (using approximations)
  console.log('🔍 Test 5: Last/Next Occurrences')
  try {
    const lastJupiterAries = findLastOccurrence('Jupiter', 'Aries', 15)
    const nextJupiterAries = findNextOccurrence('Jupiter', 'Aries', 15)
    
    console.log('Jupiter at 15° Aries:')
    if (lastJupiterAries) {
      console.log(`- Last occurred: ${lastJupiterAries.date.toISOString().split('T')[0]}`)
    }
    if (nextJupiterAries) {
      console.log(`- Next occurrence: ${nextJupiterAries.date.toISOString().split('T')[0]}`)
    }
  } catch (error) {
    console.error('❌ Error finding occurrences:', error.message)
  }
  console.log('')
  
  console.log('✅ Historical system test completed!')
}

// Run the test
testHistoricalSystem()
  .catch(error => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })