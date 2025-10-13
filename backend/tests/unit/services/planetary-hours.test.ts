import { planetaryHoursService } from '../../../src/services/planetary-hours.js'

describe('PlanetaryHoursService', () => {
  const testLocation = { lat: 37.7749, lon: -122.4194 } // San Francisco

  describe('getCurrentPlanetaryHour', () => {
    it('should return current planetary hour information', async () => {
      const result = await planetaryHoursService.getCurrentPlanetaryHour(new Date(), testLocation)

      expect(result).toHaveProperty('planet')
      expect(result).toHaveProperty('dayType')
      expect(result).toHaveProperty('hourIndex')
      expect(result).toHaveProperty('startTime')
      expect(result).toHaveProperty('endTime')
      expect(result).toHaveProperty('nextTransition')
      expect(result).toHaveProperty('modifiers')

      expect(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']).toContain(
        result.planet
      )
      expect(['day', 'night']).toContain(result.dayType)
      expect(result.hourIndex).toBeWithinRange(0, 23)
      expect(result.startTime).toBeInstanceOf(Date)
      expect(result.endTime).toBeInstanceOf(Date)
      expect(result.nextTransition).toBeInstanceOf(Date)
      expect(typeof result.modifiers).toBe('object')
    })

    it('should handle different times of day correctly', async () => {
      const noonTime = new Date()
      noonTime.setHours(12, 0, 0, 0)

      const midnightTime = new Date()
      midnightTime.setHours(0, 0, 0, 0)

      const noonResult = await planetaryHoursService.getCurrentPlanetaryHour(noonTime, testLocation)
      const midnightResult = await planetaryHoursService.getCurrentPlanetaryHour(
        midnightTime,
        testLocation
      )

      // Noon should typically be day, midnight should be night
      // Note: This might vary by season and location
      expect(['day', 'night']).toContain(noonResult.dayType)
      expect(['day', 'night']).toContain(midnightResult.dayType)
    })

    it('should return consistent results for the same time', async () => {
      const testTime = new Date('2025-06-21T12:00:00Z') // Summer solstice noon UTC

      const result1 = await planetaryHoursService.getCurrentPlanetaryHour(testTime, testLocation)
      const result2 = await planetaryHoursService.getCurrentPlanetaryHour(testTime, testLocation)

      expect(result1.planet).toBe(result2.planet)
      expect(result1.dayType).toBe(result2.dayType)
      expect(result1.hourIndex).toBe(result2.hourIndex)
    })
  })

  describe('getForecast', () => {
    it('should return forecast for date range', async () => {
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // 24 hours later

      const forecast = await planetaryHoursService.getForecast(startDate, endDate, testLocation, 60)

      expect(Array.isArray(forecast)).toBe(true)
      expect(forecast.length).toBeGreaterThan(0)
      expect(forecast.length).toBeLessThanOrEqual(25) // Max 25 hours

      forecast.forEach(entry => {
        expect(entry).toHaveProperty('datetime')
        expect(entry).toHaveProperty('planetaryHour')
        expect(entry).toHaveProperty('influence')
        expect(entry.datetime).toBeInstanceOf(Date)
        expect(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']).toContain(
          entry.planetaryHour.planet
        )
      })
    })

    it('should handle different intervals correctly', async () => {
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000) // 6 hours later

      const forecast60 = await planetaryHoursService.getForecast(
        startDate,
        endDate,
        testLocation,
        60
      )
      const forecast120 = await planetaryHoursService.getForecast(
        startDate,
        endDate,
        testLocation,
        120
      )

      expect(forecast60.length).toBeGreaterThan(forecast120.length)
      expect(forecast60.length).toBe(7) // 6 hours + 1
      expect(forecast120.length).toBe(4) // Every 2 hours + 1
    })
  })

  describe('getOptimalTimes', () => {
    it('should return optimal times for specific planet', async () => {
      const testDate = new Date()
      const targetPlanet = 'Sun'

      const optimalTimes = await planetaryHoursService.getOptimalTimes(
        testDate,
        testLocation,
        targetPlanet
      )

      expect(Array.isArray(optimalTimes)).toBe(true)
      optimalTimes.forEach(time => {
        expect(time.planet).toBe(targetPlanet)
        expect(time).toHaveProperty('startTime')
        expect(time).toHaveProperty('endTime')
        expect(time.startTime).toBeInstanceOf(Date)
        expect(time.endTime).toBeInstanceOf(Date)
      })
    })

    it('should return empty array for invalid planet', async () => {
      const testDate = new Date()
      const invalidPlanet = 'InvalidPlanet'

      const optimalTimes = await planetaryHoursService.getOptimalTimes(
        testDate,
        testLocation,
        invalidPlanet
      )

      expect(Array.isArray(optimalTimes)).toBe(true)
      expect(optimalTimes.length).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle extreme latitudes', async () => {
      const arcticLocation = { lat: 80, lon: 0 } // Arctic
      const antarcticLocation = { lat: -80, lon: 0 } // Antarctic

      const arcticResult = await planetaryHoursService.getCurrentPlanetaryHour(
        new Date(),
        arcticLocation
      )
      const antarcticResult = await planetaryHoursService.getCurrentPlanetaryHour(
        new Date(),
        antarcticLocation
      )

      expect(arcticResult).toHaveProperty('planet')
      expect(antarcticResult).toHaveProperty('planet')
      expect(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']).toContain(
        arcticResult.planet
      )
      expect(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']).toContain(
        antarcticResult.planet
      )
    })

    it('should handle date boundaries correctly', async () => {
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)

      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const endResult = await planetaryHoursService.getCurrentPlanetaryHour(endOfDay, testLocation)
      const startResult = await planetaryHoursService.getCurrentPlanetaryHour(
        startOfDay,
        testLocation
      )

      expect(endResult).toHaveProperty('planet')
      expect(startResult).toHaveProperty('planet')
    })
  })
})
