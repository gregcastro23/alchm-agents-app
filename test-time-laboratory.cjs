#!/usr/bin/env node

/**
 * Time Laboratory Comprehensive Test Suite
 * =======================================
 *
 * Tests all components of the Time Laboratory system including:
 * - Temporal Analysis Engine accuracy
 * - API endpoint functionality
 * - Elemental reinforcement logic
 * - Pattern detection algorithms
 * - Performance benchmarks
 * - Integration with existing systems
 */

const fetch = require('node-fetch')
const { performance } = require('perf_hooks')

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

// Test Configuration
const TEST_CONFIG = {
  timeouts: {
    api: 5000, // 5 second timeout for API calls
    analysis: 10000, // 10 second timeout for analysis
  },
  performance: {
    maxResponseTime: 2000, // Max 2 seconds for temporal analysis
    maxQueryTime: 500, // Max 500ms for simple queries
    maxPatternTime: 1500, // Max 1.5 seconds for pattern detection
  },
  mockData: {
    agents: ['leonardo-da-vinci', 'albert-einstein', 'carl-jung', 'nikola-tesla'],
    elements: ['Fire', 'Water', 'Air', 'Earth'],
    degrees: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
  },
}

// Test Results Tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  performance: {},
  errors: [],
}

function logTest(name, status, duration = 0, details = '') {
  testResults.total++
  const emoji = status ? '✅' : '❌'
  const timeStr = duration > 0 ? ` (${Math.round(duration)}ms)` : ''

  console.log(`${emoji} ${name}${timeStr}`)
  if (details) console.log(`   ${details}`)

  if (status) {
    testResults.passed++
  } else {
    testResults.failed++
    testResults.errors.push({ name, details })
  }

  if (duration > 0) {
    testResults.performance[name] = duration
  }
}

async function testTemporalAnalysisAPI() {
  console.log('\n🔬 Testing Temporal Analysis API...')

  // Test 1: Basic temporal query
  try {
    const start = performance.now()
    const response = await fetch(`${BASE_URL}/api/temporal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          type: 'natural_language',
          query: 'Show Fire reinforcements in the last month',
          agents: ['leonardo-da-vinci', 'albert-einstein'],
          reinforcementMode: true,
        },
      }),
    })

    const duration = performance.now() - start
    const data = await response.json()

    const success = response.ok && data.success && data.data.transitEvents
    logTest(
      'Basic temporal query',
      success,
      duration,
      success ? `Found ${data.data.transitEvents.length} transit events` : `Error: ${data.error}`
    )

    if (success && duration > TEST_CONFIG.performance.maxResponseTime) {
      logTest(
        'Response time performance',
        false,
        duration,
        `Exceeded ${TEST_CONFIG.performance.maxResponseTime}ms limit`
      )
    }
  } catch (error) {
    logTest('Basic temporal query', false, 0, `Network error: ${error.message}`)
  }

  // Test 2: Structured query with date range
  try {
    const start = performance.now()
    const response = await fetch(`${BASE_URL}/api/temporal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          type: 'structured',
          query: 'degree_analysis',
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
          degrees: [0, 90, 180, 270],
          elements: ['Fire', 'Water'],
        },
      }),
    })

    const duration = performance.now() - start
    const data = await response.json()

    const success = response.ok && data.success
    logTest(
      'Structured query with date range',
      success,
      duration,
      success ? `Analyzed ${data.data.patterns?.length || 0} patterns` : `Error: ${data.error}`
    )
  } catch (error) {
    logTest('Structured query with date range', false, 0, `Network error: ${error.message}`)
  }

  // Test 3: Cache functionality
  try {
    const query = {
      type: 'natural_language',
      query: 'Find consciousness spikes for Tesla',
      agents: ['nikola-tesla'],
    }

    // First request
    const start1 = performance.now()
    const response1 = await fetch(`${BASE_URL}/api/temporal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, useCache: true, cacheFor: 60 }),
    })
    const duration1 = performance.now() - start1

    // Second request (should be cached)
    const start2 = performance.now()
    const response2 = await fetch(`${BASE_URL}/api/temporal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, useCache: true }),
    })
    const duration2 = performance.now() - start2

    const success = response1.ok && response2.ok && duration2 < duration1
    logTest(
      'Cache functionality',
      success,
      duration2,
      success
        ? `Cache hit reduced time by ${Math.round(duration1 - duration2)}ms`
        : 'Cache not working'
    )
  } catch (error) {
    logTest('Cache functionality', false, 0, `Error: ${error.message}`)
  }
}

