import { planetInfo } from './planets'
import { signIndices } from './alchemizer'
import { sunData, moonData, mercuryData, venusData, marsData, jupiterData, saturnData, uranusData, neptuneData, plutoData } from './planets'

// Define orbital periods for planets in days
const orbitalPeriods = {
  'Sun': 365.25, // Earth's orbit around the Sun
  'Moon': 29.53, // Lunar month
  'Mercury': 87.97,
  'Venus': 224.7,
  'Mars': 687,
  'Jupiter': 4332.59,
  'Saturn': 10759.22,
  'Uranus': 30688.5,
  'Neptune': 60182,
  'Pluto': 90560
}

// Define approximate degrees per day for each planet
const degreesPerDay = Object.entries(orbitalPeriods).reduce(
  (acc, [planet, period]) => ({
    ...acc,
    [planet]: 360 / period
  }),
  {} as Record<string, number>
)

// Current planetary data with transit dates
const planetDataWithTransits = {
  'Sun': sunData,
  'Moon': moonData,
  'Mercury': mercuryData,
  'Venus': venusData,
  'Mars': marsData,
  'Jupiter': jupiterData,
  'Saturn': saturnData,
  'Uranus': uranusData,
  'Neptune': neptuneData,
  'Pluto': plutoData
}

// Helper function to get transit dates for a planet
function getTransitDates(planet: string): Record<string, {Start: string, End: string}> | null {
  try {
    // Special case for Moon which uses a calculation function
    if (planet === 'Moon' && planetDataWithTransits.Moon?.PlanetSpecific?.MoonCalculations?.calculateTransits) {
      const calculateTransits = planetDataWithTransits.Moon.PlanetSpecific.MoonCalculations.calculateTransits;
      // Cast the function to the expected type and call it
      return (calculateTransits as Function)(new Date());
    }
    
    if (!planetDataWithTransits[planet]?.PlanetSpecific?.TransitDates) {
      return null
    }
    
    const transitData = planetDataWithTransits[planet].PlanetSpecific.TransitDates
    
    // Handle different transit date formats
    if (transitData.hasOwnProperty('Aries') || 
        transitData.hasOwnProperty('Taurus') ||
        transitData.hasOwnProperty('Gemini')) {
      // Simple format like Mars or Venus
      return transitData as Record<string, {Start: string, End: string}>
    } 
    else if (transitData.hasOwnProperty('DirectPhasesQ2_2024')) {
      // Mercury format
      return {
        ...transitData.DirectPhasesQ2_2024,
        ...transitData.DirectPhasesQ4_2024
      } as Record<string, {Start: string, End: string}>
    }
    else if (transitData.hasOwnProperty('Pisces') || 
             transitData.hasOwnProperty('Taurus') && transitData.Taurus.hasOwnProperty('1stDecan')) {
      // Neptune/Pluto/Uranus format with decans
      // We'll simplify and use the first decan as the start and the last decan end as the end
      const simplifiedTransits: Record<string, {Start: string, End: string}> = {}
      
      for (const sign in transitData) {
        if (transitData[sign]['1stDecan']) {
          const decans = ['1stDecan', '2ndDecan', '3rdDecan']
          const firstDecan = transitData[sign]['1stDecan']
          const lastDecan = transitData[sign][decans.find(d => transitData[sign][d]) || '3rdDecan']
          
          simplifiedTransits[sign] = {
            Start: firstDecan.Start,
            End: lastDecan.End
          }
        }
      }
      
      return simplifiedTransits
    }
    
    return null
  } catch (error) {
    console.error(`Error getting transit dates for ${planet}:`, error)
    return null
  }
}

// Function to find the current sign based on transit dates
function findSignFromTransitDates(planet: string, date: Date = new Date()): { sign: string, degree: number } | null {
  try {
    const transitDates = getTransitDates(planet)
    if (!transitDates) return null
    
    const currentDateStr = date.toISOString().split('T')[0]
    
    for (const [sign, dates] of Object.entries(transitDates)) {
      const startDate = new Date(dates.Start)
      const endDate = new Date(dates.End)
      
      if (date >= startDate && date <= endDate) {
        // Found the current sign!
        
        // Calculate how far we are into this transit as a percentage
        const transitDuration = endDate.getTime() - startDate.getTime()
        const timeElapsed = date.getTime() - startDate.getTime()
        const transitProgress = timeElapsed / transitDuration
        
        // Convert to degrees (each sign is 30 degrees)
        const degree = Math.min(transitProgress * 30, 29.99)
        
        return { 
          sign, 
          degree: Math.round(degree * 100) / 100
        }
      }
    }
    
    // If we're here and we're checking the Moon, it means our hardcoded data doesn't cover
    // the requested date. We'll use the mathematical calculation as fallback.
    if (planet === 'Moon') {
      return calculateMoonPosition(date);
    }
    
    return null
  } catch (error) {
    console.error(`Error finding sign from transit dates for ${planet}:`, error)
    return null
  }
}

