import request from 'supertest'
import express from 'express'
import alchemyRoutes from '../../src/routes/alchemy'

const app = express()
app.use(express.json())
app.use('/api/alchemy', alchemyRoutes)

describe('Alchemy Routes', () => {
  describe('POST /api/alchemy/token-equilibrium', () => {
    it('should validate token equilibrium', async () => {
      const tokens = {
        spirit: 0.3,
        essence: 0.4,
        matter: 0.2,
        substance: 0.1,
      }

      const response = await request(app).post('/api/alchemy/token-equilibrium').send({ tokens })

      expect(response.status).toBe(401) // Should require auth
    })

    it('should reject invalid tokens', async () => {
      const invalidTokens = {
        spirit: 'invalid',
        essence: 0.4,
        matter: 0.2,
        substance: 0.1,
      }

      const response = await request(app)
        .post('/api/alchemy/token-equilibrium')
        .send({ tokens: invalidTokens })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/alchemy/emergency-assessment', () => {
    it('should require authentication', async () => {
      const requestData = {
        tokens: {
          spirit: 0.3,
          essence: 0.4,
          matter: 0.2,
          substance: 0.1,
        },
        astrologicalEvent: {
          type: 'eclipse',
          severity: 'critical',
        },
      }

      const response = await request(app)
        .post('/api/alchemy/emergency-assessment')
        .send(requestData)

      expect(response.status).toBe(401)
    })

    it('should validate input data', async () => {
      const invalidData = {
        tokens: {
          spirit: 'invalid',
          essence: 0.4,
          matter: 0.2,
          substance: 0.1,
        },
        astrologicalEvent: {
          type: 'eclipse',
          severity: 'invalid',
        },
      }

      const response = await request(app)
        .post('/api/alchemy/emergency-assessment')
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/alchemy/status', () => {
    it('should return alchemy service status', async () => {
      const response = await request(app).get('/api/alchemy/status')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('backend')
      expect(response.body.data).toHaveProperty('circuitBreaker')
    })
  })
})
