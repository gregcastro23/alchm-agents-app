// Test script to check Galileo API connectivity
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import * as fs from 'fs'

// Configure dotenv
dotenv.config()

// Get the current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try to read .env file directly
let envFileContent = ''
try {
  envFileContent = fs.readFileSync('.env', 'utf8')
  console.log('Found .env file contents:')
  // Print redacted version (hiding actual API keys)
  const redactedContent = envFileContent
    .split('\n')
    .map(line => {
      if (line.includes('KEY') || line.includes('SECRET')) {
        const parts = line.split('=')
        if (parts.length > 1) {
          return `${parts[0]}=[REDACTED]`
        }
      }
      return line
    })
    .join('\n')
  console.log(redactedContent)
} catch (error) {
  console.error('Error reading .env file:', error.message)
}

// Get API key from env and use exact IDs from the URL
const GALILEO_API_KEY = process.env.GALILEO_API_KEY
// Use exact IDs from the URL
const GALILEO_PROJECT = '1e7fd4a1-3e28-4fe1-a719-744f239a13be'
const GALILEO_LOG_STREAM = '6ed50263-a348-4ad6-ab63-bd04d3a4ffdd'

console.log('\nTesting Galileo API connectivity:')
console.log(`API Key exists: ${!!GALILEO_API_KEY}`)
console.log(`API Key length: ${GALILEO_API_KEY?.length || 0}`)
console.log(`Project ID: ${GALILEO_PROJECT}`)
console.log(`Log Stream: ${GALILEO_LOG_STREAM}`)

// Test sending a log with more complete metadata
async function testGalileoLog() {
  try {
    const logData = {
      project: GALILEO_PROJECT,
      stream: GALILEO_LOG_STREAM,
      content: 'Test log message',
      metadata: {
        source: 'test-script',
        timestamp: new Date().toISOString(),
        environment: 'development',
        test: true,
        requestId: `test_${Date.now()}`,
      },
    }

    console.log('\nSending log data to Galileo:', JSON.stringify(logData, null, 2))

    // Try the main API endpoint
    const response = await fetch('https://api.galileo.ai/v1/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GALILEO_API_KEY}`,
      },
      body: JSON.stringify(logData),
    })

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      console.error(`Galileo API responded with status: ${response.status}`)
      const responseText = await response.text()
      console.error('Response text:', responseText)

      // Try alternative endpoint
      console.log('\nTrying alternative endpoint...')
      const altResponse = await fetch('https://api.galileo.ai/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GALILEO_API_KEY}`,
        },
        body: JSON.stringify(logData),
      })

      console.log(`Alternative endpoint response status: ${altResponse.status}`)

      if (!altResponse.ok) {
        const altText = await altResponse.text()
        console.error('Alternative response text:', altText)
        return
      }

      const altData = await altResponse.json()
      console.log('Alternative endpoint response:', altData)
      return
    }

    const responseData = await response.json()
    console.log('Galileo API response:', responseData)
    console.log('Test completed successfully')
  } catch (error) {
    console.error('Error testing Galileo API:', error)
  }
}

// Run the test
await testGalileoLog()
