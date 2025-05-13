import { NextResponse } from "next/server"
import { generateAlchmForCurrentMoment } from "@/lib/alchemizer"

export async function GET() {
  try {
    // Generate alchemical data for the current moment
    const alchmData = await generateAlchmForCurrentMoment()
    
    // Extract the specific Alchemy Effects that we want to return
    const quantities = {
      Spirit: alchmData?.['Alchemy Effects']?.['Total Spirit'] || 0,
      Essence: alchmData?.['Alchemy Effects']?.['Total Essence'] || 0,
      Matter: alchmData?.['Alchemy Effects']?.['Total Matter'] || 0,
      Substance: alchmData?.['Alchemy Effects']?.['Total Substance'] || 0,
      DayEssence: alchmData?.['Alchemy Effects']?.['Total Day Essence'] || 0,
      NightEssence: alchmData?.['Alchemy Effects']?.['Total Night Essence'] || 0
    }
    
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
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error generating Alchm quantities:", error)
    return NextResponse.json(
      { error: "Failed to generate Alchm quantities" },
      { status: 500 }
    )
  }
} 