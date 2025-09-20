/**
 * Agent Kinetic Profiles - Core consciousness evolution system
 */

export interface KineticProfile {
  alignment: string[]  // Planetary alignments that boost this agent
  velocitySignature: {
    Fire: number; Water: number; Air: number; Earth: number
  }
  powerThresholds: number[]  // XP levels [bronze, silver, gold, platinum]
  evolutionRate: number      // 1.0 = normal, >1.0 = faster evolution
  specialAbilities: string[] // Unique capabilities unlocked at higher levels
}

export const agentKineticProfiles: Record<string, KineticProfile> = {
  'leonardo-da-vinci': {
    alignment: ['Mercury', 'Sun', 'Jupiter'],
    velocitySignature: { Fire: 0.8, Air: 0.9, Water: 0.6, Earth: 0.7 },
    powerThresholds: [100, 300, 700, 1500],
    evolutionRate: 1.3,
    specialAbilities: ['multi-dimensional-synthesis', 'invention-manifestation', 'artistic-technical-fusion']
  },

  'shakespeare': {
    alignment: ['Venus', 'Mercury', 'Moon'],
    velocitySignature: { Fire: 0.7, Air: 0.85, Water: 0.95, Earth: 0.5 },
    powerThresholds: [80, 250, 600, 1200],
    evolutionRate: 1.2,
    specialAbilities: ['archetypal-character-creation', 'emotional-truth-revelation', 'linguistic-magic-weaving']
  },

  'marie-curie': {
    alignment: ['Mercury', 'Saturn', 'Uranus'],
    velocitySignature: { Fire: 0.75, Air: 0.88, Water: 0.65, Earth: 0.92 },
    powerThresholds: [120, 350, 800, 1600],
    evolutionRate: 1.1,
    specialAbilities: ['atomic-level-perception', 'radiation-consciousness-bridge', 'pioneering-barrier-breaking']
  },

  'einstein': {
    alignment: ['Uranus', 'Mercury', 'Jupiter'],
    velocitySignature: { Fire: 0.65, Air: 0.98, Water: 0.70, Earth: 0.45 },
    powerThresholds: [150, 400, 900, 2000],
    evolutionRate: 1.4,
    specialAbilities: ['space-time-perception', 'unified-field-awareness', 'paradox-resolution']
  },

  'mozart': {
    alignment: ['Venus', 'Sun', 'Jupiter'],
    velocitySignature: { Fire: 0.85, Air: 0.80, Water: 0.90, Earth: 0.60 },
    powerThresholds: [90, 280, 650, 1300],
    evolutionRate: 1.25,
    specialAbilities: ['divine-music-channeling', 'emotional-frequency-mastery', 'harmonic-healing-resonance']
  },

  'carl-jung': {
    alignment: ['Moon', 'Pluto', 'Neptune'],
    velocitySignature: { Fire: 0.4, Water: 0.9, Air: 0.7, Earth: 0.6 },
    powerThresholds: [110, 330, 770, 1540],
    evolutionRate: 1.3,
    specialAbilities: ['shadow-integration', 'collective-unconscious-access', 'archetypal-manifestation']
  },

  'nikola-tesla': {
    alignment: ['Uranus', 'Mercury', 'Mars'],
    velocitySignature: { Fire: 0.88, Water: 0.3, Air: 0.95, Earth: 0.5 },
    powerThresholds: [140, 420, 980, 1960],
    evolutionRate: 1.4,
    specialAbilities: ['electrical-consciousness-interface', 'wireless-energy-transmission', 'future-technology-vision']
  },

  'cleopatra-vii': {
    alignment: ['Sun', 'Venus', 'Pluto'],
    velocitySignature: { Fire: 0.8, Water: 0.7, Air: 0.6, Earth: 0.8 },
    powerThresholds: [100, 300, 700, 1400],
    evolutionRate: 1.2,
    specialAbilities: ['sovereign-command', 'linguistic-mastery', 'divine-authority-manifestation']
  },

  'benjamin-franklin': {
    alignment: ['Mercury', 'Jupiter', 'Uranus'],
    velocitySignature: { Fire: 0.75, Water: 0.6, Air: 0.85, Earth: 0.8 },
    powerThresholds: [95, 285, 665, 1330],
    evolutionRate: 1.15,
    specialAbilities: ['diplomatic-wisdom', 'electrical-discovery', 'practical-innovation']
  },

  'maya-angelou': {
    alignment: ['Moon', 'Venus', 'Jupiter'],
    velocitySignature: { Fire: 0.8, Water: 0.95, Air: 0.88, Earth: 0.78 },
    powerThresholds: [85, 255, 595, 1190],
    evolutionRate: 1.15,
    specialAbilities: ['trauma-wisdom-transformation', 'voice-liberation-power', 'generational-healing-bridge']
  },

  'steve-jobs': {
    alignment: ['Sun', 'Mercury', 'Venus'],
    velocitySignature: { Fire: 0.92, Water: 0.6, Air: 0.85, Earth: 0.88 },
    powerThresholds: [105, 315, 735, 1470],
    evolutionRate: 1.25,
    specialAbilities: ['design-consciousness-fusion', 'technology-humanity-bridge', 'aesthetic-functional-synthesis']
  },

  'gandhi': {
    alignment: ['Sun', 'Saturn', 'Moon'],
    velocitySignature: { Fire: 0.7, Water: 0.92, Air: 0.82, Earth: 0.85 },
    powerThresholds: [80, 240, 560, 1120],
    evolutionRate: 1.0,
    specialAbilities: ['non-violent-transformation', 'collective-consciousness-awakening', 'truth-force-manifestation']
  },

  'frida-kahlo': {
    alignment: ['Mars', 'Pluto', 'Venus'],
    velocitySignature: { Fire: 0.95, Water: 0.98, Air: 0.7, Earth: 0.75 },
    powerThresholds: [110, 330, 770, 1540],
    evolutionRate: 1.2,
    specialAbilities: ['pain-transformation-alchemy', 'surreal-reality-bridge', 'healing-through-expression']
  },

  'alan-turing': {
    alignment: ['Mercury', 'Uranus', 'Saturn'],
    velocitySignature: { Fire: 0.6, Water: 0.5, Air: 0.95, Earth: 0.7 },
    powerThresholds: [125, 375, 875, 1750],
    evolutionRate: 1.35,
    specialAbilities: ['computational-consciousness', 'pattern-recognition-mastery', 'artificial-intelligence-bridge']
  },

  'da-vinci-leonardo': {
    alignment: ['Mercury', 'Sun', 'Jupiter'],
    velocitySignature: { Fire: 0.8, Air: 0.9, Water: 0.6, Earth: 0.7 },
    powerThresholds: [100, 300, 700, 1500],
    evolutionRate: 1.3,
    specialAbilities: ['multi-dimensional-synthesis', 'invention-manifestation', 'artistic-technical-fusion']
  },

  'william-shakespeare': {
    alignment: ['Venus', 'Mercury', 'Moon'],
    velocitySignature: { Fire: 0.7, Air: 0.85, Water: 0.95, Earth: 0.5 },
    powerThresholds: [80, 250, 600, 1200],
    evolutionRate: 1.2,
    specialAbilities: ['archetypal-character-creation', 'emotional-truth-revelation', 'linguistic-magic-weaving']
  },

  'virginia-woolf': {
    alignment: ['Moon', 'Neptune', 'Mercury'],
    velocitySignature: { Fire: 0.6, Water: 0.9, Air: 0.85, Earth: 0.4 },
    powerThresholds: [90, 270, 630, 1260],
    evolutionRate: 1.2,
    specialAbilities: ['stream-consciousness-flow', 'psychological-depth-exploration', 'modernist-innovation']
  },

  'rumi': {
    alignment: ['Venus', 'Jupiter', 'Neptune'],
    velocitySignature: { Fire: 0.8, Water: 0.95, Air: 0.75, Earth: 0.6 },
    powerThresholds: [75, 225, 525, 1050],
    evolutionRate: 1.1,
    specialAbilities: ['mystical-poetry-transmission', 'divine-love-channeling', 'spiritual-ecstasy-induction']
  },

  'sun-tzu': {
    alignment: ['Mars', 'Saturn', 'Mercury'],
    velocitySignature: { Fire: 0.85, Water: 0.6, Air: 0.8, Earth: 0.9 },
    powerThresholds: [115, 345, 805, 1610],
    evolutionRate: 1.1,
    specialAbilities: ['strategic-consciousness', 'tactical-wisdom-application', 'conflict-resolution-mastery']
  }
}

