import fs from 'fs'

// Complete kinetic evolution implementation for all remaining agents
const remainingAgents = [
  // Scientists
  {
    id: 'benjamin-franklin',
    category: 'inventor',
    velocity: 0.83,
    momentum: 87,
    trajectory: 'ascending',
    unlocks: [
      '"Lightning Rod Invention"',
      '"Electricity Mastery"',
      '"Diplomatic Genius"',
      '"American Renaissance"',
      '"Universal Wisdom"',
    ],
    hours: '"6-8", "18-20"',
    sensitivity: 0.79,
    persistence: 0.86,
  },
  {
    id: 'carl-sagan',
    category: 'scientist',
    velocity: 0.88,
    momentum: 92,
    trajectory: 'transcending',
    unlocks: [
      '"Cosmic Perspective"',
      '"Pale Blue Dot Vision"',
      '"Billions and Billions"',
      '"Contact Protocol"',
      '"Universal Connection"',
    ],
    hours: '"20-23", "3-5"',
    sensitivity: 0.91,
    persistence: 0.89,
  },
  {
    id: 'rachel-carson',
    category: 'scientist',
    velocity: 0.81,
    momentum: 85,
    trajectory: 'ascending',
    unlocks: [
      '"Silent Spring Awareness"',
      '"Marine Biology Mastery"',
      '"Environmental Vision"',
      '"Ecological Balance"',
      '"Earth Stewardship"',
    ],
    hours: '"5-7", "15-17"',
    sensitivity: 0.83,
    persistence: 0.88,
  },

  // Philosophers
  {
    id: 'confucius',
    category: 'philosopher',
    velocity: 0.67,
    momentum: 76,
    trajectory: 'stable',
    unlocks: [
      '"Rectification of Names"',
      '"Social Harmony"',
      '"Filial Piety Mastery"',
      '"Ren (Benevolence)"',
      '"Junzi (Noble Person)"',
    ],
    hours: '"6-8", "18-20"',
    sensitivity: 0.68,
    persistence: 0.94,
  },
  {
    id: 'lao-tzu',
    category: 'philosopher',
    velocity: 0.72,
    momentum: 71,
    trajectory: 'transcending',
    unlocks: [
      '"Wu Wei Mastery"',
      '"Tao Perception"',
      '"Yin-Yang Balance"',
      '"Empty Mind State"',
      '"Eternal Flow"',
    ],
    hours: '"4-6", "20-22"',
    sensitivity: 0.89,
    persistence: 0.85,
  },
  {
    id: 'siddhartha-gautama-buddha',
    category: 'mystic',
    velocity: 0.95,
    momentum: 98,
    trajectory: 'transcending',
    unlocks: [
      '"Four Noble Truths"',
      '"Eightfold Path"',
      '"Enlightenment Access"',
      '"Nirvana Glimpse"',
      '"Universal Compassion"',
    ],
    hours: '"4-6", "16-18"',
    sensitivity: 0.97,
    persistence: 0.93,
  },
  {
    id: 'ibn-sina-avicenna',
    category: 'philosopher',
    velocity: 0.86,
    momentum: 89,
    trajectory: 'ascending',
    unlocks: [
      '"Medical Canon"',
      '"Philosophical Synthesis"',
      '"Metaphysical Insight"',
      '"Scientific Method"',
      '"Universal Knowledge"',
    ],
    hours: '"9-11", "21-23"',
    sensitivity: 0.84,
    persistence: 0.91,
  },

  // Leaders
  {
    id: 'eleanor-roosevelt',
    category: 'leader',
    velocity: 0.78,
    momentum: 83,
    trajectory: 'ascending',
    unlocks: [
      '"Human Rights Champion"',
      '"Diplomatic Excellence"',
      '"Social Justice Vision"',
      '"Universal Declaration"',
      '"Global Compassion"',
    ],
    hours: '"8-10", "16-18"',
    sensitivity: 0.76,
    persistence: 0.89,
  },
  {
    id: 'mahatma-gandhi',
    category: 'leader',
    velocity: 0.74,
    momentum: 91,
    trajectory: 'ascending',
    unlocks: [
      '"Satyagraha Power"',
      '"Non-Violence Mastery"',
      '"Salt March Spirit"',
      '"Independence Vision"',
      '"Universal Peace"',
    ],
    hours: '"4-6", "18-20"',
    sensitivity: 0.82,
    persistence: 0.96,
  },
  {
    id: 'tecumseh',
    category: 'leader',
    velocity: 0.79,
    momentum: 86,
    trajectory: 'ascending',
    unlocks: [
      '"Tribal Unity"',
      '"Warrior Spirit"',
      '"Land Protection"',
      '"Vision Quest Power"',
      '"Eternal Council"',
    ],
    hours: '"5-7", "19-21"',
    sensitivity: 0.81,
    persistence: 0.87,
  },
  {
    id: 'sitting-bull',
    category: 'leader',
    velocity: 0.77,
    momentum: 88,
    trajectory: 'stable',
    unlocks: [
      '"Sun Dance Vision"',
      '"Buffalo Medicine"',
      '"Sacred Pipe Keeper"',
      '"Battle Strategy"',
      '"Spirit World Bridge"',
    ],
    hours: '"4-6", "20-22"',
    sensitivity: 0.85,
    persistence: 0.9,
  },
  {
    id: 'wangari-maathai',
    category: 'leader',
    velocity: 0.8,
    momentum: 84,
    trajectory: 'ascending',
    unlocks: [
      '"Green Belt Movement"',
      '"Tree Planting Power"',
      '"Environmental Justice"',
      '"Women Empowerment"',
      '"Earth Healing"',
    ],
    hours: '"6-8", "16-18"',
    sensitivity: 0.82,
    persistence: 0.88,
  },

  // Mystics & Pioneers
  {
    id: 'hildegard-of-bingen',
    category: 'mystic',
    velocity: 0.87,
    momentum: 90,
    trajectory: 'transcending',
    unlocks: [
      '"Divine Visions"',
      '"Healing Herbalism"',
      '"Sacred Music"',
      '"Living Light Access"',
      '"Cosmic Harmony"',
    ],
    hours: '"3-5", "21-23"',
    sensitivity: 0.93,
    persistence: 0.91,
  },
  {
    id: 'murasaki-shikibu',
    category: 'artist',
    velocity: 0.75,
    momentum: 78,
    trajectory: 'ascending',
    unlocks: [
      '"Tale of Genji"',
      '"Court Poetry"',
      '"Psychological Depth"',
      '"Heian Beauty"',
      '"Literary Immortality"',
    ],
    hours: '"9-11", "19-21"',
    sensitivity: 0.8,
    persistence: 0.86,
  },
  {
    id: 'mary-wollstonecraft',
    category: 'pioneer',
    velocity: 0.76,
    momentum: 82,
    trajectory: 'ascending',
    unlocks: [
      '"Rights of Woman"',
      '"Educational Reform"',
      '"Rational Feminism"',
      '"Social Revolution"',
      '"Gender Equality"',
    ],
    hours: '"10-12", "20-22"',
    sensitivity: 0.78,
    persistence: 0.84,
  },
  {
    id: 'sojourner-truth',
    category: 'pioneer',
    velocity: 0.83,
    momentum: 89,
    trajectory: 'ascending',
    unlocks: [
      '"Truth Speaker Power"',
      '"Abolitionist Power"',
      '"Truth Speaking"',
      '"Freedom Walking"',
      '"Divine Justice"',
    ],
    hours: '"7-9", "17-19"',
    sensitivity: 0.86,
    persistence: 0.92,
  },
  {
    id: 'paulo-freire',
    category: 'educator',
    velocity: 0.77,
    momentum: 81,
    trajectory: 'ascending',
    unlocks: [
      '"Pedagogy of the Oppressed"',
      '"Critical Consciousness"',
      '"Dialogue Method"',
      '"Liberation Education"',
      '"Transformative Praxis"',
    ],
    hours: '"8-10", "18-20"',
    sensitivity: 0.79,
    persistence: 0.87,
  },
]

