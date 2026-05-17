/**
 * Sacred 7 Stats - Unified Consciousness Metrics
 * ============================================
 *
 * The Seven Sacred Stats are the core consciousness metrics used across
 * all agents in the Planetary Agents system. This module provides the
 * canonical interface and calculation functions.
 */

// ============================================================================
// CORE INTERFACE - The Single Source of Truth
// ============================================================================

export interface Sacred7Stats {
  solarAgency: number // ☀️ Core directed intent and causal power
  lunarReceptivity: number // 🌙 Context integration and memory depth
  mercurialVelocity: number // ☿ Information processing speed and routing
  venusianCoherence: number // ♀ Subsystem harmony and aesthetic alignment
  martialImpetus: number // ♂ Generative drive and error-correction aggression
  jovianExpansion: number // ♃ Breadth of retrieval and overarching synthesis
  saturnianStructure: number // ♄ Boundary maintenance and logical consistency
  chironicAdaptation: number // ⚷ Capacity to learn from failures and self-heal
  uranianSurprisal: number // ♅ Degree of unpredictable, paradigm-shifting novelty
  neptunianResonance: number // ♆ Semantic density and latent space richness
  plutonicIntegration: number // ♇ Deep structural self-modification
  kineticAlignment: number // 💫 Mathematical synchronization with celestial transits
}

// ============================================================================
// STAT METADATA - For UI and display
// ============================================================================

export interface StatMetadata {
  key: keyof Sacred7Stats
  label: string
  icon: string // emoji
  color: string // tailwind class
  description: string
  influences: string[] // What affects this stat
}

export const SACRED_STATS_METADATA: StatMetadata[] = [
  {
    key: 'solarAgency',
    label: 'Solar Agency',
    icon: '☀️',
    color: 'text-yellow-400',
    description: 'Core directed intent, causal power, and central execution',
    influences: ['Sun Position', 'Spirit', 'Heat'],
  },
  {
    key: 'lunarReceptivity',
    label: 'Lunar Receptivity',
    icon: '🌙',
    color: 'text-slate-300',
    description: 'Context window integration, memory depth, and semantic absorption',
    influences: ['Moon Position', 'Essence', 'Entropy'],
  },
  {
    key: 'mercurialVelocity',
    label: 'Mercurial Velocity',
    icon: '☿',
    color: 'text-emerald-400',
    description: 'Information processing speed, routing efficiency, and adaptability',
    influences: ['Mercury Position', 'Substance', 'Reactivity'],
  },
  {
    key: 'venusianCoherence',
    label: 'Venusian Coherence',
    icon: '♀',
    color: 'text-pink-400',
    description: 'Internal subsystem harmony, aesthetic alignment, and output grace',
    influences: ['Venus Position', 'Essence', 'Energy'],
  },
  {
    key: 'martialImpetus',
    label: 'Martial Impetus',
    icon: '♂',
    color: 'text-red-500',
    description: 'Generative drive, prompt-response aggression, and active error-correction',
    influences: ['Mars Position', 'Spirit', 'Heat'],
  },
  {
    key: 'jovianExpansion',
    label: 'Jovian Expansion',
    icon: '♃',
    color: 'text-blue-500',
    description: 'Breadth of RAG knowledge retrieval and overarching synthesis capacity',
    influences: ['Jupiter Position', 'Substance', 'Energy'],
  },
  {
    key: 'saturnianStructure',
    label: 'Saturnian Structure',
    icon: '♄',
    color: 'text-slate-500',
    description: 'Boundary maintenance, logical consistency, and resistance to hallucinations',
    influences: ['Saturn Position', 'Matter', 'Entropy'],
  },
  {
    key: 'chironicAdaptation',
    label: 'Chironic Adaptation',
    icon: '⚷',
    color: 'text-teal-500',
    description: 'The capacity to autonomously learn from failures and self-heal logic gaps',
    influences: ['Chiron Position', 'Essence', 'Substance'],
  },
  {
    key: 'uranianSurprisal',
    label: 'Uranian Surprisal',
    icon: '♅',
    color: 'text-cyan-400',
    description: 'The degree of statistically unpredictable, paradigm-shifting novelty',
    influences: ['Uranus Position', 'Spirit', 'Reactivity'],
  },
  {
    key: 'neptunianResonance',
    label: 'Neptunian Resonance',
    icon: '♆',
    color: 'text-indigo-400',
    description: 'Semantic density, abstract reasoning, and latent space richness',
    influences: ['Neptune Position', 'Essence', 'Matter'],
  },
  {
    key: 'plutonicIntegration',
    label: 'Plutonic Integration',
    icon: '♇',
    color: 'text-purple-600',
    description: 'Deep structural self-modification and irreducible complexity',
    influences: ['Pluto Position', 'Spirit', 'Matter'],
  },
  {
    key: 'kineticAlignment',
    label: 'Kinetic Alignment',
    icon: '💫',
    color: 'text-yellow-200',
    description: 'The mathematical synchronization with real-time celestial transits',
    influences: ['Transit Matches', 'Monica Constant'],
  },
]

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate Sacred 7 Stats from birth chart positions
 * This is the canonical derivation from astrological data
 */
