import { NextResponse } from 'next/server'
import {
  analyzeAllAspectDynamics,
  findNearestApplyingAspect,
  type AspectsSamplingOptions,
} from '@/lib/aspects-sampling'
import { validateAspectCalculations } from '@/lib/aspects-dynamics'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface AspectsRequest {
  lat: number
  lon: number
  date?: string // YYYY-MM-DD format
  window?: number // Smoothing window for kinetics (default: 3)
  planets?: string // Comma-separated planet list
  includeKinetics?: boolean // Include kinetics-based confidence weighting
  mode?: 'full' | 'nearest' // Analysis mode
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate parameters
    const lat = parseFloat(searchParams.get('lat') || '37.7749')
    const lon = parseFloat(searchParams.get('lon') || '-122.4194')
    const dateParam = searchParams.get('date')
    const window = Math.max(1, parseInt(searchParams.get('window') || '3', 10) || 3)
    const planetsParam = searchParams.get('planets')
    const includeKinetics = searchParams.get('includeKinetics') === 'true'
    const mode = searchParams.get('mode') || 'full'

    console.log('API: Aspects dynamics endpoint called', {
      lat,
      lon,
      dateParam,
      window,
      includeKinetics,
      mode,
    })

    // Validate coordinates
    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90 degrees' },
        { status: 400 }
      )
    }

    if (lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180 degrees' },
        { status: 400 }
      )
    }

    // Parse date or use current moment
    let centerDate: Date
    if (dateParam) {
      const parsedDate = new Date(dateParam)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
      }
      centerDate = parsedDate
    } else {
      centerDate = new Date()
    }

    // Parse target planets
    let targetPlanets: string[] | undefined
    if (planetsParam) {
      targetPlanets = planetsParam
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)

      // Validate planet names
      const validPlanets = [
        'Sun',
        'Moon',
        'Mercury',
        'Venus',
        'Mars',
        'Jupiter',
        'Saturn',
        'Uranus',
        'Neptune',
        'Pluto',
      ]
      const invalidPlanets = targetPlanets.filter(p => !validPlanets.includes(p))

      if (invalidPlanets.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid planets: ${invalidPlanets.join(', ')}. Valid options: ${validPlanets.join(', ')}`,
          },
          { status: 400 }
        )
      }
    }

    const location = { latitude: lat, longitude: lon }
    const options: AspectsSamplingOptions = {
      targetPlanets,
      window,
      includeKinetics,
      hoursToSample: 5, // Default 5-point sampling for aspect rates
    }

    // Perform aspect analysis based on mode
    if (mode === 'nearest') {
      // Find nearest applying aspect for quick queries
      const nearestResult = await findNearestApplyingAspect(location, options)

      return NextResponse.json({
        success: true,
        mode: 'nearest',
        timestamp: centerDate.toISOString(),
        location,
        nearestAspect: nearestResult.nearestAspect || null,
        aspectsHint: nearestResult.aspectsHint,
        timeToExact: nearestResult.timeToExact,
        metadata: {
          planetsAnalyzed: targetPlanets || [
            'Sun',
            'Moon',
            'Mercury',
            'Venus',
            'Mars',
            'Jupiter',
            'Saturn',
          ],
          window,
          includeKinetics,
          generationTime: new Date().toISOString(),
        },
      })
    }

    // Full aspect analysis (default mode)
    const aspectsResult = await analyzeAllAspectDynamics(location, centerDate, options)

    // Validate calculations
    const validation = validateAspectCalculations()

    const responseData = {
      success: true,
      mode: 'full',
      timestamp: aspectsResult.timestamp.toISOString(),
      location: aspectsResult.location,
      window: aspectsResult.window,
      aspects: aspectsResult.aspects.map(aspect => ({
        planet1: aspect.planet1,
        planet2: aspect.planet2,
        type: aspect.type,
        orb: Math.round(aspect.orb * 100) / 100, // Round to 2 decimal places
        status: aspect.status,
        rate: Math.round(aspect.rate * 1000) / 1000, // Rate in degrees per hour
        confidence: Math.round(aspect.confidence * 100) / 100,
        timestamps: aspect.timestamps.map(t => t.toISOString()),
        samples: aspect.samples,
        kineticInfluence: aspect.kineticInfluence
          ? Math.round(aspect.kineticInfluence * 1000) / 1000
          : undefined,
      })),
      metadata: {
        planetsAnalyzed: aspectsResult.metadata.planetsAnalyzed,
        samplesGenerated: aspectsResult.metadata.samplesGenerated,
        kineticEnhancement: aspectsResult.metadata.kineticEnhancement,
        validationStatus: validation,
        generationTime: new Date().toISOString(),
      },
    }

    console.log('API: Successfully generated aspects analysis', {
      aspectsCount: aspectsResult.aspects.length,
      planetsAnalyzed: aspectsResult.metadata.planetsAnalyzed.length,
      samplesGenerated: aspectsResult.metadata.samplesGenerated,
    })

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    console.error('API Error in aspects dynamics:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze aspects dynamics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body: AspectsRequest = await request.json()
    const {
      lat = 37.7749,
      lon = -122.4194,
      date,
      window = 3,
      planets,
      includeKinetics = false,
      mode = 'full',
    } = body

    console.log('API: Aspects dynamics POST endpoint called', body)

    // Validate coordinates
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    // Parse date or use current moment
    let centerDate: Date
    if (date) {
      const parsedDate = new Date(date)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }
      centerDate = parsedDate
    } else {
      centerDate = new Date()
    }

    // Parse target planets
    let targetPlanets: string[] | undefined
    if (planets) {
      if (typeof planets === 'string') {
        targetPlanets = planets
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0)
      } else if (Array.isArray(planets)) {
        targetPlanets = planets
      }
    }

    const location = { latitude: lat, longitude: lon }
    const options: AspectsSamplingOptions = {
      targetPlanets,
      window: Math.max(1, window),
      includeKinetics,
      hoursToSample: 5,
    }

    // Perform analysis based on mode
    if (mode === 'nearest') {
      const nearestResult = await findNearestApplyingAspect(location, options)

      return NextResponse.json({
        success: true,
        mode: 'nearest',
        timestamp: centerDate.toISOString(),
        location,
        nearestAspect: nearestResult.nearestAspect || null,
        aspectsHint: nearestResult.aspectsHint,
        timeToExact: nearestResult.timeToExact,
        metadata: {
          planetsAnalyzed: targetPlanets || [
            'Sun',
            'Moon',
            'Mercury',
            'Venus',
            'Mars',
            'Jupiter',
            'Saturn',
          ],
          window,
          includeKinetics,
          generationTime: new Date().toISOString(),
        },
      })
    }

    // Full analysis
    const aspectsResult = await analyzeAllAspectDynamics(location, centerDate, options)

    return NextResponse.json({
      success: true,
      mode: 'full',
      timestamp: aspectsResult.timestamp.toISOString(),
      location: aspectsResult.location,
      window: aspectsResult.window,
      aspects: aspectsResult.aspects,
      metadata: aspectsResult.metadata,
    })
  } catch (error) {
    console.error('API POST Error in aspects dynamics:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze aspects dynamics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