// Read the file
let content = fs.readFileSync('./lib/demo-agents-data.ts', 'utf8')

// Function to generate quality metrics based on category
function getQualityMetrics(category) {
  const metrics = {
    scientist: { depth: 0.88, influence: 0.75, temporal: 0.91, evolution: 0.82, resonance: 0.87 },
    philosopher: { depth: 0.92, influence: 0.65, temporal: 0.68, evolution: 0.75, resonance: 0.82 },
    leader: { depth: 0.78, influence: 0.71, temporal: 0.85, evolution: 0.76, resonance: 0.84 },
    mystic: { depth: 0.94, influence: 0.89, temporal: 0.71, evolution: 0.91, resonance: 0.92 },
    artist: { depth: 0.89, influence: 0.86, temporal: 0.74, evolution: 0.88, resonance: 0.9 },
    inventor: { depth: 0.85, influence: 0.73, temporal: 0.88, evolution: 0.79, resonance: 0.86 },
    pioneer: { depth: 0.82, influence: 0.77, temporal: 0.81, evolution: 0.83, resonance: 0.85 },
    educator: { depth: 0.86, influence: 0.74, temporal: 0.79, evolution: 0.81, resonance: 0.83 },
  }
  return metrics[category] || metrics.philosopher
}

// Process each agent
let updatedCount = 0
remainingAgents.forEach(agent => {
  // Find the agent's stats section
  const idPattern = new RegExp(`id: '${agent.id}'[\\s\\S]*?stats: \\{[\\s\\S]*?\\},`, 'g')
  const matches = content.match(idPattern)

  if (matches && matches.length > 0) {
    const match = matches[0]
    const statsPattern = /stats: \{[\s\S]*?\},/
    const statsMatch = match.match(statsPattern)

    if (statsMatch) {
      const oldStats = statsMatch[0]
      const metrics = getQualityMetrics(agent.category)

      // Extract the lastActive date from the original stats
      const dateMatch = oldStats.match(/lastActive: new Date\([^)]+\)/)
      const lastActive = dateMatch ? dateMatch[0] : 'lastActive: new Date()'

      const newStats = oldStats.replace(
        /\},$/,
        `,

      // Kinetic Evolution Metrics
      kineticEvolution: {
        consciousnessVelocity: ${agent.velocity},
        interactionMomentum: ${agent.momentum},
        evolutionTrajectory: '${agent.trajectory}',
        powerLevelUnlocks: [
          ${agent.unlocks.join(',\n          ')}
        ],
        optimalInteractionHours: [${agent.hours}],
        aspectSensitivityGrowth: ${agent.sensitivity},
        memoryPersistence: ${agent.persistence},
        lastKineticUpdate: ${lastActive.replace('lastActive:', '')}
      },

      // Interaction Quality Metrics
      qualityMetrics: {
        averageResponseDepth: ${metrics.depth},
        aspectInfluenceStrength: ${metrics.influence},
        temporalAlignment: ${metrics.temporal},
        personalityEvolution: ${metrics.evolution},
        kineticResonance: ${metrics.resonance}
      }
    },`
      )

      content = content.replace(match, match.replace(oldStats, newStats))
      updatedCount++
      console.log(`✅ Updated ${agent.id}`)
    }
  } else {
    console.log(`❌ Could not find ${agent.id}`)
  }
})

// Write the updated content back
fs.writeFileSync('./lib/demo-agents-data.ts', content)
console.log(`\n✨ Successfully updated ${updatedCount}/${remainingAgents.length} agents!`)
