import { planetInfo } from './planets'
import { signIndices } from './alchemizer'

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