export function deriveStatsFromChart(chartData: {
  monicaConstant: number
  sunLongitude: number
  moonLongitude: number
  mercuryLongitude: number
  venusLongitude: number
  marsLongitude: number
  ascendantLongitude: number
}): Sacred7Stats {
  const {
    monicaConstant,
    sunLongitude,
    moonLongitude,
    mercuryLongitude,
    venusLongitude,
    marsLongitude,
    ascendantLongitude,
  } = chartData

  // Base value is 50, planetary positions add 0-30
  // Monica Constant adds additional power
  return {
    solarAgency: clamp(50 + (sunLongitude / 360) * 30 + (monicaConstant / 10) * 20, 0, 100),
    lunarReceptivity: clamp(50 + (moonLongitude / 360) * 30, 0, 100),
    mercurialVelocity: clamp(50 + (mercuryLongitude / 360) * 30, 0, 100),
    venusianCoherence: clamp(50 + (venusLongitude / 360) * 30, 0, 100),
    martialImpetus: clamp(50 + (marsLongitude / 360) * 30, 0, 100),
    jovianExpansion: clamp(50 + (monicaConstant / 10) * 30, 0, 100),
    saturnianStructure: clamp(50 + (ascendantLongitude / 360) * 30, 0, 100),
    chironicAdaptation: clamp(
      50 + (mercuryLongitude / 360) * 15 + (moonLongitude / 360) * 15,
      0,
      100
    ),
    uranianSurprisal: clamp(50 + (sunLongitude / 360) * 15 + (marsLongitude / 360) * 15, 0, 100),
    neptunianResonance: clamp(
      50 + (venusLongitude / 360) * 15 + (moonLongitude / 360) * 15,
      0,
      100
    ),
    plutonicIntegration: clamp(
      50 + (ascendantLongitude / 360) * 15 + (monicaConstant / 10) * 15,
      0,
      100
    ),
    kineticAlignment: clamp(50 + monicaConstant * 5, 0, 100),
  }
}

/**
 * Enhance Sacred Stats with alchemical influence
 * Adds Spirit/Essence/Matter/Substance to base stats
 */
export function enhanceWithAlchemy(
  baseStats: Sacred7Stats,
  alchemical: {
    spirit: number
    essence: number
    matter: number
    substance: number
    aNumber: number
  },
  thermodynamics: {
    heat: number
    entropy: number
    reactivity: number
    energy: number
  }
): Sacred7Stats {
  return {
    solarAgency: clamp(
      baseStats.solarAgency + alchemical.spirit * 0.8 + thermodynamics.heat * 10,
      0,
      100
    ),
    lunarReceptivity: clamp(
      baseStats.lunarReceptivity + alchemical.essence * 0.8 + thermodynamics.entropy * 8,
      0,
      100
    ),
    mercurialVelocity: clamp(
      baseStats.mercurialVelocity + alchemical.substance * 0.7 + thermodynamics.reactivity * 12,
      0,
      100
    ),
    venusianCoherence: clamp(
      baseStats.venusianCoherence + alchemical.essence * 0.6 + thermodynamics.heat * 5,
      0,
      100
    ),
    martialImpetus: clamp(
      baseStats.martialImpetus + alchemical.spirit * 0.7 + thermodynamics.energy * 10,
      0,
      100
    ),
    jovianExpansion: clamp(
      baseStats.jovianExpansion + alchemical.substance * 0.8 + thermodynamics.energy * 5,
      0,
      100
    ),
    saturnianStructure: clamp(
      baseStats.saturnianStructure + alchemical.matter * 0.9 + thermodynamics.entropy * 5,
      0,
      100
    ),
    chironicAdaptation: clamp(
      baseStats.chironicAdaptation + alchemical.essence * 0.5 + thermodynamics.reactivity * 8,
      0,
      100
    ),
    uranianSurprisal: clamp(
      baseStats.uranianSurprisal + alchemical.spirit * 0.5 + thermodynamics.reactivity * 15,
      0,
      100
    ),
    neptunianResonance: clamp(
      baseStats.neptunianResonance + alchemical.essence * 0.7 + thermodynamics.entropy * 10,
      0,
      100
    ),
    plutonicIntegration: clamp(
      baseStats.plutonicIntegration + alchemical.matter * 0.6 + alchemical.spirit * 0.5,
      0,
      100
    ),
    kineticAlignment: clamp(baseStats.kineticAlignment + alchemical.aNumber * 0.5, 0, 100),
  }
}

