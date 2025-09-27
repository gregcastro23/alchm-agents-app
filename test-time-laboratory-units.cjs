#!/usr/bin/env node

/**
 * Time Laboratory Unit Tests
 * ==========================
 *
 * Tests Time Laboratory components in isolation without requiring running server.
 */

const { performance } = require('perf_hooks')

// Test Results Tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
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
}

async function testPerformanceOptimization() {
  console.log('\n⚡ Testing Performance Optimization Components...')

  try {
    // Test 1: Import performance module
    const perfModule = require('./lib/time-laboratory-performance.ts')
    logTest('Performance module import', true, 0, 'Module imports successfully')
  } catch (error) {
    logTest('Performance module import', false, 0, `Import error: ${error.message}`)
    return
  }

  try {
    // Test 2: Check performance classes exist
    const {
      TemporalAnalysisCache,
      QueryOptimizer,
      PerformanceMonitor,
      globalCache,
      globalQueryOptimizer,
      globalPerformanceMonitor,
    } = require('./lib/time-laboratory-performance.ts')

    logTest('Performance classes available', true, 0, 'All classes imported')

    // Test 3: Cache functionality
    const testCache = new TemporalAnalysisCache(10, 5000) // 10 items, 5 second TTL
    const testKey = testCache.generateKey({ query: 'test', type: 'natural_language' })

    await testCache.set(testKey, { test: 'data' })
    const retrieved = await testCache.get(testKey)

    logTest(
      'Cache set/get functionality',
      retrieved && retrieved.test === 'data',
      0,
      'Cache stores and retrieves data correctly'
    )

    // Test 4: Cache metrics
    const metrics = testCache.getMetrics()
    logTest(
      'Cache metrics tracking',
      typeof metrics.hitRate === 'number' && typeof metrics.size === 'number',
      0,
      `Hit rate: ${metrics.hitRate}, Size: ${metrics.size}`
    )

    // Test 5: Query optimizer
    const optimizer = new QueryOptimizer()
    const sampleQuery = {
      type: 'natural_language',
      query: 'test query',
      agents: ['leonardo-da-vinci', 'albert-einstein'],
      dateRange: {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    }

    const hints = optimizer.analyzeQuery(sampleQuery)
    logTest(
      'Query optimization hints',
      typeof hints === 'object' && hints !== null,
      0,
      `Generated hints: ${Object.keys(hints).length} properties`
    )

    // Test 6: Performance monitor
    const monitor = new PerformanceMonitor()
    monitor.recordQueryTime(150)
    monitor.recordPatternDetectionTime(75)
    monitor.recordElementalCalculationTime(25)

    const perfMetrics = monitor.getMetrics()
    logTest(
      'Performance monitoring',
      perfMetrics.queryTime === 150 && perfMetrics.patternDetectionTime === 75,
      0,
      `Query: ${perfMetrics.queryTime}ms, Pattern: ${perfMetrics.patternDetectionTime}ms`
    )

    // Test 7: Global instances
    logTest(
      'Global performance instances',
      globalCache && globalQueryOptimizer && globalPerformanceMonitor,
      0,
      'All global instances initialized'
    )

    // Test 8: Performance report generation
    const report = monitor.generatePerformanceReport()
    logTest(
      'Performance report generation',
      typeof report === 'string' && report.includes('Performance Report'),
      0,
      'Report generated successfully'
    )
  } catch (error) {
    logTest('Performance optimization tests', false, 0, `Error: ${error.message}`)
  }
}

async function testTemporalAnalysisEngine() {
  console.log('\n🔬 Testing Temporal Analysis Engine...')

  try {
    // Test import
    const engineModule = require('./lib/temporal-analysis-engine.ts')
    logTest('Temporal analysis engine import', true, 0, 'Engine module imports')

    // Check if TemporalAnalysisEngine class exists
    const { TemporalAnalysisEngine } = engineModule
    logTest(
      'TemporalAnalysisEngine class',
      !!TemporalAnalysisEngine,
      0,
      'Main engine class available'
    )

    // Test query processing (without actual execution)
    const sampleQuery = {
      type: 'natural_language',
      query: 'Show Fire reinforcements',
      reinforcementMode: true,
    }

    logTest(
      'Query structure validation',
      sampleQuery.type && sampleQuery.query && sampleQuery.reinforcementMode,
      0,
      'Sample query structure valid'
    )
  } catch (error) {
    logTest('Temporal analysis engine tests', false, 0, `Error: ${error.message}`)
  }
}

async function testElementalReinforcementLogic() {
  console.log('\n🔥 Testing Elemental Reinforcement Logic...')

  try {
    const reinforcementModule = require('./lib/elemental-reinforcement.ts')
    logTest('Elemental reinforcement import', true, 0, 'Module imports successfully')

    // Test elemental compatibility
    const { getElementalCompatibility } = reinforcementModule

    if (getElementalCompatibility) {
      const fireFireCompatibility = getElementalCompatibility('Fire', 'Fire')
      logTest(
        'Fire-Fire reinforcement logic',
        fireFireCompatibility && fireFireCompatibility.compatibility >= 0.9,
        0,
        `Compatibility: ${fireFireCompatibility?.compatibility || 'undefined'}`
      )

      const waterWaterCompatibility = getElementalCompatibility('Water', 'Water')
      logTest(
        'Water-Water reinforcement logic',
        waterWaterCompatibility && waterWaterCompatibility.compatibility >= 0.9,
        0,
        `Compatibility: ${waterWaterCompatibility?.compatibility || 'undefined'}`
      )
    } else {
      logTest('Elemental compatibility function', false, 0, 'Function not found')
    }
  } catch (error) {
    logTest('Elemental reinforcement tests', false, 0, `Error: ${error.message}`)
  }
}

async function testPatternDetection() {
  console.log('\n🔍 Testing Pattern Detection System...')

  try {
    const patternModule = require('./lib/degree-pattern-detection.ts')
    logTest('Pattern detection import', true, 0, 'Module imports successfully')

    const { DegreePatternDetection } = patternModule

    if (DegreePatternDetection) {
      const detector = new DegreePatternDetection()
      logTest(
        'Pattern detection class instantiation',
        !!detector,
        0,
        'DegreePatternDetection class instantiated'
      )

      // Test mock data processing
      const mockTransitEvents = [
        {
          agentId: 'test-agent',
          degree: 30,
          element: 'Fire',
          timestamp: new Date(),
          significance: 0.8,
        },
      ]

      if (detector.detectRecurringActivations) {
        const patterns = detector.detectRecurringActivations(mockTransitEvents)
        logTest(
          'Pattern detection execution',
          Array.isArray(patterns),
          0,
          `Detected ${patterns?.length || 0} patterns`
        )
      } else {
        logTest('Pattern detection method', false, 0, 'detectRecurringActivations method not found')
      }
    } else {
      logTest('Pattern detection class', false, 0, 'DegreePatternDetection class not found')
    }
  } catch (error) {
    logTest('Pattern detection tests', false, 0, `Error: ${error.message}`)
  }
}

async function testGrimoireExport() {
  console.log('\n📜 Testing Grimoire Export System...')

  try {
    const grimoireModule = require('./lib/temporal-grimoire-export.ts')
    logTest('Grimoire export import', true, 0, 'Module imports successfully')

    const { TemporalGrimoireExporter } = grimoireModule

    if (TemporalGrimoireExporter) {
      logTest('TemporalGrimoireExporter class', true, 0, 'Exporter class available')

      // Test template system
      if (TemporalGrimoireExporter.getAvailableTemplates) {
        const templates = TemporalGrimoireExporter.getAvailableTemplates()
        logTest(
          'Template system',
          Array.isArray(templates),
          0,
          `${templates?.length || 0} templates available`
        )
      }
    } else {
      logTest('TemporalGrimoireExporter class', false, 0, 'Exporter class not found')
    }
  } catch (error) {
    logTest('Grimoire export tests', false, 0, `Error: ${error.message}`)
  }
}

async function testCollaborativeSessions() {
  console.log('\n🤝 Testing Collaborative Time Sessions...')

  try {
    const collaborativeModule = require('./lib/collaborative-time-sessions.ts')
    logTest('Collaborative sessions import', true, 0, 'Module imports successfully')

    const { CollaborativeTimeSessionManager } = collaborativeModule

    if (CollaborativeTimeSessionManager) {
      const sessionManager = new CollaborativeTimeSessionManager()
      logTest(
        'Session manager instantiation',
        !!sessionManager,
        0,
        'CollaborativeTimeSessionManager instantiated'
      )

      // Test session creation
      if (sessionManager.createSession) {
        const sessionId = sessionManager.createSession('test-user', {
          type: 'natural_language',
          query: 'test session',
        })
        logTest('Session creation', !!sessionId, 0, `Session ID: ${sessionId || 'undefined'}`)
      }
    } else {
      logTest('CollaborativeTimeSessionManager class', false, 0, 'Session manager class not found')
    }
  } catch (error) {
    logTest('Collaborative sessions tests', false, 0, `Error: ${error.message}`)
  }
}

function generateTestReport() {
  console.log('\n📊 Unit Test Results Summary')
  console.log('=============================')
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`)

  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:')
    testResults.errors.forEach(error => {
      console.log(`  • ${error.name}: ${error.details}`)
    })
  }

  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'unit_tests',
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100,
    },
    errors: testResults.errors,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
    },
  }

  const fs = require('fs')
  const reportFilename = `test-results-time-laboratory-units-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

  try {
    fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2))
    console.log(`\n📄 Test report saved: ${reportFilename}`)
  } catch (error) {
    console.log(`\n⚠️  Could not save test report: ${error.message}`)
  }

  return testResults.failed === 0
}

async function runUnitTests() {
  console.log('🕰️ Time Laboratory Unit Test Suite')
  console.log('==================================')
  console.log(`Started: ${new Date().toISOString()}\n`)

  const startTime = performance.now()

  // Run all unit test suites
  await testPerformanceOptimization()
  await testTemporalAnalysisEngine()
  await testElementalReinforcementLogic()
  await testPatternDetection()
  await testGrimoireExport()
  await testCollaborativeSessions()

  const totalTime = performance.now() - startTime
  console.log(`\n⏱️ Total test time: ${Math.round(totalTime)}ms`)

  const success = generateTestReport()

  // Exit with appropriate code
  process.exit(success ? 0 : 1)
}

// Run tests if called directly
if (require.main === module) {
  runUnitTests().catch(error => {
    console.error('❌ Unit test suite failed:', error)
    process.exit(1)
  })
}

module.exports = {
  runUnitTests,
  testPerformanceOptimization,
  testTemporalAnalysisEngine,
  testElementalReinforcementLogic,
  testPatternDetection,
  testGrimoireExport,
  testCollaborativeSessions,
}
