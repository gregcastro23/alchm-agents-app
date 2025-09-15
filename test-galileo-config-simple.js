#!/usr/bin/env node
// Simple Galileo configuration test
// This test validates the configuration without making API calls

require('dotenv').config()

const GALILEO_API_KEY = process.env.GALILEO_API_KEY
const GALILEO_PROJECT = process.env.GALILEO_PROJECT || 'AlchmPlanetaryAgents'
const GALILEO_LOG_STREAM = process.env.GALILEO_LOG_STREAM || 'Planetary Agents'

console.log('🔍 Galileo Configuration Validation')
console.log('===================================')
console.log('')

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

function printStatus(status, message) {
  const color =
    colors[
      status === 'SUCCESS'
        ? 'green'
        : status === 'ERROR'
          ? 'red'
          : status === 'WARNING'
            ? 'yellow'
            : 'blue'
    ]
  const icon =
    status === 'SUCCESS' ? '✅' : status === 'ERROR' ? '❌' : status === 'WARNING' ? '⚠️' : 'ℹ️'
  console.log(`${color}${icon} ${message}${colors.reset}`)
}

// Test 1: API Key
console.log('Test 1: API Key Configuration')
console.log('-----------------------------')
if (GALILEO_API_KEY) {
  printStatus('SUCCESS', `API Key is configured (length: ${GALILEO_API_KEY.length})`)

  // Check if it looks like a valid Galileo API key
  if (GALILEO_API_KEY.startsWith('gal_') || GALILEO_API_KEY.length > 20) {
    printStatus('SUCCESS', 'API Key format appears valid')
  } else {
    printStatus(
      'WARNING',
      'API Key format may be invalid (should start with "gal_" or be a long string)'
    )
  }
} else {
  printStatus('ERROR', 'GALILEO_API_KEY is not set')
}

console.log('')

// Test 2: Project Configuration
console.log('Test 2: Project Configuration')
console.log('------------------------------')
if (GALILEO_PROJECT) {
  printStatus('SUCCESS', `Project is configured: ${GALILEO_PROJECT}`)

  // Check if it's a UUID or string
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    GALILEO_PROJECT
  )
  if (isUUID) {
    printStatus('INFO', 'Project ID is in UUID format')
  } else {
    printStatus('INFO', 'Project ID is in string format')
  }
} else {
  printStatus('ERROR', 'GALILEO_PROJECT is not set')
}

console.log('')

// Test 3: Log Stream Configuration
console.log('Test 3: Log Stream Configuration')
console.log('---------------------------------')
if (GALILEO_LOG_STREAM) {
  printStatus('SUCCESS', `Log Stream is configured: ${GALILEO_LOG_STREAM}`)

  // Check if it's a UUID or string
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    GALILEO_LOG_STREAM
  )
  if (isUUID) {
    printStatus('INFO', 'Log Stream ID is in UUID format')
  } else {
    printStatus('INFO', 'Log Stream ID is in string format')
  }
} else {
  printStatus('ERROR', 'GALILEO_LOG_STREAM is not set')
}

console.log('')

// Test 4: Environment File
console.log('Test 4: Environment File')
console.log('------------------------')
const fs = require('fs')
if (fs.existsSync('.env.local')) {
  printStatus('SUCCESS', '.env.local file exists')

  const envContent = fs.readFileSync('.env.local', 'utf8')
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))

  const hasGalileoKey = lines.some(line => line.startsWith('GALILEO_API_KEY='))
  const hasProject = lines.some(line => line.startsWith('GALILEO_PROJECT='))
  const hasStream = lines.some(line => line.startsWith('GALILEO_LOG_STREAM='))

  if (hasGalileoKey) printStatus('SUCCESS', 'GALILEO_API_KEY found in .env.local')
  else printStatus('ERROR', 'GALILEO_API_KEY not found in .env.local')

  if (hasProject) printStatus('SUCCESS', 'GALILEO_PROJECT found in .env.local')
  else printStatus('WARNING', 'GALILEO_PROJECT not found in .env.local')

  if (hasStream) printStatus('SUCCESS', 'GALILEO_LOG_STREAM found in .env.local')
  else printStatus('WARNING', 'GALILEO_LOG_STREAM not found in .env.local')
} else {
  printStatus('ERROR', '.env.local file does not exist')
}

console.log('')

// Test 5: Node.js Environment
console.log('Test 5: Node.js Environment')
console.log('----------------------------')
printStatus('SUCCESS', `Node.js version: ${process.version}`)
printStatus('SUCCESS', `Platform: ${process.platform}`)
printStatus('SUCCESS', `Architecture: ${process.arch}`)

console.log('')

// Test 6: Dependencies
console.log('Test 6: Dependencies')
console.log('--------------------')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const hasGalileo = packageJson.dependencies && packageJson.dependencies.galileo
  const hasDotenv = packageJson.dependencies && packageJson.dependencies.dotenv

  if (hasGalileo) {
    printStatus('SUCCESS', `Galileo SDK installed (version: ${hasGalileo})`)
  } else {
    printStatus('ERROR', 'Galileo SDK not found in dependencies')
  }

  if (hasDotenv) {
    printStatus('SUCCESS', `dotenv installed (version: ${hasDotenv})`)
  } else {
    printStatus('WARNING', 'dotenv not found in dependencies')
  }
} catch (error) {
  printStatus('ERROR', `Could not read package.json: ${error.message}`)
}

console.log('')

// Summary
console.log('📊 Configuration Summary')
console.log('========================')
console.log(`API Key: ${GALILEO_API_KEY ? 'Configured' : 'Missing'}`)
console.log(`Project: ${GALILEO_PROJECT || 'Not set'}`)
console.log(`Log Stream: ${GALILEO_LOG_STREAM || 'Not set'}`)
console.log(`Environment File: ${fs.existsSync('.env.local') ? 'Exists' : 'Missing'}`)

console.log('')

if (GALILEO_API_KEY && GALILEO_PROJECT && GALILEO_LOG_STREAM) {
  printStatus('SUCCESS', 'Galileo configuration appears to be complete!')
  printStatus('INFO', 'You can now test API connectivity with: node test-galileo-connectivity.js')
  printStatus('INFO', 'Or run the full test suite with: ./test-galileo-all.sh')
} else {
  printStatus('ERROR', 'Galileo configuration is incomplete')
  printStatus('INFO', 'Please check the missing configuration items above')
}

console.log('')
printStatus('INFO', 'Note: This test only validates configuration, not API connectivity')
printStatus('INFO', 'For API connectivity testing, use the connectivity test script')