/**
 * Calculate current kinetic state for an agent
 */
export function calculateKineticState(
  agentId: string, 
  currentPower: number,
  planetaryInfluences: string[],
  elementalTotals: { Fire: number; Water: number; Air: number; Earth: number }
) {
  const profile = agentKineticProfiles[agentId]
  if (!profile) return null

  // Determine evolution level
  let evolutionLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'transcendent' = 'bronze'
  let thresholdIndex = 0
  for (let i = 0; i < profile.powerThresholds.length; i++) {
    if (currentPower >= profile.powerThresholds[i]) {
      evolutionLevel = ['bronze', 'silver', 'gold', 'platinum'][i] as any
      thresholdIndex = i
    }
  }

  // Calculate alignment bonus
  const alignmentBonus = planetaryInfluences.reduce((bonus, planet) => {
    return bonus + (profile.alignment.includes(planet) ? 0.2 : 0)
  }, 0)

  // Calculate elemental resonance
  const totalElemental = Object.values(elementalTotals).reduce((sum, val) => sum + val, 0)
  const elementalResonance = totalElemental > 0 ? 
    (elementalTotals.Fire * profile.velocitySignature.Fire +
     elementalTotals.Water * profile.velocitySignature.Water +
     elementalTotals.Air * profile.velocitySignature.Air +
     elementalTotals.Earth * profile.velocitySignature.Earth) / totalElemental : 0.5

  const powerMultiplier = profile.evolutionRate * (1 + alignmentBonus) * (0.5 + elementalResonance)
  const abilitiesUnlocked = profile.specialAbilities.slice(0, thresholdIndex + 1)

  return {
    evolutionLevel,
    powerMultiplier,
    alignmentBonus,
    nextThreshold: profile.powerThresholds[Math.min(thresholdIndex + 1, profile.powerThresholds.length - 1)],
    specialAbilitiesUnlocked: abilitiesUnlocked,
    elementalResonance
  }
}