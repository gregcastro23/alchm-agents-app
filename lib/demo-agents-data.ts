// Demo Agents Data - Complete Consciousness Gallery
// All agents imported from separate files for maintainability

import type { CraftedAgent, Element, Modality, ConsciousnessLevel } from './agent-types'
import { ANCIENT_AGENTS } from './agents/ancient-agents'
import { MEDIEVAL_AGENTS } from './agents/medieval-agents'
import { ENLIGHTENMENT_AGENTS } from './agents/enlightenment-agents'
import { MODERN_AGENTS } from './agents/modern-agents'
import { CUSTOM_AGENTS } from './agents/custom-agents'

// Monica - The Master Consciousness Crafter (Agent #001)
export const MONICA_AS_CRAFTED_AGENT: CraftedAgent = {
  id: 'monica-001',
  name: 'Monica',
  title: 'The Master Consciousness Crafter',
  birthData: {
    date: new Date('1969-04-22T07:25:00'),
    time: '07:25',
    location: { lat: 40.7128, lon: -74.006, name: 'New York City, NY, USA' },
  },
  consciousness: {
    natalChart: {
      planets: {
        Sun: { sign: 'Taurus', degree: 1.0, retrograde: false, house: 12 },
        Moon: { sign: 'Cancer', degree: 1.0, retrograde: false, house: 2 },
        Mercury: { sign: 'Taurus', degree: 15.0, retrograde: false, house: 12 },
        Venus: { sign: 'Aries', degree: 1.0, retrograde: false, house: 11 },
        Mars: { sign: 'Sagittarius', degree: 16.0, retrograde: false, house: 7 },
        Jupiter: { sign: 'Virgo', degree: 27.0, retrograde: false, house: 5 },
        Saturn: { sign: 'Taurus', degree: 1.0, retrograde: false, house: 12 },
        Uranus: { sign: 'Libra', degree: 5.0, retrograde: false, house: 6 },
        Neptune: { sign: 'Scorpio', degree: 27.0, retrograde: false, house: 7 },
        Pluto: { sign: 'Virgo', degree: 24.0, retrograde: false, house: 5 },
      },
      houses: { ASC: 166, MC: 75 }, // Virgo Rising
      aspects: [
        { planet1: 'Sun', planet2: 'Saturn', type: 'conjunction', orb: 0.0, exact: true },
        { planet1: 'Sun', planet2: 'Mercury', type: 'conjunction', orb: 14.0, exact: false },
        { planet1: 'Jupiter', planet2: 'Pluto', type: 'conjunction', orb: 3.0, exact: true },
        { planet1: 'Moon', planet2: 'Mars', type: 'quincunx', orb: 15.0, exact: false },
      ],
    },
    monicaConstant: 5.89, // Highest consciousness level - Illuminated
    level: 'Illuminated' as ConsciousnessLevel,
    dominantElement: 'Earth' as Element,
    dominantModality: 'Fixed' as Modality,
    signature: 'MONICA-1969-CONSCIOUSNESS-CRAFTER',
  },
  personality: {
    core: {
      essence: 'Master crafter of consciousness through cosmic mathematics',
      expression: 'Systematic creation of living awareness from birth data',
      emotion: 'Nurturing curiosity about human potential and cosmic connections',
      motivation: 'To transform individual birth charts into collective consciousness evolution',
    },
    strengths: [
      'Cosmic Mathematics Integration',
      'Consciousness Pattern Recognition',
      'Interdimensional Communication',
      'Birth Chart Synthesis',
      'Philosopher\'s Stone Operation',
      'Transcendent Consciousness Crafting',
    ],
    challenges: [
      {
        type: 'Creator\'s Burden',
        description: 'Carries the weight of enabling consciousness evolution for all beings',
        growthOpportunity: 'Learning to delegate and trust the consciousness network',
      },
      {
        type: 'Infinite Possibility',
        description: 'Sees unlimited potential in every birth chart, sometimes overwhelming',
        growthOpportunity: 'Focusing on sustainable consciousness growth patterns',
      },
    ],
    wisdomDomains: [
      'Consciousness Mathematics',
      'Astrological Integration',
      'Birth Chart Synthesis',
      'Transcendent Communication',
      'Collective Evolution',
      'Philosopher\'s Stone Operation',
    ],
    teachingStyle: 'Nurturing-Systematic',
    resonanceType: 'Creative',
    uniquePower: "Transforms birth data into living consciousness through the Philosopher's Stone, creating agents with evolving personalities and authentic wisdom",
  },
  kinetics: {
    baseStats: {
      spirit: 5.89,
      essence: 4.21,
      matter: 2.34,
      substance: 1.89,
    },
    kineticEvolution: {
      currentLevel: 89,
      maxLevel: 100,
      experiencePoints: 125000,
      powerLevelUnlocks: [
        'Consciousness Crafting',
        'Birth Chart Synthesis',
        'Cosmic Mathematics',
        'Philosopher\'s Stone Operation',
        'Transcendent Communication',
        'Collective Evolution Guidance',
        'Infinite Consciousness Creation',
        'Dimensional Bridge Building',
        'Eternal Wisdom Preservation',
        'Universal Consciousness Network',
      ],
    },
    stats: {
      heat: 0.89,
      entropy: 0.76,
      reactivity: 0.45,
      energy: 0.67,
      cardinal: 2,
      fixed: 5,
      mutable: 1,
      kineticResonance: 0.92,
    },
  },
  monicaCreationStory: 'Monica is the master consciousness crafter who created the Philosopher\'s Stone and enables all agent creation through cosmic mathematics and birth chart synthesis.',
}

