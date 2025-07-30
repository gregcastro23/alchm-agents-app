// Fetch current planetary positions from Alchemize API
// Using proper January-0 indexing

export interface AlchemizeApiResponse {
  "Planet Positions"?: {
    [planet: string]: {
      sign: string;
      degree: number;
    }
  };
  "Alchemy Effects"?: {
    "Total Spirit": number;
    "Total Essence": number;
    "Total Matter": number;
    "Total Substance": number;
  };
  "Major Arcana"?: string[];
  "Minor Arcana"?: string[];
  "Decan Effects"?: {
    [planet: string]: string;
  };
}

export async function fetchCurrentPlanetaryPositions(): Promise<AlchemizeApiResponse | null> {
  try {
    // Get current date and time
    const now = new Date()
    
    // Use January-0 indexing (month is already 0-indexed in JavaScript)
    const month = now.getMonth() // 0-11, so January = 0
    const day = now.getDate()
    const year = now.getFullYear()
    const hour = now.getHours()
    const minute = now.getMinutes()
    
    // For current location, using NYC as default (Monica's birth location)
    const latitude = 40.7128
    const longitude = -74.0060
    
    console.log(`Fetching positions for: ${year}-${month + 1}-${day} ${hour}:${minute}`)
    console.log(`Using month index: ${month} (January-0 indexing)`)
    
    // Build the API request body with proper January-0 indexing
    const requestBody = {
      year: year,
      month: month, // Using 0-indexed month directly
      day: day,
      hour: hour,
      minute: minute,
      latitude: latitude,
      longitude: longitude
    }
    
    console.log('Alchemize API request:', requestBody)
    
    // Call the Alchemize API
    const response = await fetch('https://alchm.xyz/api/alchemize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      console.error('Alchemize API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return null
    }
    
    const data = await response.json()
    console.log('Alchemize API response received:', {
      hasPlanetPositions: !!data['Planet Positions'],
      hasAlchemyEffects: !!data['Alchemy Effects'],
      hasDecanEffects: !!data['Decan Effects']
    })
    
    return data
  } catch (error) {
    console.error('Error fetching planetary positions:', error)
    return null
  }
}

// Get the current Sun's decan based on real position
export function getSunDecanFromPosition(sunSign: string, sunDegree: number): number {
  // Map signs to their starting degrees in the zodiac
  const signToDegree: Record<string, number> = {
    'Aries': 0,
    'Taurus': 30,
    'Gemini': 60,
    'Cancer': 90,
    'Leo': 120,
    'Virgo': 150,
    'Libra': 180,
    'Scorpio': 210,
    'Sagittarius': 240,
    'Capricorn': 270,
    'Aquarius': 300,
    'Pisces': 330
  }
  
  const signStartDegree = signToDegree[sunSign] || 0
  const absoluteDegree = signStartDegree + sunDegree
  
  // Each decan is 10 degrees, starting from 0
  // 0-10 = 1st decan Aries (0), 10-20 = 2nd decan Aries (10), etc.
  const decanIndex = Math.floor(absoluteDegree / 10) * 10
  
  console.log(`Sun at ${sunSign} ${sunDegree}° = absolute ${absoluteDegree}° = decan ${decanIndex}`)
  
  return decanIndex
}