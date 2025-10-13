import express from 'express'
import { Server } from 'http'
import { cacheService } from '../../src/services/cache.js'
import { logger } from '../../src/utils/logger.js'

/**
 * Test server helper for integration tests
 * Manages server lifecycle and provides utilities
 */
export class TestServer {
  private app: express.Application
  private server: Server | null = null
  private port: number

  constructor(app: express.Application, port: number = 0) {
    this.app = app
    this.port = port
  }

  /**
   * Start the test server
   */
  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        const address = this.server!.address()
        const actualPort = typeof address === 'object' ? address?.port : this.port
        const url = `http://localhost:${actualPort}`
        logger.info(`Test server started on ${url}`)
        resolve(url)
      })

      this.server.on('error', reject)
    })
  }

  /**
   * Stop the test server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close(err => {
          if (err) {
            reject(err)
          } else {
            logger.info('Test server stopped')
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * Get the server URL
   */
  getUrl(): string {
    if (!this.server) {
      throw new Error('Server not started')
    }
    const address = this.server.address()
    const port = typeof address === 'object' ? address?.port : this.port
    return `http://localhost:${port}`
  }
}

/**
 * Setup integration test environment
 */
export async function setupIntegrationTestEnv() {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.LOG_LEVEL = 'error'
  process.env.REDIS_URL = process.env.REDIS_TEST_URL || 'redis://localhost:6380'
  process.env.ALCHM_BACKEND_URL = process.env.MOCK_API_URL || 'http://localhost:9000'

  // Connect to test cache
  try {
    await cacheService.connect()
    logger.info('Test cache connected')
  } catch (error) {
    logger.warn('Test cache connection failed, using memory fallback:', error)
  }
}

/**
 * Cleanup integration test environment
 */
export async function cleanupIntegrationTestEnv() {
  // Clear cache
  await cacheService.flush()

  // Disconnect services
  cacheService.disconnect()

  logger.info('Test environment cleaned up')
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const result = await condition()
    if (result) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(`Condition not met within ${timeout}ms`)
}

/**
 * Generate test JWT token
 */
export function generateTestToken(payload: object = { userId: 'test-user' }): string {
  const jwt = require('jsonwebtoken')
  const secret = process.env.JWT_SECRET || 'test-secret'
  return jwt.sign(payload, secret, { expiresIn: '1h' })
}