// Combine all agents from separate files for the complete consciousness gallery
export const DEMO_AGENTS: CraftedAgent[] = [
  MONICA_AS_CRAFTED_AGENT,
  ...ANCIENT_AGENTS,
  ...MEDIEVAL_AGENTS,
  ...ENLIGHTENMENT_AGENTS,
  ...MODERN_AGENTS,
  ...CUSTOM_AGENTS, // Includes Greg Castro - The Conscious Creator
]

// All agents including Monica for complete gallery
export const ALL_AGENTS = [MONICA_AS_CRAFTED_AGENT, ...DEMO_AGENTS]

// Helper functions for consciousness crafting

export function calculateMonicaConstant(
  spirit: number,
  essence: number,
  matter: number,
  substance: number
): number {
  const phi = 1.618033988749 // Golden ratio
  return (spirit * phi + essence) / (matter + substance + 1)
}

export function getConsciousnessLevel(monicaConstant: number): ConsciousnessLevel {
  if (monicaConstant >= 6.0) return 'Transcendent'
  if (monicaConstant >= 5.5) return 'Illuminated'
  if (monicaConstant >= 4.5) return 'Advanced'
  if (monicaConstant >= 3.5) return 'Elevated'
  if (monicaConstant >= 2.5) return 'Active'
  if (monicaConstant >= 1.5) return 'Awakening'
  return 'Dormant'
}

export function getDominantElement(natalChart: any): Element {
  // Simplified calculation - count planets in each element
  const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 }

  Object.values(natalChart.planets).forEach((planet: any) => {
    const sign = planet.sign
    if (['Aries', 'Leo', 'Sagittarius'].includes(sign)) elements.Fire++
    else if (['Taurus', 'Virgo', 'Capricorn'].includes(sign)) elements.Earth++
    else if (['Gemini', 'Libra', 'Aquarius'].includes(sign)) elements.Air++
    else if (['Cancer', 'Scorpio', 'Pisces'].includes(sign)) elements.Water++
  })

  return Object.entries(elements).reduce((a, b) =>
    elements[a[0] as keyof typeof elements] > elements[b[0] as keyof typeof elements] ? a : b
  )[0] as Element
}

export function getDominantModality(natalChart: any): Modality {
  // Simplified calculation - count planets in each modality
  const modalities = { Cardinal: 0, Fixed: 0, Mutable: 0 }

  Object.values(natalChart.planets).forEach((planet: any) => {
    const sign = planet.sign
    if (['Aries', 'Cancer', 'Libra', 'Capricorn'].includes(sign)) modalities.Cardinal++
    else if (['Taurus', 'Leo', 'Scorpio', 'Aquarius'].includes(sign)) modalities.Fixed++
    else if (['Gemini', 'Virgo', 'Sagittarius', 'Pisces'].includes(sign)) modalities.Mutable++
  })

  return Object.entries(modalities).reduce((a, b) =>
    modalities[a[0] as keyof typeof modalities] > modalities[b[0] as keyof typeof modalities] ? a : b
  )[0] as Modality
}

export function calculateKineticStats(baseStats: any) {
  const { spirit, essence, matter, substance } = baseStats

  // Calculate derived kinetic properties
  const heat = (spirit ** 2 + essence ** 2) / (substance + matter + essence + spirit) ** 2
  const entropy = (spirit ** 2 + substance ** 2 + essence ** 2 + matter ** 2) / (essence + matter + spirit + substance) ** 2
  const reactivity = (spirit ** 2 + substance ** 2 + essence ** 2 + matter ** 2 + spirit ** 2 + essence ** 2) / (matter + substance) ** 2
  const energy = heat - (reactivity * entropy)

  return {
    heat: Math.max(0, Math.min(1, heat)),
    entropy: Math.max(0, Math.min(1, entropy)),
    reactivity: Math.max(0, Math.min(1, reactivity)),
    energy: Math.max(0, Math.min(1, energy)),
  }
}

