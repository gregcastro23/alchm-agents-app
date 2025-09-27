import { NextRequest, NextResponse } from 'next/server'
import {
  planetaryPositionsService,
  type AccuracyLevel,
} from '@/lib/services/planetary-positions-service'
import { logQuantitiesToGalileo } from '@/lib/galileo-logger'
import { trackPerformanceMetrics } from './metrics/route'
import { withErrorHandling } from '@/lib/error-handling'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RequestBody {
  date?: string // ISO date string
  accuracy?: AccuracyLevel
  includeAlchemy?: boolean
  useCache?: boolean
}

export async function GET(req: NextRequest) {
  return withErrorHandling(
    async () => {
      const startTime = Date.now()
      const url = new URL(req.url)
      const dateParam = url.searchParams.get('date')
      const accuracyParam = url.searchParams.get('accuracy') as AccuracyLevel
      const includeAlchemyParam = url.searchParams.get('includeAlchemy')
      const useCacheParam = url.searchParams.get('useCache')

      const requestBody: RequestBody = {
        date: dateParam || undefined,
        accuracy: accuracyParam || 'high',
        includeAlchemy: includeAlchemyParam === 'true',
        useCache: useCacheParam !== 'false', // Default true
      }

      const date = requestBody.date ? new Date(requestBody.date) : new Date()

      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use ISO date string.' },
          { status: 400 }
        )
      }

      const options = {
        accuracy: requestBody.accuracy,
        useCache: requestBody.useCache,
        timeout: 15000, // 15 seconds for API calls
        retryAttempts: 2,
      }

      let planetaryData

      if (requestBody.includeAlchemy) {
        planetaryData = await planetaryPositionsService.getPlanetaryPositionsWithAlchemy(
          date,
          options
        )
      } else {
        planetaryData = await planetaryPositionsService.getPlanetaryPositions(date, options)
      }

      // Log to Galileo for observability if alchemy data is included
      if (planetaryData.alchmQuantities) {
        try {
          await logQuantitiesToGalileo(
            {
              quantities: {
                Spirit: planetaryData.alchmQuantities.spirit,
                Essence: planetaryData.alchmQuantities.essence,
                Matter: planetaryData.alchmQuantities.matter,
                Substance: planetaryData.alchmQuantities.substance,
                ANumber:
                  planetaryData.alchmQuantities.spirit +
                  planetaryData.alchmQuantities.essence +
                  planetaryData.alchmQuantities.matter +
                  planetaryData.alchmQuantities.substance,
                DayEssence: 0,
                NightEssence: 0,
              },
              dominantElement: '',
              heat: planetaryData.alchmQuantities.Heat,
              entropy: planetaryData.alchmQuantities.Entropy,
              reactivity: planetaryData.alchmQuantities.Reactivity,
              energy: planetaryData.alchmQuantities.Energy,
              sunSign: planetaryData.planetaryPositions.find(p => p.planet === 'Sun')?.sign || '',
              chartRuler: '',
              timestamp: planetaryData.timestamp,
              planetaryPositions: planetaryData.planetaryPositions.reduce((acc, pos) => {
                acc[pos.planet] = {
                  sign: pos.sign,
                  degree: pos.degree.toString(),
                  retrograde: pos.retrograde,
                }
                return acc
              }, {} as any),
            },
            {
              api_endpoint: '/api/planetary-positions',
              request_timestamp: planetaryData.timestamp,
              calculation_method: `unified-service-${planetaryData.source}`,
              monica_constant: planetaryData.monicaConstant || 0,
            }
          )
        } catch (e) {
          console.warn('[Galileo] planetary positions logging failed (non-fatal):', e)
        }
      }

      // Set cache headers based on accuracy level
      const cacheMaxAge = {
        high: 300, // 5 minutes
        medium: 900, // 15 minutes
        low: 3600, // 1 hour
        fallback: 86400, // 24 hours
      }[planetaryData.accuracy]

      // Track performance metrics
      const responseTime = Date.now() - startTime
      trackPerformanceMetrics(
        responseTime,
        planetaryData.accuracy,
        planetaryData.cached,
        planetaryData.source
      )

      return NextResponse.json(planetaryData, {
        headers: {
          'Cache-Control': `public, max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`,
          'X-Source': planetaryData.source,
          'X-Accuracy': planetaryData.accuracy,
          'X-Cached': planetaryData.cached.toString(),
        },
      })
    },
    {
      system: 'api',
      operation: 'planetary_positions_get',
      severity: 'high',
    }
  ).then(result => {
    if (result.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: result.userMessage,
          context: result.context,
        },
        { status: 500 }
      )
    }
    return result
  })
}

export async function POST(req: NextRequest) {
  return withErrorHandling(
    async () => {
      const startTime = Date.now()
      const body = (await req.json()) as RequestBody
      const date = body.date ? new Date(body.date) : new Date()

      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use ISO date string.' },
          { status: 400 }
        )
      }

      const options = {
        accuracy: body.accuracy || 'high',
        useCache: body.useCache !== false,
        timeout: 15000,
        retryAttempts: 2,
      }

      let planetaryData

      if (body.includeAlchemy) {
        planetaryData = await planetaryPositionsService.getPlanetaryPositionsWithAlchemy(
          date,
          options
        )
      } else {
        planetaryData = await planetaryPositionsService.getPlanetaryPositions(date, options)
      }

      // Track performance metrics
      const responseTime = Date.now() - startTime
      trackPerformanceMetrics(
        responseTime,
        planetaryData.accuracy,
        planetaryData.cached,
        planetaryData.source
      )

      return NextResponse.json(planetaryData, {
        headers: {
          'X-Source': planetaryData.source,
          'X-Accuracy': planetaryData.accuracy,
          'X-Cached': planetaryData.cached.toString(),
        },
      })
    },
    {
      system: 'api',
      operation: 'planetary_positions_post',
      severity: 'high',
    }
  ).then(result => {
    if (result.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: result.userMessage,
          context: result.context,
        },
        { status: 500 }
      )
    }
    return result
  })
}
