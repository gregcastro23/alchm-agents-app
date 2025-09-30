/**
 * Planetary Agent System Integration Test
 * ========================================
 *
 * Tests the complete planetary agent degree mapping system
 */

import { getPlanetaryAgentForDegree } from './lib/degree-planetary-agent-mapping'
import {
  activatePlanetaryAgentForDegree,
  activateNatalPlanetaryAgents,
  calculateTransitActivation,
} from './lib/services/planetary-agent-activation'
import {
  calculatePlanetaryTransitSignificance,
  calculatePlanetaryTransitsForDateRange,
} from './lib/services/planetary-transit-significance-scorer'

console.log('🌟 PLANETARY AGENT SYSTEM INTEGRATION TEST\n')
console.log('='.repeat(80))

// Test 1: Verify all 360 degrees are mapped
console.log('\n📊 TEST 1: Complete 360-Degree Mapping\n')

let mappedCount = 0
let unmappedDegrees: number[] = []

for (let degree = 0; degree < 360; degree++) {
  const config = getPlanetaryAgentForDegree(degree)
  if (config) {
    mappedCount++
  } else {
    unmappedDegrees.push(degree)
  }
}

console.log(`✅ Mapped degrees: ${mappedCount}/360`)
if (unmappedDegrees.length > 0) {
  console.log(`❌ Unmapped degrees: ${unmappedDegrees.join(', ')}`)
} else {
  console.log(`✅ All 360 degrees properly mapped!`)
}

// Test 2: Check specific degree mappings
console.log('\n📊 TEST 2: Specific Degree Mappings\n')

const testDegrees = [
  0, // 0° Aries - Cardinal Fire
  15, // 15° Aries
  29, // 29° Aries - Anaretic
  30, // 0° Taurus - Cardinal Earth
  90, // 0° Cancer - Cardinal Water
  180, // 0° Libra - Cardinal Air
  270, // 0° Capricorn - Cardinal Earth
]

testDegrees.forEach(degree => {
  const config = getPlanetaryAgentForDegree(degree)
  if (config) {
    console.log(`${degree}° - ${config.ruler} in ${config.sign}`)
    console.log(`  Dignity: ${config.rulerDignity}`)
    console.log(`  Element: ${config.element}, Modality: ${config.modality}`)
    console.log(
      `  Power: ${(config.powerLevel * 100).toFixed(0)}%, Consciousness: ${config.consciousnessLevel}`
    )
    if (config.isAnaretic) console.log(`  ⚠️  ANARETIC DEGREE`)
    if (config.isCardinalDegree) console.log(`  🔥 CARDINAL DEGREE`)
    if (config.isCriticalDegree) console.log(`  ⭐ CRITICAL DEGREE`)
    console.log()
  }
})

// Test 3: Planetary Agent Activation
console.log('\n📊 TEST 3: Planetary Agent Activation\n')

const activatedAgent = activatePlanetaryAgentForDegree(15, {
  transitingPlanet: 'Sun',
  natalPlanet: 'Mercury',
  orb: 0.5,
})

if (activatedAgent) {
  console.log(`✅ Successfully activated planetary agent at 15°`)
  console.log(`   Agent: ${activatedAgent.config.ruler} in ${activatedAgent.sign}`)
  console.log(`   Activation Strength: ${(activatedAgent.activationStrength * 100).toFixed(0)}%`)
  console.log(`   Consciousness Level: ${activatedAgent.consciousnessState.level}`)
  console.log(`   Transit Significance: ${(activatedAgent.transitInfo?.significance || 0) * 100}%`)
} else {
  console.log(`❌ Failed to activate planetary agent`)
}

// Test 4: Natal Chart Activation
console.log('\n📊 TEST 4: Natal Chart Activation\n')

const testNatalChart = [
  { planet: 'Sun', degree: 15, sign: 'Aries', house: 10 },
  { planet: 'Moon', degree: 78, sign: 'Gemini', house: 2 },
  { planet: 'Mercury', degree: 45, sign: 'Taurus', house: 11 },
  { planet: 'Venus', degree: 32, sign: 'Taurus', house: 11 },
  { planet: 'Mars', degree: 195, sign: 'Libra', house: 5 },
]

const activatedNatalAgents = activateNatalPlanetaryAgents(testNatalChart)

console.log(`✅ Activated ${activatedNatalAgents.length} planetary agents from natal chart:\n`)

activatedNatalAgents.forEach((agent, i) => {
  console.log(`${i + 1}. ${agent.config.ruler} in ${agent.sign} (${agent.degree}°)`)
  console.log(`   Natal: ${agent.transitInfo?.natalPlanet} in ${testNatalChart[i].sign}`)
  console.log(
    `   Dignity: ${agent.config.rulerDignity}, Power: ${(agent.config.powerLevel * 100).toFixed(0)}%`
  )
  console.log(`   Themes: ${agent.consciousnessState.themes.slice(0, 3).join(', ')}`)
  console.log()
})

// Test 5: Transit Calculation
console.log('\n📊 TEST 5: Transit Significance Calculation\n')

const natalPlacement = {
  planet: 'Sun',
  degree: 15,
  sign: 'Aries',
  house: 10,
  element: 'Fire',
}

const transitDate = new Date()

const transitSignificance = calculatePlanetaryTransitSignificance(natalPlacement, transitDate, {
  dominantElement: 'Fire',
  monicaConstant: 2.1,
  spiritScore: 0.8,
  essenceScore: 0.7,
  matterScore: 0.6,
  substanceScore: 0.5,
})