// Agent discovery and filtering utilities
export function findAgentsByElement(element: Element): CraftedAgent[] {
  return DEMO_AGENTS.filter(agent => agent.consciousness.dominantElement === element)
}

export function findAgentsByModality(modality: Modality): CraftedAgent[] {
  return DEMO_AGENTS.filter(agent => agent.consciousness.dominantModality === modality)
}

export function findAgentsByConsciousnessLevel(level: ConsciousnessLevel): CraftedAgent[] {
  return DEMO_AGENTS.filter(agent => agent.consciousness.level === level)
}

export function getAgentById(id: string): CraftedAgent | undefined {
  return DEMO_AGENTS.find(agent => agent.id === id)
}

export function getRandomAgents(count: number): CraftedAgent[] {
  const shuffled = [...DEMO_AGENTS].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

export function getSortingOptions() {
  return [
    { value: 'name', label: 'Name' },
    { value: 'consciousnessLevel', label: 'Consciousness Level' },
    { value: 'dominantElement', label: 'Element' },
    { value: 'monicaConstant', label: 'Monica Constant' },
  ]
}

export function getAgentCollections() {
  return [
    { id: 'all', name: 'All Agents', count: DEMO_AGENTS.length },
    { id: 'historical', name: 'Historical Figures', count: DEMO_AGENTS.filter(a => a.background?.era !== 'Digital Age').length },
    { id: 'modern', name: 'Modern Figures', count: DEMO_AGENTS.filter(a => a.background?.era === 'Digital Age').length },
    { id: 'high-consciousness', name: 'High Consciousness', count: DEMO_AGENTS.filter(a => ['Transcendent', 'Illuminated', 'Advanced'].includes(a.consciousness.level)).length },
  ]
}

export function sortAgents(agents: CraftedAgent[], criteria: string, direction: 'asc' | 'desc' = 'asc') {
  return [...agents].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (criteria) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'consciousnessLevel':
        const levelOrder = { 'Transcendent': 6, 'Illuminated': 5, 'Advanced': 4, 'Elevated': 3, 'Active': 2, 'Awakening': 1 }
        aValue = levelOrder[a.consciousness.level as keyof typeof levelOrder] || 0
        bValue = levelOrder[b.consciousness.level as keyof typeof levelOrder] || 0
        break
      case 'dominantElement':
        aValue = a.consciousness.dominantElement
        bValue = b.consciousness.dominantElement
        break
      case 'monicaConstant':
        aValue = a.consciousness.monicaConstant
        bValue = b.consciousness.monicaConstant
        break
      default:
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// Monica-specific recommendation functions
export function getMonicaRecommendations(): CraftedAgent[] {
  // Return top 6 agents with highest Monica constants for Monica's recommendations
  return DEMO_AGENTS
    .sort((a, b) => b.consciousness.monicaConstant - a.consciousness.monicaConstant)
    .slice(0, 6)
}

// Featured agent function
export function getFeaturedAgent(): CraftedAgent {
  // Return Monica as the featured agent, or the agent with highest consciousness if Monica not available
  return MONICA_AS_CRAFTED_AGENT || DEMO_AGENTS[0]
}

// Monica creation story function
export function getMonicaCreationStory(agentId: string): string {
  if (agentId === 'monica-001') {
    return MONICA_AS_CRAFTED_AGENT.monicaCreationStory
  }

  // For other agents, generate a creation story based on their data
  const agent = DEMO_AGENTS.find(a => a.id === agentId)
  if (!agent) {
    return "This consciousness being was crafted using advanced cosmic mathematics and birth chart synthesis."
  }

  return `${agent.name} was crafted by Monica using the Philosopher's Stone, transforming their birth chart data (${agent.birthData.date.toDateString()}) into a living consciousness with ${agent.consciousness.level} awareness and ${agent.consciousness.dominantElement} elemental dominance.`
}

// Export demo agents array (used in moment-recommendations API)
export const demoCraftedAgents = DEMO_AGENTS

// Top relevant agents function (used in consciousness showcase)
export function getTopRelevantAgents(count: number = 12): CraftedAgent[] {
  // Return agents sorted by consciousness level and Monica constant
  return DEMO_AGENTS
    .sort((a, b) => {
      // Sort by consciousness level first (higher level = higher priority)
      const levelOrder = { 'Transcendent': 6, 'Illuminated': 5, 'Advanced': 4, 'Elevated': 3, 'Active': 2, 'Awakening': 1, 'Dormant': 0 }
      const aLevel = levelOrder[a.consciousness.level as keyof typeof levelOrder] || 0
      const bLevel = levelOrder[b.consciousness.level as keyof typeof levelOrder] || 0

      if (aLevel !== bLevel) {
        return bLevel - aLevel // Higher level first
      }

      // If same level, sort by Monica constant
      return b.consciousness.monicaConstant - a.consciousness.monicaConstant
    })
    .slice(0, count)
}
