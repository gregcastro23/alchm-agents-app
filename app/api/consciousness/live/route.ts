import { NextResponse } from 'next/server'
import { generateAlchmForCurrentMoment } from '@/lib/alchemizer'
import { calculateMonicaConstant } from '@/lib/monica/monica-constant'

/**
 * Live consciousness calculations with frontend fallback
 * Calculates real-time cosmic weather and consciousness metrics
 */
async function calculateConsciousness(body: any = {}) {
  try {
    // Parse request body for birth data
    const birthData = body?.birthData
    const birthDate = birthData?.birthDate || '1970-01-01'
    const birthTime = birthData?.birthTime || '12:00'
    const latitude = birthData?.latitude || 0
    const longitude = birthData?.longitude || 0

    // Generate current moment alchemical data
    const currentAlchm = await generateAlchmForCurrentMoment()
    const alchmEffects = currentAlchm['Alchemy Effects'] || {}

    // Extract alchemical quantities
    const birthSpirit = alchmEffects['Total Spirit'] || 0
    const birthEssence = alchmEffects['Total Essence'] || 0
    const birthMatter = alchmEffects['Total Matter'] || 0
    const birthSubstance = alchmEffects['Total Substance'] || 0

    // Calculate birth Kalchm (birth chart alchemical quantities)
    const birthKalchm = {
      spirit: birthSpirit,
      essence: birthEssence,
      matter: birthMatter,
      substance: birthSubstance,
      aNumber: currentAlchm['A-Number'] || currentAlchm.A_number || 2,
    }

    // Calculate base Monica Constant using current alchemical data
    const mcResult = calculateMonicaConstant({
      spirit: birthSpirit,
      essence: birthEssence,
      matter: birthMatter,
      substance: birthSubstance,
    })
    const birthMC = mcResult.value

    // For now, live values are same as birth (until we implement transit modulation)
    const liveKalchm = {
      spirit: birthSpirit,
      essence: birthEssence,
      matter: birthMatter,
      substance: birthSubstance,
      aNumber: currentAlchm['A-Number'] || currentAlchm.A_number || 2,
    }

    const liveMC = birthMC
    const mcChange = 0 // Would need historical data to calculate change
    const mcPercentChange = 0

    // Determine cosmic weather based on current conditions
    const energy = currentAlchm.Energy || 0
    const heat = currentAlchm.Heat || 0
    const entropy = currentAlchm.Entropy || 0

    let cosmicWeather = 'Balanced cosmic conditions'
    if (energy > 600) {
      cosmicWeather = 'High energy cosmic surge - enhanced consciousness activation'
    } else if (energy > 500) {
      cosmicWeather = 'Elevated cosmic energy - favorable for spiritual work'
    } else if (energy < 300) {
      cosmicWeather = 'Quiet cosmic conditions - ideal for introspection'
    } else if (heat > 50) {
      cosmicWeather = 'Dynamic cosmic heat - passionate transformations'
    } else if (entropy > 50) {
      cosmicWeather = 'Chaotic cosmic flux - breakthrough potential'
    }

    // Determine consciousness level
    let consciousnessLevel = 'Active'
    if (liveMC >= 6) consciousnessLevel = 'Transcendent'
    else if (liveMC >= 5) consciousnessLevel = 'Illuminated'
    else if (liveMC >= 4) consciousnessLevel = 'Advanced'
    else if (liveMC >= 3) consciousnessLevel = 'Elevated'
    else if (liveMC >= 2) consciousnessLevel = 'Active'
    else if (liveMC >= 1) consciousnessLevel = 'Awakening'
    else consciousnessLevel = 'Dormant'

    // Build response matching LiveConsciousnessResult interface
    const result = {
      success: true,
      data: {
        birthMC,
        birthKalchm,
        liveMC,
        liveKalchm,
        mcChange,
        mcPercentChange,
        dominantTransitEffect: 'current',
        consciousnessLevel,
        liveConsciousnessLevel: consciousnessLevel,
        interpretations: {
          mcChange: mcChange > 0.1
            ? 'Consciousness expanding'
            : mcChange < -0.1
              ? 'Minor contraction observed'
              : 'Stable consciousness',
          transitInfluence: `Current A# ${(currentAlchm['A-Number'] || currentAlchm.A_number || 2).toFixed(2)} - ${(currentAlchm['A-Number'] || currentAlchm.A_number || 2) > 2.5 ? 'spiritual emphasis' : (currentAlchm['A-Number'] || currentAlchm.A_number || 2) < 1.5 ? 'material emphasis' : 'balanced blend'}`,
          cosmicWeather,
        },
        timestamp: new Date().toISOString(),
        calculationTime: 0,
        fromCache: false,
      },
    }

    return result
  } catch (error) {
    console.error('Frontend consciousness proxy error:', error)
    throw error
  }
}

export async function GET() {
  try {
    // GET requests use default parameters (current moment, no birth data)
    const result = await calculateConsciousness({})
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/consciousness/live error:', error)
    return NextResponse.json(
      {
        error: 'Consciousness calculation failed',
        code: 'CALCULATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // POST requests parse body for birth data
    let body = {}
    try {
      const text = await request.text()
      if (text && text.trim()) {
        body = JSON.parse(text)
      }
    } catch (parseError) {
      console.warn('Invalid JSON in consciousness request, using empty body')
    }

    const result = await calculateConsciousness(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/consciousness/live error:', error)
    return NextResponse.json(
      {
        error: 'Consciousness calculation failed',
        code: 'CALCULATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
