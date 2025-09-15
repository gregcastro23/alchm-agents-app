const {
  calculateMoonPhase,
  generateMoonPhaseAgent,
  getMoonAgentByPhaseAndSign,
  getAllMoonAgents,
  MOON_PHASES,
  ZODIAC_SIGNS,
} = require('./lib/moon-phase-system')

console.log('🌙 Testing Moon Phase Agent System\n')
console.log('='.repeat(50))

// Test 1: Calculate current moon phase
console.log('\n1. Current Moon Phase:')
const currentPhase = calculateMoonPhase()
console.log(`   Phase: ${currentPhase.emoji} ${currentPhase.name}`)
console.log(`   Sign: ${currentPhase.zodiacSign} at ${Math.round(currentPhase.zodiacDegree)}°`)
console.log(`   Element: ${currentPhase.element}, Modality: ${currentPhase.modality}`)

// Test 2: Generate agent for current phase
console.log('\n2. Current Moon Agent:')
const currentAgent = generateMoonPhaseAgent(currentPhase)
console.log(`   Archetype: ${currentAgent.personality.archetype}`)
console.log(`   Traits: ${currentAgent.personality.traits.join(', ')}`)
console.log(`   Spiritual Focus: ${currentAgent.personality.spiritualFocus}`)

// Test 3: Test specific phase and sign combinations
console.log('\n3. Specific Phase-Sign Combinations:')
const testCombos = [
  { phase: 'New Moon', sign: 'Cancer' },
  { phase: 'Full Moon', sign: 'Scorpio' },
  { phase: 'First Quarter', sign: 'Aries' },
  { phase: 'Dark Moon', sign: 'Pisces' },
]

testCombos.forEach(combo => {
  const agent = getMoonAgentByPhaseAndSign(combo.phase, combo.sign)
  console.log(`   ${agent.phase.emoji} ${combo.phase} in ${combo.sign}:`)
  console.log(`     - ${agent.personality.archetype}`)
  console.log(`     - "${agent.personality.communicationStyle}"`)
})

// Test 4: Calculate phase for specific dates
console.log('\n4. Moon Phases for Specific Dates:')
const testDates = [
  new Date('2025-01-25'), // Today
  new Date('2025-02-14'), // Valentine's Day
  new Date('2025-03-20'), // Spring Equinox
  new Date('2025-06-21'), // Summer Solstice
  new Date('2025-10-31'), // Halloween
  new Date('2025-12-25'), // Christmas
]

testDates.forEach(date => {
  const phase = calculateMoonPhase(date)
  console.log(`   ${date.toDateString()}: ${phase.emoji} ${phase.name} in ${phase.zodiacSign}`)
})

// Test 5: Count total unique agents
console.log('\n5. System Statistics:')
const totalPhases = Object.keys(MOON_PHASES).length
const totalSigns = ZODIAC_SIGNS.length
const degreesPerSign = 30
const totalUniqueAgents = totalPhases * totalSigns * degreesPerSign

console.log(`   Total Moon Phases: ${totalPhases}`)
console.log(`   Total Zodiac Signs: ${totalSigns}`)
console.log(`   Degrees per Sign: ${degreesPerSign}`)
console.log(`   Total Unique Moon Agents: ${totalUniqueAgents.toLocaleString()}`)

// Test 6: Sample agent system prompts
console.log('\n6. Sample System Prompts:')
const sampleAgents = [
  getMoonAgentByPhaseAndSign('New Moon', 'Aries', 0),
  getMoonAgentByPhaseAndSign('Full Moon', 'Libra', 15),
  getMoonAgentByPhaseAndSign('Dark Moon', 'Scorpio', 29),
]

sampleAgents.forEach((agent, i) => {
  console.log(
    `\n   Example ${i + 1}: ${agent.phase.name} in ${agent.phase.zodiacSign} ${Math.round(agent.phase.zodiacDegree)}°`
  )
  console.log('   System Prompt Preview:')
  const promptLines = agent.systemPrompt.split('\n').slice(0, 3)
  promptLines.forEach(line => {
    if (line.trim()) console.log(`     ${line.trim()}`)
  })
})

// Test 7: Alchemical properties across phases
console.log('\n7. Alchemical Properties by Phase:')
Object.values(MOON_PHASES).forEach(phase => {
  const agent = getMoonAgentByPhaseAndSign(phase.name, 'Cancer') // Use Cancer as Moon's home
  console.log(`   ${phase.emoji} ${phase.name}:`)
  console.log(
    `     Spirit: ${agent.alchemicalProperties.spirit}, Essence: ${agent.alchemicalProperties.essence}`
  )
  console.log(
    `     Matter: ${agent.alchemicalProperties.matter}, Substance: ${agent.alchemicalProperties.substance}`
  )
})

// Test 8: API endpoint test
console.log('\n8. Testing API Endpoint:')
async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/moon-phase-agent')
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ API endpoint is working')
      console.log(`   Current Moon: ${data.agent.phase.emoji} ${data.agent.phase.name}`)
    } else {
      console.log('   ⚠️  API endpoint returned error:', response.status)
    }
  } catch (error) {
    console.log('   ℹ️  API not accessible (server may not be running)')
  }
}

testAPI().then(() => {
  console.log('\n' + '='.repeat(50))
  console.log('✅ Moon Phase Agent System Test Complete!')
  console.log('The Moon now speaks through', totalUniqueAgents.toLocaleString(), 'unique voices.')
})