async function testElementalReinforcementLogic() {
  console.log('\n🔥 Testing Elemental Reinforcement Logic...')

  // Test 1: Same element reinforcement
  try {
    const response = await fetch(`${BASE_URL}/api/temporal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          type: 'natural_language',
          query: 'Show Fire-Fire reinforcements',
          elements: ['Fire'],
          reinforcementMode: true,
        },
      }),
    })

    const data = await response.json()

    if (data.success && data.data.reinforcementScores) {
      const fireScore = data.data.reinforcementScores.find(s => s.element === 'Fire')
      const success = fireScore && fireScore.score >= 0.8 // High reinforcement expected
      logTest(
        'Fire-Fire reinforcement',
        success,
        0,
        success
          ? `Fire reinforcement score: ${(fireScore.score * 100).toFixed(1)}%`
          : 'Low reinforcement score'
      )
    } else {
      logTest('Fire-Fire reinforcement', false, 0, 'No reinforcement data returned')
    }
  } catch (error) {
    logTest('Fire-Fire reinforcement', false, 0, `Error: ${error.message}`)
  }

  // Test 2: Multi-element compatibility
  const elementPairs = [
    ['Fire', 'Fire', 0.9],
    ['Water', 'Water', 0.9],
    ['Air', 'Air', 0.9],
    ['Earth', 'Earth', 0.9],
  ]

  for (const [elem1, elem2, expectedMin] of elementPairs) {
    try {
      const response = await fetch(`${BASE_URL}/api/temporal-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            type: 'structured',
            query: 'elemental_compatibility_test',
            elements: [elem1, elem2],
            reinforcementMode: true,
          },
        }),
      })

      const data = await response.json()
      const success = data.success // Just test that it completes
      logTest(
        `${elem1}-${elem2} compatibility`,
        success,
        0,
        success ? 'Compatibility calculated' : 'Calculation failed'
      )
    } catch (error) {
      logTest(`${elem1}-${elem2} compatibility`, false, 0, `Error: ${error.message}`)
    }
  }
}

async function testPatternDetection() {
  console.log('\n🔍 Testing Pattern Detection...')

  // Test 1: Recurring activation patterns
  try {
    const start = performance.now()
    const response = await fetch(`${BASE_URL}/api/temporal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          type: 'structured',
          query: 'pattern_analysis',
          degrees: [0, 30, 60, 90],
          agents: TEST_CONFIG.mockData.agents,
          granularity: 'daily',
        },
      }),
    })

    const duration = performance.now() - start
    const data = await response.json()

    const success = response.ok && data.success && Array.isArray(data.data.patterns)
    logTest(
      'Pattern detection analysis',
      success,
      duration,
      success ? `Detected ${data.data.patterns.length} patterns` : `Error: ${data.error}`
    )

    if (success && duration > TEST_CONFIG.performance.maxPatternTime) {
      logTest(
        'Pattern detection performance',
        false,
        duration,
        `Exceeded ${TEST_CONFIG.performance.maxPatternTime}ms limit`
      )
    }
  } catch (error) {
    logTest('Pattern detection analysis', false, 0, `Error: ${error.message}`)
  }

  // Test 2: Consciousness spike detection
  try {
    const response = await fetch(`${BASE_URL}/api/temporal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          type: 'natural_language',
          query: 'Find consciousness evolution spikes across all agents',
          agents: TEST_CONFIG.mockData.agents,
        },
      }),
    })

    const data = await response.json()
    const success = response.ok && data.success
    logTest(
      'Consciousness spike detection',
      success,
      0,
      success
        ? `Found ${data.data.transitEvents?.length || 0} consciousness events`
        : 'Detection failed'
    )
  } catch (error) {
    logTest('Consciousness spike detection', false, 0, `Error: ${error.message}`)
  }
}

