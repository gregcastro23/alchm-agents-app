import { NextRequest, NextResponse } from 'next/server'
import {
  calculateProfessionalHouses,
  type HouseSystem,
  type EnhancedBirthInfo,
} from '@/lib/enhanced-astronomical-calculator'
import { BirthInfoSchema } from '@/lib/schemas'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * API endpoint for testing professional house system calculations
 * Compares different house systems (Equal, Placidus, Koch, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.birth) {
      return NextResponse.json({ error: 'Missing birth information' }, { status: 400 })
    }

    // Validate birth info
    const birth = BirthInfoSchema.parse(body.birth)
    const requestedSystems = (body.systems as HouseSystem[]) || ['equal', 'placidus', 'koch']

    // Convert from 0-based month to 1-based for enhanced calculations
    const enhancedBirthInfo: EnhancedBirthInfo = {
      year: birth.year,
      month: birth.month + 1,
      day: birth.day,
      hour: birth.hour,
      minute: birth.minute,
      second: 0,
      latitude: birth.latitude || 40.7128,
      longitude: birth.longitude || -74.006,
    }

    const houseSystems: Record<string, any> = {}

    // Calculate all requested house systems
    for (const system of requestedSystems) {
      try {
        const result = calculateProfessionalHouses(enhancedBirthInfo, system)
        houseSystems[system] = {
          system: result.system,
          ascendant: result.ascendant,
          midheaven: result.midheaven,
          houses: result.houses.map(house => ({
            house: house.houseNumber,
            longitude: house.longitude,
            sign: house.sign,
            degree: house.signDegree.toFixed(2),
          })),
          summary: {
            house1: `${result.houses[0].sign} ${result.houses[0].signDegree.toFixed(1)}°`,
            house10: `${result.houses[9].sign} ${result.houses[9].signDegree.toFixed(1)}°`,
            houseSizes: calculateHouseSizes(result.houses),
          },
        }
      } catch (error) {
        houseSystems[system] = {
          error: error instanceof Error ? error.message : 'Calculation failed',
        }
      }
    }

    return NextResponse.json({
      success: true,
      birthInfo: {
        date: `${birth.year}-${String(birth.month + 1).padStart(2, '0')}-${String(birth.day).padStart(2, '0')}`,
        time: `${String(birth.hour).padStart(2, '0')}:${String(birth.minute).padStart(2, '0')}`,
        location: `${birth.latitude?.toFixed(2)}°, ${birth.longitude?.toFixed(2)}°`,
      },
      houseSystems,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('House systems test error:', error)
    return NextResponse.json(
      {
        error: 'Failed to test house systems',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'Professional House Systems Testing API',
    description: 'Compare different astrological house systems',
    usage: 'POST with birth info and optional systems array',
    availableSystems: ['equal', 'placidus', 'koch', 'campanus', 'regiomontanus'],
    defaultSystems: ['equal', 'placidus', 'koch'],
    differences: {
      equal: 'All houses exactly 30° - simplest system',
      placidus: 'Most popular unequal system - time-based divisions',
      koch: 'Birthplace prime vertical method - similar to Placidus',
      campanus: 'Prime vertical divisions - space-based',
      regiomontanus: 'Celestial equator divisions - older system',
    },
    example: {
      birth: {
        name: 'Test Chart',
        year: 2000,
        month: 0,
        day: 1,
        hour: 12,
        minute: 0,
        latitude: 40.7128,
        longitude: -74.006,
      },
      systems: ['equal', 'placidus', 'koch'],
    },
  })
}

function calculateHouseSizes(houses: any[]): number[] {
  const sizes: number[] = []

  for (let i = 0; i < 12; i++) {
    const currentHouse = houses[i].longitude
    const nextHouse = i === 11 ? houses[0].longitude + 360 : houses[i + 1].longitude

    let size = nextHouse - currentHouse
    if (size < 0) size += 360
    if (size > 180) size = 360 - size

    sizes.push(Math.round(size * 10) / 10)
  }

  return sizes
}
