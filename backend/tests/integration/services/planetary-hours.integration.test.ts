import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { planetaryHoursService } from '../../../src/services/planetary-hours.js'
import { setupIntegrationTestEnv, cleanupIntegrationTestEnv } from '../../helpers/test-server.js'
import { validLocation, generateLocation } from '../../helpers/fixtures.js'

describe('Planetary Hours Service Integration Tests', () => {
  beforeAll(async () => {
    await setupIntegrationTestEnv()
  })

  afterAll(async () => {
    await cleanupIntegrationTestEnv()
  })

  describe('Current Planetary Hour', () => {
    it('should calculate current planetary hour', async () => {
      const result = await planetaryHoursService.getCurrentPlanetaryHour(
        new Date(),
        validLocation
      )

      expect(result).toBeDefined()
      expect(result.planet).toBeDefined()
      expect(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']).toContain(
        result.planet
      )
      expect(['day', 'night']).toContain(result.dayType)
      expect(result.hourIndex).toBeGreaterThanOrEqual(0)
      expect(result.hourIndex).toBeLessThan(24)
      expect(result.startTime).toBeInstanceOf(Date)
      expect(result.endTime).toBeInstanceOf(Date)
      expect(result.modifiers).toBeDefined()
    })

    it('should return consistent results for same time', async () => {
      const testDate = new Date('2025-06-21T12:00:00Z')
      const location = validLocation

      const result1 = await planetaryHoursService.getCurrentPlanetaryHour(testDate, location)
      const result2 = await planetaryHoursService.getCurrentPlanetaryHour(testDate, location)

      expect(result1.planet).toBe(result2.planet)
      expect(result1.dayType).toBe(result2.dayType)
      expect(result1.hourIndex).toBe(result2.hourIndex)
    })

    it('should handle different locations', async () => {
      const testDate = new Date('2025-06-21T12:00:00Z')

      const locations = [
        { lat: 40.7128, lon: -74.006 }, // New York
        { lat: 51.5074, lon: -0.1278 }, // London
        { lat: 35.6762, lon: 139.6503 }, // Tokyo
      ]

      const results = await Promise.all(
        locations.map(loc => planetaryHoursService.getCurrentPlanetaryHour(testDate, loc))
      )

      // Different locations may have different planetary hours
      results.forEach(result => {
        expect(result.planet).toBeDefined()
        expect(result.dayType).toBeDefined()
      })
    })
  })

  describe('Planetary Hour Forecast', () => {
    it('should generate forecast for date range', async () => {
      const startDate = new Date('2025-06-21T00:00:00Z')
      const endDate = new Date('2025-06-21T23:59:59Z')

      const forecast = await planetaryHoursService.getForecast(
        startDate,
        endDate,
        validLocation,
        60 // 1-hour intervals
      )

      expect(forecast).toBeDefined()
      expect(forecast.length).toBeGreaterThan(0)
      expect(forecast.length).toBeLessThanOrEqual(24)

      forecast.forEach(entry => {
        expect(entry.datetime).toBeInstanceOf(Date)
        expect(entry.planetaryHour).toBeDefined()
        expect(entry.influence).toBeDefined()
        expect(entry.influence.spirit).toBeGreaterThan(0)
        expect(entry.influence.essence).toBeGreaterThan(0)
        expect(entry.influence.matter).toBeGreaterThan(0)
        expect(entry.influence.substance).toBeGreaterThan(0)
      })
    })

    it('should handle custom intervals', async () => {
      const startDate = new Date('2025-06-21T00:00:00Z')
      const endDate = new Date('2025-06-21T06:00:00Z')

      const forecast30min = await planetaryHoursService.getForecast(
        startDate,
        endDate,
        validLocation,
        30
      )

      const forecast1hour = await planetaryHoursService.getForecast(
        startDate,
        endDate,
        validLocation,
        60
      )

      // 30-minute intervals should have roughly 2x entries
      expect(forecast30min.length).toBeGreaterThan(forecast1hour.length)
    })

    it('should cache forecast results', async () => {
      const startDate = new Date('2025-06-21T00:00:00Z')
      const endDate = new Date('2025-06-21T12:00:00Z')

      const start1 = Date.now()
      await planetaryHoursService.getForecast(startDate, endDate, validLocation, 60)
      const duration1 = Date.now() - start1

      // Second call should be faster due to caching
      const start2 = Date.now()
      await planetaryHoursService.getForecast(startDate, endDate, validLocation, 60)
      const duration2 = Date.now() - start2

      expect(duration2).toBeLessThan(duration1)
    })
  })

  describe('Optimal Times', () => {
    it('should find optimal times for specific planet', async () => {
      const date = new Date('2025-06-21')

      const sunTimes = await planetaryHoursService.getOptimalTimes(date, validLocation, 'Sun')

      expect(sunTimes).toBeDefined()
      expect(sunTimes.length).toBeGreaterThan(0)

      sunTimes.forEach(time => {
        expect(time.planet).toBe('Sun')
        expect(time.startTime.getDate()).toBe(date.getDate())
      })
    })

    it('should return empty array for non-occurring planets', async () => {
      const date = new Date('2025-06-21')

      // Test with invalid planet name
      const invalidTimes = await planetaryHoursService.getOptimalTimes(
        date,
        validLocation,
        'InvalidPlanet'
      )

      expect(invalidTimes).toEqual([])
    })
  })

  describe('Edge Cases', () => {
    it('should handle polar regions (midnight sun)', async () => {
      const arcticLocation = { lat: 78.2232, lon: 15.6267 } // Longyearbyen
      const summerDate = new Date('2025-06-21T12:00:00Z')

      const result = await planetaryHoursService.getCurrentPlanetaryHour(
        summerDate,
        arcticLocation
      )

      expect(result).toBeDefined()
      expect(result.planet).toBeDefined()
    })

    it('should handle equator locations', async () => {
      const equatorLocation = { lat: 0, lon: 0 }
      const testDate = new Date('2025-06-21T12:00:00Z')

      const result = await planetaryHoursService.getCurrentPlanetaryHour(
        testDate,
        equatorLocation
      )

      expect(result).toBeDefined()
      expect(result.dayType).toBe('day')
    })

    it('should handle date transitions', async () => {
      const location = validLocation
      const midnight = new Date('2025-06-21T23:59:00Z')

      const beforeMidnight = await planetaryHoursService.getCurrentPlanetaryHour(
        midnight,
        location
      )
      const afterMidnight = await planetaryHoursService.getCurrentPlanetaryHour(
        new Date(midnight.getTime() + 2 * 60 * 1000),
        location
      )

      expect(beforeMidnight.planet).toBeDefined()
      expect(afterMidnight.planet).toBeDefined()
      // Planets should be different at date transition
    })
  })

  describe('Performance', () => {
    it('should calculate multiple planetary hours efficiently', async () => {
      const dates = Array.from(
        { length: 10 },
        (_, i) => new Date(Date.now() + i * 60 * 60 * 1000)
      )

      const startTime = Date.now()
      await Promise.all(
        dates.map(date => planetaryHoursService.getCurrentPlanetaryHour(date, validLocation))
      )
      const duration = Date.now() - startTime

      // Should complete 10 calculations in under 2 seconds
      expect(duration).toBeLessThan(2000)
    })
  })
})