// Calculate Moon position based on a simple mathematical model
function calculateMoonPosition(date: Date): { sign: string, degree: number } {
  try {
    // Reference point: May 19, 2024 - Moon in Sagittarius at 16.22 degrees
    const referenceDate = new Date(2024, 4, 19);
    const referenceDegree = 16.22;
    const referenceSignIndex = 8; // Sagittarius
    
    // Calculate days since reference
    const daysSinceReference = (date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Moon moves about 13.2 degrees per day (360 / 27.3 days)
    const degreesMoved = daysSinceReference * 13.2;
    
    // Calculate absolute position
    const absoluteReferencePosition = (referenceSignIndex * 30) + referenceDegree;
    let newAbsolutePosition = (absoluteReferencePosition + degreesMoved) % 360;
    
    // Handle negative values
    if (newAbsolutePosition < 0) {
      newAbsolutePosition += 360;
    }
    
    // Calculate new sign and degree
    const newSignIndex = Math.floor(newAbsolutePosition / 30);
    const newDegree = newAbsolutePosition % 30;
    
    // Get sign name
    const signs = Object.entries(signIndices).reduce(
      (acc, [sign, index]) => ({ ...acc, [index]: sign }),
      {} as Record<number, string>
    );
    
    return {
      sign: signs[newSignIndex] || 'Aries',
      degree: Math.round(newDegree * 100) / 100
    };
  } catch (error) {
    console.error('Error calculating Moon position:', error);
    // Fallback to Sagittarius
    return { sign: 'Sagittarius', degree: 0 };
  }
}

// Calculate the current sign and degree for a planet based on a reference position and date
export function calculatePlanetPosition(
  planet: string,
  referenceDate: Date,
  referenceSign: string,
  referenceDegree: number,
  currentDate: Date = new Date()
): { sign: string, degree: number } {
  // Skip calculation for Ascendant as it depends on location and time
  if (planet === 'Ascendant') {
    return { sign: 'Virgo', degree: 0.1 } // Updated to match provided position
  }
  
  // Try to use transit dates first if available
  const transitPosition = findSignFromTransitDates(planet, currentDate)
  if (transitPosition) {
    console.log(`Using transit dates for ${planet}: ${transitPosition.sign} ${transitPosition.degree}°`)
    return transitPosition
  }
  
  try {
    // Calculate days since reference date
    const daysSinceReference = (currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    
    // Calculate total degrees moved
    const degreesMoved = daysSinceReference * (degreesPerDay[planet] || 1)
    
    // Calculate new absolute degree position (0-359)
    const referenceSignIndex = signIndices[referenceSign]
    if (referenceSignIndex === undefined) {
      console.error(`Invalid reference sign for ${planet}: ${referenceSign}`)
      // Return the reference position as fallback
      return { sign: referenceSign, degree: referenceDegree }
    }
    
    const absoluteDegreeReference = (referenceSignIndex * 30) + referenceDegree
    let newAbsoluteDegree = (absoluteDegreeReference + degreesMoved) % 360
    
    // Handle negative values
    if (newAbsoluteDegree < 0) {
      newAbsoluteDegree += 360
    }
    
    // Calculate new sign and degree
    const newSignIndex = Math.floor(newAbsoluteDegree / 30)
    const newDegree = newAbsoluteDegree % 30
    
    // Get sign name from index
    const signs = Object.entries(signIndices).reduce(
      (acc, [sign, index]) => ({ ...acc, [index]: sign }),
      {} as Record<number, string>
    )
    
    const newSign = signs[newSignIndex] || 'Aries' // Default to Aries if sign can't be determined
    
    return {
      sign: newSign,
      degree: Math.round(newDegree * 100) / 100 // Round to 2 decimal places
    }
  } catch (error) {
    console.error(`Error calculating position for ${planet}:`, error)
    // Return the reference position as fallback
    return { sign: referenceSign, degree: referenceDegree }
  }
}

/**
 * Calculates the current positions of planets based on reference positions and orbital speeds
 * Optionally accepts a timestamp to prevent caching
 * @param timestamp Optional timestamp to force recalculation
 * @returns Object with planet names as keys and their current sign and degree
 */
export function getCurrentPlanetaryPositions(timestamp?: number): Record<string, { sign: string, degree: string }> {
  const now = new Date()
  
  // If a timestamp is provided, log it to verify fresh data
  if (timestamp) {
    console.log(`Calculating positions with timestamp: ${timestamp}`)
  }
  
  // Get the current reference positions
  const referencePositions = planetaryReferencePositions
  
  // Reference date (May 15, 2024)
  const referenceDate = new Date(2024, 4, 15)
  
  // Calculate days since reference date
  const daysSinceReference = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  
  // Calculate current positions based on reference positions and days elapsed
  const currentPositions: Record<string, { sign: string, degree: string }> = {}
  
  for (const planet in referencePositions) {
    try {
      // Skip if planet not in degreesPerDay
      if (!degreesPerDay[planet]) continue
      
      // Get position from transit dates if available
      const transitPosition = getTransitPositionFromDates(planet, now)
      
      if (transitPosition) {
        currentPositions[planet] = {
          sign: transitPosition.sign,
          degree: transitPosition.degree
        }
        continue
      }
      
      // Calculate position based on reference position and orbital speed
      const refPosition = referencePositions[planet]
      const refDegree = parseFloat(refPosition.degree)
      const refSignIndex = signIndices[refPosition.sign]
      
      // Calculate new degree
      let newDegree = refDegree + (daysSinceReference * degreesPerDay[planet])
      
      // Normalize degree to be within 0-360
      newDegree = newDegree % 360
      if (newDegree < 0) newDegree += 360
      
      // Calculate new sign index
      const newSignIndex = Math.floor(newDegree / 30)
      
      // Calculate degree within sign
      const degreeInSign = newDegree % 30
      
      // Get sign name from index
      const newSign = Object.keys(signIndices).find(
        key => signIndices[key] === newSignIndex
      ) || refPosition.sign
      
      currentPositions[planet] = {
        sign: newSign,
        degree: degreeInSign.toFixed(2)
      }
    } catch (error) {
      console.error(`Error calculating position for ${planet}:`, error)
      // Use reference position as fallback
      currentPositions[planet] = referencePositions[planet]
    }
  }
  
  return currentPositions
}

/**
 * Gets the raw planetary positions directly from calculations
 * This is used for debugging purposes
 */
export function getRawPlanetaryPositions() {
  const now = new Date()
  
  // Force a timestamp to prevent caching
  const timestamp = now.getTime()
  
  // Get the current reference positions
  const referencePositions = planetaryReferencePositions
  
  // Reference date (May 15, 2024)
  const referenceDate = new Date(2024, 4, 15)
  
  // Calculate days since reference date
  const daysSinceReference = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  
  // Calculate current positions based on reference positions and days elapsed
  const currentPositions: Record<string, { sign: string, degree: string, rawDegree: number }> = {}
  
  for (const planet in referencePositions) {
    try {
      // Skip if planet not in degreesPerDay
      if (!degreesPerDay[planet]) continue
      
      // Get position from transit dates if available
      const transitPosition = getTransitPositionFromDates(planet, now)
      
      if (transitPosition) {
        currentPositions[planet] = transitPosition
        continue
      }
      
      // Calculate position based on reference position and orbital speed
      const refPosition = referencePositions[planet]
      const refDegree = parseFloat(refPosition.degree)
      const refSignIndex = signIndices[refPosition.sign]
      
      // Calculate new degree
      let newDegree = refDegree + (daysSinceReference * degreesPerDay[planet])
      
      // Normalize degree to be within 0-360
      newDegree = newDegree % 360
      if (newDegree < 0) newDegree += 360
      
      // Calculate new sign index
      const newSignIndex = Math.floor(newDegree / 30)
      
      // Calculate degree within sign
      const degreeInSign = newDegree % 30
      
      // Get sign name from index
      const newSign = Object.keys(signIndices).find(
        key => signIndices[key] === newSignIndex
      ) || refPosition.sign
      
      currentPositions[planet] = {
        sign: newSign,
        degree: degreeInSign.toFixed(2),
        rawDegree: newDegree
      }
    } catch (error) {
      console.error(`Error calculating position for ${planet}:`, error)
      // Use reference position as fallback
      currentPositions[planet] = {
        ...referencePositions[planet],
        rawDegree: parseFloat(referencePositions[planet].degree)
      }
    }
  }
  
  return {
    timestamp,
    calculatedPositions: currentPositions,
    referencePositions,
    referenceDate: referenceDate.toISOString(),
    daysSinceReference,
    degreesPerDay
  }
} 