import { NextRequest, NextResponse } from 'next/server'
import { planetaryPositionsService } from '@/lib/services/planetary-positions-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface AccuracyValidationResult {
  timestamp: string
  source: string
  accuracy: string
  precision: number // degrees of difference
  planetsValidated: number
  totalPlanets: number
  responseTime: number
  cached: boolean
}

interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
  averageCacheAge: number
  cacheSize: number
}

interface PerformanceMetrics {
  p50: number // 50th percentile response time
  p95: number // 95th percentile response time
  p99: number // 99th percentile response time
  average: number
  min: number
  max: number
  totalRequests: number
}

interface PlanetaryMetrics {
  accuracyValidation: {
    lastValidation: AccuracyValidationResult | null
    averagePrecision: number
    validationCount: number
    sourcesUsed: Record<string, number>
  }
  cache: CacheMetrics
  performance: PerformanceMetrics
  health: {
    circuitBreakers: Record<string, { state: string, failures: number, lastFailure: string | null }>
    externalApiStatus: string
    lastHealthCheck: string
  }
  usage: {
    requestsByAccuracy: Record<string, number>
    requestsBySource: Record<string, number>
    popularTimeRanges: Record<string, number>
  }
}

// In-memory metrics storage (would be Redis in production)
let metricsStorage: {
  accuracyValidations: AccuracyValidationResult[]
  performanceLogs: { timestamp: number, responseTime: number, accuracy: string, cached: boolean }[]
  cacheHits: number
  cacheMisses: number
  requestsByAccuracy: Record<string, number>
  requestsBySource: Record<string, number>
  lastHealthCheck: Date | null
} = {
  accuracyValidations: [],
  performanceLogs: [],
  cacheHits: 0,
  cacheMisses: 0,
  requestsByAccuracy: {},
  requestsBySource: {},
  lastHealthCheck: null,
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'validate') {
      // Run accuracy validation
      const validationResult = await runAccuracyValidation()
      return NextResponse.json({
        success: true,
        validation: validationResult,
      })
    }

    if (action === 'health') {
      // Service health check
      const healthStatus = await checkServiceHealth()
      return NextResponse.json({
        success: true,
        health: healthStatus,
      })
    }

    // Return comprehensive metrics
    const metrics = await generatePlanetaryMetrics()

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Planetary positions metrics error:', error)
    return NextResponse.json({
      error: 'Failed to generate planetary positions metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Run accuracy validation by comparing different calculation methods
async function runAccuracyValidation(): Promise<AccuracyValidationResult> {
  const startTime = Date.now()
  const testDate = new Date() // Current time for validation

  try {
    // Get positions from different sources for comparison
    const [highAccuracy, enhancedCalc, basicTransits] = await Promise.all([
      planetaryPositionsService.getPlanetaryPositions(testDate, { accuracy: 'high', useCache: false }),
      planetaryPositionsService.getPlanetaryPositions(testDate, { accuracy: 'medium', useCache: false }),
      planetaryPositionsService.getPlanetaryPositions(testDate, { accuracy: 'low', useCache: false }),
    ])

    const responseTime = Date.now() - startTime

    // Compare precision between methods (using high accuracy as baseline)
    let totalPrecisionDiff = 0
    let planetsValidated = 0

    const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
    const baselinePositions = highAccuracy.planetaryPositions

    // Compare with enhanced calculator
    enhancedCalc.planetaryPositions.forEach(pos => {
      const baseline = baselinePositions.find(p => p.planet === pos.planet)
      if (baseline && planets.includes(pos.planet)) {
        const diff = Math.abs(baseline.longitude! - pos.longitude!)
        totalPrecisionDiff += Math.min(diff, 360 - diff) // Handle 0/360 wraparound
        planetsValidated++
      }
    })

    // Compare with basic transits
    basicTransits.planetaryPositions.forEach(pos => {
      const baseline = baselinePositions.find(p => p.planet === pos.planet)
      if (baseline && planets.includes(pos.planet)) {
        const diff = Math.abs(baseline.longitude! - pos.longitude!)
        totalPrecisionDiff += Math.min(diff, 360 - diff)
        planetsValidated++
      }
    })

    const averagePrecision = totalPrecisionDiff / Math.max(planetsValidated, 1)

    const result: AccuracyValidationResult = {
      timestamp: new Date().toISOString(),
      source: highAccuracy.source,
      accuracy: highAccuracy.accuracy,
      precision: averagePrecision,
      planetsValidated,
      totalPlanets: planets.length,
      responseTime,
      cached: false,
    }

    // Store validation result
    metricsStorage.accuracyValidations.push(result)
    // Keep only last 100 validations
    if (metricsStorage.accuracyValidations.length > 100) {
      metricsStorage.accuracyValidations = metricsStorage.accuracyValidations.slice(-100)
    }

    return result

  } catch (error) {
    console.error('Accuracy validation failed:', error)
    const responseTime = Date.now() - startTime

    const errorResult: AccuracyValidationResult = {
      timestamp: new Date().toISOString(),
      source: 'error',
      accuracy: 'unknown',
      precision: -1,
      planetsValidated: 0,
      totalPlanets: 7,
      responseTime,
      cached: false,
    }

    metricsStorage.accuracyValidations.push(errorResult)
    return errorResult
  }
}

// Check service health and circuit breaker status
async function checkServiceHealth() {
  const healthStatus = {
    circuitBreakers: {},
    externalApiStatus: 'unknown',
    lastHealthCheck: new Date().toISOString(),
  }

  try {
    // Check external API connectivity
    const testResponse = await fetch('https://api.astrologize.com/planets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: new Date().toISOString(),
        accuracy: 'high'
      }),
      signal: AbortSignal.timeout(5000)
    })

    healthStatus.externalApiStatus = testResponse.ok ? 'healthy' : 'degraded'

  } catch (error) {
    healthStatus.externalApiStatus = 'offline'
  }

  // Update health check timestamp
  metricsStorage.lastHealthCheck = new Date()

  return healthStatus
}

