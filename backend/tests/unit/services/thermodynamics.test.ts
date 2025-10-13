import { thermodynamicsService } from '../../../src/services/thermodynamics.js'
import type { ElementalValues } from '../../../src/services/thermodynamics.js'

describe('ThermodynamicsService', () => {
  const validElementalValues: ElementalValues = {
    spirit: 5.0,
    essence: 4.0,
    matter: 3.0,
    substance: 2.0,
    fire: 6.0,
    water: 5.0,
    air: 4.0,
    earth: 3.0,
  }

  describe('calculateThermodynamics', () => {
    it('should calculate basic thermodynamic properties', () => {
      const result = thermodynamicsService.calculateThermodynamics(validElementalValues)

      expect(result).toHaveProperty('heat')
      expect(result).toHaveProperty('entropy')
      expect(result).toHaveProperty('reactivity')
      expect(result).toHaveProperty('gibbsEnergy')
      expect(result).toHaveProperty('metrics')
      expect(result).toHaveProperty('classification')

      expect(typeof result.heat).toBe('number')
      expect(typeof result.entropy).toBe('number')
      expect(typeof result.reactivity).toBe('number')
      expect(typeof result.gibbsEnergy).toBe('number')
      expect(Number.isFinite(result.heat)).toBe(true)
      expect(Number.isFinite(result.entropy)).toBe(true)
      expect(Number.isFinite(result.reactivity)).toBe(true)
      expect(Number.isFinite(result.gibbsEnergy)).toBe(true)
    })

    it('should calculate metrics correctly', () => {
      const result = thermodynamicsService.calculateThermodynamics(validElementalValues)

      expect(result.metrics).toHaveProperty('totalElemental')
      expect(result.metrics).toHaveProperty('alchemicalSum')
      expect(result.metrics).toHaveProperty('elementalSum')
      expect(result.metrics).toHaveProperty('stability')
      expect(result.metrics).toHaveProperty('transformation')
      expect(result.metrics).toHaveProperty('conservation')

      // Verify total calculations
      const expectedAlchemicalSum = 5.0 + 4.0 + 3.0 + 2.0 // 14
      const expectedElementalSum = 6.0 + 5.0 + 4.0 + 3.0 // 18
      const expectedTotal = expectedAlchemicalSum + expectedElementalSum // 32

      expect(result.metrics.alchemicalSum).toBe(expectedAlchemicalSum)
      expect(result.metrics.elementalSum).toBe(expectedElementalSum)
      expect(result.metrics.totalElemental).toBe(expectedTotal)

      expect(result.metrics.stability).toBeWithinRange(0, 1)
      expect(result.metrics.transformation).toBeWithinRange(0, 1)
    })

    it('should provide meaningful classifications', () => {
      const result = thermodynamicsService.calculateThermodynamics(validElementalValues)

      expect(result.classification).toHaveProperty('energyState')
      expect(result.classification).toHaveProperty('thermalCategory')
      expect(result.classification).toHaveProperty('reactivityLevel')
      expect(result.classification).toHaveProperty('stabilityIndex')

      expect(typeof result.classification.energyState).toBe('string')
      expect(typeof result.classification.thermalCategory).toBe('string')
      expect(typeof result.classification.reactivityLevel).toBe('string')
      expect(typeof result.classification.stabilityIndex).toBe('string')
    })

    it('should handle zero values gracefully', () => {
      const zeroValues: ElementalValues = {
        spirit: 0,
        essence: 0,
        matter: 0,
        substance: 0,
        fire: 0,
        water: 0,
        air: 0,
        earth: 0,
      }

      const result = thermodynamicsService.calculateThermodynamics(zeroValues)

      expect(result.heat).toBe(0)
      expect(result.entropy).toBe(0)
      expect(result.reactivity).toBe(0)
      expect(Number.isFinite(result.gibbsEnergy)).toBe(true)
    })

    it('should handle high values correctly', () => {
      const highValues: ElementalValues = {
        spirit: 100,
        essence: 100,
        matter: 100,
        substance: 100,
        fire: 100,
        water: 100,
        air: 100,
        earth: 100,
      }

      const result = thermodynamicsService.calculateThermodynamics(highValues)

      expect(Number.isFinite(result.heat)).toBe(true)
      expect(Number.isFinite(result.entropy)).toBe(true)
      expect(Number.isFinite(result.reactivity)).toBe(true)
      expect(Number.isFinite(result.gibbsEnergy)).toBe(true)
      expect(result.heat).toBeGreaterThan(0)
      expect(result.entropy).toBeGreaterThan(0)
      expect(result.reactivity).toBeGreaterThan(0)
    })
  })

  describe('analyzeThermodynamics', () => {
    it('should return analysis with additional metadata', async () => {
      const result = await thermodynamicsService.analyzeThermodynamics(validElementalValues)

      expect(result).toHaveProperty('computeTime')
      expect(result).toHaveProperty('inputHash')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('conservationCheck')

      expect(typeof result.computeTime).toBe('number')
      expect(typeof result.inputHash).toBe('string')
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(result.computeTime).toBeGreaterThanOrEqual(0)
    })

    it('should perform conservation checks', async () => {
      const result = await thermodynamicsService.analyzeThermodynamics(validElementalValues)

      expect(result.conservationCheck).toHaveProperty('passed')
      expect(result.conservationCheck).toHaveProperty('totalInput')
      expect(result.conservationCheck).toHaveProperty('totalOutput')
      expect(result.conservationCheck).toHaveProperty('variance')

      expect(typeof result.conservationCheck.passed).toBe('boolean')
      expect(result.conservationCheck.totalInput).toBeGreaterThan(0)
      expect(result.conservationCheck.totalOutput).toBeGreaterThan(0)
      expect(result.conservationCheck.variance).toBeGreaterThanOrEqual(0)
    })

    it('should cache results for identical inputs', async () => {
      const result1 = await thermodynamicsService.analyzeThermodynamics(validElementalValues)
      const result2 = await thermodynamicsService.analyzeThermodynamics(validElementalValues)

      expect(result1.inputHash).toBe(result2.inputHash)
      expect(result1.heat).toBe(result2.heat)
      expect(result1.entropy).toBe(result2.entropy)
      expect(result1.reactivity).toBe(result2.reactivity)
    })
  })

  describe('batchAnalyze', () => {
    it('should process multiple input sets', async () => {
      const inputSets = [
        validElementalValues,
        { ...validElementalValues, spirit: 10 },
        { ...validElementalValues, fire: 10 },
      ]

      const results = await thermodynamicsService.batchAnalyze(inputSets)

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(3)

      results.forEach(result => {
        expect(result).toHaveProperty('heat')
        expect(result).toHaveProperty('entropy')
        expect(result).toHaveProperty('reactivity')
        expect(result).toHaveProperty('conservationCheck')
      })
    })

    it('should handle empty input array', async () => {
      const results = await thermodynamicsService.batchAnalyze([])

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })
  })

  describe('Edge cases and validation', () => {
    it('should handle negative values', () => {
      const negativeValues: ElementalValues = {
        spirit: -5,
        essence: 4,
        matter: 3,
        substance: 2,
        fire: 6,
        water: 5,
        air: 4,
        earth: 3,
      }

      // Should not throw, but might log warnings
      expect(() => {
        thermodynamicsService.calculateThermodynamics(negativeValues)
      }).not.toThrow()
    })

    it('should throw for invalid inputs', () => {
      const invalidValues = {
        spirit: NaN,
        essence: 4,
        matter: 3,
        substance: 2,
        fire: 6,
        water: 5,
        air: 4,
        earth: 3,
      } as ElementalValues

      expect(() => {
        thermodynamicsService.calculateThermodynamics(invalidValues)
      }).toThrow()
    })

    it('should throw for missing properties', () => {
      const incompleteValues = {
        spirit: 5,
        essence: 4,
        matter: 3,
        // Missing other properties
      } as ElementalValues

      expect(() => {
        thermodynamicsService.calculateThermodynamics(incompleteValues)
      }).toThrow()
    })

    it('should handle extreme values', () => {
      const extremeValues: ElementalValues = {
        spirit: 1e10,
        essence: 1e-10,
        matter: 0,
        substance: Infinity,
        fire: -Infinity,
        water: 1e100,
        air: 1e-100,
        earth: Number.MAX_VALUE,
      }

      // Should handle gracefully or throw meaningful error
      expect(() => {
        thermodynamicsService.calculateThermodynamics(extremeValues)
      }).toThrow()
    })
  })

  describe('Mathematical properties', () => {
    it('should maintain energy conservation principles', () => {
      const result = thermodynamicsService.calculateThermodynamics(validElementalValues)

      // Gibbs energy should be heat - (reactivity * entropy)
      const expectedGibbsEnergy = result.heat - result.reactivity * result.entropy
      expect(result.gibbsEnergy).toBeCloseTo(expectedGibbsEnergy, 10)
    })

    it('should show sensitivity to input changes', () => {
      const baseResult = thermodynamicsService.calculateThermodynamics(validElementalValues)

      const modifiedValues = { ...validElementalValues, spirit: validElementalValues.spirit * 2 }
      const modifiedResult = thermodynamicsService.calculateThermodynamics(modifiedValues)

      // Results should be different when inputs change
      expect(baseResult.heat).not.toBe(modifiedResult.heat)
      expect(baseResult.entropy).not.toBe(modifiedResult.entropy)
      expect(baseResult.reactivity).not.toBe(modifiedResult.reactivity)
    })

    it('should produce consistent results for same inputs', () => {
      const result1 = thermodynamicsService.calculateThermodynamics(validElementalValues)
      const result2 = thermodynamicsService.calculateThermodynamics(validElementalValues)

      expect(result1.heat).toBe(result2.heat)
      expect(result1.entropy).toBe(result2.entropy)
      expect(result1.reactivity).toBe(result2.reactivity)
      expect(result1.gibbsEnergy).toBe(result2.gibbsEnergy)
    })
  })
})
