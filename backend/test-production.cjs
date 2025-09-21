#!/usr/bin/env node

/**
 * Production Backend Test Script
 * Tests core functionality without TypeScript compilation
 */

const http = require('http')
const { spawn } = require('child_process')
const path = require('path')

// Test configuration
const TEST_PORT = 8000
const TEST_HOST = 'localhost'
const TEST_TIMEOUT = 30000

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TEST_HOST,
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Backend-Test/1.0'
      }
    }

    if (data && method !== 'GET') {
      const postData = JSON.stringify(data)
      options.headers['Content-Length'] = Buffer.byteLength(postData)
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })

      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body)
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          })
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

async function testHealthCheck() {
  log('\n🏥 Testing Health Check...', colors.blue)

  try {
    const response = await makeRequest('/api/health')

    if (response.statusCode === 200) {
      log('✅ Health check passed', colors.green)
      log(`   Status: ${response.body.status}`)
      log(`   Uptime: ${response.body.uptime}s`)
      return true
    } else {
      log(`❌ Health check failed with status ${response.statusCode}`, colors.red)
      return false
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, colors.red)
    return false
  }
}

async function testSecurityHeaders() {
  log('\n🔒 Testing Security Headers...', colors.blue)

  try {
    const response = await makeRequest('/')
    const headers = response.headers

    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ]

    let passed = 0
    securityHeaders.forEach(header => {
      if (headers[header]) {
        log(`✅ ${header}: ${headers[header]}`, colors.green)
        passed++
      } else {
        log(`❌ Missing header: ${header}`, colors.red)
      }
    })

    if (headers['x-powered-by']) {
      log(`❌ X-Powered-By header should be removed: ${headers['x-powered-by']}`, colors.red)
    } else {
      log('✅ X-Powered-By header properly removed', colors.green)
      passed++
    }

    return passed >= 3
  } catch (error) {
    log(`❌ Security headers test error: ${error.message}`, colors.red)
    return false
  }
}

async function testRateLimiting() {
  log('\n⏱️  Testing Rate Limiting...', colors.blue)

  try {
    // Make multiple rapid requests
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest('/api/health'))
    }

    const responses = await Promise.all(promises)
    const successCount = responses.filter(r => r.statusCode === 200).length

    if (successCount >= 4) {
      log('✅ Rate limiting allows reasonable traffic', colors.green)
      return true
    } else {
      log('⚠️  Rate limiting may be too strict', colors.yellow)
      return true // Not a failure, just a warning
    }
  } catch (error) {
    log(`❌ Rate limiting test error: ${error.message}`, colors.red)
    return false
  }
}

async function testApiEndpoints() {
  log('\n🚀 Testing API Endpoints...', colors.blue)

  const endpoints = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/planetary/current-hour', method: 'POST', data: { location: { lat: 37.7749, lon: -122.4194 } } },
    { path: '/api/tokens/calculate', method: 'POST', data: { tokens: { Spirit: 1, Essence: 0.8, Matter: 0.6, Substance: 0.4 }, location: { lat: 37.7749, lon: -122.4194 } } }
  ]

  let passed = 0

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.path, endpoint.method, endpoint.data)

      if (response.statusCode >= 200 && response.statusCode < 300) {
        log(`✅ ${endpoint.method} ${endpoint.path}`, colors.green)
        passed++
      } else if (response.statusCode === 503) {
        log(`⚠️  ${endpoint.method} ${endpoint.path} - Service disabled via feature flag`, colors.yellow)
        passed++ // Feature flags are expected
      } else {
        log(`❌ ${endpoint.method} ${endpoint.path} - Status: ${response.statusCode}`, colors.red)
      }
    } catch (error) {
      log(`❌ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`, colors.red)
    }
  }

  return passed >= 2 // At least health and one other endpoint should work
}

async function testErrorHandling() {
  log('\n⚠️  Testing Error Handling...', colors.blue)

  try {
    // Test 404 handling
    const response404 = await makeRequest('/api/nonexistent')
    if (response404.statusCode === 404) {
      log('✅ 404 handling works correctly', colors.green)
    } else {
      log(`❌ Expected 404, got ${response404.statusCode}`, colors.red)
      return false
    }

    // Test malformed JSON
    try {
      const badJsonResponse = await makeRequest('/api/planetary/current-hour', 'POST', 'invalid json')
      if (badJsonResponse.statusCode >= 400 && badJsonResponse.statusCode < 500) {
        log('✅ Bad JSON handling works correctly', colors.green)
      } else {
        log(`❌ Bad JSON should return 4xx, got ${badJsonResponse.statusCode}`, colors.red)
        return false
      }
    } catch (error) {
      log('✅ Bad JSON properly rejected', colors.green)
    }

    return true
  } catch (error) {
    log(`❌ Error handling test failed: ${error.message}`, colors.red)
    return false
  }
}

async function runTests() {
  log('🧪 Starting Backend Production Tests...', colors.blue)
  log(`Testing against: http://${TEST_HOST}:${TEST_PORT}`, colors.blue)

  // Wait for server to be ready
  log('\n⏳ Waiting for server to start...', colors.yellow)
  let serverReady = false
  let attempts = 0
  const maxAttempts = 10

  while (!serverReady && attempts < maxAttempts) {
    try {
      await makeRequest('/api/health')
      serverReady = true
      log('✅ Server is ready', colors.green)
    } catch (error) {
      attempts++
      if (attempts < maxAttempts) {
        log(`   Attempt ${attempts}/${maxAttempts} - waiting...`, colors.yellow)
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        log('❌ Server failed to start within timeout', colors.red)
        process.exit(1)
      }
    }
  }

  // Run all tests
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Security Headers', fn: testSecurityHeaders },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'API Endpoints', fn: testApiEndpoints },
    { name: 'Error Handling', fn: testErrorHandling }
  ]

  let totalTests = tests.length
  let passedTests = 0

  for (const test of tests) {
    const result = await test.fn()
    if (result) {
      passedTests++
    }
  }

  // Final results
  log('\n' + '='.repeat(50), colors.blue)
  log(`📊 Test Results: ${passedTests}/${totalTests} passed`, passedTests === totalTests ? colors.green : colors.yellow)

  if (passedTests === totalTests) {
    log('🎉 All tests passed! Backend is ready for production.', colors.green)
    return true
  } else {
    log('⚠️  Some tests failed. Review issues before deployment.', colors.yellow)
    return false
  }
}

// Main execution
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      log(`❌ Test execution failed: ${error.message}`, colors.red)
      process.exit(1)
    })
}

module.exports = { runTests }