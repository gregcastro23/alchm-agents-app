import { CraftedAgent } from '@/lib/agent-types'
import { AlchemicalProfile } from './alchemical-profiles'

export interface SacredStats {
  power: number
  resonance: number
  wisdom: number
  charisma: number
  intuition: number
  adaptability: number
  vitality: number
}

/**
 * Calculates the 7 Sacred Stats from an agent's data and current cosmic conditions
 */
export function calculateSevenSacredStats(
  agent: CraftedAgent,
  alchemical: AlchemicalProfile,
  currentKinetics?: { powerAlignment: number }
): SacredStats {
  const mc = agent.consciousness.monicaConstant
  const stage = agent.personality?.evolutionStage ?? 0
  const powerAlignment = currentKinetics?.powerAlignment || 0

  // Power: Based on spirit + MC + stage + current power alignment
  const power = Math.min(100, alchemical.spirit * 10 + mc * 5 + stage * 0.5 + powerAlignment * 15)

  // Resonance: Based on essence + kinetic metrics
  const resonance = Math.min(100, alchemical.essence * 10 + (agent.stats.resonanceScore || 0) * 0.1)

  // Wisdom: Based on conversations + wisdom shared
  const wisdom = Math.min(
    100,
    (agent.stats.wisdomShared || 0) * 0.5 +
      (agent.stats.conversations || 0) * 0.2 +
      alchemical.matter * 8
  )

  // Charisma: Based on stage + essence
  const charisma = Math.min(100, stage * 0.6 + alchemical.essence * 8)

  // Intuition: Based on spirit + consciousness velocity
  const intuition = Math.min(
    100,
    alchemical.spirit * 9 + (agent.stats.kineticEvolution?.consciousnessVelocity || 0) * 30
  )

  // Adaptability: Based on substance + evolution trajectory
  const adaptability = Math.min(100, alchemical.substance * 12 + mc * 3)

  // Vitality: Based on matter + interaction momentum
  const vitality = Math.min(
    100,
    alchemical.matter * 9 + (agent.stats.kineticEvolution?.interactionMomentum || 0) * 40
  )

  return {
    power: Math.round(power),
    resonance: Math.round(resonance),
    wisdom: Math.round(wisdom),
    charisma: Math.round(charisma),
    intuition: Math.round(intuition),
    adaptability: Math.round(adaptability),
    vitality: Math.round(vitality),
  }
}
