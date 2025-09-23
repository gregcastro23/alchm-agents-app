#!/usr/bin/env node

/**
 * Planetary Agents Backend - Health Check Script
 * Comprehensive health check for Docker container monitoring
 */

const http = require('http')

const healthCheck = () => {
  const options = {
    host: 'localhost',
    port: process.env.PORT || 8000,
    path: '/api/health',
    timeout: 3000,
    headers: {
      'User-Agent': 'Docker-HealthCheck/1.0',
    },
  }

  const request = http.request(options, res => {
    console.log(`Health check status: ${res.statusCode}`)

    if (res.statusCode === 200) {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          const health = JSON.parse(data)
          console.log('Health check successful:', health.status)
          process.exit(0)
        } catch (error) {
          console.error('Invalid health check response:', error.message)
          process.exit(1)
        }
      })
    } else {
      console.error(`Health check failed with status: ${res.statusCode}`)
      process.exit(1)
    }
  })

  request.on('error', error => {
    console.error('Health check request failed:', error.message)
    process.exit(1)
  })

  request.on('timeout', () => {
    console.error('Health check request timed out')
    request.destroy()
    process.exit(1)
  })

  request.setTimeout(3000)
  request.end()
}

// Run health check
healthCheck()
