import { NextResponse } from "next/server"
import { getCurrentPlanetaryPositions, getRawPlanetaryPositions } from "@/lib/calculate-transits"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    // Get the current time
    const now = new Date()
    
    // Get the current planetary positions
    const positions = getCurrentPlanetaryPositions()
    
    // Get the raw positions directly from the calculation
    const rawPositions = getRawPlanetaryPositions()
    
    return NextResponse.json({
      timestamp: now.toISOString(),
      positions,
      rawPositions,
      message: "This is a debug endpoint for verifying planetary position calculations"
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    })
  } catch (error) {
    console.error("Error getting debug positions:", error)
    return NextResponse.json({ error: "Failed to get planetary positions" }, { status: 500 })
  }
} 