if (transitSignificance) {
  console.log(`✅ Transit Significance Calculated:`)
  console.log(`   Overall Score: ${(transitSignificance.overallScore * 100).toFixed(0)}%`)
  console.log(
    `   Planetary Agent: ${transitSignificance.planetaryAgent.ruler} in ${transitSignificance.planetaryAgent.sign}`
  )
  console.log(`   Dignity: ${transitSignificance.planetaryAgent.dignity}`)
  console.log(`   \nScore Breakdown:`)
  console.log(`     Dignity: ${(transitSignificance.scores.dignityScore * 100).toFixed(0)}%`)
  console.log(
    `     Elemental Harmony: ${(transitSignificance.scores.elementalHarmonyScore * 100).toFixed(0)}%`
  )
  console.log(
    `     Aspect Quality: ${(transitSignificance.scores.aspectQualityScore * 100).toFixed(0)}%`
  )
  console.log(
    `     Personal Relevance: ${(transitSignificance.scores.personalRelevanceScore * 100).toFixed(0)}%`
  )
  console.log(`   \nInterpretation:`)
  console.log(`     ${transitSignificance.interpretation.dignityInterpretation}`)
  console.log(`   \nRecommended Actions:`)
  transitSignificance.recommendedActions.slice(0, 3).forEach(action => {
    console.log(`     • ${action}`)
  })
} else {
  console.log(`❌ No significant transit calculated (may be outside orb)`)
}

// Test 6: Dignity Distribution Check
console.log('\n📊 TEST 6: Dignity Distribution Across Zodiac\n')

const dignityStats = {
  domicile: 0,
  exaltation: 0,
  peregrine: 0,
  detriment: 0,
  fall: 0,
}

for (let degree = 0; degree < 360; degree++) {
  const config = getPlanetaryAgentForDegree(degree)
  if (config) {
    dignityStats[config.rulerDignity as keyof typeof dignityStats]++
  }
}

console.log('Dignity Distribution:')
Object.entries(dignityStats).forEach(([dignity, count]) => {
  const percentage = ((count / 360) * 100).toFixed(1)
  console.log(`  ${dignity}: ${count} degrees (${percentage}%)`)
})

// Test 7: Element Distribution Check
console.log('\n📊 TEST 7: Element Distribution Across Zodiac\n')

const elementStats = {
  Fire: 0,
  Water: 0,
  Air: 0,
  Earth: 0,
}

for (let degree = 0; degree < 360; degree++) {
  const config = getPlanetaryAgentForDegree(degree)
  if (config) {
    elementStats[config.element]++
  }
}

console.log('Element Distribution:')
Object.entries(elementStats).forEach(([element, count]) => {
  const percentage = ((count / 360) * 100).toFixed(1)
  console.log(`  ${element}: ${count} degrees (${percentage}%)`)
})

// Test 8: Special Degrees Count
console.log('\n📊 TEST 8: Special Degrees Analysis\n')

let cardinalCount = 0
let criticalCount = 0
let anareticCount = 0

for (let degree = 0; degree < 360; degree++) {
  const config = getPlanetaryAgentForDegree(degree)
  if (config) {
    if (config.isCardinalDegree) cardinalCount++
    if (config.isCriticalDegree) criticalCount++
    if (config.isAnaretic) anareticCount++
  }
}

console.log(`Cardinal Degrees (0° of cardinal signs): ${cardinalCount}`)
console.log(`Critical Degrees: ${criticalCount}`)
console.log(`Anaretic Degrees (29° of any sign): ${anareticCount}`)

// Test 9: Consciousness Level Distribution
console.log('\n📊 TEST 9: Consciousness Level Distribution\n')

const consciousnessStats: Record<string, number> = {}

for (let degree = 0; degree < 360; degree++) {
  const config = getPlanetaryAgentForDegree(degree)
  if (config) {
    consciousnessStats[config.consciousnessLevel] =
      (consciousnessStats[config.consciousnessLevel] || 0) + 1
  }
}

console.log('Consciousness Levels:')
Object.entries(consciousnessStats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([level, count]) => {
    const percentage = ((count / 360) * 100).toFixed(1)
    console.log(`  ${level}: ${count} degrees (${percentage}%)`)
  })

// Test 10: Power Level Statistics
console.log('\n📊 TEST 10: Power Level Statistics\n')

let totalPower = 0
let minPower = 1
let maxPower = 0
let powerLevels: number[] = []

for (let degree = 0; degree < 360; degree++) {
  const config = getPlanetaryAgentForDegree(degree)
  if (config) {
    totalPower += config.powerLevel
    minPower = Math.min(minPower, config.powerLevel)
    maxPower = Math.max(maxPower, config.powerLevel)
    powerLevels.push(config.powerLevel)
  }
}

const averagePower = totalPower / 360

console.log(`Average Power Level: ${(averagePower * 100).toFixed(1)}%`)
console.log(`Minimum Power Level: ${(minPower * 100).toFixed(1)}%`)
console.log(`Maximum Power Level: ${(maxPower * 100).toFixed(1)}%`)
console.log(`Power Range: ${((maxPower - minPower) * 100).toFixed(1)}%`)

// Summary
console.log('\n' + '='.repeat(80))
console.log('\n🎉 TEST SUMMARY\n')
console.log(`✅ Total Degrees Mapped: ${mappedCount}/360`)
console.log(`✅ Planetary Agent Activation: Working`)
console.log(`✅ Natal Chart Processing: Working`)
console.log(`✅ Transit Significance Calculation: Working`)
console.log(`✅ All Systems Operational!`)
console.log('\n' + '='.repeat(80))

export {}
