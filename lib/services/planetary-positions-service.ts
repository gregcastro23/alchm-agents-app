/**
 * Unified Planetary Positions Service
 * ===================================
 *
 * Provides accurate, cached, and resilient planetary position calculations
 * with comprehensive fallback hierarchy for maximum reliability.
 */

import { CircuitBreaker, withRetries } from '@/lib/resilience'
import { EnhancedBirthInfo, calculateAllPlanets } from '@/lib/enhanced-astronomical-calculator'
import { getCurrentPlanetaryPositions } from '@/lib/calculate-transits'
import { fetchAstrologizeWheel, fetchAlchmize, type BirthInfo } from '@/lib/astrologize'
import { performanceCache } from '@/lib/performance-cache'

export interface PlanetaryPosition {
  planet: string
  sign: string
  degree: number // 0-29.9999 within sign
  longitude?: number // 0-360 absolute longitude
  retrograde: boolean
  speed?: number // degrees per day
}

export interface AlchemicalQuantities {
  spirit: number
  essence: number
  matter: number
  substance: number
  Heat: number
  Entropy: number
  Reactivity: number
  Energy: number
}

export interface PlanetaryData {
  timestamp: string
  planetaryPositions: PlanetaryPosition[]
  alchmQuantities?: AlchemicalQuantities
  monicaConstant?: number
  source: 'external-api' | 'enhanced-calculator' | 'basic-transits' | 'static-fallback'
  accuracy: 'high' | 'medium' | 'low' | 'fallback'
  cached: boolean
  cacheAge?: number // milliseconds since cached
  error?: string
}

export type AccuracyLevel = 'high' | 'medium' | 'low' | 'fallback'

interface ServiceOptions {
  accuracy: AccuracyLevel
  useCache: boolean
  timeout: number
  retryAttempts: number
}

const DEFAULT_OPTIONS: Required<ServiceOptions> = {
  accuracy: 'high',
  useCache: true,
  timeout: 10000,
  retryAttempts: 2,
}

// Circuit breakers for different services
const externalApiCB = new CircuitBreaker()
const enhancedCalcCB = new CircuitBreaker()
const basicTransitsCB = new CircuitBreaker()

export class PlanetaryPositionsService {
  private cache = new Map<string, { data: PlanetaryData; timestamp: number; expiresAt: number }>()
  private readonly cacheTTL = {
    high: 5 * 60 * 1000, // 5 minutes for high accuracy
    medium: 15 * 60 * 1000, // 15 minutes for medium
    low: 60 * 60 * 1000, // 1 hour for low
    fallback: 24 * 60 * 60 * 1000, // 24 hours for fallback
  }

  /**
   * Generate cache key for planetary data
   */
  private generateCacheKey(date: Date, accuracy: AccuracyLevel): string {
    // Cache by hour for high/medium, by day for low/fallback
    const precision = accuracy === 'high' || accuracy === 'medium' ? 'hour' : 'day'
    const timeKey =
      precision === 'hour'
        ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
        : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

    return `planetary-${precision}-${timeKey}-${accuracy}`
  }

