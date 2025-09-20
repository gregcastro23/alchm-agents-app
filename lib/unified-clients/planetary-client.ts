/**
 * Unified Planetary Hours Client
 * -----------------------------
 * Feature-flagged client that prefers backend APIs and gracefully
 * falls back to existing frontend-compatible calculations.
 */

import { planetaryHoursService as frontendService, type Location } from '../services/planetary-hours.js'

export interface PlanetaryHourRequest {
  datetime?: Date
  location: Location
  timezone?: string
}

export interface PlanetaryForecastRequest {
  startDate: Date
  endDate: Date
  location: Location
  interval?: number
}

export interface OptimalTimesRequest {
  date: Date
  location: Location
  targetPlanet: string
}

export interface BackendPlanetaryResponse<T = any> {
  success: boolean
  data: T
  metadata: {
    computeTime: number
    [key: string]: any
  }
}

class BackendPlanetaryClient {
  private static backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  static async getCurrentHour(request: PlanetaryHourRequest): Promise<BackendPlanetaryResponse> {
    const res = await fetch(`${this.backendUrl}/api/planetary/current-hour`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error(`Planetary hour request failed: ${res.status}`)
    return res.json()
  }

  static async getForecast(request: PlanetaryForecastRequest): Promise<BackendPlanetaryResponse> {
    const res = await fetch(`${this.backendUrl}/api/planetary/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: request.startDate.toISOString(),
        endDate: request.endDate.toISOString(),
        location: request.location,
        interval: request.interval
      }),
    })
    if (!res.ok) throw new Error(`Planetary forecast failed: ${res.status}`)
    return res.json()
  }

  static async getOptimalTimes(request: OptimalTimesRequest): Promise<BackendPlanetaryResponse> {
    const res = await fetch(`${this.backendUrl}/api/planetary/optimal-times`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: request.date.toISOString(),
        location: request.location,
        targetPlanet: request.targetPlanet
      }),
    })
    if (!res.ok) throw new Error(`Optimal times request failed: ${res.status}`)
    return res.json()
  }
}

export class UnifiedPlanetaryClient {
  private static useBackend = 
    typeof process !== 'undefined' && 
    process.env.NEXT_PUBLIC_PLANETARY_HOURS_BACKEND === 'true'

  static async getCurrentPlanetaryHour(request: PlanetaryHourRequest): Promise<any> {
    try {
      if (this.useBackend) {
        const resp = await BackendPlanetaryClient.getCurrentHour(request)
        return resp.data
      }
      
      // Fallback to frontend calculation
      return await frontendService.getCurrentPlanetaryHour(
        request.datetime || new Date(),
        request.location
      )
    } catch (error) {
      console.warn('Backend planetary hours failed, falling back to frontend:', error)
      
      // Always fallback to frontend calculation
      return await frontendService.getCurrentPlanetaryHour(
        request.datetime || new Date(),
        request.location
      )
    }
  }

  static async getForecast(request: PlanetaryForecastRequest): Promise<any> {
    try {
      if (this.useBackend) {
        const resp = await BackendPlanetaryClient.getForecast(request)
        return resp.data
      }
      
      // Fallback to frontend calculation
      return await frontendService.getForecast(
        request.startDate,
        request.endDate,
        request.location,
        request.interval
      )
    } catch (error) {
      console.warn('Backend planetary forecast failed, falling back to frontend:', error)
      
      // Always fallback to frontend calculation
      return await frontendService.getForecast(
        request.startDate,
        request.endDate,
        request.location,
        request.interval
      )
    }
  }

  static async getOptimalTimes(request: OptimalTimesRequest): Promise<any> {
    try {
      if (this.useBackend) {
        const resp = await BackendPlanetaryClient.getOptimalTimes(request)
        return resp.data
      }
      
      // Fallback to frontend calculation
      return await frontendService.getOptimalTimes(
        request.date,
        request.location,
        request.targetPlanet
      )
    } catch (error) {
      console.warn('Backend optimal times failed, falling back to frontend:', error)
      
      // Always fallback to frontend calculation
      return await frontendService.getOptimalTimes(
        request.date,
        request.location,
        request.targetPlanet
      )
    }
  }

  static getStatus(): {
    backendEnabled: boolean
    backendUrl: string
  } {
    return {
      backendEnabled: this.useBackend,
      backendUrl: BackendPlanetaryClient['backendUrl']
    }
  }
}

export default UnifiedPlanetaryClient
