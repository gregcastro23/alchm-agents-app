import { NextResponse } from "next/server"
import { alchemize, createElementObject, getElementRanking } from "@/lib/alchemizer"
import { getSignElement, getPlanetaryElement, calculateElementalAffinity } from "@/lib/astrological-data"
import { getCurrentPlanetaryPositions } from "@/lib/calculate-transits"

// Prevent caching - we always want fresh calculations
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const { birthInfo, planets } = await req.json()
    
    // Extract basic information
    const { date, time, location } = birthInfo
    const hour = time ? parseInt(time.split(':')[0]) : 12
    const isDiurnal = hour >= 6 && hour < 18
    
    // Get current planetary positions when no specific planets are provided
    // or when default planets are detected
    const isDefaultPlanets = !planets || 
      (planets.sunSign === "Leo" && 
       planets.moonSign === "Cancer" && 
       planets.mercurySign === "Virgo")
    
    let celestialBodies = []
    
    if (isDefaultPlanets) {
      // Use the current planetary positions with a timestamp to force fresh data
      const timestamp = new Date().getTime()
      const currentPositions = getCurrentPlanetaryPositions(timestamp)
      
      // Safety checks for each planet
      const defaultHouse = "1"
      const defaultSign = "Aries"
      
      // Function to safely get sign or return default
      const getSafeSign = (planet) => {
        return currentPositions[planet]?.sign || defaultSign
      }
      
      celestialBodies = [
        { label: "Sun", Sign: { label: getSafeSign("Sun") }, House: { label: "10" } },
        { label: "Moon", Sign: { label: getSafeSign("Moon") }, House: { label: "9" } },
        { label: "Mercury", Sign: { label: getSafeSign("Mercury") }, House: { label: "11" } },
        { label: "Venus", Sign: { label: getSafeSign("Venus") }, House: { label: "12" } },
        { label: "Mars", Sign: { label: getSafeSign("Mars") }, House: { label: "7" } },
        { label: "Jupiter", Sign: { label: getSafeSign("Jupiter") }, House: { label: "4" } },
        { label: "Saturn", Sign: { label: getSafeSign("Saturn") }, House: { label: "5" } },
        { label: "Uranus", Sign: { label: getSafeSign("Uranus") }, House: { label: "6" } },
        { label: "Neptune", Sign: { label: getSafeSign("Neptune") }, House: { label: "7" } },
        { label: "Pluto", Sign: { label: getSafeSign("Pluto") }, House: { label: "2" } },
        { label: "Ascendant", Sign: { label: getSafeSign("Ascendant") }, House: { label: "1" } }
      ]
      
      console.log("Using current positions for chart:", currentPositions)
    } else {
      // Use the provided planetary positions
      celestialBodies = [
        { label: "Sun", Sign: { label: planets.sunSign || "Leo" }, House: { label: "10" } },
        { label: "Moon", Sign: { label: planets.moonSign || "Cancer" }, House: { label: "9" } },
        { label: "Mercury", Sign: { label: planets.mercurySign || "Virgo" }, House: { label: "11" } },
        { label: "Venus", Sign: { label: planets.venusSign || "Libra" }, House: { label: "12" } },
        { label: "Mars", Sign: { label: planets.marsSign || "Aries" }, House: { label: "7" } },
        { label: "Jupiter", Sign: { label: planets.jupiterSign || "Sagittarius" }, House: { label: "4" } },
        { label: "Saturn", Sign: { label: planets.saturnSign || "Capricorn" }, House: { label: "5" } },
        { label: "Uranus", Sign: { label: planets.uranusSign || "Aquarius" }, House: { label: "6" } },
        { label: "Neptune", Sign: { label: planets.neptuneSign || "Pisces" }, House: { label: "7" } },
        { label: "Pluto", Sign: { label: planets.plutoSign || "Scorpio" }, House: { label: "2" } },
        { label: "Ascendant", Sign: { label: planets.ascendantSign || "Aries" }, House: { label: "1" } }
      ]
    }
    
    // Create a horoscope object with the appropriate celestial bodies
    const horoscope = {
      tropical: {
        Ascendant: {
          Sign: { label: celestialBodies[10].Sign.label }
        },
        CelestialBodies: {
          all: celestialBodies,
          sun: { ChartPosition: { Ecliptic: { ArcDegreesFormatted30: "15°" } } },
          moon: { ChartPosition: { Ecliptic: { ArcDegreesFormatted30: "10°" } } },
          mercury: { ChartPosition: { Ecliptic: { ArcDegreesFormatted30: "5°" } } },
          venus: { ChartPosition: { Ecliptic: { ArcDegreesFormatted30: "20°" } } },
          mars: { ChartPosition: { Ecliptic: { ArcDegreesFormatted30: "25°" } } },
          jupiter: { ChartPosition: { Ecliptic: { ArcDegreesFormatted30: "12°" } } },
          saturn: { ChartPosition: { Ecliptic: { ArcDegreesFormatted30: "8°" } } },
          uranus: { ChartPosition: { Ecliptic: { ArcDegreesFormatted30: "17°" } } },
          neptune: { ChartPosition: { Ecliptic: { ArcDegreesFormatted30: "23°" } } },
          pluto: { ChartPosition: { Ecliptic: { ArcDegreesFormatted30: "3°" } } },
        },
        Aspects: {
          points: {
            sun: [
              { aspectKey: "conjunction", point1Label: "Sun", point2Label: "Mercury" },
              { aspectKey: "trine", point1Label: "Sun", point2Label: "Mars" }
            ],
            moon: [
              { aspectKey: "square", point1Label: "Moon", point2Label: "Venus" }
            ],
            // More aspects would be defined here
          }
        }
      }
    }
    
    // Process birthInfo for alchemizer
    const birthInfoForAlchemizer = {
      ...birthInfo,
      hour
    }
    
    // Call the alchemizer
    const alchemicalInfo = alchemize(birthInfoForAlchemizer, horoscope)
    
    // Calculate elemental totals
    const elementalTotals = createElementObject()
    
    // Process planetary positions to get element totals
    horoscope.tropical.CelestialBodies.all.forEach((celestialBody: any) => {
      const planet = celestialBody.label
      const sign = celestialBody.Sign.label
      const element = getSignElement(sign)
      elementalTotals[element] += 1
      
      // Calculate elemental affinity for each planet
      const planetElement = getPlanetaryElement(planet, isDiurnal)
      const affinity = calculateElementalAffinity(planet, sign, isDiurnal)
      
      // Apply affinity to boost the element's strength
      elementalTotals[element] += (affinity - 0.5) // Add bonus for high affinity
    })
    
    // Determine dominant element
    const dominantElement = getElementRanking(elementalTotals)[1]
    
    // Get the values from alchemizer result (if available) or use calculated values
    const sunSign = alchemicalInfo['Sun Sign'] || horoscope.tropical.CelestialBodies.all[0].Sign.label
    const chartRuler = alchemicalInfo['Chart Ruler'] || "Unknown"
    const heat = alchemicalInfo['Heat'] || 0
    const entropy = alchemicalInfo['Entropy'] || 0
    const reactivity = alchemicalInfo['Reactivity'] || 0
    const energy = alchemicalInfo['Energy'] || 0
    
    // Return the elemental information
    return NextResponse.json({
      elementalTotals,
      dominantElement,
      alchemicalInfo: {
        sunSign,
        chartRuler,
        heat,
        entropy,
        reactivity,
        energy
      },
      isDiurnal,
      planetaryElements: horoscope.tropical.CelestialBodies.all.map((body: any) => ({
        planet: body.label,
        sign: body.Sign.label,
        signElement: getSignElement(body.Sign.label),
        planetElement: getPlanetaryElement(body.label, isDiurnal),
        affinity: Math.round(calculateElementalAffinity(body.label, body.Sign.label, isDiurnal) * 100)
      }))
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate"
      }
    })
  } catch (error) {
    console.error("Error in elemental info calculation:", error)
    return NextResponse.json({ 
      error: "Failed to calculate elemental information", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500,
      headers: {
        "Cache-Control": "no-store"
      }
    })
  }
} 