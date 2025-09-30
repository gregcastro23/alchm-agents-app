// Comprehensive System Integration Tests for Planetary Agent Transit System
// Tests end-to-end user journeys, concurrent load, data consistency, and error recovery

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

// API Route imports
import { POST as createNatalChartAPI } from '@/app/api/user-natal-charts/route'
import { POST as personalizedTransitsAPI } from '@/app/api/personalized-transits/route'
import { POST as transitNotificationsAPI } from '@/app/api/transit-notifications/route'
import { POST as unifiedAgentChatAPI } from '@/app/api/unified-multi-agent-chat/route'
import { GET as realtimeNotificationsAPI } from '@/app/api/realtime-notifications/route'
import { POST as systemInitAPI } from '@/app/api/system-init/route'

// Mock data and utilities
import {
  mockUserNatalChart,
  mockTransitData,
  mockAgentProfiles,
  generateMockUsers,
  mockNotificationPreferences,
} from './fixtures/mock-integration-data'

const prisma = new PrismaClient()

// Test configuration
const TEST_CONFIG = {
  concurrentUsers: 25,
  testDuration: 30000, // 30 seconds
  apiTimeout: 10000, // 10 seconds
  cleanupTimeout: 5000,
}

describe('Planetary Agent Transit System - Complete Integration Suite', () => {
  let testUsers: Array<{ id: string; email: string; chartId?: string }> = []
  let activeSessions: Map<string, any> = new Map()

  beforeAll(async () => {
    // Initialize test database with clean state
    await prisma.$connect()

    // Generate test users for concurrent load testing
    testUsers = generateMockUsers(TEST_CONFIG.concurrentUsers)

    // Initialize system components
    const initRequest = new NextRequest('http://localhost/api/system-init', {
      method: 'POST',
      body: JSON.stringify({
        initializeDatabase: true,
        initializeCache: true,
        initializeJobs: true,
      }),
    })

    const initResponse = await systemInitAPI(initRequest)
    expect(initResponse.status).toBe(200)
  })

  afterAll(async () => {
    // Cleanup all test data
    await Promise.all(
      testUsers.map(async user => {
        if (user.chartId) {
          await prisma.natalChart.deleteMany({ where: { userId: user.id } })
        }
        await prisma.user.deleteMany({ where: { id: user.id } })
      })
    )

    await prisma.$disconnect()
  })

  describe('Complete User Journey Integration', () => {
    it(
      'should complete full user journey: chart creation → transit analysis → notifications → agent chat',
      async () => {
        const testUser = testUsers[0]
        let natalChartId: string

        // Step 1: Create natal chart
        const chartRequest = new NextRequest('http://localhost/api/user-natal-charts', {
          method: 'POST',
          body: JSON.stringify({
            userId: testUser.id,
            ...mockUserNatalChart,
          }),
        })

        const chartResponse = await createNatalChartAPI(chartRequest)
        expect(chartResponse.status).toBe(201)

        const chartData = await chartResponse.json()
        natalChartId = chartData.chart.id
        testUser.chartId = natalChartId

        expect(chartData.chart).toHaveProperty('celestialPlacements')
        expect(chartData.chart.celestialPlacements).toHaveLength(11) // 10 planets + ascendant

        // Step 2: Calculate personalized transits
        const transitsRequest = new NextRequest('http://localhost/api/personalized-transits', {
          method: 'POST',
          body: JSON.stringify({
            userId: testUser.id,
            chartId: natalChartId,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            significanceThreshold: 0.6,
            includeAspectDetails: true,
            includeOrbAnalysis: true,
          }),
        })

        const transitsResponse = await personalizedTransitsAPI(transitsRequest)
        expect(transitsResponse.status).toBe(200)

        const transitsData = await transitsResponse.json()
        expect(transitsData.transits).toBeDefined()
        expect(Array.isArray(transitsData.transits)).toBe(true)
        expect(transitsData.significanceSummary).toBeDefined()

        // Verify transit data structure
        if (transitsData.transits.length > 0) {
          const sampleTransit = transitsData.transits[0]
          expect(sampleTransit).toHaveProperty('transitingPlanet')
          expect(sampleTransit).toHaveProperty('natalPlanet')
          expect(sampleTransit).toHaveProperty('aspect')
          expect(sampleTransit).toHaveProperty('significance')
          expect(sampleTransit.significance).toBeGreaterThanOrEqual(0)
          expect(sampleTransit.significance).toBeLessThanOrEqual(1)
        }

        // Step 3: Set up notification preferences and trigger notifications
        const notificationRequest = new NextRequest('http://localhost/api/transit-notifications', {
          method: 'POST',
          body: JSON.stringify({
            userId: testUser.id,
            chartId: natalChartId,
            notificationType: 'significant_transit',
            threshold: 0.7,
            enabled: true,
            channels: ['email', 'push', 'in_app'],
          }),
        })

        const notificationResponse = await transitNotificationsAPI(notificationRequest)
        expect(notificationResponse.status).toBe(200)

        // Step 4: Test agent chat with transit context
        const chatRequest = new NextRequest('http://localhost/api/unified-multi-agent-chat', {
          method: 'POST',
          body: JSON.stringify({
            message: 'What do these current transits mean for my consciousness evolution?',
            agents: mockAgentProfiles.slice(0, 2), // Planetary and consciousness agents
            context: {
              userId: testUser.id,
              natalChartId,
              currentTransits: transitsData.transits.slice(0, 3), // Include recent transits
              sessionHistory: [],
              enableMemoryPersistence: true,
              realtimeUpdates: true,
            },
          }),
        })

        const chatResponse = await unifiedAgentChatAPI(chatRequest)
        expect(chatResponse.status).toBe(200)

        const chatData = await chatResponse.json()
        expect(chatData.responses).toHaveLength(2) // Two agents responded
        expect(chatData.groupDynamics).toBeDefined()
        expect(chatData.sessionUpdate).toBeDefined()

        // Verify agent responses include transit context
        chatData.responses.forEach((response: any) => {
          expect(response.content).toBeDefined()
          expect(response.consciousnessShift).toBeGreaterThan(0)
          expect(response.metadata).toHaveProperty('crossAgentReferences')
        })

        // Step 5: Verify real-time notifications are working
        const notificationsRequest = new NextRequest(
          `http://localhost/api/realtime-notifications?userId=${testUser.id}`
        )

        const notificationsResponse = await realtimeNotificationsAPI(notificationsRequest)
        expect(notificationsResponse.status).toBe(200)

        const notificationsData = await notificationsResponse.json()
        expect(notificationsData.notifications).toBeDefined()
        expect(Array.isArray(notificationsData.notifications)).toBe(true)
      },
      TEST_CONFIG.apiTimeout
    )

    it('should handle rapid successive requests without data corruption', async () => {
      const testUser = testUsers[1]
      const requests = []

      // Create multiple concurrent requests for the same user
      for (let i = 0; i < 10; i++) {
        const request = new NextRequest('http://localhost/api/personalized-transits', {
          method: 'POST',
          body: JSON.stringify({
            userId: testUser.id,
            chartId: testUser.chartId || 'test-chart-id',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        })
        requests.push(personalizedTransitsAPI(request))
      }

      const responses = await Promise.all(requests)

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Verify responses are consistent (same data structure)
      const responseData = await Promise.all(responses.map(async response => await response.json()))

      responseData.forEach(data => {
        expect(data.transits).toBeDefined()
        expect(data.significanceSummary).toBeDefined()
      })
    })
  })

  describe('Concurrent Load Testing', () => {
    it(
      `should handle ${TEST_CONFIG.concurrentUsers} simultaneous users`,
      async () => {
        const startTime = Date.now()
        const concurrentRequests = []

        // Create concurrent requests for different users
        testUsers.slice(0, TEST_CONFIG.concurrentUsers).forEach(user => {
          const request = new NextRequest('http://localhost/api/personalized-transits', {
            method: 'POST',
            body: JSON.stringify({
              userId: user.id,
              chartId: user.chartId || 'test-chart-id',
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              significanceThreshold: 0.5,
            }),
          })
          concurrentRequests.push(personalizedTransitsAPI(request))
        })

        const responses = await Promise.all(concurrentRequests)
        const endTime = Date.now()

        // Verify all requests completed successfully
        responses.forEach((response, index) => {
          expect(response.status).toBe(200, `Request ${index} failed`)
        })

        // Verify reasonable response time (under 30 seconds for all concurrent requests)
        expect(endTime - startTime).toBeLessThan(TEST_CONFIG.testDuration)

        // Verify response consistency
        const responseData = await Promise.all(
          responses.slice(0, 5).map(async response => await response.json())
        )

        responseData.forEach((data, index) => {
          expect(data.transits).toBeDefined()
          expect(data.significanceSummary).toBeDefined()
          expect(data.processingTime).toBeLessThan(5000) // Individual request under 5 seconds
        })
      },
      TEST_CONFIG.testDuration
    )

    it('should maintain data consistency under load', async () => {
      const testUser = testUsers[2]
      const initialChartId = testUser.chartId

      // Perform multiple operations concurrently
      const operations = [
        // Read operations
        fetch(`http://localhost/api/user-natal-charts?userId=${testUser.id}&primaryOnly=true`),
        fetch(`http://localhost/api/user-natal-charts?userId=${testUser.id}`),

        // Write operations (simulated through API calls)
        personalizedTransitsAPI(
          new NextRequest('http://localhost/api/personalized-transits', {
            method: 'POST',
            body: JSON.stringify({
              userId: testUser.id,
              chartId: initialChartId,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }),
          })
        ),
      ]

      const results = await Promise.all(operations)

      // All operations should succeed
      results.forEach((result, index) => {
        if (result instanceof Response) {
          expect(result.status).toBe(200)
        } else {
          expect(result.status).toBe(200)
        }
      })

      // Verify chart data remained consistent
      const chartCheck = await fetch(
        `http://localhost/api/user-natal-charts?userId=${testUser.id}&primaryOnly=true`
      )
      const chartData = await chartCheck.json()

      expect(chartData.chart.id).toBe(initialChartId)
    })
  })

  describe('Data Consistency Across APIs', () => {
    it('should maintain consistent chart data across all APIs', async () => {
      const testUser = testUsers[3]
      const chartId = testUser.chartId!

      // Fetch chart data from multiple APIs
      const [chartAPI, transitsAPI] = await Promise.all([
        fetch(`http://localhost/api/user-natal-charts?userId=${testUser.id}&primaryOnly=true`),
        personalizedTransitsAPI(
          new NextRequest('http://localhost/api/personalized-transits', {
            method: 'POST',
            body: JSON.stringify({
              userId: testUser.id,
              chartId,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }),
          })
        ),
      ])

      const chartData = await chartAPI.json()
      const transitsResponse = await transitsAPI
      const transitsData = await transitsResponse.json()

      // Verify chart consistency
      expect(chartData.chart.id).toBe(chartId)
      expect(chartData.chart.userId).toBe(testUser.id)

      // Verify transits reference correct chart
      expect(transitsData.chartId).toBe(chartId)
      expect(transitsData.userId).toBe(testUser.id)

      // Verify celestial placements consistency
      if (transitsData.transits && transitsData.transits.length > 0) {
        const sampleTransit = transitsData.transits[0]
        expect(chartData.chart.celestialPlacements).toContainEqual(
          expect.objectContaining({
            planet: sampleTransit.natalPlanet,
          })
        )
      }
    })

    it('should synchronize notification preferences across sessions', async () => {
      const testUser = testUsers[4]

      // Set notification preferences
      const setPrefsRequest = new NextRequest('http://localhost/api/transit-notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          notificationType: 'all_transits',
          threshold: 0.8,
          enabled: true,
          channels: ['email', 'push'],
        }),
      })

      await transitNotificationsAPI(setPrefsRequest)

      // Simulate new session - fetch preferences
      const getPrefsRequest = new NextRequest(
        `http://localhost/api/transit-notifications?userId=${testUser.id}`
      )
      const getResponse = await fetch(
        `http://localhost/api/transit-notifications?userId=${testUser.id}`
      )
      const prefsData = await getResponse.json()

      // Verify preferences persisted
      expect(prefsData.preferences).toBeDefined()
      expect(prefsData.preferences.threshold).toBe(0.8)
      expect(prefsData.preferences.channels).toContain('email')
      expect(prefsData.preferences.channels).toContain('push')
    })
  })

  describe('Error Recovery and Graceful Degradation', () => {
    it('should handle API failures gracefully', async () => {
      const testUser = testUsers[5]

      // Test with invalid chart ID
      const invalidRequest = new NextRequest('http://localhost/api/personalized-transits', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          chartId: 'invalid-chart-id',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      })

      const response = await personalizedTransitsAPI(invalidRequest)
      expect(response.status).toBe(404)

      const errorData = await response.json()
      expect(errorData.error).toContain('not found')

      // System should remain operational for other requests
      const validRequest = new NextRequest('http://localhost/api/user-natal-charts', {
        method: 'GET',
        url: `http://localhost/api/user-natal-charts?userId=${testUser.id}`,
      })

      // Mock URL constructor for GET request
      Object.defineProperty(validRequest, 'url', {
        value: `http://localhost/api/user-natal-charts?userId=${testUser.id}`,
      })

      const validResponse = await fetch(
        `http://localhost/api/user-natal-charts?userId=${testUser.id}`
      )
      expect(validResponse.status).toBe(200)
    })

    it('should handle network timeouts gracefully', async () => {
      const testUser = testUsers[6]

      // Create request that might timeout
      const timeoutRequest = new NextRequest('http://localhost/api/personalized-transits', {
        method: 'POST',
        body: JSON.stringify({
          userId: testUser.id,
          chartId: testUser.chartId,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Very long range
          significanceThreshold: 0.1, // Very low threshold
        }),
      })

      // Set a reasonable timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), TEST_CONFIG.apiTimeout)
      )

      try {
        await Promise.race([personalizedTransitsAPI(timeoutRequest), timeoutPromise])
      } catch (error) {
        // Should handle timeout gracefully
        expect(error.message).toBe('Timeout')
      }

      // System should still be responsive
      const healthCheck = await fetch('http://localhost/api/health')
      expect(healthCheck.status).toBe(200)
    })

    it('should recover from database connection issues', async () => {
      const testUser = testUsers[7]

      // Mock database disconnection (simulate by rejecting prisma calls)
      const originalPrismaQuery = prisma.natalChart.findUnique
      prisma.natalChart.findUnique = vi
        .fn()
        .mockRejectedValueOnce(new Error('Database connection lost'))

      const request = new NextRequest('http://localhost/api/user-natal-charts', {
        method: 'GET',
        url: `http://localhost/api/user-natal-charts?userId=${testUser.id}`,
      })

      try {
        const response = await fetch(`http://localhost/api/user-natal-charts?userId=${testUser.id}`)
        expect([500, 503]).toContain(response.status) // Should return error status
      } finally {
        // Restore original function
        prisma.natalChart.findUnique = originalPrismaQuery
      }

      // Verify system recovers
      const recoveryCheck = await fetch(
        `http://localhost/api/user-natal-charts?userId=${testUser.id}`
      )
      expect(recoveryCheck.status).toBe(200)
    })
  })

  describe('Cross-API Data Flow', () => {
    it('should maintain data flow from charts → transits → notifications → chat', async () => {
      const testUser = testUsers[8]

      // 1. Create chart
      const chartData = await createChartForUser(testUser)

      // 2. Generate transits
      const transitsData = await generateTransitsForChart(testUser, chartData.id)

      // 3. Create notifications based on transits
      const significantTransits = transitsData.transits.filter((t: any) => t.significance > 0.7)
      if (significantTransits.length > 0) {
        await setupNotificationsForTransits(testUser, significantTransits)
      }

      // 4. Use transit data in agent chat
      const chatRequest = new NextRequest('http://localhost/api/unified-multi-agent-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Help me understand these significant transits in my chart',
          agents: mockAgentProfiles.slice(0, 1),
          context: {
            userId: testUser.id,
            natalChartId: chartData.id,
            currentTransits: significantTransits,
            sessionHistory: [],
          },
        }),
      })

      const chatResponse = await unifiedAgentChatAPI(chatRequest)
      expect(chatResponse.status).toBe(200)

      const chatData = await chatResponse.json()

      // Verify chat response references transit data
      expect(chatData.responses[0].content).toBeDefined()
      expect(chatData.groupDynamics).toBeDefined()
    })
  })

  describe('Performance Benchmarks', () => {
    it('should meet API response time targets', async () => {
      const testUser = testUsers[9]
      const responseTimes: number[] = []

      // Test multiple API calls and measure response times
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now()

        const request = new NextRequest('http://localhost/api/personalized-transits', {
          method: 'POST',
          body: JSON.stringify({
            userId: testUser.id,
            chartId: testUser.chartId,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        })

        await personalizedTransitsAPI(request)
        const endTime = Date.now()
        responseTimes.push(endTime - startTime)
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const percentile95 = responseTimes.sort((a, b) => a - b)[
        Math.floor(responseTimes.length * 0.95)
      ]

      // Performance targets
      expect(averageResponseTime).toBeLessThan(200) // < 200ms average
      expect(percentile95).toBeLessThan(500) // < 500ms 95th percentile
    })

    it('should handle memory usage efficiently', async () => {
      const testUser = testUsers[10]

      // Monitor memory usage during concurrent operations
      const initialMemory = process.memoryUsage()

      const concurrentOps = Array(50)
        .fill(null)
        .map(() =>
          personalizedTransitsAPI(
            new NextRequest('http://localhost/api/personalized-transits', {
              method: 'POST',
              body: JSON.stringify({
                userId: testUser.id,
                chartId: testUser.chartId,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              }),
            })
          )
        )

      await Promise.all(concurrentOps)

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory usage should remain reasonable (< 50MB increase)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })
})

// Helper functions for test setup
async function createChartForUser(user: any): Promise<any> {
  const request = new NextRequest('http://localhost/api/user-natal-charts', {
    method: 'POST',
    body: JSON.stringify({
      userId: user.id,
      ...mockUserNatalChart,
    }),
  })

  const response = await createNatalChartAPI(request)
  const data = await response.json()
  return data.chart
}

async function generateTransitsForChart(user: any, chartId: string): Promise<any> {
  const request = new NextRequest('http://localhost/api/personalized-transits', {
    method: 'POST',
    body: JSON.stringify({
      userId: user.id,
      chartId,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  })

  const response = await personalizedTransitsAPI(request)
  return await response.json()
}

async function setupNotificationsForTransits(user: any, transits: any[]): Promise<void> {
  const request = new NextRequest('http://localhost/api/transit-notifications', {
    method: 'POST',
    body: JSON.stringify({
      userId: user.id,
      transitIds: transits.map(t => t.id),
      notificationType: 'significant_transit',
      enabled: true,
    }),
  })

  await transitNotificationsAPI(request)
}
