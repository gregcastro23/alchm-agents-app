import request from 'supertest'
import express from 'express'
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import alchemyRoutes from '../../../src/routes/alchemy.js'
import { errorHandler } from '../../../src/middleware/error-handler.js'
import { featureFlagMiddleware } from '../../../src/middleware/feature-flags.js'
import { authMiddleware } from '../../../src/middleware/auth.js'
import {
  TestServer,
  setupIntegrationTestEnv,
  cleanupIntegrationTestEnv,
  generateTestToken,
} from '../../helpers/test-server.js'
import { validTokens, validBirthInfo } from '../../helpers/fixtures.js'

describe('Alchemy Routes Integration Tests', () => {
  let testServer: TestServer
  let baseUrl: string
  let authToken: string

  beforeAll(async () => {
    await setupIntegrationTestEnv()

    // Create Express app
    const app = express()
    app.use(express.json())
    app.use(featureFlagMiddleware)
    app.use(authMiddleware)
    app.use('/api/alchemy', alchemyRoutes)
    app.use(errorHandler)

    // Start server
    testServer = new TestServer(app)
    baseUrl = await testServer.start()

    // Generate auth token
    authToken = generateTestToken({ userId: 'integration-test-user' })
  })

  afterAll(async () => {
    await testServer.stop()
    await cleanupIntegrationTestEnv()
  })

  describe('POST /api/alchemy/token-equilibrium', () => {
    it('should validate token equilibrium with real calculations', async () => {
      const response = await request(baseUrl)
        .post('/api/alchemy/token-equilibrium')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tokens: validTokens })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.elementalHarmony).toBeDefined()
      expect(typeof response.body.data.elementalHarmony).toBe('number')
    })

    it('should reject requests without authentication', async () => {
      const response = await request(baseUrl)
        .post('/api/alchemy/token-equilibrium')
        .send({ tokens: validTokens })

      expect(response.status).toBe(401)
    })

    it('should reject invalid token values', async () => {
      const invalidTokens = {
        spirit: -0.1, // Negative value
        essence: 0.4,
        matter: 0.2,
        substance: 0.1,
      }

      const response = await request(baseUrl)
        .post('/api/alchemy/token-equilibrium')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tokens: invalidTokens })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should reject malformed token structure', async () => {
      const malformedTokens = {
        spirit: 'not-a-number',
        essence: 0.4,
      }

      const response = await request(baseUrl)
        .post('/api/alchemy/token-equilibrium')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tokens: malformedTokens })

      expect(response.status).toBe(400)
    })

    it('should handle edge case token distributions', async () => {
      const edgeCases = [
        { spirit: 1.0, essence: 0, matter: 0, substance: 0 }, // All spirit
        { spirit: 0.25, essence: 0.25, matter: 0.25, substance: 0.25 }, // Perfect balance
        { spirit: 0.1, essence: 0.3, matter: 0.5, substance: 0.1 }, // Matter dominant
      ]

      for (const tokens of edgeCases) {
        const response = await request(baseUrl)
          .post('/api/alchemy/token-equilibrium')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ tokens })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      }
    })
  })

  describe('POST /api/alchemy/emergency-assessment', () => {
    it('should perform emergency assessment with real data', async () => {
      const requestData = {
        tokens: validTokens,
        astrologicalEvent: {
          type: 'eclipse',
          severity: 'critical',
        },
      }

      const response = await request(baseUrl)
        .post('/api/alchemy/emergency-assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.assessment).toBeDefined()
    })

    it('should handle different event severities', async () => {
      const severities = ['low', 'medium', 'high', 'critical']

      for (const severity of severities) {
        const response = await request(baseUrl)
          .post('/api/alchemy/emergency-assessment')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tokens: validTokens,
            astrologicalEvent: { type: 'aspect', severity },
          })

        expect(response.status).toBe(200)
        expect(response.body.data.assessment.severity).toBeDefined()
      }
    })

    it('should validate event types', async () => {
      const invalidEvent = {
        tokens: validTokens,
        astrologicalEvent: {
          type: 'invalid-event-type',
          severity: 'critical',
        },
      }

      const response = await request(baseUrl)
        .post('/api/alchemy/emergency-assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEvent)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/alchemy/status', () => {
    it('should return comprehensive service status', async () => {
      const response = await request(baseUrl)
        .get('/api/alchemy/status')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.backend).toBeDefined()
      expect(response.body.data.circuitBreaker).toBeDefined()
    })

    it('should include cache statistics', async () => {
      const response = await request(baseUrl)
        .get('/api/alchemy/status')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.body.data.cache).toBeDefined()
    })
  })

  describe('Caching Behavior', () => {
    it('should cache repeated identical requests', async () => {
      const requestData = { tokens: validTokens }

      // First request
      const response1 = await request(baseUrl)
        .post('/api/alchemy/token-equilibrium')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)

      expect(response1.status).toBe(200)

      // Second identical request should return cached result
      const response2 = await request(baseUrl)
        .post('/api/alchemy/token-equilibrium')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)

      expect(response2.status).toBe(200)
      // Cached response should be identical
      expect(response1.body).toEqual(response2.body)

      // Verify cache is being used by checking multiple requests return consistent results
      const response3 = await request(baseUrl)
        .post('/api/alchemy/token-equilibrium')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)

      expect(response3.status).toBe(200)
      expect(response1.body).toEqual(response3.body)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(baseUrl)
        .post('/api/alchemy/token-equilibrium')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')

      expect(response.status).toBe(400)
    })

    it('should handle missing required fields', async () => {
      const response = await request(baseUrl)
        .post('/api/alchemy/token-equilibrium')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Missing tokens field

      expect(response.status).toBe(400)
    })

    it('should handle server errors gracefully', async () => {
      // Send request that would cause internal error
      const response = await request(baseUrl)
        .post('/api/alchemy/emergency-assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tokens: validTokens,
          astrologicalEvent: null, // Invalid structure
        })

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(baseUrl)
          .post('/api/alchemy/token-equilibrium')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tokens: {
              spirit: 0.3 + i * 0.01,
              essence: 0.3,
              matter: 0.2,
              substance: 0.2 - i * 0.01,
            },
          })
      )

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })
    })
  })
})
