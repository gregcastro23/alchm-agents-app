import { logger } from '../utils/logger.js'
import { cacheService } from './cache.js'

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

export interface ThermodynamicResult {
  heat: number
  entropy: number
  reactivity: number
  gibbsEnergy: number
  metrics: {
    totalElemental: number
    alchemicalSum: number
    elementalSum: number
    stability: number
    transformation: number
    conservation: number
  }
  classification: {
    energyState: string
    thermalCategory: string
    reactivityLevel: string
    stabilityIndex: string
  }
}

export interface ThermodynamicAnalysis extends ThermodynamicResult {
  computeTime: number
  inputHash: string
  timestamp: Date
  conservationCheck: {
    passed: boolean
    totalInput: number
    totalOutput: number
    variance: number
  }
}

class ThermodynamicsService {
  
  /**
   * Core thermodynamic calculations following alchemical principles
   */
  calculateThermodynamics(values: ElementalValues): ThermodynamicResult {
    // Validate inputs
    this.validateInputs(values)
    
    const { spirit, essence, matter, substance, fire, water, air, earth } = values
    
    // Calculate totals for conservation checks
    const alchemicalSum = spirit + essence + matter + substance
    const elementalSum = fire + water + air + earth
    const totalElemental = alchemicalSum + elementalSum
    
    // Core thermodynamic formulas based on alchemical principles
    // Heat = (Spirit² + Fire²) / (Substance + Essence + Matter + Water + Air + Earth)²
    const denominator = substance + essence + matter + water + air + earth
    const heat = denominator > 0 ? (Math.pow(spirit, 2) + Math.pow(fire, 2)) / Math.pow(denominator, 2) : 0
    
    // Entropy = (Spirit² + Substance² + Fire² + Air²) / (Essence + Matter + Earth + Water)²
    const entropyDenominator = essence + matter + earth + water
    const entropy = entropyDenominator > 0 ? 
      (Math.pow(spirit, 2) + Math.pow(substance, 2) + Math.pow(fire, 2) + Math.pow(air, 2)) / Math.pow(entropyDenominator, 2) : 0
    
    // Reactivity = (Spirit² + Substance² + Essence² + Fire² + Air² + Water²) / (Matter + Earth)²
    const reactivityDenominator = matter + earth
    const reactivity = reactivityDenominator > 0 ? 
      (Math.pow(spirit, 2) + Math.pow(substance, 2) + Math.pow(essence, 2) + Math.pow(fire, 2) + Math.pow(air, 2) + Math.pow(water, 2)) / Math.pow(reactivityDenominator, 2) : 0
    
    // Gibbs Free Energy approximation: Energy = Heat - (Reactivity * Entropy)
    const gibbsEnergy = heat - (reactivity * entropy)
    
    // Additional metrics
    const stability = this.calculateStability(values)
    const transformation = this.calculateTransformationPotential(values)
    const conservation = this.calculateConservation(values)
    
    // Classifications
    const energyState = this.classifyEnergyState(gibbsEnergy)
    const thermalCategory = this.classifyThermalState(heat)
    const reactivityLevel = this.classifyReactivity(reactivity)
    const stabilityIndex = this.classifyStability(stability)
    
    return {
      heat,
      entropy,
      reactivity,
      gibbsEnergy,
      metrics: {
        totalElemental,
        alchemicalSum,
        elementalSum,
        stability,
        transformation,
        conservation
      },
      classification: {
        energyState,
        thermalCategory,
        reactivityLevel,
        stabilityIndex
      }
    }
  }
  
  /**
   * Calculate thermodynamics with caching and analysis
   */
  async analyzeThermodynamics(values: ElementalValues): Promise<ThermodynamicAnalysis> {
    const startTime = Date.now()
    const inputHash = this.hashInputs(values)
    const cacheKey = `thermodynamics:${inputHash}`
    
    try {
      const cached = await cacheService.get(cacheKey)
      if (cached) {
        logger.debug('Returning cached thermodynamics result')
        return cached as ThermodynamicAnalysis
      }
    } catch (error) {
      logger.warn('Cache check failed for thermodynamics:', error)
    }
    
    // Perform calculations
    const result = this.calculateThermodynamics(values)
    const computeTime = Date.now() - startTime
    
    // Conservation check
    const conservationCheck = this.performConservationCheck(values, result)
    
    const analysis: ThermodynamicAnalysis = {
      ...result,
      computeTime,
      inputHash,
      timestamp: new Date(),
      conservationCheck
    }
    
    // Cache results for 24 hours (thermodynamics are deterministic)
    try {
      await cacheService.set(cacheKey, analysis, 86400)
    } catch (error) {
      logger.warn('Failed to cache thermodynamics result:', error)
    }
    
    return analysis
  }
  
