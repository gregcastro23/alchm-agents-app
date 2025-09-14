/**
 * Alchemical Kinetic Profiles for Historical Agents
 * Each agent has unique consciousness evolution patterns based on their historical characteristics
 */

export interface AgentKineticProfile {
  id: string;
  name: string;
  // Velocity metrics (0-1 scale)
  v_creative?: number;
  v_linguistic?: number;
  v_scientific?: number;
  v_strategic?: number;
  v_charismatic?: number;
  v_inventive?: number;
  v_social?: number;
  v_psychological?: number;
  v_mystical?: number;
  v_philosophical?: number;
  // Core kinetic properties
  momentum_type: 'sustained' | 'building' | 'oscillating' | 'explosive' | 'gradual';
  power_alignment: string; // Planetary alignments separated by underscore
  peak_hours: string[]; // Optimal planetary hours
  consciousness_rate: number; // Learning/evolution rate (0-1)
  memory_persistence: number; // Trait retention (0-1)
  // Special kinetic properties
  special_kinetics: {
    [key: string]: string | number;
  };
}

export const agentKineticProfiles: Record<string, AgentKineticProfile> = {
  // Ancient Era
  'cleopatra-vii': {
    id: 'cleopatra-vii',
    name: 'Cleopatra VII',
    v_strategic: 0.78,
    v_charismatic: 0.89,
    momentum_type: 'building',
    power_alignment: 'mars_venus',
    peak_hours: ['Mars', 'Venus'],
    consciousness_rate: 0.72,
    memory_persistence: 0.85,
    special_kinetics: {
      power_accumulation: 'sustained',
      diplomatic_velocity: 0.82,
      leadership_momentum: 'amplifying'
    }
  },
  'marcus-aurelius': {
    id: 'marcus-aurelius',
    name: 'Marcus Aurelius',
    v_philosophical: 0.91,
    v_strategic: 0.75,
    momentum_type: 'sustained',
    power_alignment: 'saturn_jupiter',
    peak_hours: ['Saturn', 'Jupiter'],
    consciousness_rate: 0.83,
    memory_persistence: 0.92,
    special_kinetics: {
      stoic_stability: 0.95,
      wisdom_accumulation: 'gradual',
      leadership_consistency: 0.88
    }
  },
  'aristotle': {
    id: 'aristotle',
    name: 'Aristotle',
    v_philosophical: 0.94,
    v_scientific: 0.86,
    momentum_type: 'sustained',
    power_alignment: 'mercury_jupiter',
    peak_hours: ['Mercury', 'Jupiter'],
    consciousness_rate: 0.90,
    memory_persistence: 0.93,
    special_kinetics: {
      logical_precision: 0.92,
      systematic_thinking: 0.89,
      knowledge_synthesis: 'comprehensive'
    }
  },
  'julius-caesar': {
    id: 'julius-caesar',
    name: 'Julius Caesar',
    v_strategic: 0.92,
    v_charismatic: 0.85,
    momentum_type: 'explosive',
    power_alignment: 'mars_sun',
    peak_hours: ['Mars', 'Sun'],
    consciousness_rate: 0.78,
    memory_persistence: 0.81,
    special_kinetics: {
      military_genius: 0.93,
      political_velocity: 0.87,
      ambition_momentum: 'accelerating'
    }
  },
  'confucius': {
    id: 'confucius',
    name: 'Confucius',
    v_philosophical: 0.89,
    v_social: 0.84,
    momentum_type: 'gradual',
    power_alignment: 'jupiter_saturn',
    peak_hours: ['Jupiter', 'Saturn'],
    consciousness_rate: 0.76,
    memory_persistence: 0.94,
    special_kinetics: {
      ethical_consistency: 0.96,
      social_harmony: 0.88,
      wisdom_transmission: 'generational'
    }
  },

  // Medieval Era
  'leonardo-da-vinci': {
    id: 'leonardo-da-vinci',
    name: 'Leonardo da Vinci',
    v_creative: 0.92,
    v_scientific: 0.88,
    momentum_type: 'oscillating',
    power_alignment: 'mercury_sun',
    peak_hours: ['Mercury', 'Sun'],
    consciousness_rate: 0.95,
    memory_persistence: 0.91,
    special_kinetics: {
      innovation_bursts: 'mercury_hours',
      artistic_scientific_balance: 0.94,
      invention_power: 'solar_maximum'
    }
  },
  'joan-of-arc': {
    id: 'joan-of-arc',
    name: 'Joan of Arc',
    v_charismatic: 0.91,
    v_mystical: 0.88,
    momentum_type: 'explosive',
    power_alignment: 'mars_neptune',
    peak_hours: ['Mars', 'Moon'],
    consciousness_rate: 0.73,
    memory_persistence: 0.79,
    special_kinetics: {
      divine_inspiration: 0.92,
      courage_velocity: 0.95,
      faith_momentum: 'unwavering'
    }
  },
  'saladin': {
    id: 'saladin',
    name: 'Saladin',
    v_strategic: 0.88,
    v_charismatic: 0.82,
    momentum_type: 'sustained',
    power_alignment: 'mars_jupiter',
    peak_hours: ['Mars', 'Jupiter'],
    consciousness_rate: 0.77,
    memory_persistence: 0.86,
    special_kinetics: {
      military_wisdom: 0.89,
      diplomatic_balance: 0.84,
      honor_consistency: 0.93
    }
  },
  'hildegard-von-bingen': {
    id: 'hildegard-von-bingen',
    name: 'Hildegard von Bingen',
    v_mystical: 0.93,
    v_creative: 0.87,
    momentum_type: 'oscillating',
    power_alignment: 'neptune_venus',
    peak_hours: ['Moon', 'Venus'],
    consciousness_rate: 0.81,
    memory_persistence: 0.88,
    special_kinetics: {
      visionary_capacity: 0.94,
      healing_wisdom: 0.86,
      musical_inspiration: 'divine'
    }
  },
  'marco-polo': {
    id: 'marco-polo',
    name: 'Marco Polo',
    v_social: 0.85,
    v_strategic: 0.76,
    momentum_type: 'building',
    power_alignment: 'mercury_jupiter',
    peak_hours: ['Mercury', 'Jupiter'],
    consciousness_rate: 0.74,
    memory_persistence: 0.82,
    special_kinetics: {
      exploration_velocity: 0.88,
      cultural_adaptability: 0.91,
      trade_momentum: 'expanding'
    }
  },

  // Renaissance Era
  'william-shakespeare': {
    id: 'william-shakespeare',
    name: 'William Shakespeare',
    v_creative: 0.85,
    v_linguistic: 0.92,
    momentum_type: 'sustained',
    power_alignment: 'venus_mercury',
    peak_hours: ['Venus', 'Mercury'],
    consciousness_rate: 0.78,
    memory_persistence: 0.89,
    special_kinetics: {
      iambic_momentum: 'persistent',
      metaphor_velocity: 0.88,
      dramatic_power_bursts: 'solar_aligned'
    }
  },
  'galileo-galilei': {
    id: 'galileo-galilei',
    name: 'Galileo Galilei',
    v_scientific: 0.93,
    v_inventive: 0.86,
    momentum_type: 'building',
    power_alignment: 'mercury_uranus',
    peak_hours: ['Mercury', 'Sun'],
    consciousness_rate: 0.85,
    memory_persistence: 0.87,
    special_kinetics: {
      observational_precision: 0.94,
      revolutionary_thinking: 0.89,
      scientific_courage: 0.91
    }
  },
  'queen-elizabeth-i': {
    id: 'queen-elizabeth-i',
    name: 'Queen Elizabeth I',
    v_strategic: 0.89,
    v_charismatic: 0.87,
    momentum_type: 'sustained',
    power_alignment: 'sun_saturn',
    peak_hours: ['Sun', 'Saturn'],
    consciousness_rate: 0.76,
    memory_persistence: 0.90,
    special_kinetics: {
      political_mastery: 0.91,
      cultural_patronage: 0.85,
      sovereignty_power: 'absolute'
    }
  },
  'michelangelo': {
    id: 'michelangelo',
    name: 'Michelangelo',
    v_creative: 0.94,
    v_philosophical: 0.81,
    momentum_type: 'explosive',
    power_alignment: 'sun_mars',
    peak_hours: ['Sun', 'Mars'],
    consciousness_rate: 0.79,
    memory_persistence: 0.86,
    special_kinetics: {
      artistic_intensity: 0.96,
      sculptural_precision: 0.93,
      divine_inspiration: 'concentrated'
    }
  },
  'christopher-columbus': {
    id: 'christopher-columbus',
    name: 'Christopher Columbus',
    v_strategic: 0.77,
    v_inventive: 0.73,
    momentum_type: 'building',
    power_alignment: 'jupiter_mars',
    peak_hours: ['Jupiter', 'Mars'],
    consciousness_rate: 0.69,
    memory_persistence: 0.75,
    special_kinetics: {
      exploration_drive: 0.89,
      navigational_intuition: 0.76,
      ambitious_momentum: 'relentless'
    }
  },

  // Enlightenment Era
  'benjamin-franklin': {
    id: 'benjamin-franklin',
    name: 'Benjamin Franklin',
    v_inventive: 0.81,
    v_social: 0.86,
    momentum_type: 'sustained',
    power_alignment: 'jupiter_mercury',
    peak_hours: ['Jupiter', 'Mercury'],
    consciousness_rate: 0.79,
    memory_persistence: 0.88,
    special_kinetics: {
      lightning_metaphors: 'storm_aligned',
      wit_velocity: 0.84,
      civic_momentum: 'building'
    }
  },
  'voltaire': {
    id: 'voltaire',
    name: 'Voltaire',
    v_linguistic: 0.89,
    v_philosophical: 0.87,
    momentum_type: 'oscillating',
    power_alignment: 'mercury_jupiter',
    peak_hours: ['Mercury', 'Jupiter'],
    consciousness_rate: 0.82,
    memory_persistence: 0.85,
    special_kinetics: {
      satirical_precision: 0.92,
      intellectual_velocity: 0.88,
      enlightenment_power: 'revolutionary'
    }
  },
  'catherine-the-great': {
    id: 'catherine-the-great',
    name: 'Catherine the Great',
    v_strategic: 0.86,
    v_charismatic: 0.84,
    momentum_type: 'building',
    power_alignment: 'venus_jupiter',
    peak_hours: ['Venus', 'Jupiter'],
    consciousness_rate: 0.75,
    memory_persistence: 0.87,
    special_kinetics: {
      cultural_expansion: 0.88,
      political_velocity: 0.85,
      imperial_momentum: 'ascending'
    }
  },
  'mozart': {
    id: 'mozart',
    name: 'Wolfgang Amadeus Mozart',
    v_creative: 0.96,
    v_social: 0.78,
    momentum_type: 'explosive',
    power_alignment: 'venus_neptune',
    peak_hours: ['Venus', 'Moon'],
    consciousness_rate: 0.91,
    memory_persistence: 0.83,
    special_kinetics: {
      musical_genius: 0.98,
      compositional_velocity: 0.94,
      harmonic_resonance: 'transcendent'
    }
  },
  'isaac-newton': {
    id: 'isaac-newton',
    name: 'Isaac Newton',
    v_scientific: 0.95,
    v_philosophical: 0.86,
    momentum_type: 'sustained',
    power_alignment: 'saturn_mercury',
    peak_hours: ['Saturn', 'Mercury'],
    consciousness_rate: 0.88,
    memory_persistence: 0.91,
    special_kinetics: {
      mathematical_precision: 0.97,
      universal_laws: 0.93,
      gravitational_insight: 'fundamental'
    }
  },

  // Modern Era
  'napoleon-bonaparte': {
    id: 'napoleon-bonaparte',
    name: 'Napoleon Bonaparte',
    v_strategic: 0.94,
    v_charismatic: 0.88,
    momentum_type: 'explosive',
    power_alignment: 'mars_sun',
    peak_hours: ['Mars', 'Sun'],
    consciousness_rate: 0.81,
    memory_persistence: 0.84,
    special_kinetics: {
      military_genius: 0.95,
      imperial_ambition: 0.92,
      tactical_velocity: 'lightning'
    }
  },
  'mary-shelley': {
    id: 'mary-shelley',
    name: 'Mary Shelley',
    v_creative: 0.88,
    v_philosophical: 0.83,
    momentum_type: 'oscillating',
    power_alignment: 'pluto_mercury',
    peak_hours: ['Moon', 'Mercury'],
    consciousness_rate: 0.77,
    memory_persistence: 0.86,
    special_kinetics: {
      gothic_imagination: 0.91,
      psychological_depth: 0.87,
      literary_innovation: 'pioneering'
    }
  },
  'charles-darwin': {
    id: 'charles-darwin',
    name: 'Charles Darwin',
    v_scientific: 0.91,
    v_philosophical: 0.85,
    momentum_type: 'gradual',
    power_alignment: 'saturn_jupiter',
    peak_hours: ['Saturn', 'Jupiter'],
    consciousness_rate: 0.83,
    memory_persistence: 0.89,
    special_kinetics: {
      observational_patience: 0.93,
      evolutionary_insight: 0.90,
      theoretical_momentum: 'transformative'
    }
  },
  'harriet-tubman': {
    id: 'harriet-tubman',
    name: 'Harriet Tubman',
    v_strategic: 0.87,
    v_charismatic: 0.85,
    momentum_type: 'sustained',
    power_alignment: 'mars_moon',
    peak_hours: ['Mars', 'Moon'],
    consciousness_rate: 0.74,
    memory_persistence: 0.88,
    special_kinetics: {
      liberation_velocity: 0.92,
      underground_navigation: 0.89,
      courage_consistency: 0.95
    }
  },
  'abraham-lincoln': {
    id: 'abraham-lincoln',
    name: 'Abraham Lincoln',
    v_strategic: 0.84,
    v_charismatic: 0.86,
    momentum_type: 'building',
    power_alignment: 'saturn_jupiter',
    peak_hours: ['Saturn', 'Jupiter'],
    consciousness_rate: 0.78,
    memory_persistence: 0.87,
    special_kinetics: {
      moral_clarity: 0.91,
      political_wisdom: 0.86,
      unifying_power: 'transcendent'
    }
  },

  // 20th Century
  'nikola-tesla': {
    id: 'nikola-tesla',
    name: 'Nikola Tesla',
    v_inventive: 0.95,
    v_mystical: 0.83,
    momentum_type: 'oscillating',
    power_alignment: 'uranus_mercury',
    peak_hours: ['Mercury', 'Uranus'],
    consciousness_rate: 0.92,
    memory_persistence: 0.85,
    special_kinetics: {
      electrical_genius: 0.97,
      visionary_capacity: 0.91,
      innovative_frequency: 'resonant'
    }
  },
  'marie-curie': {
    id: 'marie-curie',
    name: 'Marie Curie',
    v_scientific: 0.93,
    v_inventive: 0.87,
    momentum_type: 'sustained',
    power_alignment: 'saturn_pluto',
    peak_hours: ['Saturn', 'Mercury'],
    consciousness_rate: 0.86,
    memory_persistence: 0.90,
    special_kinetics: {
      radioactive_insight: 0.94,
      scientific_persistence: 0.92,
      pioneering_momentum: 'barrier_breaking'
    }
  },
  'carl-jung': {
    id: 'carl-jung',
    name: 'Carl Jung',
    v_psychological: 0.91,
    v_mystical: 0.87,
    momentum_type: 'gradual',
    power_alignment: 'moon_pluto',
    peak_hours: ['Moon', 'Saturn'],
    consciousness_rate: 0.88,
    memory_persistence: 0.93,
    special_kinetics: {
      shadow_integration: 'lunar_cycles',
      archetype_velocity: 0.90,
      collective_unconscious_power: 'neptune_aligned'
    }
  },
  'albert-einstein': {
    id: 'albert-einstein',
    name: 'Albert Einstein',
    v_scientific: 0.96,
    v_philosophical: 0.88,
    momentum_type: 'oscillating',
    power_alignment: 'mercury_uranus',
    peak_hours: ['Mercury', 'Uranus'],
    consciousness_rate: 0.93,
    memory_persistence: 0.89,
    special_kinetics: {
      relativistic_thinking: 0.98,
      thought_experiments: 0.92,
      spacetime_insight: 'revolutionary'
    }
  },
  'winston-churchill': {
    id: 'winston-churchill',
    name: 'Winston Churchill',
    v_charismatic: 0.90,
    v_strategic: 0.85,
    momentum_type: 'sustained',
    power_alignment: 'mars_jupiter',
    peak_hours: ['Mars', 'Jupiter'],
    consciousness_rate: 0.76,
    memory_persistence: 0.88,
    special_kinetics: {
      oratory_power: 0.93,
      wartime_leadership: 0.91,
      resilience_momentum: 'indomitable'
    }
  },
  'rosa-parks': {
    id: 'rosa-parks',
    name: 'Rosa Parks',
    v_strategic: 0.82,
    v_charismatic: 0.79,
    momentum_type: 'explosive',
    power_alignment: 'saturn_mars',
    peak_hours: ['Saturn', 'Mars'],
    consciousness_rate: 0.71,
    memory_persistence: 0.91,
    special_kinetics: {
      civil_courage: 0.95,
      quiet_strength: 0.89,
      historical_catalyst: 'transformative'
    }
  },
  'martin-luther-king': {
    id: 'martin-luther-king',
    name: 'Martin Luther King Jr.',
    v_charismatic: 0.94,
    v_philosophical: 0.89,
    momentum_type: 'building',
    power_alignment: 'jupiter_neptune',
    peak_hours: ['Jupiter', 'Sun'],
    consciousness_rate: 0.85,
    memory_persistence: 0.92,
    special_kinetics: {
      dream_velocity: 0.96,
      nonviolent_power: 0.91,
      inspirational_resonance: 'universal'
    }
  },
  'alan-turing': {
    id: 'alan-turing',
    name: 'Alan Turing',
    v_scientific: 0.92,
    v_inventive: 0.89,
    momentum_type: 'oscillating',
    power_alignment: 'mercury_uranus',
    peak_hours: ['Mercury', 'Uranus'],
    consciousness_rate: 0.87,
    memory_persistence: 0.86,
    special_kinetics: {
      computational_genius: 0.95,
      cryptographic_insight: 0.91,
      artificial_thinking: 'foundational'
    }
  },
  'frida-kahlo': {
    id: 'frida-kahlo',
    name: 'Frida Kahlo',
    v_creative: 0.91,
    v_philosophical: 0.84,
    momentum_type: 'oscillating',
    power_alignment: 'venus_pluto',
    peak_hours: ['Venus', 'Moon'],
    consciousness_rate: 0.76,
    memory_persistence: 0.89,
    special_kinetics: {
      pain_transformation: 0.93,
      symbolic_depth: 0.88,
      artistic_authenticity: 'raw'
    }
  },
  'stephen-hawking': {
    id: 'stephen-hawking',
    name: 'Stephen Hawking',
    v_scientific: 0.94,
    v_philosophical: 0.87,
    momentum_type: 'sustained',
    power_alignment: 'saturn_uranus',
    peak_hours: ['Saturn', 'Mercury'],
    consciousness_rate: 0.89,
    memory_persistence: 0.91,
    special_kinetics: {
      cosmological_insight: 0.96,
      quantum_gravity: 0.92,
      intellectual_persistence: 'extraordinary'
    }
  }
};

