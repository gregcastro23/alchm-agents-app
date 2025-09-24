import { describe, it, expect } from 'vitest'
import {
  computeForce,
  getPlanetaryForceModifier,
  type ForceVector,
  type ElementVector
} from '../lib/alchemical-kinetics'

describe('Force Kinetics', () => {
  describe('getPlanetaryForceModifier', () => {
    it('should return 1.2 for Mars (amplifying force)', () => {
      expect(getPlanetaryForceModifier('Mars')).toBe(1.2)
    })

    it('should return 0.9 for Saturn (dampening force)', () => {
      expect(getPlanetaryForceModifier('Saturn')).toBe(0.9)
    })

    it('should return 1.0 for other planets', () => {
      expect(getPlanetaryForceModifier('Sun')).toBe(1.0)
      expect(getPlanetaryForceModifier('Moon')).toBe(1.0)
      expect(getPlanetaryForceModifier('Venus')).toBe(1.0)
    })
  })

  describe('computeForce', () => {
    const sampleMomentum = [
      {
        t: new Date('2024-01-01T12:00:00Z'),
        p: { Fire: 2.0, Water: 1.5, Air: 1.0, Earth: 0.5 } as ElementVector,
        inertia: 2.0,
        planetaryHour: 'Mars' as const,
      },
      {
        t: new Date('2024-01-01T13:00:00Z'),
        p: { Fire: 2.5, Water: 1.8, Air: 1.2, Earth: 0.7 } as ElementVector,
        inertia: 2.1,
        planetaryHour: 'Mars' as const,
      },
    ]

    const sampleVelocity = [
      {
        t: new Date('2024-01-01T12:00:00Z'),
        v: { Fire: 1.0, Water: 0.75, Air: 0.5, Earth: 0.25 } as ElementVector,
        planetaryHour: 'Mars' as const,
      },
      {
        t: new Date('2024-01-01T13:00:00Z'),
        v: { Fire: 1.25, Water: 0.9, Air: 0.6, Earth: 0.35 } as ElementVector,
        planetaryHour: 'Mars' as const,
      },
    ]

    it('should compute force as dp/dt with planetary modifiers', () => {
      const result = computeForce(sampleMomentum, sampleVelocity)

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('f')
      expect(result[0]).toHaveProperty('magnitude')
      expect(result[0]).toHaveProperty('forceType')

      // Force should be amplified by Mars modifier (1.2)
      // dp/dt for Fire: (2.5-2.0)/1 = 0.5 (since dt is in hours, not milliseconds)
      // Multiplied by 1.2 = 0.6
      expect(result[1].f.Fire).toBeCloseTo(0.5 * 1.2, 5)
    })

    it('should calculate correct magnitude', () => {
      const result = computeForce(sampleMomentum, sampleVelocity)
      const force = result[1].f

      const expectedMagnitude = Math.sqrt(
        force.Fire ** 2 + force.Water ** 2 + force.Air ** 2 + force.Earth ** 2
      )

      expect(result[1].magnitude).toBeCloseTo(expectedMagnitude, 10)
    })

    it('should determine force type based on magnitude', () => {
      const result = computeForce(sampleMomentum, sampleVelocity)

      // With Mars amplification, should be accelerating
      expect(result[1].forceType).toBe('accelerating')
    })

    it('should handle zero time intervals gracefully', () => {
      const zeroDtMomentum = [
        {
          t: new Date('2024-01-01T12:00:00Z'),
          p: { Fire: 1.0, Water: 1.0, Air: 1.0, Earth: 1.0 } as ElementVector,
          inertia: 1.0,
          planetaryHour: 'Sun' as const,
        },
        {
          t: new Date('2024-01-01T12:00:00Z'), // Same time
          p: { Fire: 2.0, Water: 2.0, Air: 2.0, Earth: 2.0 } as ElementVector,
          inertia: 1.0,
          planetaryHour: 'Sun' as const,
        },
      ]

      const result = computeForce(zeroDtMomentum, sampleVelocity.slice(0, 2))
      expect(result[1].f.Fire).toBe(0)
      expect(result[1].magnitude).toBe(0)
    })

    it('should return empty array for insufficient data', () => {
      expect(computeForce([], [])).toEqual([])
      expect(computeForce([sampleMomentum[0]], [])).toEqual([])
    })
  })
})
