import { NextResponse } from "next/server"
import { generateAlchmForCurrentMoment } from "@/lib/alchemizer"
import { getCurrentPlanetaryPositions } from "@/lib/calculate-transits"
import { generateRealTimeSignVectorRune } from "@/lib/runes/sign-vector-runes"
import { logQuantitiesToGalileo, type AlchemicalMetrics } from "@/lib/galileo-logger"
import { sampleCurrentMoment } from "@/lib/alchemical-kinetics-sampler"
import { computePower, getSolarAmplification } from "@/lib/alchemical-kinetics"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface RealtimeRuneRequest {
  includeAlchemical?: boolean;
  runeType?: 'basic' | 'enhanced' | 'premium';
  runeCount?: number; // Number of runes to generate (max 5)
  includeKinetics?: boolean; // Include kinetics-based power calculations
  location?: { latitude: number; longitude: number }; // For kinetics sampling
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAlchemical = searchParams.get('includeAlchemical') !== 'false'
    const runeType = searchParams.get('runeType') || 'enhanced'
    const includeKinetics = searchParams.get('includeKinetics') === 'true'
    const lat = parseFloat(searchParams.get('lat') || '37.7749')
    const lon = parseFloat(searchParams.get('lon') || '-122.4194')
    
    console.log("API: Realtime runes endpoint called", { includeAlchemical, runeType, includeKinetics })
    
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
    
    // Phase 4: Kinetics-based power enhancement
    let kineticsPowerData: any = null
    if (includeKinetics) {
      try {
        // Sample current moment for kinetics
        const currentSample = await sampleCurrentMoment(
          { latitude: lat, longitude: lon },
          { includePlanetaryHours: true }
        )
        
        // Calculate recent power using a simple 2-sample approximation
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 3600000)
        const pastSample = await sampleCurrentMoment(
          { latitude: lat, longitude: lon },
          { includePlanetaryHours: true }
        )
        // Note: In a real implementation, we'd want actual historical data
        // For now, we'll use the current sample with slight variation
        pastSample.Energy = currentSample.Energy * (0.9 + Math.random() * 0.2)
        pastSample.t = oneHourAgo
        
        const powerSamples = [
          { t: pastSample.t, Energy: pastSample.Energy, planetaryHour: pastSample.planetaryHour },
          { t: currentSample.t, Energy: currentSample.Energy, planetaryHour: currentSample.planetaryHour }
        ]
        
        const powerResults = computePower(powerSamples)
        const currentPower = powerResults[powerResults.length - 1]
        
        // Get seasonal modifier (simplified)
        const month = now.getMonth()
        const seasonalModifier = month >= 2 && month <= 4 ? 1.1 : // Spring acceleration
                               month >= 5 && month <= 7 ? 1.2 : // Summer peak
                               month >= 8 && month <= 10 ? 0.95 : // Autumn deceleration
                               0.9 // Winter stability
        
        // Calculate enhanced power level
        const basePower = realtimeRune.powerLevel || 100
        const kineticsPower = Math.abs(currentPower?.power || 0) * 50 // Scale factor
        const solarAmplification = getSolarAmplification(currentSample.planetaryHour)
        
        const enhancedPowerLevel = Math.round(
          basePower + (kineticsPower * solarAmplification * seasonalModifier)
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
          planetaryHour: currentSample.planetaryHour,
          seasonalPhase: currentSample.seasonalPhase
        }
        
        // Add kinetics description to rune
        realtimeRune.description += ` Kinetically enhanced with ${powerType} power during ${currentSample.planetaryHour} hour.`
        
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
        kineticsPowerData
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
    const { includeAlchemical = true, runeType = 'enhanced', includeKinetics = false, location } = body
    const lat = location?.latitude || 37.7749
    const lon = location?.longitude || -122.4194
    
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
        rune.powerLevel = Math.round((rune.powerLevel || 100) * (0.95 + Math.random() * 0.1))
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