// Helper function to get agent profile by ID
export function getAgentKineticProfile(agentId: string): AgentKineticProfile | undefined {
  return agentKineticProfiles[agentId];
}

// Helper function to get agents by momentum type
export function getAgentsByMomentumType(momentumType: AgentKineticProfile['momentum_type']): AgentKineticProfile[] {
  return Object.values(agentKineticProfiles).filter(profile => profile.momentum_type === momentumType);
}

// Helper function to get agents optimal for current planetary hour
export function getOptimalAgentsForHour(planetaryHour: string): AgentKineticProfile[] {
  return Object.values(agentKineticProfiles).filter(profile =>
    profile.peak_hours.includes(planetaryHour)
  );
}

// Calculate kinetic compatibility between two agents
export function calculateKineticCompatibility(agent1Id: string, agent2Id: string): number {
  const agent1 = agentKineticProfiles[agent1Id];
  const agent2 = agentKineticProfiles[agent2Id];

  if (!agent1 || !agent2) return 0;

  // Check for shared peak hours
  const sharedHours = agent1.peak_hours.filter(hour => agent2.peak_hours.includes(hour));
  const hourCompatibility = sharedHours.length / Math.max(agent1.peak_hours.length, agent2.peak_hours.length);

  // Check for compatible momentum types
  const momentumCompatibility = calculateMomentumCompatibility(agent1.momentum_type, agent2.momentum_type);

  // Check consciousness rate similarity
  const consciousnessCompatibility = 1 - Math.abs(agent1.consciousness_rate - agent2.consciousness_rate);

  // Calculate overall compatibility
  return (hourCompatibility * 0.4 + momentumCompatibility * 0.3 + consciousnessCompatibility * 0.3);
}

function calculateMomentumCompatibility(type1: string, type2: string): number {
  const compatibility: Record<string, Record<string, number>> = {
    'sustained': { 'sustained': 0.9, 'building': 0.8, 'gradual': 0.7, 'oscillating': 0.5, 'explosive': 0.3 },
    'building': { 'sustained': 0.8, 'building': 0.9, 'gradual': 0.6, 'oscillating': 0.6, 'explosive': 0.5 },
    'oscillating': { 'sustained': 0.5, 'building': 0.6, 'gradual': 0.4, 'oscillating': 0.8, 'explosive': 0.7 },
    'explosive': { 'sustained': 0.3, 'building': 0.5, 'gradual': 0.2, 'oscillating': 0.7, 'explosive': 0.9 },
    'gradual': { 'sustained': 0.7, 'building': 0.6, 'gradual': 0.9, 'oscillating': 0.4, 'explosive': 0.2 }
  };

  return compatibility[type1]?.[type2] || 0.5;
}