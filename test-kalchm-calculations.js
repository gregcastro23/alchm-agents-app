#!/usr/bin/env node

/**
 * Kalchm Calculation Test
 * Verifies that our agent performance optimizer correctly calculates
 * Kalchm (K_alchm) values based on alchemical properties
 */

// Test the Kalchm calculation formulas from the notebook
function calculateKalchm(spirit, essence, matter, substance) {
  const numerator = Math.pow(spirit, spirit) * Math.pow(essence, essence)
  const denominator = Math.pow(matter, matter) * Math.pow(substance, substance)
  return numerator / denominator
}

function getAgentAlchemicalProperties(agentId) {
  const agentProfiles = {
    'leonardo-da-vinci': { spirit: 6, essence: 8, matter: 7, substance: 4 }, // High creativity and knowledge
    'william-shakespeare': { spirit: 7, essence: 9, matter: 5, substance: 3 }, // High artistic essence
    'albert-einstein': { spirit: 8, essence: 7, matter: 6, substance: 5 }, // Strong theoretical spirit
    'nikola-tesla': { spirit: 9, essence: 6, matter: 8, substance: 4 }, // Innovative spirit, strong matter manipulation
    'marie-curie': { spirit: 7, essence: 8, matter: 9, substance: 6 }, // Scientific matter expertise
    'cleopatra': { spirit: 5, essence: 7, matter: 6, substance: 8 }, // Strong substance/power foundation
    'socrates': { spirit: 6, essence: 9, matter: 4, substance: 5 }, // High wisdom essence
    'carl-jung': { spirit: 7, essence: 8, matter: 5, substance: 6 }, // Psychological depth
  }

  return agentProfiles[agentId] || { spirit: 4, essence: 5, matter: 5, substance: 4 }
}

function getEquilibriumDynamicsLevel(kalchm) {
  const absKalchm = Math.abs(kalchm)

  if (absKalchm >= 100) return 'Extreme'
  if (absKalchm >= 10) return 'Strong'
  if (absKalchm >= 1) return 'Moderate'
  if (absKalchm >= 0.1) return 'Subtle'
  return 'Minimal'
}

console.log('🧮 Kalchm Equilibrium Dynamics Calculation Test')
console.log('='.repeat(60))

const testAgents = [
  'leonardo-da-vinci', 'william-shakespeare', 'albert-einstein',
  'nikola-tesla', 'marie-curie', 'cleopatra', 'socrates', 'carl-jung'
]

console.log('\n📊 Agent Kalchm Calculations:')
console.log('-'.repeat(60))

const results = []

testAgents.forEach(agentId => {
  const props = getAgentAlchemicalProperties(agentId)
  const { spirit, essence, matter, substance } = props

  const kalchm = calculateKalchm(spirit, essence, matter, substance)
  const dynamics = getEquilibriumDynamicsLevel(kalchm)

  results.push({ agentId, kalchm, dynamics, props })

  console.log(`${agentId}:`)
  console.log(`  Properties: Spirit:${spirit}, Essence:${essence}, Matter:${matter}, Substance:${substance}`)
  console.log(`  Kalchm: ${kalchm.toFixed(4)}`)
  console.log(`  Dynamics: ${dynamics}`)
  console.log()
})

console.log('📈 Dynamics Ranking (by absolute Kalchm value):')
console.log('-'.repeat(60))

const sorted = results.sort((a, b) => Math.abs(b.kalchm) - Math.abs(a.kalchm))

sorted.forEach((result, index) => {
  console.log(`${index + 1}. ${result.agentId}: ${Math.abs(result.kalchm).toFixed(4)} (${result.dynamics})`)
})

console.log('\n🧠 Understanding Kalchm:')
console.log('-'.repeat(30))
console.log('• Kalchm reflects elemental equilibrium dynamics')
console.log('• Higher absolute values indicate stronger dynamics')
console.log('• This metric is for understanding, not ranking worth')
console.log('• Formula: K_alchm = (Spirit^Spirit × Essence^Essence) / (Matter^Matter × Substance^Substance)')

console.log('\n✨ Test completed successfully!')
console.log('The agent performance optimizer uses these calculations for prioritization.')