/**
 * Unified Thermodynamics Client
 * -----------------------------
 * Feature-flagged client that prefers backend APIs and gracefully
 * falls back to existing frontend-compatible calculations.
 */

import { thermodynamicsService as frontendService } from '../services/thermodynamics.js'

export interface ElementalValues {
  spirit: number
  essence: number
  matter: number
  substance: number
  fire: number
  water: number
  air: number
  earth: number
}

export interface BackendThermodynamicsResponse<T = any> {
  success: boolean
  data: T
  metadata: {
    computeTime: number
    inputValues: ElementalValues
    conservationPassed: boolean
    [key: string]: any
  }
}

class BackendThermodynamicsClient {
  private static backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  static async calculateThermodynamics(elementalValues: ElementalValues): Promise<BackendThermodynamicsResponse> {
    const res = await fetch(`${this.backendUrl}/api/alchemy/thermodynamics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ elementalValues }),
    })
    if (!res.ok) throw new Error(`Thermodynamics calculation failed: ${res.status}`)
    return res.json()
  }

  static async batchCalculate(inputSets: ElementalValues[]): Promise<BackendThermodynamicsResponse> {
    const res = await fetch(`${this.backendUrl}/api/alchemy/batch-thermodynamics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputSets }),
    })
    if (!res.ok) throw new Error(`Batch thermodynamics calculation failed: ${res.status}`)
    return res.json()
  }
}

export class UnifiedThermodynamicsClient {
  private static useBackend = 
    typeof process !== 'undefined' && 
    process.env.NEXT_PUBLIC_THERMODYNAMICS_BACKEND === 'true'

  static async calculateThermodynamics(elementalValues: ElementalValues): Promise<any> {
    try {
      if (this.useBackend) {
        const resp = await BackendThermodynamicsClient.calculateThermodynamics(elementalValues)
        return resp.data
      }
      
      // Fallback to frontend calculation
      return await frontendService.analyzeThermodynamics(elementalValues)
    } catch (error) {
      console.warn('Backend thermodynamics failed, falling back to frontend:', error)
      
      // Always fallback to frontend calculation
      return await frontendService.analyzeThermodynamics(elementalValues)
    }
  }

  static async batchCalculate(inputSets: ElementalValues[]): Promise<any> {
    try {
      if (this.useBackend) {
        const resp = await BackendThermodynamicsClient.batchCalculate(inputSets)
        return resp.data
      }
      
      // Fallback to frontend batch calculation
      return await frontendService.batchAnalyze(inputSets)
    } catch (error) {
      console.warn('Backend batch thermodynamics failed, falling back to frontend:', error)
      
      // Always fallback to frontend calculation
      return await frontendService.batchAnalyze(inputSets)
    }
  }

  /**
   * Quick calculation for simple thermodynamic properties
   * Always uses frontend for speed
   */
  static calculateQuick(elementalValues: ElementalValues): any {
    return frontendService.calculateThermodynamics(elementalValues)
  }

  /**
   * Validate elemental values before calculation
   */
  static validateElementalValues(values: ElementalValues): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const requiredFields = ['spirit', 'essence', 'matter', 'substance', 'fire', 'water', 'air', 'earth']
    
    for (const field of requiredFields) {
      const value = values[field as keyof ElementalValues]
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors.push(`${field} must be a finite number`)
      }
    }
    
    // Check for all zeros
    const hasValues = Object.values(values).some(v => v !== 0)
    if (!hasValues) {
      errors.push('At least one elemental value must be non-zero')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Create elemental values from alchemical data
   */
  static fromAlchemicalData(alchmData: any): ElementalValues {
    const effects = alchmData['Alchemy Effects'] || {}
    const totalEffects = alchmData['Total Effect Value'] || {}
    
    return {
      spirit: effects['Total Spirit'] || 0,
      essence: effects['Total Essence'] || 0,
      matter: effects['Total Matter'] || 0,
      substance: effects['Total Substance'] || 0,
      fire: totalEffects['Fire'] || 0,
      water: totalEffects['Water'] || 0,
      air: totalEffects['Air'] || 0,
      earth: totalEffects['Earth'] || 0
    }
  }

  static getStatus(): {
    backendEnabled: boolean
    backendUrl: string
  } {
    return {
      backendEnabled: this.useBackend,
      backendUrl: BackendThermodynamicsClient['backendUrl']
    }
  }
}

export default UnifiedThermodynamicsClient
