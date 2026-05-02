const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://whattoeatnext-production.up.railway.app'
const API_SECRET = process.env.INTERNAL_API_SECRET || '882133EA-3D06-4DF2-A63C-F4114AB4EFBC'

export interface LegacyPlanetaryPosition {
  name: string
  sign: string
  degree: number
  minute: number
  longitude: number
  isRetrograde: boolean
  retrogradeSymbol: string
  longitudeSpeed: number
  arcminutesPerDay: number
  speedDisplay: string
}

export interface PlanetaryPositionsRequest {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  latitude: number
  longitude: number
  zodiacSystem?: string
  recipe?: any
  kinetic_rating?: number
  planetary_hour_ruler?: string
  thermo_rating?: number
}

export class PlanetaryAPIClient {
  private baseUrl: string

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'INTERNAL_API_SECRET': API_SECRET
    }
  }

  /**
   * Helper to format a Date and location into the payload
   */
  private buildPayload(date: Date, latitude?: number, longitude?: number): PlanetaryPositionsRequest {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      latitude: latitude || 40.7128,
      longitude: longitude || -74.0060,
      zodiacSystem: 'tropical',
      recipe: {},
      kinetic_rating: 0,
      planetary_hour_ruler: 'Sun',
      thermo_rating: 0,
    }
  }

  /**
   * Get planetary positions. Replaces all legacy planetary calculation functions.
   */
  async getPlanetaryPositions(
    date: Date,
    latitude?: number,
    longitude?: number
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/planetary/positions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildPayload(date, latitude, longitude)),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch planetary positions: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[PlanetaryAPIClient] getPlanetaryPositions error:', error)
      throw error
    }
  }

  /**
   * Elemental Constitution (SEMS)
   */
  async getAlchemicalQuantities(
    date: Date,
    latitude?: number,
    longitude?: number
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alchemical/quantities`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildPayload(date, latitude, longitude)),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch alchemical quantities: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[PlanetaryAPIClient] getAlchemicalQuantities error:', error)
      throw error
    }
  }

  /**
   * Transit & Ritual Generation
   */
  async generateCookingInstruction(
    date: Date,
    latitude?: number,
    longitude?: number
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rituals/generate-cooking-instruction`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildPayload(date, latitude, longitude)),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate cooking instruction: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[PlanetaryAPIClient] generateCookingInstruction error:', error)
      throw error
    }
  }

  /**
   * Natal/Onboarding Calculations
   */
  async getUserOnboarding(
    date: Date,
    latitude?: number,
    longitude?: number
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/onboarding`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildPayload(date, latitude, longitude)),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user onboarding: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[PlanetaryAPIClient] getUserOnboarding error:', error)
      throw error
    }
  }

  /**
   * Returns alchemical quantities mapped to the legacy shape consumers expected
   * from generateAlchmForCurrentMoment(). The Railway backend only emits the four
   * core scores plus kinetic_val/thermo_val — older fields (Energy, Heat, Entropy,
   * A-Number) are derived locally so legacy UI keeps working.
   */
  async getAlchemicalQuantitiesLegacy(
    date: Date = new Date(),
    latitude?: number,
    longitude?: number
  ): Promise<any> {
    const raw = await this.getAlchemicalQuantities(date, latitude, longitude)
    const spirit = Number(raw?.spirit_score ?? 0)
    const essence = Number(raw?.essence_score ?? 0)
    const matter = Number(raw?.matter_score ?? 0)
    const substance = Number(raw?.substance_score ?? 0)
    const kineticVal = Number(raw?.kinetic_val ?? 0)
    const thermoVal = Number(raw?.thermo_val ?? 0)
    const aNumber = matter + substance > 0 ? (spirit + essence) / (matter + substance) : 2
    return {
      'Alchemy Effects': {
        'Total Spirit': spirit,
        'Total Essence': essence,
        'Total Matter': matter,
        'Total Substance': substance,
      },
      'A-Number': aNumber,
      A_number: aNumber,
      Energy: thermoVal * 1000,
      Heat: thermoVal,
      Entropy: kineticVal,
      Reactivity: kineticVal,
      spirit_score: spirit,
      essence_score: essence,
      matter_score: matter,
      substance_score: substance,
      kinetic_val: kineticVal,
      thermo_val: thermoVal,
    }
  }

  /**
   * Bulk planetary positions over a date range. Replaces local sweep/sampler logic.
   */
  async getPlanetaryPositionsBulk(
    startDate: Date,
    endDate: Date,
    intervalHours: number,
    latitude?: number,
    longitude?: number
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/planetary/positions/bulk`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          interval_hours: intervalHours,
          latitude: latitude || 40.7128,
          longitude: longitude || -74.006,
          zodiacSystem: 'tropical',
        }),
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch bulk planetary positions: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('[PlanetaryAPIClient] getPlanetaryPositionsBulk error:', error)
      throw error
    }
  }

  /**
   * Returns positions in the legacy array shape consumers expected from getCurrentPlanetaryPositions().
   * Adapter over getPlanetaryPositions(). Use this for any consumer migrating from the old calc files.
   */
  async getPlanetaryPositionsLegacy(
    date: Date = new Date(),
    latitude?: number,
    longitude?: number
  ): Promise<LegacyPlanetaryPosition[]> {
    const raw = await this.getPlanetaryPositions(date, latitude, longitude)
    const positions = raw?.planetary_positions || {}
    return Object.entries(positions).map(([name, body]: [string, any]) => ({
      name,
      sign: body?.sign ?? '',
      degree: typeof body?.degree === 'number' ? body.degree : 0,
      minute: typeof body?.minute === 'number' ? body.minute : 0,
      longitude: typeof body?.exactLongitude === 'number' ? body.exactLongitude : 0,
      isRetrograde: Boolean(body?.isRetrograde),
      retrogradeSymbol: body?.retrogradeSymbol ?? '',
      longitudeSpeed: typeof body?.longitudeSpeed === 'number' ? body.longitudeSpeed : 0,
      arcminutesPerDay: typeof body?.arcminutesPerDay === 'number' ? body.arcminutesPerDay : 0,
      speedDisplay: body?.speedDisplay ?? '',
    }))
  }

  /**
   * Health check for backend connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      return response.ok
    } catch (error) {
      console.error('[PlanetaryAPIClient] Health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const planetaryAPI = new PlanetaryAPIClient()
