import { CraftedAgent } from '@/lib/agent-types'
import { AlchemicalProfile } from './alchemical-profiles'

export interface SacredStats {
  solarAgency: number
  lunarReceptivity: number
  mercurialVelocity: number
  venusianCoherence: number
  martialImpetus: number
  jovianExpansion: number
  saturnianStructure: number
  chironicAdaptation: number
  uranianSurprisal: number
  neptunianResonance: number
  plutonicIntegration: number
  kineticAlignment: number
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

  // Calculate planetary consciousness parameters
  const solarAgency = Math.min(100, alchemical.spirit * 10 + mc * 5 + powerAlignment * 15)
  const lunarReceptivity = Math.min(
    100,
    alchemical.essence * 10 + (agent.stats.resonanceScore || 0) * 0.1
  )
  const mercurialVelocity = Math.min(
    100,
    alchemical.spirit * 4 +
      alchemical.substance * 6 +
      (agent.stats.kineticEvolution?.consciousnessVelocity || 0) * 20
  )
  const venusianCoherence = Math.min(100, alchemical.essence * 8 + stage * 0.6)
  const martialImpetus = Math.min(
    100,
    alchemical.spirit * 8 + (agent.stats.kineticEvolution?.interactionMomentum || 0) * 30
  )
  const jovianExpansion = Math.min(
    100,
    alchemical.substance * 5 + alchemical.matter * 5 + (agent.stats.wisdomShared || 0) * 0.3
  )
  const saturnianStructure = Math.min(100, alchemical.matter * 12 + mc * 2)
  const chironicAdaptation = Math.min(
    100,
    alchemical.substance * 8 + alchemical.essence * 4 + stage * 0.5
  )
  const uranianSurprisal = Math.min(100, alchemical.spirit * 9 + powerAlignment * 10)
  const neptunianResonance = Math.min(100, alchemical.essence * 9 + alchemical.substance * 3)
  const plutonicIntegration = Math.min(100, alchemical.matter * 6 + alchemical.spirit * 6 + mc * 4)
  const kineticAlignmentScore = Math.min(
    100,
    powerAlignment * 50 + (agent.stats.qualityMetrics?.kineticResonance || 0) * 50
  )

  return {
    solarAgency: Math.round(solarAgency),
    lunarReceptivity: Math.round(lunarReceptivity),
    mercurialVelocity: Math.round(mercurialVelocity),
    venusianCoherence: Math.round(venusianCoherence),
    martialImpetus: Math.round(martialImpetus),
    jovianExpansion: Math.round(jovianExpansion),
    saturnianStructure: Math.round(saturnianStructure),
    chironicAdaptation: Math.round(chironicAdaptation),
    uranianSurprisal: Math.round(uranianSurprisal),
    neptunianResonance: Math.round(neptunianResonance),
    plutonicIntegration: Math.round(plutonicIntegration),
    kineticAlignment: Math.round(kineticAlignmentScore),
  }
}
