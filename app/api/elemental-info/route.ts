import { NextResponse } from "next/server"
import { alchemize, createElementObject, getElementRanking } from "@/lib/alchemizer"
import { getSignElement, getPlanetaryElement, calculateElementalAffinity } from "@/lib/astrological-data"
import { getCurrentPlanetaryPositions } from "@/lib/calculate-transits"

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
      // Use the current planetary positions
      const currentPositions = getCurrentPlanetaryPositions()
      
      celestialBodies = [
        { label: "Sun", Sign: { label: currentPositions['Sun'].sign }, House: { label: "10" } },
        { label: "Moon", Sign: { label: currentPositions['Moon'].sign }, House: { label: "9" } },
        { label: "Mercury", Sign: { label: currentPositions['Mercury'].sign }, House: { label: "11" } },
        { label: "Venus", Sign: { label: currentPositions['Venus'].sign }, House: { label: "12" } },
        { label: "Mars", Sign: { label: currentPositions['Mars'].sign }, House: { label: "7" } },
        { label: "Jupiter", Sign: { label: currentPositions['Jupiter'].sign }, House: { label: "4" } },
        { label: "Saturn", Sign: { label: currentPositions['Saturn'].sign }, House: { label: "5" } },
        { label: "Uranus", Sign: { label: currentPositions['Uranus'].sign }, House: { label: "6" } },
        { label: "Neptune", Sign: { label: currentPositions['Neptune'].sign }, House: { label: "7" } },
        { label: "Pluto", Sign: { label: currentPositions['Pluto'].sign }, House: { label: "2" } },
        { label: "Ascendant", Sign: { label: currentPositions['Ascendant'].sign }, House: { label: "1" } }
      ]
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
    })
  } catch (error) {
    console.error("Error in elemental info calculation:", error)
    return NextResponse.json({ error: "Failed to calculate elemental information" }, { status: 500 })
  }
} 