  /**
   * Get cached data if available and valid
   */
  private getCachedData(date: Date, accuracy: AccuracyLevel): PlanetaryData | null {
    const key = this.generateCacheKey(date, accuracy)
    const cached = this.cache.get(key)

    if (!cached) return null

    const now = Date.now()
    if (now > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return {
      ...cached.data,
      cached: true,
      cacheAge: now - cached.timestamp,
    }
  }

  /**
   * Cache planetary data
   */
  private setCachedData(date: Date, accuracy: AccuracyLevel, data: PlanetaryData): void {
    const key = this.generateCacheKey(date, accuracy)
    const ttl = this.cacheTTL[accuracy]

    this.cache.set(key, {
      data: { ...data, cached: false },
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    })

    // Cleanup old cache entries (keep last 100)
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )

      entries.slice(0, 20).forEach(([key]) => this.cache.delete(key))
    }
  }

  /**
   * Method 1: External API (highest accuracy)
   */
  private async fetchFromExternalAPI(
    date: Date,
    options: ServiceOptions
  ): Promise<PlanetaryData | null> {
    try {
      // Create birth info for current moment
      const birthInfo: BirthInfo = {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1, // Convert to 1-based
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        latitude: 0, // Planetary positions don't depend on location
        longitude: 0,
        name: 'Current Moment',
      }

      const result = await externalApiCB.exec(async () => {
        return (await Promise.race([
          fetchAlchmize({ birth: birthInfo }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('External API timeout')), options.timeout)
          ),
        ])) as any
      })

      if (!result.result?.astrologize) {
        return null
      }

      // This is a fallback - external API doesn't provide planetary positions directly
      // We would need to parse the astrologize SVG or use a different approach
      return null
    } catch (error) {
      console.warn('External API planetary positions failed:', error)
      return null
    }
  }

  /**
   * Method 2: Enhanced Astronomical Calculator (high accuracy)
   */
  private async fetchFromEnhancedCalculator(
    date: Date,
    options: ServiceOptions
  ): Promise<PlanetaryData> {
    try {
      const birthInfo: EnhancedBirthInfo = {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds(),
        latitude: 0, // Not needed for planetary positions
        longitude: 0,
      }

      const result = await enhancedCalcCB.exec(async () => {
        return await Promise.race([
          calculateAllPlanets(birthInfo),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Enhanced calculator timeout')), options.timeout)
          ),
        ])
      })

      if (!result.result) {
        throw new Error('Enhanced calculator returned no result')
      }

      const planetaryPositions: PlanetaryPosition[] = Object.entries(result.result.planets).map(
        ([planet, pos]: [string, any]) => ({
          planet,
          sign: pos.sign || 'Aries',
          degree: Math.max(0, Math.min(29.9999, pos.signDegree || 0)),
          longitude: pos.longitude,
          retrograde: Boolean(pos.retrograde),
          speed: pos.speed,
        })
      )

      return {
        timestamp: date.toISOString(),
        planetaryPositions,
        source: 'enhanced-calculator',
        accuracy: 'high',
        cached: false,
      }
    } catch (error) {
      console.warn('Enhanced calculator failed:', error)
      throw error
    }
  }

  /**
   * Method 3: Basic Transit Calculations (medium accuracy)
   */
  private async fetchFromBasicTransits(
    date: Date,
    options: ServiceOptions
  ): Promise<PlanetaryData> {
    try {
      const result = await basicTransitsCB.exec(async () => {
        return await Promise.race([
          getCurrentPlanetaryPositions(date.getTime()),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Basic transits timeout')), options.timeout)
          ),
        ])
      })

      if (!result.result) {
        throw new Error('Basic transits returned no result')
      }

      const planetaryPositions: PlanetaryPosition[] = Object.entries(result.result).map(
        ([planet, pos]: [string, any]) => ({
          planet,
          sign: pos.sign || 'Aries',
          degree: Math.max(0, Math.min(29.9999, parseFloat(pos.degree) || 0)),
          retrograde: Boolean(pos.retrograde),
        })
      )

      return {
        timestamp: date.toISOString(),
        planetaryPositions,
        source: 'basic-transits',
        accuracy: 'medium',
        cached: false,
      }
    } catch (error) {
      console.warn('Basic transits failed:', error)
      throw error
    }
  }

  /**
   * Method 4: Static Fallback Positions (low accuracy, guaranteed availability)
   */
  private getStaticFallbackPositions(date: Date): PlanetaryData {
    // Simplified fallback positions - these would be reasonable defaults
    // In a real implementation, these could be more sophisticated approximations
    const planetaryPositions: PlanetaryPosition[] = [
      { planet: 'Sun', sign: 'Aries', degree: 15, retrograde: false },
      { planet: 'Moon', sign: 'Cancer', degree: 10, retrograde: false },
      { planet: 'Mercury', sign: 'Aries', degree: 20, retrograde: false },
      { planet: 'Venus', sign: 'Taurus', degree: 5, retrograde: false },
      { planet: 'Mars', sign: 'Aries', degree: 25, retrograde: false },
      { planet: 'Jupiter', sign: 'Sagittarius', degree: 15, retrograde: false },
      { planet: 'Saturn', sign: 'Capricorn', degree: 10, retrograde: false },
      { planet: 'Uranus', sign: 'Aquarius', degree: 5, retrograde: false },
      { planet: 'Neptune', sign: 'Pisces', degree: 20, retrograde: false },
      { planet: 'Pluto', sign: 'Capricorn', degree: 25, retrograde: false },
    ]

    return {
      timestamp: date.toISOString(),
      planetaryPositions,
      source: 'static-fallback',
      accuracy: 'fallback',
      cached: false,
      error: 'All calculation methods failed, using static fallback positions',
    }
  }

  /**
   * Main method to get planetary positions with automatic fallback hierarchy
   */
  async getPlanetaryPositions(
    date: Date = new Date(),
    options: Partial<ServiceOptions> = {}
  ): Promise<PlanetaryData> {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    // Try cache first if enabled
    if (opts.useCache) {
      const cached = this.getCachedData(date, opts.accuracy)
      if (cached) {
        return cached
      }
    }

    // Fallback hierarchy based on accuracy requirement
    const methods: Array<{
      method: () => Promise<PlanetaryData | null>
      source: PlanetaryData['source']
      accuracy: PlanetaryData['accuracy']
    }> = []

    if (opts.accuracy === 'high') {
      methods.push(
        {
          method: () => this.fetchFromExternalAPI(date, opts),
          source: 'external-api',
          accuracy: 'high',
        },
        {
          method: () => this.fetchFromEnhancedCalculator(date, opts),
          source: 'enhanced-calculator',
          accuracy: 'high',
        },
        {
          method: () => this.fetchFromBasicTransits(date, opts),
          source: 'basic-transits',
          accuracy: 'medium',
        }
      )
    } else if (opts.accuracy === 'medium') {
      methods.push(
        {
          method: () => this.fetchFromEnhancedCalculator(date, opts),
          source: 'enhanced-calculator',
          accuracy: 'high',
        },
        {
          method: () => this.fetchFromBasicTransits(date, opts),
          source: 'basic-transits',
          accuracy: 'medium',
        }
      )
    } else if (opts.accuracy === 'low') {
      methods.push({
        method: () => this.fetchFromBasicTransits(date, opts),
        source: 'basic-transits',
        accuracy: 'medium',
      })
    }

    // Always have static fallback as last resort
    methods.push({
      method: () => Promise.resolve(this.getStaticFallbackPositions(date)),
      source: 'static-fallback',
      accuracy: 'fallback',
    })

    // Try methods in order
    for (const { method, source, accuracy } of methods) {
      try {
        const result = await method()
        if (result) {
          // Cache successful result if caching is enabled
          if (opts.useCache) {
            this.setCachedData(date, opts.accuracy, result)
          }

          return result
        }
      } catch (error) {
        console.warn(`${source} method failed:`, error)
        continue
      }
    }

    // This should never happen due to static fallback, but just in case
    throw new Error('All planetary position calculation methods failed')
  }

  /**
   * Get planetary positions with alchemical calculations
   */
  async getPlanetaryPositionsWithAlchemy(
    date: Date = new Date(),
    options: Partial<ServiceOptions> = {}
  ): Promise<PlanetaryData> {
    const planetaryData = await this.getPlanetaryPositions(date, options)

    // Try to get alchemical data from philosophers-stone API
    try {
      const response = await fetch('/api/philosophers-stone/positions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const alchemyData = await response.json()
        planetaryData.alchmQuantities = alchemyData.alchmQuantities
        planetaryData.monicaConstant = alchemyData.monicaConstant
      }
    } catch (error) {
      console.warn('Failed to fetch alchemical data:', error)
    }

    return planetaryData
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[]; hitRate?: number } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Validate planetary position data
   */
  validatePositions(positions: PlanetaryPosition[]): boolean {
    if (!Array.isArray(positions) || positions.length === 0) {
      return false
    }

    for (const pos of positions) {
      if (!pos.planet || !pos.sign) return false
      if (typeof pos.degree !== 'number' || pos.degree < 0 || pos.degree >= 30) return false
      if (typeof pos.retrograde !== 'boolean') return false
    }

    return true
  }
}

// Export singleton instance
export const planetaryPositionsService = new PlanetaryPositionsService()
