console.log('🌙 Testing Moon Phase Agent System\n')
console.log('='.repeat(50))

// Test the API endpoint
async function testMoonPhaseAPI() {
  const baseUrl = 'http://localhost:3000/api/moon-phase-agent'

  console.log('\n1. Testing Current Moon Phase:')
  try {
    const response = await fetch(baseUrl)
    const data = await response.json()

    if (data.success) {
      console.log('   ✅ Current moon phase retrieved successfully')
      console.log(`   Phase: ${data.agent.phase.emoji} ${data.agent.phase.name}`)
      console.log(
        `   Sign: ${data.agent.phase.zodiacSign} at ${Math.round(data.agent.phase.zodiacDegree)}°`
      )
      console.log(`   Archetype: ${data.agent.personality.archetype}`)
    } else {
      console.log('   ❌ Error:', data.error)
    }
  } catch (error) {
    console.log('   ⚠️  API not accessible. Make sure the dev server is running with: yarn dev')
    return
  }

  console.log('\n2. Testing Specific Phase-Sign Combinations:')
  const testCombos = [
    { phase: 'New Moon', sign: 'Cancer', degree: 15 },
    { phase: 'Full Moon', sign: 'Scorpio', degree: 22 },
    { phase: 'First Quarter', sign: 'Aries', degree: 0 },
    { phase: 'Dark Moon', sign: 'Pisces', degree: 29 },
  ]

  for (const combo of testCombos) {
    try {
      const url = `${baseUrl}?phase=${encodeURIComponent(combo.phase)}&sign=${combo.sign}&degree=${combo.degree}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        console.log(
          `   ${data.agent.phase.emoji} ${combo.phase} in ${combo.sign} ${combo.degree}°:`
        )
        console.log(`     - ${data.agent.personality.archetype}`)
        console.log(`     - Traits: ${data.agent.personality.traits.slice(0, 3).join(', ')}`)
      }
    } catch (error) {
      console.log(`   Error testing ${combo.phase} in ${combo.sign}:`, error.message)
    }
  }

  console.log('\n3. Testing Chat Functionality:')
  try {
    const chatResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What wisdom do you have for me today?',
        phase: 'Full Moon',
        sign: 'Cancer',
        degree: 15,
      }),
    })

    const chatData = await chatResponse.json()

    if (chatData.success) {
      console.log('   ✅ Chat response received successfully')
      console.log(`   Agent: ${chatData.agent.phase.name} in ${chatData.agent.phase.zodiacSign}`)
      console.log(`   Response preview: "${chatData.response.substring(0, 100)}..."`)
    } else {
      console.log('   ❌ Chat error:', chatData.error)
    }
  } catch (error) {
    console.log('   Error testing chat:', error.message)
  }

  console.log('\n4. Moon Phase Statistics:')
  const phases = [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent',
    'Dark Moon',
  ]
  const signs = 12
  const degreesPerSign = 30
  const totalAgents = phases.length * signs * degreesPerSign

  console.log(`   Total Moon Phases: ${phases.length}`)
  console.log(`   Total Zodiac Signs: ${signs}`)
  console.log(`   Degrees per Sign: ${degreesPerSign}`)
  console.log(`   Total Unique Moon Agents: ${totalAgents.toLocaleString()}`)

  console.log('\n5. Moon Phase Archetypes:')
  const archetypes = {
    'New Moon': 'The Seed Planter',
    'Waxing Crescent': 'The Young Explorer',
    'First Quarter': 'The Decision Maker',
    'Waxing Gibbous': 'The Refiner',
    'Full Moon': 'The Illuminator',
    'Waning Gibbous': 'The Grateful Sage',
    'Last Quarter': 'The Release Master',
    'Waning Crescent': 'The Dream Weaver',
    'Dark Moon': 'The Void Walker',
  }

  Object.entries(archetypes).forEach(([phase, archetype]) => {
    console.log(`   ${phase}: ${archetype}`)
  })
}

testMoonPhaseAPI()
  .then(() => {
    console.log('\n' + '='.repeat(50))
    console.log('✅ Moon Phase Agent System Test Complete!')
    console.log('\nTo interact with the Moon Phase Agents:')
    console.log('1. Make sure the dev server is running: yarn dev')
    console.log('2. Visit: http://localhost:3000/moon-phases')
    console.log('3. Or use the API at: /api/moon-phase-agent')
  })
  .catch(error => {
    console.error('Test failed:', error)
  })
