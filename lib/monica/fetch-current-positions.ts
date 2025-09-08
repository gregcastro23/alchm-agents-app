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

// Cache for preventing concurrent requests
let currentRequest: Promise<AlchemizeApiResponse | null> | null = null
let lastRequestTime = 0
const REQUEST_CACHE_DURATION = 30000 // 30 seconds

export async function fetchCurrentPlanetaryPositions(signal?: AbortSignal): Promise<AlchemizeApiResponse | null> {
  // Return cached request if one is in progress or recently completed
  const now = Date.now()
  if (currentRequest && (now - lastRequestTime) < REQUEST_CACHE_DURATION) {
    console.log('Using cached/in-progress request for planetary positions')
    return currentRequest
  }

  // Create new request
  currentRequest = performFetch(signal)
  lastRequestTime = now
  
  try {
    const result = await currentRequest
    return result
  } finally {
    // Clear the request after completion
    setTimeout(() => {
      if (Date.now() - lastRequestTime >= REQUEST_CACHE_DURATION) {
        currentRequest = null
      }
    }, REQUEST_CACHE_DURATION)
  }
}

async function performFetch(signal?: AbortSignal): Promise<AlchemizeApiResponse | null> {
  try {
    // Use our local API instead of external alchm.xyz API
    console.log('Fetching current planetary positions from local API...')
    
    // Call our local elemental-info API which has the current planetary positions
    const response = await fetch('/api/elemental-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        birthInfo: {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          location: 'New York' // Default location
        },
        planets: {} // Use current planetary positions
      }),
      signal
    })
    
    if (!response.ok) {
      console.error('Local API error:', response.status, response.statusText)
      return null
    }
    
    const data = await response.json()
    
    // Transform our local API response to match the expected AlchemizeApiResponse format
    const transformedData: AlchemizeApiResponse = {
      "Planet Positions": {},
      "Alchemy Effects": {
        "Total Spirit": data.alchemicalInfo?.alchemicalProperties?.spirit || 0,
        "Total Essence": data.alchemicalInfo?.alchemicalProperties?.essence || 0,
        "Total Matter": data.alchemicalInfo?.alchemicalProperties?.matter || 0,
        "Total Substance": data.alchemicalInfo?.alchemicalProperties?.substance || 0,
      },
      "Major Arcana": [],
      "Minor Arcana": [],
      "Decan Effects": {}
    }
    
    // Transform planetary elements to planetary positions
    if (data.planetaryElements) {
      data.planetaryElements.forEach((planet: any) => {
        if (transformedData["Planet Positions"]) {
          transformedData["Planet Positions"][planet.planet] = {
            sign: planet.sign,
            degree: 15 // Default degree since we don't have exact degrees in our API
          }
        }
      })
    }
    
    console.log('Local API response transformed:', {
      hasPlanetPositions: !!transformedData['Planet Positions'],
      hasAlchemyEffects: !!transformedData['Alchemy Effects'],
      planetCount: Object.keys(transformedData['Planet Positions'] || {}).length
    })
    
    return transformedData
  } catch (error) {
    console.error('Error fetching planetary positions from local API:', error)
    
    // Fallback: return a minimal response with current positions from our calculate-transits
    try {
      const { getCurrentPlanetaryPositions } = await import('../calculate-transits')
      const positions = getCurrentPlanetaryPositions()
      
      const fallbackData: AlchemizeApiResponse = {
        "Planet Positions": {},
        "Alchemy Effects": {
          "Total Spirit": 5,
          "Total Essence": 7,
          "Total Matter": 6,
          "Total Substance": 2,
        },
        "Major Arcana": [],
        "Minor Arcana": [],
        "Decan Effects": {}
      }
      
      // Convert positions to the expected format
      if (fallbackData["Planet Positions"]) {
        Object.entries(positions).forEach(([planet, pos]) => {
          fallbackData["Planet Positions"]![planet] = {
            sign: pos.sign,
            degree: parseFloat(pos.degree) || 15
          }
        })
      }
      
      console.log('Using fallback planetary positions')
      return fallbackData
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return null
    }
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