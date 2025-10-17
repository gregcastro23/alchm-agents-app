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
  // The Seven Sacred Stats - Living Vital Signs of Consciousness
  power: number        // ⚡ Alchemical Force - Raw consciousness power (0-100)
  resonance: number    // 💫 Harmonic Frequency - Connection to cosmic rhythms (0-100)
  wisdom: number       // 🔮 Accumulated Insight - Knowledge depth (0-100)
  charisma: number     // ✨ Magnetic Presence - Influence ability (0-100)
  intuition: number    // 👁️ Psychic Sensitivity - Inner knowing (0-100)
  adaptability: number // 🌊 Flux Capacity - Handles change (0-100)
  vitality: number     // 💚 Life Force - Energy and stamina (0-100)
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
    key: 'power',
    label: 'Power',
    icon: '⚡',
    color: 'text-yellow-400',
    description: 'Alchemical Force - Raw consciousness power',
    influences: ['Monica Constant', 'A-Number', 'Thermodynamic Energy'],
  },
  {
    key: 'resonance',
    label: 'Resonance',
    icon: '💫',
    color: 'text-purple-400',
    description: 'Harmonic Frequency - Connection to cosmic rhythms',
    influences: ['Sun Position', 'Heat', 'Spirit'],
  },
  {
    key: 'wisdom',
    label: 'Wisdom',
    icon: '🔮',
    color: 'text-blue-400',
    description: 'Accumulated Insight - Knowledge depth',
    influences: ['Moon Position', 'Essence', 'Entropy'],
  },
  {
    key: 'charisma',
    label: 'Charisma',
    icon: '✨',
    color: 'text-pink-400',
    description: 'Magnetic Presence - Influence ability',
    influences: ['Venus Position', 'Spirit', 'Heat'],
  },
  {
    key: 'intuition',
    label: 'Intuition',
    icon: '👁️',
    color: 'text-cyan-400',
    description: 'Psychic Sensitivity - Inner knowing',
    influences: ['Moon Position', 'Essence', 'Reactivity'],
  },
  {
    key: 'adaptability',
    label: 'Adaptability',
    icon: '🌊',
    color: 'text-emerald-400',
    description: 'Flux Capacity - Handles change',
    influences: ['Mercury Position', 'Substance', 'Energy'],
  },
  {
    key: 'vitality',
    label: 'Vitality',
    icon: '💚',
    color: 'text-green-400',
    description: 'Life Force - Energy and stamina',
    influences: ['Ascendant Position', 'Matter', 'Heat'],
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
    power: clamp(50 + (monicaConstant / 10) * 30, 0, 100),
    resonance: clamp(50 + (sunLongitude / 360) * 30, 0, 100),
    wisdom: clamp(50 + (moonLongitude / 360) * 30, 0, 100),
    charisma: clamp(50 + (venusLongitude / 360) * 30, 0, 100),
    intuition: clamp(50 + (moonLongitude / 360) * 30, 0, 100),
    adaptability: clamp(50 + (mercuryLongitude / 360) * 30, 0, 100),
    vitality: clamp(50 + (ascendantLongitude / 360) * 30, 0, 100),
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
    power: clamp(
      baseStats.power + alchemical.aNumber * 0.5 + thermodynamics.energy * 10,
      0,
      100
    ),
    resonance: clamp(
      baseStats.resonance + thermodynamics.heat * 15 + alchemical.spirit * 0.8,
      0,
      100
    ),
    wisdom: clamp(
      baseStats.wisdom + alchemical.essence * 0.7 + thermodynamics.entropy * 8,
      0,
      100
    ),
    charisma: clamp(
      baseStats.charisma + alchemical.spirit * 0.6 + thermodynamics.heat * 12,
      0,
      100
    ),
    intuition: clamp(
      baseStats.intuition + alchemical.essence * 0.9 + thermodynamics.reactivity * 10,
      0,
      100
    ),
    adaptability: clamp(
      baseStats.adaptability + alchemical.substance * 0.8 + thermodynamics.energy * 8,
      0,
      100
    ),
    vitality: clamp(
      baseStats.vitality + alchemical.matter * 0.7 + thermodynamics.heat * 5,
      0,
      100
    ),
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
    power: 50,
    resonance: 50,
    wisdom: 50,
    charisma: 50,
    intuition: 50,
    adaptability: 50,
    vitality: 50,
  }
}

/**
 * Validate stats object
 */
export function validateStats(stats: Partial<Sacred7Stats>): Sacred7Stats {
  const defaults = createDefaultStats()
  return {
    power: clamp(stats.power ?? 50, 0, 100),
    resonance: clamp(stats.resonance ?? 50, 0, 100),
    wisdom: clamp(stats.wisdom ?? 50, 0, 100),
    charisma: clamp(stats.charisma ?? 50, 0, 100),
    intuition: clamp(stats.intuition ?? 50, 0, 100),
    adaptability: clamp(stats.adaptability ?? 50, 0, 100),
    vitality: clamp(stats.vitality ?? 50, 0, 100),
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
