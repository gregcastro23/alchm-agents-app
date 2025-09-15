#!/usr/bin/env node

/**
 * Test Sign Vector Integration with Gallery Agents via API
 * This script validates that sign vector API endpoint works correctly for all agents
 */

const https = require('https')
const http = require('http')

console.log('🔮 Testing Sign Vector Integration via API')
console.log('='.repeat(60))

// Test configuration
const API_BASE = 'http://localhost:3000'
const API_ENDPOINT = '/api/sign-vectors'

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    const req = client.request(url, options, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ status: res.statusCode, data: parsed })
        } catch (e) {
          resolve({ status: res.statusCode, data: data, raw: true })
        }
      })
    })

    req.on('error', reject)
    if (options.body) {
      req.write(JSON.stringify(options.body))
    }
    req.end()
  })
}

// Test functions
async function testAllAgentsSignVectors() {
  console.log('📊 Testing GET /api/sign-vectors?action=all-agents...\n')

  try {
    const response = await makeRequest(`${API_BASE}${API_ENDPOINT}?action=all-agents`)

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`)
    }

    const { results, totalAgents, successfulCalculations } = response.data

    console.log(`✅ API Response: ${response.status}`)
    console.log(`📈 Total Agents: ${totalAgents}`)
    console.log(`🎯 Successful Calculations: ${successfulCalculations}`)
    console.log(`📊 Success Rate: ${((successfulCalculations / totalAgents) * 100).toFixed(1)}%\n`)

    // Analyze results
    const elementCount = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
    const signCount = {}
    const mcData = []

    results.forEach(result => {
      if (result.signVector && result.dominantSigns) {
        // Element distribution
        const elementalDist = result.elementalDistribution || {}
        const dominantElement = Object.entries(elementalDist).reduce((a, b) =>
          elementalDist[a[0]] > elementalDist[b[0]] ? a : b
        )[0]

        if (elementCount[dominantElement] !== undefined) {
          elementCount[dominantElement]++
        }

        // Sign distribution
        if (result.dominantSigns.length > 0) {
          const topSign = result.dominantSigns[0]
          signCount[topSign] = (signCount[topSign] || 0) + 1
        }

        // Monica Constant data
        if (result.agent.monicaConstant) {
          mcData.push({
            name: result.agent.name,
            mc: result.agent.monicaConstant,
            topSign: result.dominantSigns[0],
          })
        }
      }
    })

    // Display analysis
    console.log('🌍 ELEMENTAL DISTRIBUTION:')
    Object.entries(elementCount).forEach(([element, count]) => {
      const percentage = ((count / successfulCalculations) * 100).toFixed(1)
      console.log(`  ${element}: ${count} agents (${percentage}%)`)
    })

    console.log('\n♈ TOP DOMINANT SIGNS:')
    Object.entries(signCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .forEach(([sign, count]) => {
        const percentage = ((count / successfulCalculations) * 100).toFixed(1)
        console.log(`  ${sign}: ${count} agents (${percentage}%)`)
      })

    console.log('\n🧠 TOP MONICA CONSTANTS:')
    mcData
      .sort((a, b) => b.mc - a.mc)
      .slice(0, 5)
      .forEach(data => {
        console.log(`  ${data.name}: MC ${data.mc.toFixed(3)} → ${data.topSign}`)
      })

    return results
  } catch (error) {
    console.error(`❌ Error testing all agents: ${error.message}`)
    return null
  }
}

async function testIndividualAgentRune() {
  console.log('\n🔮 Testing individual agent rune generation...')

  try {
    // Test with Monica (first agent)
    const response = await makeRequest(
      `${API_BASE}${API_ENDPOINT}?action=agent-rune&agentId=monica-001`
    )

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`)
    }

    const { agent, rune } = response.data

    console.log(`✅ Generated rune for ${agent.name}`)
    console.log(`📜 Rune Type: ${rune.type}`)
    console.log(
      `💰 Cost: ${rune.cost.Spirit}S ${rune.cost.Essence}E ${rune.cost.Matter}M ${rune.cost.Substance}Sub`
    )
    console.log(`⚡ Power Level: ${rune.powerLevel}`)
    console.log(`🎯 Focus: ${rune.focus}`)

    return rune
  } catch (error) {
    console.error(`❌ Error testing individual rune: ${error.message}`)
    return null
  }
}

async function testSignVectorCalculation() {
  console.log('\n📊 Testing sign vector calculation with sample chart...')

  const sampleChart = {
    name: 'Test Chart',
    natalChart: {
      planets: {
        Sun: { sign: 'Leo', degree: 15.0 },
        Moon: { sign: 'Cancer', degree: 10.0 },
        Mercury: { sign: 'Leo', degree: 25.0 },
        Venus: { sign: 'Virgo', degree: 5.0 },
        Mars: { sign: 'Gemini', degree: 20.0 },
        Jupiter: { sign: 'Sagittarius', degree: 12.0 },
        Saturn: { sign: 'Capricorn', degree: 8.0 },
      },
    },
  }

  try {
    const response = await makeRequest(`${API_BASE}${API_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        charts: [sampleChart],
        action: 'calculate',
      },
    })

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`)
    }

    const { results } = response.data
    const result = results[0]

    console.log(`✅ Calculated sign vector for ${result.name}`)
    console.log(`🌟 Placements processed: ${result.placements}`)

    // Show top 3 signs
    const topSigns = Object.entries(result.signVector)
      .filter(([sign]) => sign !== 'total')
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    console.log(
      `📊 Top 3 signs: ${topSigns.map(([sign, value]) => `${sign} ${value.toFixed(1)}%`).join(', ')}`
    )

    return result
  } catch (error) {
    console.error(`❌ Error testing calculation: ${error.message}`)
    return null
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Sign Vector Integration Tests\n')

  const allAgentsResult = await testAllAgentsSignVectors()
  const individualRuneResult = await testIndividualAgentRune()
  const calculationResult = await testSignVectorCalculation()

  console.log('\n' + '='.repeat(60))
  console.log('📋 TEST SUMMARY')
  console.log('='.repeat(60))

  console.log(`✅ All Agents Test: ${allAgentsResult ? 'PASSED' : 'FAILED'}`)
  console.log(`✅ Individual Rune Test: ${individualRuneResult ? 'PASSED' : 'FAILED'}`)
  console.log(`✅ Calculation Test: ${calculationResult ? 'PASSED' : 'FAILED'}`)

  const passedTests = [allAgentsResult, individualRuneResult, calculationResult].filter(
    Boolean
  ).length
  console.log(`\n🎯 Overall: ${passedTests}/3 tests passed`)

  if (passedTests === 3) {
    console.log('🎉 ALL TESTS PASSED! Sign Vector Integration is working perfectly!')
  } else {
    console.log('⚠️ Some tests failed. Check the API endpoint and server status.')
  }
}

// Check if server is running and run tests
console.log('🔍 Checking if development server is running...')
makeRequest(`${API_BASE}/api/sign-vectors?action=all-agents`)
  .then(() => {
    console.log('✅ Server is running, starting tests...\n')
    return runAllTests()
  })
  .catch(error => {
    console.log('❌ Server not responding. Please start the development server with: npm run dev')
    console.log(`   Error: ${error.message}`)
    process.exit(1)
  })
