import { NextResponse } from 'next/server'
import { generateAlchmForCurrentMoment } from '@/lib/alchemizer'
import { getCurrentPlanetaryPositions } from '@/lib/calculate-transits'
import { generateRealTimeSignVectorRune } from '@/lib/runes/sign-vector-runes'
import { logQuantitiesToGalileo, type AlchemicalMetrics } from '@/lib/galileo-logger'
import { sampleCurrentMoment, sampleHourlyAlchm } from '@/lib/alchemical-kinetics-sampler'
import { computePower, getSolarAmplification } from '@/lib/alchemical-kinetics'
import { findNearestApplyingAspect } from '@/lib/aspects-sampling'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RealtimeRuneRequest {
  includeAlchemical?: boolean
  runeType?: 'basic' | 'enhanced' | 'premium'
  runeCount?: number // Number of runes to generate (max 5)
  includeKinetics?: boolean // Include kinetics-based power calculations
  location?: { latitude: number; longitude: number } // For kinetics sampling
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAlchemical = searchParams.get('includeAlchemical') !== 'false'
    const runeType = searchParams.get('runeType') || 'enhanced'
    const includeKinetics = searchParams.get('includeKinetics') === 'true'
    const smoothingWindow = Math.max(1, parseInt(searchParams.get('window') || '1', 10) || 1)
    const lat = parseFloat(searchParams.get('lat') || '37.7749')
    const lon = parseFloat(searchParams.get('lon') || '-122.4194')

    console.log('API: Realtime runes endpoint called', {
      includeAlchemical,
      runeType,
      includeKinetics,
    })

    // Get current planetary positions
    const planetaryPositions = getCurrentPlanetaryPositions()

    let alchmData = null
    let quantities = null

    // Generate alchemical data if requested
    if (includeAlchemical) {
      alchmData = await generateAlchmForCurrentMoment()

      if (alchmData && alchmData['Alchemy Effects']) {
        quantities = {
          Spirit: alchmData['Alchemy Effects']['Total Spirit'] || 0,
          Essence: alchmData['Alchemy Effects']['Total Essence'] || 0,
          Matter: alchmData['Alchemy Effects']['Total Matter'] || 0,
          Substance: alchmData['Alchemy Effects']['Total Substance'] || 0,
          ANumber: alchmData['Alchemy Effects']['A #'] || 0,
          DayEssence: alchmData['Alchemy Effects']['Total Day Essence'] || 0,
          NightEssence: alchmData['Alchemy Effects']['Total Night Essence'] || 0,
        }
      }
    }

    // Generate real-time rune
    const realtimeRune = generateRealTimeSignVectorRune(
      planetaryPositions,
      includeAlchemical ? { quantities } : null
    )

    // Phase 4: Aspect dynamics integration
    let aspectsMetadata: any = null
    if (includeKinetics) {
      try {
        // Get applying aspects for rune metadata
        const aspectsResult = await findNearestApplyingAspect(
          { latitude: lat, longitude: lon },
          { includeKinetics: true, window: smoothingWindow }
        )

        aspectsMetadata = {
          aspectsHint: aspectsResult.aspectsHint,
          nearestAspect: aspectsResult.nearestAspect
            ? {
                planets: `${aspectsResult.nearestAspect.planet1}-${aspectsResult.nearestAspect.planet2}`,
                type: aspectsResult.nearestAspect.type,
                status: aspectsResult.nearestAspect.status,
                orb: Math.round(aspectsResult.nearestAspect.orb * 100) / 100,
                confidence: Math.round(aspectsResult.nearestAspect.confidence * 100) / 100,
              }
            : null,
          timeToExact: aspectsResult.timeToExact
            ? Math.round(aspectsResult.timeToExact * 10) / 10
            : null,
        }

        // Enhance rune description with aspect information
        if (
          aspectsResult.aspectsHint &&
          aspectsResult.aspectsHint !== 'No significant applying aspects detected'
        ) {
          realtimeRune.description += ` Cosmic alignment: ${aspectsResult.aspectsHint}.`
        }
      } catch (aspectError) {
        console.warn('Aspects integration failed:', aspectError)
        aspectsMetadata = { error: 'Aspects calculation failed', fallback: true }
      }
    }

    // Phase 5: Kinetics-based power enhancement
    let kineticsPowerData: any = null
    if (includeKinetics) {
      try {
        // Sample recent hourly data for proper kinetics analysis
        const now = new Date()
        const startTime = new Date(now.getTime() - smoothingWindow * 3600000) // Go back by window hours

        // Get actual historical samples using the established sampler
        const kineticSamples = await sampleHourlyAlchm(
          { latitude: lat, longitude: lon },
          startTime,
          {
            includePlanetaryHours: true,
            hoursToSample: smoothingWindow + 1, // Include current hour
            startHour: startTime.getHours(),
          }
        )

        // Prepare samples for power calculation
        const powerSamples = kineticSamples.map(sample => ({
          t: sample.t,
          Energy: sample.Energy,
          planetaryHour: sample.planetaryHour,
        }))

        const powerResults = computePower(powerSamples, { window: smoothingWindow })
        const currentPower = powerResults[powerResults.length - 1]

        // Get the most recent kinetic sample for planetary hour context
        const currentKineticSample = kineticSamples[kineticSamples.length - 1]

        // Get seasonal modifier (simplified)
        const month = now.getMonth()
        const seasonalModifier =
          month >= 2 && month <= 4
            ? 1.1 // Spring acceleration
            : month >= 5 && month <= 7
              ? 1.2 // Summer peak
              : month >= 8 && month <= 10
                ? 0.95 // Autumn deceleration
                : 0.9 // Winter stability

        // Calculate enhanced power level
        const basePower = realtimeRune.powerLevel || 100
        const kineticsPower = Math.abs(currentPower?.power || 0) * 50 // Scale factor
        const solarAmplification = getSolarAmplification(currentKineticSample.planetaryHour)

        const enhancedPowerLevel = Math.round(
          basePower + kineticsPower * solarAmplification * seasonalModifier
        )

        realtimeRune.powerLevel = Math.max(50, Math.min(250, enhancedPowerLevel))

        // Determine power type based on kinetics
        const powerMagnitude = Math.abs(currentPower?.power || 0)
        let powerType: 'building' | 'sustained' | 'peak' | 'waning' = 'sustained'
        if (powerMagnitude > 0.5) powerType = 'peak'
        else if (powerMagnitude > 0.1) powerType = 'building'
        else if (powerMagnitude < -0.1) powerType = 'waning'

        kineticsPowerData = {
          rawPower: currentPower?.power || 0,
          solarAmplification,
          seasonalModifier,
          powerType,
          enhancedPowerLevel,
          planetaryHour: currentKineticSample.planetaryHour,
          seasonalPhase: currentKineticSample.seasonalPhase,
        }

        // Add kinetics description to rune
        realtimeRune.description += ` Kinetically enhanced with ${powerType} power during ${currentKineticSample.planetaryHour} hour.`
      } catch (kineticError) {
        console.warn('Kinetics enhancement failed:', kineticError)
        kineticsPowerData = { error: 'Kinetics calculation failed', fallback: true }
      }
    }

    // Enhance based on rune type
    if (runeType === 'premium') {
      realtimeRune.powerLevel = Math.round((realtimeRune.powerLevel || 100) * 1.25)
      realtimeRune.rarity = 'cosmic'
      realtimeRune.name = `Premium ${realtimeRune.name}`
      realtimeRune.description += ' Enhanced with premium cosmic algorithms.'
    } else if (runeType === 'basic') {
      realtimeRune.powerLevel = Math.round((realtimeRune.powerLevel || 100) * 0.8)
      realtimeRune.name = `Basic ${realtimeRune.name}`
    }

    const responseData = {
      success: true,
      rune: realtimeRune,
      metadata: {
        generationTime: new Date().toISOString(),
        planetaryPositionsCount: Object.keys(planetaryPositions).length,
        includeAlchemical,
        runeType,
        includeKinetics,
        alchemicalQuantities: quantities,
        dominantElement: alchmData?.['Dominant Element'],
        sunSign: alchmData?.['Sun Sign'],
        kineticsPowerData,
        aspectsMetadata,
      },
      timestamp: new Date().toISOString(),
    }

    // Log to Galileo for analytics
    try {
      if (includeAlchemical && quantities) {
        // Build metrics payload explicitly to match AlchemicalMetrics interface
        const metricsData: AlchemicalMetrics = {
          quantities,
          dominantElement: alchmData?.['Dominant Element'] || 'unknown',
          heat: alchmData?.['Heat'] || 0,
          entropy: alchmData?.['Entropy'] || 0,
          reactivity: alchmData?.['Reactivity'] || 0,
          energy: alchmData?.['Energy'] || 0,
          sunSign: alchmData?.['Sun Sign'] || 'unknown',
          chartRuler: alchmData?.['Chart Ruler'] || 'unknown',
          timestamp: new Date().toISOString(),
          planetaryPositions,
        }

        await logQuantitiesToGalileo(metricsData, {
          api_endpoint: '/api/realtime-runes',
          request_timestamp: new Date().toISOString(),
          rune_type: runeType,
          include_alchemical: includeAlchemical,
        })
      }
    } catch (galileoError) {
      console.warn('Failed to log realtime rune to Galileo:', galileoError)
    }

    console.log('API: Successfully generated realtime rune', {
      runeId: realtimeRune.id,
      powerLevel: realtimeRune.powerLevel,
      planetaryCount: Object.keys(planetaryPositions).length,
    })

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    console.error('API Error generating realtime runes:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate realtime runes',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body: RealtimeRuneRequest = await request.json()
    const {
      includeAlchemical = true,
      runeType = 'enhanced',
      includeKinetics = false,
      location,
    } = body
    const lat = location?.latitude || 37.7749
    const lon = location?.longitude || -122.4194

    console.log('API: Realtime runes POST endpoint called', body)

    // Get current planetary positions
    const planetaryPositions = getCurrentPlanetaryPositions()

    let alchmData = null
    let quantities = null

    // Generate alchemical data if requested
    if (includeAlchemical) {
      alchmData = await generateAlchmForCurrentMoment()

      if (alchmData && alchmData['Alchemy Effects']) {
        quantities = {
          Spirit: alchmData['Alchemy Effects']['Total Spirit'] || 0,
          Essence: alchmData['Alchemy Effects']['Total Essence'] || 0,
          Matter: alchmData['Alchemy Effects']['Total Matter'] || 0,
          Substance: alchmData['Alchemy Effects']['Total Substance'] || 0,
          ANumber: alchmData['Alchemy Effects']['A #'] || 0,
          DayEssence: alchmData['Alchemy Effects']['Total Day Essence'] || 0,
          NightEssence: alchmData['Alchemy Effects']['Total Night Essence'] || 0,
        }
      }
    }

    // Generate multiple runes for batch processing
    const runeCount = Math.min(5, body.runeCount || 1) // Max 5 runes per request
    const runes = []

    for (let i = 0; i < runeCount; i++) {
      const rune = generateRealTimeSignVectorRune(
        planetaryPositions,
        includeAlchemical ? { quantities } : null
      )

      // Add deterministic variation for multiple runes based on iteration
      if (i > 0) {
        rune.id = `${rune.id}-${i}`
        rune.name = `${rune.name} (Variant ${i + 1})`

        // Create deterministic variation based on iteration and current time
        const timeBasedSeed = (new Date().getMinutes() + i) % 10
        const variationFactor = 0.95 + timeBasedSeed / 100 // 0.95 to 1.04 range
        rune.powerLevel = Math.round((rune.powerLevel || 100) * variationFactor)
      }

      runes.push(rune)
    }

    return NextResponse.json({
      success: true,
      runes,
      count: runes.length,
      metadata: {
        generationTime: new Date().toISOString(),
        planetaryPositionsCount: Object.keys(planetaryPositions).length,
        includeAlchemical,
        runeType,
        alchemicalQuantities: quantities,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('API POST Error generating realtime runes:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate realtime runes',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
