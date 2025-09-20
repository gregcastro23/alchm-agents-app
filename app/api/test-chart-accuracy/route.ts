import { NextRequest, NextResponse } from 'next/server'
import { testAstronomicalAccuracy } from '@/lib/monica/horoscope-generator'
import { BirthInfoSchema } from '@/lib/schemas'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * API endpoint for testing astronomical accuracy improvements
 * Compares legacy vs enhanced calculations
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.birth) {
      return NextResponse.json(
        { error: 'Missing birth information' },
        { status: 400 }
      )
    }

    // Validate birth info
    const birth = BirthInfoSchema.parse(body.birth)

    // Convert from 0-based month to 1-based for horoscope generation
    const birthInfo = {
      year: birth.year,
      month: birth.month + 1,
      day: birth.day,
      hour: birth.hour,
      minute: birth.minute,
      latitude: birth.latitude || 40.7128,
      longitude: birth.longitude || -74.0060,
    }

    // Run accuracy comparison
    const accuracyTest = testAstronomicalAccuracy(birthInfo)

    return NextResponse.json({
      success: true,
      comparison: {
        legacy: {
          metadata: accuracyTest.legacy.metadata,
          ascendant: accuracyTest.legacy.tropical.Ascendant,
          planetCount: accuracyTest.legacy.tropical.CelestialBodies.all.length,
          samplePlanets: accuracyTest.legacy.tropical.CelestialBodies.all.slice(0, 3)
        },
        enhanced: {
          metadata: accuracyTest.enhanced.metadata,
          ascendant: accuracyTest.enhanced.tropical.Ascendant,
          planetCount: accuracyTest.enhanced.tropical.CelestialBodies.all.length,
          samplePlanets: accuracyTest.enhanced.tropical.CelestialBodies.all.slice(0, 3)
        }
      },
      improvements: accuracyTest.improvements,
      summary: accuracyTest.summary,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chart accuracy test error:', error)
    return NextResponse.json(
      {
        error: 'Failed to test chart accuracy',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'Chart Accuracy Testing API',
    description: 'Compare legacy vs enhanced astronomical calculations',
    usage: 'POST with birth info to test accuracy improvements',
    expectedImprovements: {
      'Sun': '±0.1° vs ±2-5° (legacy)',
      'Moon': '±0.5° vs ±2-5° (legacy)',
      'Mercury': '±2.0° improvement for retrograde periods',
      'Venus': '±1.0° improvement for retrograde periods',
      'Mars': '±1.5° improvement for elliptical orbit',
      'Jupiter': '±0.5° improvement',
      'Saturn': '±0.3° improvement',
      'Ascendant': '±1.0° improvement with proper sidereal time'
    }
  })
}