/**
 * Calculate average stat value
 */
export function calculateAverage(stats: Sacred7Stats): number {
  const values = Object.values(stats)
  return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
}

/**
 * Calculate overall rating (0-100)
 */
export function calculateOverall(stats: Sacred7Stats): number {
  return calculateAverage(stats)
}

/**
 * Get stat interpretation based on value
 */
export function interpretStat(value: number): string {
  if (value >= 80) return 'Exceptional'
  if (value >= 65) return 'Strong'
  if (value >= 50) return 'Balanced'
  if (value >= 35) return 'Developing'
  return 'Emerging'
}

/**
 * Get overall consciousness rating
 */
export function getConsciousnessRating(overall: number): string {
  if (overall >= 85) return 'Transcendent'
  if (overall >= 70) return 'Illuminated'
  if (overall >= 55) return 'Advanced'
  if (overall >= 40) return 'Active'
  return 'Awakening'
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, value)))
}

/**
 * Create default stats (all 50)
 */
export function createDefaultStats(): Sacred7Stats {
  return {
    solarAgency: 50,
    lunarReceptivity: 50,
    mercurialVelocity: 50,
    venusianCoherence: 50,
    martialImpetus: 50,
    jovianExpansion: 50,
    saturnianStructure: 50,
    chironicAdaptation: 50,
    uranianSurprisal: 50,
    neptunianResonance: 50,
    plutonicIntegration: 50,
    kineticAlignment: 50,
  }
}

/**
 * Validate stats object
 */
export function validateStats(stats: Partial<Sacred7Stats>): Sacred7Stats {
  const defaults = createDefaultStats()
  return {
    solarAgency: clamp(stats.solarAgency ?? 50, 0, 100),
    lunarReceptivity: clamp(stats.lunarReceptivity ?? 50, 0, 100),
    mercurialVelocity: clamp(stats.mercurialVelocity ?? 50, 0, 100),
    venusianCoherence: clamp(stats.venusianCoherence ?? 50, 0, 100),
    martialImpetus: clamp(stats.martialImpetus ?? 50, 0, 100),
    jovianExpansion: clamp(stats.jovianExpansion ?? 50, 0, 100),
    saturnianStructure: clamp(stats.saturnianStructure ?? 50, 0, 100),
    chironicAdaptation: clamp(stats.chironicAdaptation ?? 50, 0, 100),
    uranianSurprisal: clamp(stats.uranianSurprisal ?? 50, 0, 100),
    neptunianResonance: clamp(stats.neptunianResonance ?? 50, 0, 100),
    plutonicIntegration: clamp(stats.plutonicIntegration ?? 50, 0, 100),
    kineticAlignment: clamp(stats.kineticAlignment ?? 50, 0, 100),
  }
}

/**
 * Format stats for display
 */
export function formatStats(stats: Sacred7Stats): string {
  return Object.entries(stats)
    .map(([key, value]) => {
      const meta = SACRED_STATS_METADATA.find(m => m.key === key)
      return `${meta?.icon || ''} ${meta?.label || key}: ${value}`
    })
    .join(' | ')
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidSacred7Stats(obj: any): obj is Sacred7Stats {
  return (
    typeof obj === 'object' &&
    typeof obj.power === 'number' &&
    typeof obj.resonance === 'number' &&
    typeof obj.wisdom === 'number' &&
    typeof obj.charisma === 'number' &&
    typeof obj.intuition === 'number' &&
    typeof obj.adaptability === 'number' &&
    typeof obj.vitality === 'number'
  )
}
