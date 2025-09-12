import { NextResponse } from "next/server"
import { generateAlchmForCurrentMoment } from "@/lib/alchemizer"
import { getCurrentPlanetaryPositions } from "@/lib/calculate-transits"
import { generateRealTimeSignVectorRune } from "@/lib/runes/sign-vector-runes"
import { logQuantitiesToGalileo, type AlchemicalMetrics } from "@/lib/galileo-logger"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface RealtimeRuneRequest {
  includeAlchemical?: boolean;
  runeType?: 'basic' | 'enhanced' | 'premium';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAlchemical = searchParams.get('includeAlchemical') !== 'false'
    const runeType = searchParams.get('runeType') || 'enhanced'
    
    console.log("API: Realtime runes endpoint called", { includeAlchemical, runeType })
    
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
          NightEssence: alchmData['Alchemy Effects']['Total Night Essence'] || 0
        }
      }
    }
    
    // Generate real-time rune
    const realtimeRune = generateRealTimeSignVectorRune(
      planetaryPositions, 
      includeAlchemical ? { quantities } : null
    )
    
    // Enhance based on rune type
    if (runeType === 'premium') {
      realtimeRune.powerLevel = Math.round(realtimeRune.powerLevel * 1.25)
      realtimeRune.rarity = 'cosmic'
      realtimeRune.name = `Premium ${realtimeRune.name}`
      realtimeRune.description += ' Enhanced with premium cosmic algorithms.'
    } else if (runeType === 'basic') {
      realtimeRune.powerLevel = Math.round(realtimeRune.powerLevel * 0.8)
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
        alchemicalQuantities: quantities,
        dominantElement: alchmData?.['Dominant Element'],
        sunSign: alchmData?.['Sun Sign']
      },
      timestamp: new Date().toISOString()
    }
    
    // Log to Galileo for analytics
    try {
      if (includeAlchemical && quantities) {
        const metricsData: AlchemicalMetrics = {
          ...responseData.metadata,
          planetaryPositions
        }
        
        await logQuantitiesToGalileo(metricsData, {
          api_endpoint: '/api/realtime-runes',
          request_timestamp: new Date().toISOString(),
          rune_type: runeType,
          include_alchemical: includeAlchemical
        })
      }
    } catch (galileoError) {
      console.warn('Failed to log realtime rune to Galileo:', galileoError)
    }
    
    console.log("API: Successfully generated realtime rune", {
      runeId: realtimeRune.id,
      powerLevel: realtimeRune.powerLevel,
      planetaryCount: Object.keys(planetaryPositions).length
    })
    
    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    })
    
  } catch (error) {
    console.error("API Error generating realtime runes:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate realtime runes", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body: RealtimeRuneRequest = await request.json()
    const { includeAlchemical = true, runeType = 'enhanced' } = body
    
    console.log("API: Realtime runes POST endpoint called", body)
    
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
          NightEssence: alchmData['Alchemy Effects']['Total Night Essence'] || 0
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
      
      // Add slight variation for multiple runes
      if (i > 0) {
        rune.id = `${rune.id}-${i}`
        rune.name = `${rune.name} (Variant ${i + 1})`
        rune.powerLevel = Math.round(rune.powerLevel * (0.95 + Math.random() * 0.1))
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
        alchemicalQuantities: quantities
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("API POST Error generating realtime runes:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate realtime runes", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}