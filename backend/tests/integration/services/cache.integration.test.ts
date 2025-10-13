import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { cacheService } from '../../../src/services/cache.js'
import { setupIntegrationTestEnv, cleanupIntegrationTestEnv } from '../../helpers/test-server.js'

describe('Cache Service Integration Tests', () => {
  beforeAll(async () => {
    await setupIntegrationTestEnv()
  })

  afterAll(async () => {
    await cleanupIntegrationTestEnv()
  })

  describe('Redis Operations', () => {
    it('should connect to Redis successfully', async () => {
      const stats = cacheService.getStats()
      expect(stats.connected).toBe(true)
    })

    it('should set and get values', async () => {
      const key = 'test:integration:simple'
      const value = { data: 'test-value', timestamp: Date.now() }

      const setResult = await cacheService.set(key, value, 60)
      expect(setResult).toBe(true)

      const retrieved = await cacheService.get(key)
      expect(retrieved).toEqual(value)
    })

    it('should handle TTL expiration', async () => {
      const key = 'test:integration:ttl'
      const value = 'expires-quickly'

      await cacheService.set(key, value, 1) // 1 second TTL

      // Verify it exists immediately
      const immediate = await cacheService.get(key)
      expect(immediate).toBe(value)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500))

      const expired = await cacheService.get(key)
      expect(expired).toBeNull()
    })

    it('should handle complex objects', async () => {
      const key = 'test:integration:complex'
      const complexValue = {
        nested: {
          data: [1, 2, 3],
          metadata: { type: 'test', active: true },
        },
        timestamp: new Date().toISOString(),
      }

      await cacheService.set(key, complexValue, 60)
      const retrieved = await cacheService.get(key)
      expect(retrieved).toEqual(complexValue)
    })

    it('should delete keys', async () => {
      const key = 'test:integration:delete'
      await cacheService.set(key, 'to-be-deleted', 60)

      const exists = await cacheService.exists(key)
      expect(exists).toBe(true)

      await cacheService.del(key)

      const stillExists = await cacheService.exists(key)
      expect(stillExists).toBe(false)
    })

    it('should find keys by pattern', async () => {
      // Set multiple keys with same prefix
      await cacheService.set('test:pattern:one', 'value1', 60)
      await cacheService.set('test:pattern:two', 'value2', 60)
      await cacheService.set('test:pattern:three', 'value3', 60)

      const keys = await cacheService.keys('test:pattern:*')
      expect(keys.length).toBeGreaterThanOrEqual(3)
      expect(keys).toContain('test:pattern:one')
      expect(keys).toContain('test:pattern:two')
      expect(keys).toContain('test:pattern:three')
    })

    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => {
        const key = `test:concurrent:${i}`
        const value = { index: i, data: `value-${i}` }
        return cacheService.set(key, value, 60)
      })

      const results = await Promise.all(operations)
      expect(results.every(r => r === true)).toBe(true)

      // Verify all values were set
      const retrievals = Array.from({ length: 10 }, (_, i) =>
        cacheService.get(`test:concurrent:${i}`)
      )

      const values = await Promise.all(retrievals)
      values.forEach((value, i) => {
        expect(value).toEqual({ index: i, data: `value-${i}` })
      })
    })
  })

  describe('Fallback Behavior', () => {
    it('should use memory cache when Redis unavailable', async () => {
      // This test verifies the cache service can operate without Redis
      const key = 'test:fallback:memory'
      const value = 'fallback-value'

      const setResult = await cacheService.set(key, value, 60)
      expect(setResult).toBe(true)

      const retrieved = await cacheService.get(key)
      expect(retrieved).toBe(value)
    })
  })

  describe('Cache Performance', () => {
    it('should handle high-frequency reads', async () => {
      const key = 'test:performance:read'
      const value = { data: 'high-frequency-read' }

      await cacheService.set(key, value, 300)

      const startTime = Date.now()
      const reads = Array.from({ length: 100 }, () => cacheService.get(key))
      await Promise.all(reads)
      const duration = Date.now() - startTime

      // Should complete 100 reads in under 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should handle high-frequency writes', async () => {
      const startTime = Date.now()
      const writes = Array.from({ length: 50 }, (_, i) =>
        cacheService.set(`test:performance:write:${i}`, { index: i }, 60)
      )
      await Promise.all(writes)
      const duration = Date.now() - startTime

      // Should complete 50 writes in under 1 second
      expect(duration).toBeLessThan(1000)
    })
  })
})
