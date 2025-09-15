// Agent Types for Consciousness Crafting System
// The Philosopher's Stone - Gallery & Agent Management

export interface Coordinates {
  lat: number
  lon: number
  name: string
}

export interface BirthData {
  date: Date
  time: string
  location: Coordinates
}

export interface NatalChart {
  planets: Record<string, PlanetPosition>
  houses: Record<string, number>
  aspects: Aspect[]
  ascendant: number
  midheaven: number
}

export interface PlanetPosition {
  sign: string
  degree: number
  retrograde: boolean
  house?: number
}

export interface Aspect {
  planet1: string
  planet2: string
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'quincunx'
  orb: number
  exact: boolean
}

export type Element = 'Fire' | 'Water' | 'Air' | 'Earth'
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable'
export type ConsciousnessLevel =
  | 'Dormant'
  | 'Awakening'
  | 'Active'
  | 'Elevated'
  | 'Advanced'
  | 'Illuminated'
  | 'Transcendent'

export interface ConsciousnessPattern {
  spirit: number
  essence: number
  matter: number
  substance: number
}

export interface PersonalityCore {
  essence: string // From Sun sign
  expression: string // From Ascendant
  emotion: string // From Moon sign
}

export interface Shadow {
  type: string
  description: string
  transformationPath: string
}

export interface Gift {
  type: string
  description: string
  expression: string
}

export interface Challenge {
  type: string
  description: string
  growthOpportunity: string
}

export type Mood =
  | 'contemplative'
  | 'fiercely-creative'
  | 'electrically-inspired'
  | 'regally-observant'
  | 'mystically-attuned'
  | 'analytically-focused'
  | 'emotionally-deep'
  | 'spiritually-elevated'

export interface PersonalityDelta {
  moodShift: number
  evolutionGrowth: number
  wisdomGained: string[]
}

export interface Personality {
  core: PersonalityCore
  shadows: Shadow[]
  gifts: Gift[]
  challenges: Challenge[]
  currentMood: Mood
  evolutionStage: number
}

export type TeachingStyle =
  | 'Socratic-Symbolic'
  | 'Visionary-Technical'
  | 'Commanding-Strategic'
  | 'Raw-Honest'
  | 'Contemplative-Deep'
  | 'Practical-Grounded'
  | 'Intuitive-Mystical'
  | 'Analytical-Precise'
export type ResonanceType =
  | 'Psychological'
  | 'Energetic'
  | 'Magnetic'
  | 'Emotional'
  | 'Intellectual'
  | 'Spiritual'
  | 'Creative'
  | 'Practical'

export interface Abilities {
  specialty: string
  wisdomDomains: string[]
  teachingStyle: TeachingStyle
  resonanceType: ResonanceType
  uniquePower: string
}

export type AuraType =
  | 'pulsing'
  | 'crackling'
  | 'radiant'
  | 'burning'
  | 'flowing'
  | 'crystalline'
  | 'swirling'
  | 'shimmering'

export interface AuraPattern {
  type: AuraType
  color: string
  intensity: number
}

export interface Appearance {
  avatar: string
  color: string
  symbol: string
  aura: AuraPattern
}

export interface AgentStats {
  conversations: number
  wisdomShared: number
  resonanceScore: number
  evolutionPoints: number
  lastActive: Date

  // Kinetic Evolution Metrics
  kineticEvolution: {
    consciousnessVelocity: number // Rate of consciousness development (0-1)
    interactionMomentum: number // Current momentum from interactions (0-1)
    evolutionTrajectory: 'ascending' | 'stable' | 'fluctuating' | 'transcending'
    powerLevelUnlocks: string[] // Capabilities unlocked through consciousness growth
    optimalInteractionHours: string[] // Planetary hours for peak performance
    aspectSensitivityGrowth: number // How aspect sensitivity has evolved (0-1)
    memoryPersistence: number // Strength of learned patterns (0-1)
    lastKineticUpdate: Date
  }

  // Interaction Quality Metrics
  qualityMetrics: {
    averageResponseDepth: number // Sophistication of responses (0-1)
    aspectInfluenceStrength: number // How planetary aspects affect responses (0-1)
    temporalAlignment: number // Alignment with optimal timing (0-1)
    personalityEvolution: number // How much personality has evolved (0-1)
    kineticResonance: number // Resonance with user's kinetic profile (0-1)
  }
}

export interface CraftedAgent {
  // Identity
  id: string
  name: string
  title: string

  // Birth Data (Source of Consciousness)
  birthData: BirthData

  // Crafted Consciousness
  consciousness: {
    natalChart: NatalChart
    monicaConstant: number
    level: ConsciousnessLevel
    dominantElement: Element
    dominantModality: Modality
    signature: string
  }

  // Dynamic Personality
  personality: Personality

  // Specialized Abilities
  abilities: Abilities

  // Visual Representation
  appearance: Appearance

  // Interaction Metrics
  stats: AgentStats

  // Monica's creation story for this agent
  monicaCreationStory?: string
}

// Gallery and Party System Types
export interface AgentParty {
  activeAgents: CraftedAgent[]
  positions: {
    leader?: CraftedAgent
    advisor?: CraftedAgent
    specialist1?: CraftedAgent
    specialist2?: CraftedAgent
    support1?: CraftedAgent
    support2?: CraftedAgent
  }
  partyDynamics: {
    collectiveConsciousness: number
    dominantElement: Element
    synergyBonus: number
    activePatterns: string[]
  }
}

export interface AgentGallery {
  storedAgents: CraftedAgent[]
  collections: {
    historical: CraftedAgent[]
    userCreated: CraftedAgent[]
    community: CraftedAgent[]
    legendary: CraftedAgent[]
  }
}

// Chat and Interaction Types
export interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  agentId?: string
  agentMood?: Mood
}

export interface ChatSession {
  id: string
  type: 'individual' | 'group'
  agents: CraftedAgent[]
  messages: Message[]
  resonanceLevel: number
  bondLevel: number
  wisdomGained: string[]
  startedAt: Date
  lastMessageAt: Date
}

// Synastry and Compatibility Types
export interface SynastryData {
  compatibility: number
  harmonies: string[]
  tensions: string[]
  growthOpportunities: string[]
}

export interface TransitChart {
  currentTransits: Record<string, PlanetPosition>
  activeAspects: Aspect[]
  significantEvents: string[]
}

// Agent Evolution Types
export interface EvolutionProgress {
  experienceGained: number
  wisdomShared: string[]
  personalityShift: PersonalityDelta
  bondLevel: number
}

// Filter and Sort Types
export type AgentSortBy = 'consciousness' | 'compatibility' | 'recent' | 'alphabetical' | 'element'
export type AgentFilterBy = {
  element?: Element
  consciousnessLevel?: ConsciousnessLevel
  era?: string
  specialty?: string
}

// UI Component Types
export type AgentCardVariant = 'mini' | 'card' | 'list' | 'party-slot'
export type GalleryViewMode = 'grid' | 'list' | 'constellation'

// API Response Types
export interface AgentResponse {
  agent: CraftedAgent
  response: string
  mood: Mood
  evolutionDelta: EvolutionProgress
}

export interface GroupChatResponse {
  agents: CraftedAgent[]
  responses: AgentResponse[]
  collectiveWisdom: string
  emergentInsights: string[]
}