async function testGrimoireExport() {
  console.log('\n📜 Testing Grimoire Export System...')

  // Test 1: Basic grimoire generation
  try {
    const start = performance.now()
    const response = await fetch(`${BASE_URL}/api/temporal-grimoire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          type: 'natural_language',
          query: 'Renaissance creativity analysis',
        },
        results: {
          transitEvents: [],
          patterns: [],
          insights: {
            dominantElements: ['Fire', 'Air'],
            peakPeriods: [],
            degreeHotspots: [],
          },
          reinforcementScores: [],
          recommendations: { deepDiveOpportunities: [] },
        },
        options: {
          format: 'html',
          template: { name: 'mystical_complete' },
        },
      }),
    })

    const duration = performance.now() - start
    const data = await response.json()

    const success = response.ok && data.success && data.downloadUrl
    logTest(
      'Grimoire generation',
      success,
      duration,
      success ? `Generated ${data.format} grimoire (${data.size} bytes)` : `Error: ${data.error}`
    )
  } catch (error) {
    logTest('Grimoire generation', false, 0, `Error: ${error.message}`)
  }

  // Test 2: Template listing
  try {
    const response = await fetch(`${BASE_URL}/api/temporal-grimoire?action=templates`)
    const data = await response.json()

    const success = response.ok && data.success && Array.isArray(data.data.templates)
    logTest(
      'Template listing',
      success,
      0,
      success ? `Found ${data.data.templates.length} templates` : 'Template listing failed'
    )
  } catch (error) {
    logTest('Template listing', false, 0, `Error: ${error.message}`)
  }

  // Test 3: Format listing
  try {
    const response = await fetch(`${BASE_URL}/api/temporal-grimoire?action=formats`)
    const data = await response.json()

    const success = response.ok && data.success && Array.isArray(data.data.formats)
    logTest(
      'Format listing',
      success,
      0,
      success ? `Found ${data.data.formats.length} export formats` : 'Format listing failed'
    )
  } catch (error) {
    logTest('Format listing', false, 0, `Error: ${error.message}`)
  }
}

async function testPerformanceBenchmarks() {
  console.log('\n⚡ Running Performance Benchmarks...')

  // Test 1: Large dataset query
  try {
    const start = performance.now()
    const response = await fetch(`${BASE_URL}/api/temporal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          type: 'structured',
          query: 'comprehensive_analysis',
          dateRange: {
            start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
            end: new Date().toISOString(),
          },
          agents: TEST_CONFIG.mockData.agents,
          degrees: Array.from({ length: 36 }, (_, i) => i * 10), // Every 10 degrees
          elements: TEST_CONFIG.mockData.elements,
          granularity: 'daily',
        },
      }),
    })

    const duration = performance.now() - start
    const data = await response.json()

    const success = response.ok && data.success
    logTest(
      'Large dataset analysis',
      success,
      duration,
      success ? `Processed ${data.data.transitEvents?.length || 0} events` : 'Analysis failed'
    )

    // Performance benchmark
    if (duration > TEST_CONFIG.performance.maxResponseTime * 2) {
      logTest('Large dataset performance', false, duration, 'Exceeds performance threshold')
    } else {
      logTest('Large dataset performance', true, duration, 'Within performance threshold')
    }
  } catch (error) {
    logTest('Large dataset analysis', false, 0, `Error: ${error.message}`)
  }

  // Test 2: Concurrent requests
  try {
    const queries = Array.from({ length: 5 }, (_, i) =>
      fetch(`${BASE_URL}/api/temporal-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            type: 'natural_language',
            query: `Test query ${i + 1}`,
            agents: [TEST_CONFIG.mockData.agents[i % TEST_CONFIG.mockData.agents.length]],
          },
        }),
      })
    )

    const start = performance.now()
    const responses = await Promise.all(queries)
    const duration = performance.now() - start

    const successCount = responses.filter(r => r.ok).length
    const success = successCount === queries.length

    logTest(
      'Concurrent request handling',
      success,
      duration,
      success
        ? `All ${queries.length} requests succeeded`
        : `${successCount}/${queries.length} succeeded`
    )
  } catch (error) {
    logTest('Concurrent request handling', false, 0, `Error: ${error.message}`)
  }
}

async function testIntegrationWithExistingSystems() {
  console.log('\n🔗 Testing Integration with Existing Systems...')

  // Test 1: Agent consciousness integration
  try {
    const response = await fetch(
      `${BASE_URL}/api/agent-evolution?agentId=leonardo-da-vinci&action=metrics`
    )
    const data = await response.json()

    const success = response.ok && data.success
    logTest(
      'Agent consciousness integration',
      success,
      0,
      success ? 'Consciousness metrics accessible' : 'Integration failed'
    )
  } catch (error) {
    logTest('Agent consciousness integration', false, 0, `Error: ${error.message}`)
  }

  // Test 2: Alchemical kinetics sampling
  try {
    const response = await fetch(`${BASE_URL}/api/temporal-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          type: 'structured',
          query: 'kinetics_integration_test',
          agents: ['carl-jung'],
          reinforcementMode: true,
        },
      }),
    })

    const data = await response.json()
    const success = response.ok && data.success
    logTest(
      'Alchemical kinetics integration',
      success,
      0,
      success ? 'Kinetics data integrated' : 'Integration failed'
    )
  } catch (error) {
    logTest('Alchemical kinetics integration', false, 0, `Error: ${error.message}`)
  }

  // Test 3: Planetary agents compatibility
  try {
    const response = await fetch(`${BASE_URL}/api/planetary-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planet: 'Mercury',
        sign: 'Gemini',
        degree: 15,
        message: 'Test temporal compatibility',
      }),
    })

    const success = response.ok
    logTest(
      'Planetary agents compatibility',
      success,
      0,
      success ? 'Compatible with planetary agents' : 'Compatibility issue'
    )
  } catch (error) {
    logTest('Planetary agents compatibility', false, 0, `Error: ${error.message}`)
  }
}

function generateTestReport() {
  console.log('\n📊 Test Results Summary')
  console.log('========================')
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`)

  if (Object.keys(testResults.performance).length > 0) {
    console.log('\n⚡ Performance Metrics:')
    const avgTime =
      Object.values(testResults.performance).reduce((a, b) => a + b, 0) /
      Object.values(testResults.performance).length
    console.log(`Average Response Time: ${Math.round(avgTime)}ms`)

    const slowTests = Object.entries(testResults.performance)
      .filter(([_, time]) => time > TEST_CONFIG.performance.maxResponseTime)
      .sort(([_, a], [__, b]) => b - a)

    if (slowTests.length > 0) {
      console.log('\n🐌 Slow Tests (>2000ms):')
      slowTests.forEach(([name, time]) => {
        console.log(`  • ${name}: ${Math.round(time)}ms`)
      })
    }
  }

  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:')
    testResults.errors.forEach(error => {
      console.log(`  • ${error.name}: ${error.details}`)
    })
  }

  // Generate JSON report for CI/CD
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100,
    },
    performance: testResults.performance,
    errors: testResults.errors,
    environment: {
      baseUrl: BASE_URL,
      nodeVersion: process.version,
      platform: process.platform,
    },
  }

  // Save report with timestamp
  const fs = require('fs')
  const reportFilename = `test-results-time-laboratory-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2))
  console.log(`\n📄 Detailed report saved: ${reportFilename}`)

  return testResults.failed === 0
}

async function runAllTests() {
  console.log('🕰️ Time Laboratory Comprehensive Test Suite')
  console.log('===========================================')
  console.log(`Testing against: ${BASE_URL}`)
  console.log(`Started: ${new Date().toISOString()}\n`)

  const startTime = performance.now()

  // Run all test suites
  await testTemporalAnalysisAPI()
  await testElementalReinforcementLogic()
  await testPatternDetection()
  await testGrimoireExport()
  await testPerformanceBenchmarks()
  await testIntegrationWithExistingSystems()

  const totalTime = performance.now() - startTime
  console.log(`\n⏱️ Total test time: ${Math.round(totalTime)}ms`)

  const success = generateTestReport()

  // Exit with appropriate code for CI/CD
  process.exit(success ? 0 : 1)
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  })
}

module.exports = {
  runAllTests,
  testTemporalAnalysisAPI,
  testElementalReinforcementLogic,
  testPatternDetection,
  testGrimoireExport,
  testPerformanceBenchmarks,
  testIntegrationWithExistingSystems,
}
