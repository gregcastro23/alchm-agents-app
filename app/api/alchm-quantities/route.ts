import { NextResponse } from "next/server"
import { generateAlchmForCurrentMoment } from "@/lib/alchemizer"
import { logQuantitiesToGalileo, type AlchemicalMetrics } from "@/lib/galileo-logger"
import { getCurrentPlanetaryPositions } from "@/lib/calculate-transits"
import { CharacterVectorCalculator } from "@/lib/astrological-character-vectors"
import { generateRealTimeSignVectorRune } from "@/lib/runes/sign-vector-runes"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    console.log("API: alchm-quantities endpoint called")
    
    // Generate alchemical data for the current moment
    const alchmData = await generateAlchmForCurrentMoment()
    
    // Validate the response data
    if (!alchmData || typeof alchmData !== 'object') {
      console.error("API: Invalid alchm data format:", alchmData)
      return NextResponse.json(
        { error: "Invalid data format returned from alchemizer" },
        { status: 500 }
      )
    }
    
    // Extract the specific Alchemy Effects that we want to return
    const quantities = {
      Spirit: alchmData?.['Alchemy Effects']?.['Total Spirit'] || 0,
      Essence: alchmData?.['Alchemy Effects']?.['Total Essence'] || 0,
      Matter: alchmData?.['Alchemy Effects']?.['Total Matter'] || 0,
      Substance: alchmData?.['Alchemy Effects']?.['Total Substance'] || 0,
      ANumber: alchmData?.['Alchemy Effects']?.['A #'] || 0,
      DayEssence: alchmData?.['Alchemy Effects']?.['Total Day Essence'] || 0,
      NightEssence: alchmData?.['Alchemy Effects']?.['Total Night Essence'] || 0
    }
    
    // Get current planetary positions for additional context
    const planetaryPositions = getCurrentPlanetaryPositions()
    
    // Generate real-time sign vector rune
    const realtimeRune = generateRealTimeSignVectorRune(planetaryPositions, { quantities })
    
    // Include some additional data that may be useful for the client
    const responseData = {
      quantities,
      dominantElement: alchmData?.['Dominant Element'] || "",
      heat: alchmData?.['Heat'] || 0,
      entropy: alchmData?.['Entropy'] || 0,
      reactivity: alchmData?.['Reactivity'] || 0,
      energy: alchmData?.['Energy'] || 0,
      sunSign: alchmData?.['Sun Sign'] || "",
      chartRuler: alchmData?.['Chart Ruler'] || "",
      realtimeRune,
      planetaryPositions: Object.keys(planetaryPositions).length,
      timestamp: new Date().toISOString()
    }
    
    // Log quantities to Galileo for dashboard tracking (null-guarded)
    try {
      const metricsData: AlchemicalMetrics = {
        quantities,
        dominantElement: responseData.dominantElement || 'unknown',
        heat: responseData.heat || 0,
        entropy: responseData.entropy || 0,
        reactivity: responseData.reactivity || 0,
        energy: responseData.energy || 0,
        sunSign: responseData.sunSign || 'unknown',
        chartRuler: responseData.chartRuler || 'unknown',
        timestamp: responseData.timestamp,
        planetaryPositions
      }
      
      await logQuantitiesToGalileo(metricsData, {
        api_endpoint: '/api/alchm-quantities',
        request_timestamp: new Date().toISOString(),
        calculation_method: 'real-time-planetary-positions'
      })
    } catch (galileoError) {
      console.warn('Failed to log quantities to Galileo:', galileoError)
      // Don't fail the API call if Galileo logging fails
    }
    
    console.log("API: Successfully generated alchm quantities")
    
    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    })
  } catch (error) {
    console.error("API Error generating Alchm quantities:", error)
    return NextResponse.json(
      { error: "Failed to generate Alchm quantities", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 