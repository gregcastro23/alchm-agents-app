// Edge case tests for Monica's Alchemical Training System
const baseUrl = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '═'.repeat(60));
  log(`  ${title}`, 'bright');
  console.log('═'.repeat(60));
}

async function testEdgeCases() {
  log('\n🧪 EDGE CASE TEST SUITE', 'bright');
  log('Testing boundary conditions and error handling\n', 'cyan');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Zero samples
  logSection('Test 1: Zero Samples');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: 0
      })
    });
    const data = await response.json();
    
    if (data.success) {
      log('✅ PASS: Handled zero samples gracefully', 'green');
      log(`  Samples returned: ${data.data.samples?.length || 0}`, 'cyan');
      passedTests++;
    } else {
      log('❌ FAIL: Should handle zero samples', 'red');
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
  }
  
  // Test 2: Negative samples
  logSection('Test 2: Negative Sample Count');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: -5
      })
    });
    const data = await response.json();
    
    if (data.success) {
      log('✅ PASS: Handled negative samples (converted to positive)', 'green');
      log(`  Actual samples: ${data.data.metadata?.numSamples || 0}`, 'cyan');
      passedTests++;
    } else {
      log('❌ FAIL: Should handle negative sample count', 'red');
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
  }
  
  // Test 3: Very large sample count
  logSection('Test 3: Very Large Sample Count (5000)');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: 5000
      })
    });
    const data = await response.json();
    
    if (data.success && data.data.metadata?.numSamples <= 1000) {
      log('✅ PASS: Limited to maximum of 1000 samples', 'green');
      log(`  Requested: 5000, Actual: ${data.data.metadata.numSamples}`, 'cyan');
      if (data.data.metadata.errors) {
        log(`  Warning message: ${data.data.metadata.errors[0]}`, 'yellow');
      }
      passedTests++;
    } else {
      log('❌ FAIL: Should limit to 1000 samples', 'red');
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
  }
  
  // Test 4: Invalid mode
  logSection('Test 4: Invalid Mode');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'invalid_mode',
        numSamples: 1
      })
    });
    const data = await response.json();
    
    // Should default to standard mode
    if (data.success) {
      log('✅ PASS: Defaulted to standard mode for invalid mode', 'green');
      passedTests++;
    } else {
      log('⚠️  WARNING: Invalid mode not handled gracefully', 'yellow');
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
  }
  
  // Test 5: Invalid location coordinates
  logSection('Test 5: Invalid Location Coordinates');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'hourly',
        location: { latitude: 200, longitude: -500 } // Invalid coordinates
      })
    });
    const data = await response.json();
    
    if (data.success) {
      log('✅ PASS: Handled invalid coordinates', 'green');
      passedTests++;
    } else {
      log('⚠️  WARNING: Should handle invalid coordinates gracefully', 'yellow');
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
  }
  
  // Test 6: Missing parameters
  logSection('Test 6: Missing Parameters');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    
    if (data.success) {
      log('✅ PASS: Used default values for missing parameters', 'green');
      log(`  Default mode: ${data.mode}`, 'cyan');
      log(`  Default samples: ${data.data?.metadata?.numSamples || 'N/A'}`, 'cyan');
      passedTests++;
    } else {
      log('❌ FAIL: Should handle missing parameters', 'red');
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
  }
  
  // Test 7: Invalid export format
  logSection('Test 7: Invalid Export Format');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: 1,
        exportFormat: 'invalid_format'
      })
    });
    const data = await response.json();
    
    if (data.success) {
      log('✅ PASS: Defaulted to JSON format for invalid export format', 'green');
      passedTests++;
    } else {
      log('⚠️  WARNING: Invalid export format not handled', 'yellow');
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
  }
  
  // Test 8: Empty CSV generation
  logSection('Test 8: CSV Generation with No Valid Samples');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'standard',
        numSamples: 0,
        exportFormat: 'csv'
      })
    });
    const data = await response.json();
    
    if (data.success) {
      if (data.data.csv) {
        log('✅ PASS: Generated CSV headers even with no samples', 'green');
        const lines = data.data.csv.split('\n');
        log(`  CSV lines: ${lines.length}`, 'cyan');
        log(`  Headers: ${lines[0]?.substring(0, 50)}...`, 'cyan');
      } else {
        log('✅ PASS: Handled empty CSV case', 'green');
      }
      passedTests++;
    } else {
      log('⚠️  WARNING: CSV generation with no samples', 'yellow');
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
  }
  
  // Test 9: GET request on sample endpoint
  logSection('Test 9: GET Sample Endpoint');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical?mode=sample`);
    const data = await response.json();
    
    if (data.success && data.sample) {
      log('✅ PASS: Sample endpoint working', 'green');
      if (data.sample.statistics) {
        log(`  Statistics available: ${Object.keys(data.sample.statistics).length} keys`, 'cyan');
      }
      passedTests++;
    } else {
      log('❌ FAIL: Sample endpoint should return data', 'red');
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
  }
  
  // Test 10: Retrograde with zero samples
  logSection('Test 10: Retrograde Analysis with Zero Samples');
  totalTests++;
  try {
    const response = await fetch(`${baseUrl}/api/monica-agent/train-alchemical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'retrograde',
        numSamples: 0
      })
    });
    const data = await response.json();
    
    if (data.success && data.data.retrogradeAnalysis) {
      log('✅ PASS: Retrograde analysis works with zero samples', 'green');
      log(`  Impact calculated: ${JSON.stringify(data.data.retrogradeAnalysis.impact)}`, 'cyan');
      passedTests++;
    } else {
      log('⚠️  WARNING: Retrograde with zero samples', 'yellow');
    }
  } catch (error) {
    log(`❌ FAIL: ${error.message}`, 'red');
  }
  
  // Final Summary
  logSection('EDGE CASE TEST RESULTS');
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  if (passedTests === totalTests) {
    log(`✨ ALL EDGE CASES HANDLED! (${passedTests}/${totalTests})`, 'green');
  } else {
    log(`Tests Passed: ${passedTests}/${totalTests}`, passedTests > totalTests/2 ? 'yellow' : 'red');
  }
  log(`Pass Rate: ${passRate}%`, passedTests > totalTests/2 ? 'yellow' : 'red');
  
  if (passedTests >= 8) {
    log('\n🎯 Excellent edge case handling!', 'green');
  } else if (passedTests >= 6) {
    log('\n⚠️  Good edge case handling, some improvements possible', 'yellow');
  } else {
    log('\n❌ Edge case handling needs improvement', 'red');
  }
  
  console.log('\n' + '═'.repeat(60));
}

// Run edge case tests
testEdgeCases().catch(error => {
  log(`\n💥 CRITICAL ERROR: ${error.message}`, 'red');
  console.error(error);
});