  /**
   * Batch calculate thermodynamics for multiple input sets
   */
  async batchAnalyze(inputSets: ElementalValues[]): Promise<ThermodynamicAnalysis[]> {
    const promises = inputSets.map(values => this.analyzeThermodynamics(values))
    return Promise.all(promises)
  }
  
  /**
   * Calculate stability index
   */
  private calculateStability(values: ElementalValues): number {
    const { spirit, essence, matter, substance, fire, water, air, earth } = values
    
    // Stability based on balance between opposing forces
    const spiritualBalance = Math.abs(spirit - matter) / Math.max(spirit + matter, 1)
    const essentialBalance = Math.abs(essence - substance) / Math.max(essence + substance, 1)
    const elementalBalance = Math.abs((fire + air) - (water + earth)) / Math.max(fire + air + water + earth, 1)
    
    return 1 - (spiritualBalance + essentialBalance + elementalBalance) / 3
  }
  
  /**
   * Calculate transformation potential
   */
  private calculateTransformationPotential(values: ElementalValues): number {
    const { spirit, essence, matter, substance, fire, water, air, earth } = values
    
    // High transformation potential when active elements dominate
    const activeElements = spirit + fire + air
    const passiveElements = essence + matter + substance + water + earth
    const total = activeElements + passiveElements
    
    return total > 0 ? activeElements / total : 0
  }
  
  /**
   * Calculate conservation metric
   */
  private calculateConservation(values: ElementalValues): number {
    const total = Object.values(values).reduce((sum, val) => sum + Math.abs(val), 0)
    
    // Perfect conservation would be 1.0
    // Lower values indicate loss, higher values indicate gain
    const expectedTotal = 8 * 5 // Assuming baseline of 5 per element
    return total / expectedTotal
  }
  
  /**
   * Classify energy state
   */
  private classifyEnergyState(energy: number): string {
    if (energy > 0.1) return 'High Energy - Transformative'
    if (energy > 0.01) return 'Moderate Energy - Active'
    if (energy > -0.01) return 'Balanced Energy - Stable'
    if (energy > -0.1) return 'Low Energy - Passive'
    return 'Very Low Energy - Inert'
  }
  
  /**
   * Classify thermal state
   */
  private classifyThermalState(heat: number): string {
    if (heat > 0.5) return 'Highly Exothermic'
    if (heat > 0.1) return 'Exothermic'
    if (heat > 0.01) return 'Mildly Exothermic'
    if (heat > -0.01) return 'Thermal Equilibrium'
    return 'Endothermic'
  }
  
  /**
   * Classify reactivity level
   */
  private classifyReactivity(reactivity: number): string {
    if (reactivity > 2.0) return 'Extremely Reactive'
    if (reactivity > 1.0) return 'Highly Reactive'
    if (reactivity > 0.5) return 'Moderately Reactive'
    if (reactivity > 0.1) return 'Mildly Reactive'
    return 'Stable'
  }
  
  /**
   * Classify stability
   */
  private classifyStability(stability: number): string {
    if (stability > 0.9) return 'Highly Stable'
    if (stability > 0.7) return 'Stable'
    if (stability > 0.5) return 'Moderately Stable'
    if (stability > 0.3) return 'Unstable'
    return 'Highly Unstable'
  }
  
  /**
   * Validate inputs
   */
  private validateInputs(values: ElementalValues): void {
    const requiredFields = ['spirit', 'essence', 'matter', 'substance', 'fire', 'water', 'air', 'earth']
    
    for (const field of requiredFields) {
      const value = values[field as keyof ElementalValues]
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Invalid ${field} value: must be a finite number`)
      }
    }
    
    // Check for negative values (may be allowed in some contexts)
    const hasNegative = Object.values(values).some(v => v < 0)
    if (hasNegative) {
      logger.warn('Negative elemental values detected - may indicate unusual conditions')
    }
  }
  
  /**
   * Create hash of inputs for caching
   */
  private hashInputs(values: ElementalValues): string {
    const normalized = Object.keys(values)
      .sort()
      .map(key => `${key}:${values[key as keyof ElementalValues].toFixed(6)}`)
      .join('|')
    
    return Buffer.from(normalized).toString('base64')
  }
  
  /**
   * Perform conservation check
   */
  private performConservationCheck(input: ElementalValues, result: ThermodynamicResult): {
    passed: boolean
    totalInput: number
    totalOutput: number
    variance: number
  } {
    const totalInput = Object.values(input).reduce((sum, val) => sum + Math.abs(val), 0)
    const totalOutput = result.metrics.totalElemental
    const variance = Math.abs(totalInput - totalOutput) / Math.max(totalInput, 1)
    
    // Allow 5% variance for floating point precision
    const passed = variance < 0.05
    
    if (!passed) {
      logger.warn('Conservation check failed:', { totalInput, totalOutput, variance })
    }
    
    return { passed, totalInput, totalOutput, variance }
  }
}

// Singleton instance
export const thermodynamicsService = new ThermodynamicsService()
export default thermodynamicsService