// Generate comprehensive planetary metrics
async function generatePlanetaryMetrics(): Promise<PlanetaryMetrics> {
  const now = Date.now()

  // Calculate cache metrics
  const totalCacheRequests = metricsStorage.cacheHits + metricsStorage.cacheMisses
  const cacheMetrics: CacheMetrics = {
    hits: metricsStorage.cacheHits,
    misses: metricsStorage.cacheMisses,
    hitRate: totalCacheRequests > 0 ? metricsStorage.cacheHits / totalCacheRequests : 0,
    totalRequests: totalCacheRequests,
    averageCacheAge: 0, // Would need to track cache ages
    cacheSize: 0, // Would need to track actual cache size
  }

  // Calculate performance metrics from logs (last 24 hours)
  const recentLogs = metricsStorage.performanceLogs.filter(
    log => now - log.timestamp < 24 * 60 * 60 * 1000
  )

  const responseTimes = recentLogs.map(log => log.responseTime).sort((a, b) => a - b)

  const performanceMetrics: PerformanceMetrics = {
    p50: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.5)] : 0,
    p95: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0,
    p99: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0,
    average: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
    min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
    max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    totalRequests: recentLogs.length,
  }

  // Accuracy validation metrics
  const validations = metricsStorage.accuracyValidations
  const recentValidations = validations.filter(
    v => now - new Date(v.timestamp).getTime() < 24 * 60 * 60 * 1000
  )

  const sourcesUsed = validations.reduce((acc, v) => {
    acc[v.source] = (acc[v.source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const accuracyValidation = {
    lastValidation: validations.length > 0 ? validations[validations.length - 1] : null,
    averagePrecision: recentValidations.length > 0
      ? recentValidations.reduce((sum, v) => sum + v.precision, 0) / recentValidations.length
      : 0,
    validationCount: recentValidations.length,
    sourcesUsed,
  }

  // Health metrics
  const healthMetrics = await checkServiceHealth()

  return {
    accuracyValidation,
    cache: cacheMetrics,
    performance: performanceMetrics,
    health: {
      circuitBreakers: healthMetrics.circuitBreakers,
      externalApiStatus: healthMetrics.externalApiStatus,
      lastHealthCheck: healthMetrics.lastHealthCheck,
    },
    usage: {
      requestsByAccuracy: metricsStorage.requestsByAccuracy,
      requestsBySource: metricsStorage.requestsBySource,
      popularTimeRanges: {}, // Would need to implement time range analysis
    },
  }
}

// Hook to track performance (call this from the main planetary-positions endpoint)
export function trackPerformanceMetrics(responseTime: number, accuracy: string, cached: boolean, source: string) {
  metricsStorage.performanceLogs.push({
    timestamp: Date.now(),
    responseTime,
    accuracy,
    cached,
  })

  // Keep only last 1000 performance logs
  if (metricsStorage.performanceLogs.length > 1000) {
    metricsStorage.performanceLogs = metricsStorage.performanceLogs.slice(-1000)
  }

  // Track cache hits/misses
  if (cached) {
    metricsStorage.cacheHits++
  } else {
    metricsStorage.cacheMisses++
  }

  // Track usage by accuracy and source
  metricsStorage.requestsByAccuracy[accuracy] = (metricsStorage.requestsByAccuracy[accuracy] || 0) + 1
  metricsStorage.requestsBySource[source] = (metricsStorage.requestsBySource[source] || 0) + 1
}
