import dotenv from 'dotenv'
import { expect, jest } from '@jest/globals'

// Load integration test environment variables
dotenv.config({ path: '.env.test' })

// Set integration test environment
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'error'

// Integration test configuration
process.env.REDIS_TEST_URL = process.env.REDIS_TEST_URL || 'redis://localhost:6380'
process.env.MOCK_API_URL = process.env.MOCK_API_URL || 'http://localhost:9000'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-integration-secret'

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(min: number, max: number): R
    }
  }
}

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min} - ${max}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${min} - ${max}`,
        pass: false,
      }
    }
  },
})

// Longer timeout for integration tests
jest.setTimeout(30000)

// Global setup - check if required services are available
beforeAll(async () => {
  console.log('🧪 Starting integration test suite...')
  console.log('📍 Redis URL:', process.env.REDIS_TEST_URL)
  console.log('📍 Mock API URL:', process.env.MOCK_API_URL)
})

afterAll(async () => {
  console.log('✅ Integration test suite completed')
})
