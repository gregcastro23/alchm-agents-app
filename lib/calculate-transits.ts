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

// Calculate current positions based on the reference data for May 19, 2024
export function getCurrentPlanetaryPositions(): Record<string, { sign: string, degree: number }> {
  try {
    console.log('Calculating current planetary positions...')
    
    // Reference date: May 19, 2024 (today)
    const referenceDate = new Date(2024, 4, 19)
    const currentDate = new Date()
    
    console.log(`Reference date: ${referenceDate.toISOString()}, Current date: ${currentDate.toISOString()}`)
    console.log(`Days since reference: ${(currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)}`)
  
    // Updated reference positions from the user's provided current positions
    const referencePositions = {
      'Sun': { sign: 'Taurus', degree: 24.13 },      // 24° 8'
      'Moon': { sign: 'Sagittarius', degree: 16.22 }, // 16° 13'
      'Mercury': { sign: 'Taurus', degree: 7.33 },    // 7° 20'
      'Venus': { sign: 'Aries', degree: 9.58 },       // 9° 35'
      'Mars': { sign: 'Leo', degree: 12.13 },         // 12° 8'
      'Jupiter': { sign: 'Gemini', degree: 24.2 },    // 24° 12'
      'Saturn': { sign: 'Pisces', degree: 29.13 },    // 29° 8'
      'Uranus': { sign: 'Taurus', degree: 27.1 },     // 27° 6'
      'Neptune': { sign: 'Aries', degree: 1.48 },     // 1° 29'
      'Pluto': { sign: 'Aquarius', degree: 3.78 },    // 3° 47'
      'Ascendant': { sign: 'Virgo', degree: 0.1 }     // 0° 6'
    }
  
    // Verification to ensure the signIndices are correctly loaded
    console.log('Sign indices loaded:', Object.keys(signIndices).length)
    if (Object.keys(signIndices).length === 0) {
      console.error('Sign indices not loaded correctly')
      return referencePositions
    }
    
    const currentPositions: Record<string, { sign: string, degree: number }> = {}
  
    // For today's date, just use the reference positions directly
    // as they're already the current positions we want to display
    if (Math.abs((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)) < 1) {
      console.log('Using reference positions directly as current date matches reference date')
      return referencePositions
    }
  
    // Calculate current position for each planet
    for (const [planet, reference] of Object.entries(referencePositions)) {
      console.log(`Calculating position for ${planet} (reference: ${reference.sign} ${reference.degree}°)`)
      
      try {
        const { sign, degree } = calculatePlanetPosition(
          planet, 
          referenceDate, 
          reference.sign, 
          reference.degree,
          currentDate
        )
    
        currentPositions[planet] = {
          sign,
          degree
        }
        
        console.log(`${planet} calculated position: ${sign} ${degree}°`)
      } catch (err) {
        console.error(`Error calculating position for ${planet}:`, err)
        // Fallback to reference data if calculation fails
        currentPositions[planet] = {
          sign: reference.sign,
          degree: reference.degree
        }
      }
    }
  
    return currentPositions
  } catch (error) {
    console.error('Error in getCurrentPlanetaryPositions:', error)
    // Return the current positions from May 19 as fallback data
    return {
      'Sun': { sign: 'Taurus', degree: 24.13 },      
      'Moon': { sign: 'Sagittarius', degree: 16.22 }, 
      'Mercury': { sign: 'Taurus', degree: 7.33 },    
      'Venus': { sign: 'Aries', degree: 9.58 },       
      'Mars': { sign: 'Leo', degree: 12.13 },         
      'Jupiter': { sign: 'Gemini', degree: 24.2 },    
      'Saturn': { sign: 'Pisces', degree: 29.13 },    
      'Uranus': { sign: 'Taurus', degree: 27.1 },     
      'Neptune': { sign: 'Aries', degree: 1.48 },     
      'Pluto': { sign: 'Aquarius', degree: 3.78 },    
      'Ascendant': { sign: 'Virgo', degree: 0.1 }
    }
  }
} 