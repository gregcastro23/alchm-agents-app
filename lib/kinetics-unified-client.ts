/**
 * Unified Kinetics Client
 * -----------------------
 * Feature-flagged client that prefers backend enhanced APIs and gracefully
 * falls back to existing frontend-compatible client logic.
 */

import { AlchemicalKineticsClient, type KineticsGetParams } from '@/lib/kinetics-client'

export interface EnhancedKineticsParams {
  readonly location: { readonly lat: number; readonly lon: number }
  readonly options?: {
    readonly includeAgentOptimization?: boolean
    readonly includePowerPrediction?: boolean
    readonly includeResonanceMap?: boolean
    readonly agentIds?: readonly string[]
  }
}

export interface BackendKineticsResponse<T = any> {
  readonly success: boolean
  readonly data: T
  readonly computeTimeMs: number
  readonly cacheHit?: boolean
}

export class BackendKineticsClient {
  static async getEnhanced(params: EnhancedKineticsParams): Promise<BackendKineticsResponse> {
    const res = await fetch('/api/alchm-kinetics/enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) throw new Error(`Enhanced kinetics failed: ${res.status}`)
    return res.json()
  }

  static async getGroupDynamics(body: {
    agentIds: string[]
    location: { lat: number; lon: number }
  }): Promise<BackendKineticsResponse> {
    const res = await fetch('/api/kinetics/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Group dynamics failed: ${res.status}`)
    return res.json()
  }

  static async getTokenMetrics(body: {
    baseTokenRate: number
    baseNFTRarity: number
    location: { lat: number; lon: number }
  }): Promise<BackendKineticsResponse> {
    const res = await fetch('/api/kinetics/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Token kinetics failed: ${res.status}`)
    return res.json()
  }
}

export class UnifiedKineticsClient {
  private static useBackend =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_KINETICS_BACKEND === 'true'

  static async getKinetics(params: KineticsGetParams): Promise<any> {
    try {
      if (this.useBackend) {
        // Map GET params to enhanced call as base-only
        const resp = await BackendKineticsClient.getEnhanced({
          location: { lat: params.lat, lon: params.lon },
          options: {
            includeAgentOptimization: false,
            includePowerPrediction: false,
            includeResonanceMap: false,
          },
        })
        return resp.data.base
      }
      return await AlchemicalKineticsClient.get(params)
    } catch (error) {
      // Fallback to existing client
      return await AlchemicalKineticsClient.get(params)
    }
  }

  static async getEnhanced(params: EnhancedKineticsParams): Promise<BackendKineticsResponse> {
    if (!this.useBackend) {
      // Shim using base endpoint + client-side projections when backend is disabled
      const today = new Date().toISOString().slice(0, 10)
      const base = await AlchemicalKineticsClient.get({
        lat: params.location.lat,
        lon: params.location.lon,
        date: today,
        includeElemental: true,
        includePlanetary: true,
        window: 3,
      })
      return { success: true, data: { base }, computeTimeMs: 0 }
    }
    return BackendKineticsClient.getEnhanced(params)
  }

  static async getGroupDynamics(body: {
    agentIds: string[]
    location: { lat: number; lon: number }
  }): Promise<BackendKineticsResponse> {
    if (!this.useBackend) {
      // Minimal shim response
      return {
        success: true,
        data: { harmony: 0.7, powerAmplification: 1.0, momentumFlow: 'sustained', resonances: {} },
        computeTimeMs: 0,
      }
    }
    return BackendKineticsClient.getGroupDynamics(body)
  }

  static async getTokenMetrics(body: {
    baseTokenRate: number
    baseNFTRarity: number
    location: { lat: number; lon: number }
  }): Promise<BackendKineticsResponse> {
    if (!this.useBackend) {
      // Minimal shim response
      return {
        success: true,
        data: {
          currentRate: body.baseTokenRate,
          baseRate: body.baseTokenRate,
          kineticMultiplier: 1,
          velocityIndicator: 'stable',
          momentumPhase: 'sustained',
          powerLevel: 0.5,
          nextOptimalWindow: null,
          accumulationForecast: 'Stable',
          solarAmplification: 1.0,
          seasonalModifier: 1.0,
        },
        computeTimeMs: 0,
      }
    }
    return BackendKineticsClient.getTokenMetrics(body)
  }
}

export default UnifiedKineticsClient
