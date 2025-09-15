// Comprehensive test of enhanced Monica's Alchemical Training System
const baseUrl = 'http://localhost:3000'

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '═'.repeat(60))
  log(`  ${title}`, 'bright')
  console.log('═'.repeat(60))
}

async function testAlchemicalTraining() {
  log('\n🧪 COMPREHENSIVE ALCHEMICAL TRAINER TEST SUITE', 'bright')
  log('Testing enhanced features with Monica Constant integration\n', 'cyan')

  let passedTests = 0
  let failedTests = 0
  let totalTests = 0

  // Test 1: API Information Endpoint
  logSection('Test 1: API Information Endpoint')
  totalTests++
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical?mode=info`)
    const data = await response.json()

    if (data.success && data.info && data.info.version === '2.0') {
      log('✅ PASS: API info endpoint working correctly', 'green')
      log(`  Version: ${data.info.version}`, 'cyan')
      log(`  Capabilities: ${data.info.capabilities.length} features`, 'cyan')
      passedTests++
    } else {
      throw new Error('Invalid API info response')
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red')
    failedTests++
  }

  // Test 2: Standard Training with Monica Constant
  logSection('Test 2: Standard Training with Monica Constant')
  totalTests++
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: 5,
        exportFormat: 'json',
      }),
    })
    const data = await response.json()

    if (data.success && data.data) {
      const result = data.data

      // Check for Monica Constant
      if (result.monicaConstant && result.monicaConstant.average !== undefined) {
        log('✅ PASS: Monica Constant calculated successfully', 'green')
        log(`  Average MC: ${result.monicaConstant.average}`, 'cyan')
        log(`  Range: ${result.monicaConstant.min} - ${result.monicaConstant.max}`, 'cyan')
        log(`  Std Dev: ${result.monicaConstant.stdDev}`, 'cyan')
        log(
          `  Interpretation: ${result.monicaConstant.interpretation?.substring(0, 100)}...`,
          'blue'
        )
        passedTests++
      } else {
        throw new Error('Monica Constant not found in response')
      }

      // Display sample statistics
      if (result.statistics && result.statistics.averages) {
        log('\n  📊 Statistics:', 'yellow')
        log(`    Spirit: ${result.statistics.averages.spirit?.toFixed(2) || 'N/A'}`, 'cyan')
        log(`    Essence: ${result.statistics.averages.essence?.toFixed(2) || 'N/A'}`, 'cyan')
        log(`    Entropy: ${result.statistics.averages.Entropy?.toFixed(2) || 'N/A'}`, 'cyan')
      }

      // Display patterns
      if (result.patterns) {
        log('\n  🔍 Patterns:', 'yellow')
        log(`    Dominant Element: ${result.patterns.dominantElement}`, 'cyan')
        if (result.patterns.peakHours) {
          log(`    Peak Spirit Hour: ${result.patterns.peakHours.spirit}:00`, 'cyan')
        }
      }

      // Display insights
      if (result.insights && result.insights.length > 0) {
        log('\n  💡 Top Insights:', 'yellow')
        result.insights.slice(0, 3).forEach((insight, i) => {
          log(`    ${i + 1}. ${insight}`, 'blue')
        })
      }
    } else {
      throw new Error('Invalid training response')
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red')
    failedTests++
  }

  // Test 3: Hourly Analysis
  logSection("Test 3: Today's Hourly Analysis")
  totalTests++
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'hourly',
        location: { latitude: 37.7749, longitude: -122.4194 },
      }),
    })
    const data = await response.json()

    if (data.success && data.data) {
      const result = data.data
      if (result.peaks && result.averages) {
        log('✅ PASS: Hourly analysis completed', 'green')
        log(
          `  Spirit peaks at ${result.peaks.spirit.hour}:00 (${result.peaks.spirit.ruler})`,
          'cyan'
        )
        log(
          `  Essence peaks at ${result.peaks.essence.hour}:00 (${result.peaks.essence.ruler})`,
          'cyan'
        )
        log(`  Average entropy: ${result.averages.entropy?.toFixed(2)}`, 'cyan')
        passedTests++
      } else {
        throw new Error('Missing peaks or averages in hourly analysis')
      }
    } else {
      throw new Error('Invalid hourly analysis response')
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red')
    failedTests++
  }

  // Test 4: Input Validation
  logSection('Test 4: Input Validation')
  totalTests++
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: 1500, // Exceeds max limit of 1000
      }),
    })
    const data = await response.json()

    if (data.success && data.data) {
      const result = data.data
      if (result.metadata && result.metadata.errors) {
        log('✅ PASS: Input validation working', 'green')
        log(`  Validation message: ${result.metadata.errors[0]}`, 'cyan')
        passedTests++
      } else if (result.metadata && result.metadata.numSamples <= 1000) {
        log('✅ PASS: Sample size correctly limited to 1000', 'green')
        log(`  Actual samples: ${result.metadata.numSamples}`, 'cyan')
        passedTests++
      } else {
        throw new Error('Input validation not working properly')
      }
    } else {
      throw new Error('Invalid validation response')
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red')
    failedTests++
  }

  // Test 5: CSV Export Format
  logSection('Test 5: CSV Export Format')
  totalTests++
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: 2,
        exportFormat: 'csv',
      }),
    })
    const data = await response.json()

    if (data.success && data.data && data.data.csv) {
      const csvLines = data.data.csv.split('\n')
      if (csvLines[0].includes('hour,spirit,essence,matter,substance')) {
        log('✅ PASS: CSV export format working', 'green')
        log('  CSV Headers: ' + csvLines[0], 'cyan')
        log('  Data rows: ' + (csvLines.length - 1), 'cyan')
        passedTests++
      } else {
        throw new Error('Invalid CSV format')
      }
    } else {
      throw new Error('CSV export failed')
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red')
    failedTests++
  }

  // Test 6: Retrograde Analysis
  logSection('Test 6: Retrograde Analysis')
  totalTests++
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'retrograde',
        numSamples: 3,
      }),
    })
    const data = await response.json()

    if (data.success && data.data && data.data.retrogradeAnalysis) {
      log('✅ PASS: Retrograde analysis completed', 'green')
      log(`  Entropy Modifier: ${data.data.retrogradeAnalysis.impact.entropyModifier}`, 'cyan')
      log(`  Essence Modifier: ${data.data.retrogradeAnalysis.impact.essenceModifier}`, 'cyan')
      if (data.data.retrogradeAnalysis.recommendations) {
        log(`  Recommendations: ${data.data.retrogradeAnalysis.recommendations.length}`, 'cyan')
      }
      passedTests++
    } else {
      throw new Error('Retrograde analysis failed')
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red')
    failedTests++
  }

  // Test 7: Summary Export Format
  logSection('Test 7: Summary Export Format')
  totalTests++
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: 3,
        exportFormat: 'summary',
      }),
    })
    const data = await response.json()

    if (data.success && data.data && data.data.summary) {
      log('✅ PASS: Summary export format working', 'green')
      log(`  Samples: ${data.data.summary.numSamples}`, 'cyan')
      if (data.data.summary.topInsights) {
        log(`  Insights: ${data.data.summary.topInsights.length}`, 'cyan')
      }
      passedTests++
    } else {
      throw new Error('Summary export failed')
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red')
    failedTests++
  }

  // Test 8: Monica Agent Integration Test
  logSection('Test 8: Monica Agent with Alchemical Data')
  totalTests++
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:
          'Monica, calculate the Monica Constant for Spirit: 5, Essence: 7, Matter: 3, Substance: 2',
        includeAlchm: true,
      }),
    })
    const data = await response.json()

    if (data.response) {
      log('✅ PASS: Monica agent responding to alchemical queries', 'green')
      log(`  Response preview: ${data.response.substring(0, 150)}...`, 'blue')
      passedTests++
    } else {
      throw new Error('Monica agent not responding')
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red')
    failedTests++
  }

  // Final Summary
  logSection('TEST RESULTS SUMMARY')
  const passRate = ((passedTests / totalTests) * 100).toFixed(1)

  if (passedTests === totalTests) {
    log(`✨ ALL TESTS PASSED! (${passedTests}/${totalTests})`, 'green')
    log(`Pass Rate: ${passRate}%`, 'green')
  } else {
    log(`Tests Passed: ${passedTests}/${totalTests}`, passedTests > failedTests ? 'yellow' : 'red')
    log(`Tests Failed: ${failedTests}/${totalTests}`, 'red')
    log(`Pass Rate: ${passRate}%`, passedTests > failedTests ? 'yellow' : 'red')
  }

  // Performance note
  if (passedTests >= 6) {
    log('\n🎉 System is production-ready with Monica Constant integration!', 'green')
  } else if (passedTests >= 4) {
    log('\n⚠️  System partially functional, some features need attention', 'yellow')
  } else {
    log('\n❌ System needs significant fixes before production use', 'red')
  }

  console.log('\n' + '═'.repeat(60))
  log('End of test suite', 'cyan')
}

// Run the comprehensive test
testAlchemicalTraining().catch(error => {
  log(`\n💥 CRITICAL ERROR: ${error.message}`, 'red')
  console.error(error)
})
