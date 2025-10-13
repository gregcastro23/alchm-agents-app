/**
 * Test fixtures for integration tests
 * Real data structures matching production formats
 */

export const validBirthInfo = {
  year: 1990,
  month: 1,
  day: 15,
  hour: 14,
  minute: 30,
  latitude: 40.7128,
  longitude: -74.006,
}

export const validLocation = {
  lat: 40.7128,
  lon: -74.006,
}

export const validTokens = {
  spirit: 0.3,
  essence: 0.4,
  matter: 0.2,
  substance: 0.1,
}

export const validAstrologicalEvent = {
  type: 'eclipse',
  severity: 'critical',
  planet: 'Sun',
  aspectType: 'conjunction',
}

export const expectedHoroscopeStructure = {
  tropical: {
    CelestialBodies: {
      all: expect.any(Array),
      sun: expect.any(Object),
      moon: expect.any(Object),
    },
    Ascendant: expect.any(Object),
    Aspects: expect.any(Object),
  },
}

export const expectedAlchemyResponse = {
  success: expect.any(Boolean),
  alchemicalProfile: {
    spirit: expect.any(Number),
    essence: expect.any(Number),
    matter: expect.any(Number),
    substance: expect.any(Number),
    dominantElement: expect.any(String),
    heat: expect.any(Number),
    entropy: expect.any(Number),
  },
}

/**
 * Generate test birth data with variations
 */
export function generateBirthData(overrides?: Partial<typeof validBirthInfo>) {
  return {
    ...validBirthInfo,
    ...overrides,
  }
}

/**
 * Generate test location data with variations
 */
export function generateLocation(overrides?: Partial<typeof validLocation>) {
  return {
    ...validLocation,
    ...overrides,
  }
}

/**
 * Generate random date within range
 */
export function generateRandomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime()
  const end = endDate.getTime()
  const random = Math.random() * (end - start) + start
  return new Date(random)
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
