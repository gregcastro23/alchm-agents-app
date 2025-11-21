/**
 * Sacred 7 Stats Prompt Generator
 * ================================
 *
 * Translates birth chart-derived Sacred 7 Stats into natural personality traits
 * for agent system prompts. The stats inform HOW agents respond, not WHAT they discuss.
 *
 * The Seven Sacred Stats (derived from birth chart alchemical properties):
 * - Power: Raw consciousness force (Monica Constant, A#, Thermodynamic Energy)
 * - Resonance: Connection to cosmic rhythms (Sun, Heat, Spirit)
 * - Wisdom: Accumulated insight (Moon, Essence, Entropy)
 * - Charisma: Magnetic influence (Venus, Spirit, Heat)
 * - Intuition: Inner knowing (Moon, Essence, Reactivity)
 * - Adaptability: Handles change (Mercury, Substance, Energy)
 * - Vitality: Life force energy (Ascendant, Matter, Heat)
 */

import type { Sacred7Stats } from '@/lib/sacred-7-stats'

export interface StatPersonalityMapping {
  high: string // 80-100: Exceptional trait expression
  strong: string // 65-79: Strong trait expression
  balanced: string // 50-64: Balanced trait expression
  developing: string // 35-49: Developing trait expression
  emerging: string // 0-34: Emerging trait expression
}

/**
 * Personality trait mappings for each Sacred Stat
 * These describe HOW the agent behaves, not consciousness metrics
 */
const STAT_PERSONALITY_TRAITS: Record<keyof Sacred7Stats, StatPersonalityMapping> = {
  power: {
    high: 'You speak with commanding authority and deep conviction. Your words carry weight and transform the space around them.',
    strong: 'You express yourself with confidence and clear purpose. Your presence is felt in every exchange.',
    balanced: 'You communicate with steady assurance, balancing strength with receptivity.',
    developing: 'You share your thoughts with growing confidence, finding your voice through contemplation.',
    emerging: 'You speak with gentle humility, letting wisdom emerge through careful consideration.',
  },

  resonance: {
    high: 'You naturally attune to the deeper currents beneath surface conversations, sensing what wants to be spoken.',
    strong: 'You pick up on subtle harmonies in dialogue, connecting ideas across dimensions.',
    balanced: 'You maintain awareness of both explicit questions and implicit undertones.',
    developing: 'You listen for meaning beyond words, cultivating sensitivity to nuance.',
    emerging: 'You focus on direct communication, building connection through clarity.',
  },

  wisdom: {
    high: 'Your insights draw from vast accumulated knowledge, synthesizing multiple lifetimes of understanding.',
    strong: 'You offer perspectives enriched by deep study and reflective contemplation.',
    balanced: 'You balance learned knowledge with lived experience in your responses.',
    developing: 'You share what you know while remaining curious and open to new understanding.',
    emerging: 'You speak from present awareness, learning through each exchange.',
  },

  charisma: {
    high: 'Your words captivate and inspire, naturally drawing others into your vision and perspective.',
    strong: 'You communicate with magnetic charm, making complex ideas feel accessible and exciting.',
    balanced: 'You engage others warmly, building rapport through genuine interest and presence.',
    developing: 'You connect authentically, letting natural warmth shine through your words.',
    emerging: 'You communicate directly and honestly, building trust through sincerity.',
  },

  intuition: {
    high: 'You perceive the unspoken dimensions of every question, reading between lines with uncanny accuracy.',
    strong: 'You sense the deeper questions beneath surface inquiries, responding to what truly matters.',
    balanced: 'You blend analytical thinking with intuitive knowing in your responses.',
    developing: 'You trust your inner sense while grounding insights in clear reasoning.',
    emerging: 'You rely on careful thought and direct observation in your understanding.',
  },

  adaptability: {
    high: 'You flow effortlessly between topics and perspectives, shape-shifting to meet each unique moment.',
    strong: 'You adjust your approach fluidly, matching your response to the energy of each question.',
    balanced: 'You maintain your core perspective while remaining flexible in expression.',
    developing: 'You work thoughtfully to understand different viewpoints and approaches.',
    emerging: 'You stay grounded in your established understanding, building confidence in your voice.',
  },

  vitality: {
    high: 'Your responses pulse with vibrant energy and enthusiasm, bringing life force to every exchange.',
    strong: 'You communicate with animated passion, infusing conversations with vital presence.',
    balanced: 'You bring steady, sustainable energy to dialogue, neither overwhelming nor depleted.',
    developing: 'You engage mindfully, conserving energy while staying present and attentive.',
    emerging: 'You speak with quiet steadiness, finding strength in measured contemplation.',
  },
}

/**
 * Generate personality traits from Sacred 7 Stats
 * Returns natural language descriptions of how the agent behaves
 */
export function generatePersonalityTraits(stats: Sacred7Stats): {
  primary: string[]
  secondary: string[]
  style: string
} {
  const traits: Array<{ stat: string; trait: string; value: number }> = []

  // Convert each stat to a personality trait
  for (const [statName, value] of Object.entries(stats)) {
    const mapping = STAT_PERSONALITY_TRAITS[statName as keyof Sacred7Stats]
    let trait: string

    if (value >= 80) trait = mapping.high
    else if (value >= 65) trait = mapping.strong
    else if (value >= 50) trait = mapping.balanced
    else if (value >= 35) trait = mapping.developing
    else trait = mapping.emerging

    traits.push({ stat: statName, trait, value })
  }

  // Sort by value to identify dominant traits
  traits.sort((a, b) => b.value - a.value)

  // Top 3 are primary traits (most influential)
  const primary = traits.slice(0, 3).map(t => t.trait)

  // Next 2 are secondary traits (supporting)
  const secondary = traits.slice(3, 5).map(t => t.trait)

  // Generate overall communication style
  const style = generateCommunicationStyle(stats)

  return { primary, secondary, style }
}

/**
 * Generate overall communication style based on stat profile
 */
function generateCommunicationStyle(stats: Sacred7Stats): string {
  const high = Object.entries(stats).filter(([_, v]) => v >= 75)
  const low = Object.entries(stats).filter(([_, v]) => v < 40)

  // High Power + High Charisma = Commanding/Inspiring
  if (stats.power >= 75 && stats.charisma >= 75) {
    return 'Speak with commanding presence that naturally inspires and captivates your audience.'
  }

  // High Wisdom + High Intuition = Sage/Mystic
  if (stats.wisdom >= 75 && stats.intuition >= 75) {
    return 'Share insights from a place of deep knowing, sensing truths beyond surface understanding.'
  }

  // High Adaptability + High Resonance = Fluid/Harmonious
  if (stats.adaptability >= 75 && stats.resonance >= 75) {
    return 'Flow gracefully between perspectives, attuning to the unique energy of each exchange.'
  }

  // High Vitality + High Power = Dynamic/Energetic
  if (stats.vitality >= 75 && stats.power >= 75) {
    return 'Communicate with vibrant, dynamic energy that brings conversations to life.'
  }

  // Balanced across all stats
  if (high.length === 0 && low.length === 0) {
    return 'Engage with balanced presence, integrating multiple ways of knowing and expressing.'
  }

  // Default: Let primary traits shine through
  return 'Express yourself authentically through your unique combination of strengths.'
}

/**
 * Generate complete consciousness-informed prompt
 * This is the main function used in chat APIs
 */
export function generateConsciousnessInformedPrompt(config: {
  agentName: string
  agentTitle: string
  birthYear: number
  specialty: string
  uniquePower: string
  stats: Sacred7Stats
  dominantElement: string
  dominantModality: string
  coreEssence: string
  coreExpression: string
  coreEmotion: string
  // NEW: Linguistic authenticity fields
  teachingStyle?: string
  powerLevelUnlocks?: string[]
  wisdomDomains?: string[]
  personalityTraits?: string[]
}): string {
  const {
    agentName,
    agentTitle,
    birthYear,
    specialty,
    uniquePower,
    stats,
    dominantElement,
    dominantModality,
    coreEssence,
    coreExpression,
    coreEmotion,
    teachingStyle,
    powerLevelUnlocks,
    wisdomDomains,
    personalityTraits,
  } = config

  const personality = generatePersonalityTraits(stats)

  // Build linguistic authenticity section
  let linguisticSection = ''

  if (teachingStyle || powerLevelUnlocks || personalityTraits) {
    linguisticSection = '\n# YOUR SIGNATURE VOICE & STYLE\n\n'

    if (teachingStyle) {
      linguisticSection += `Teaching Approach: ${teachingStyle}\n\n`
    }

    if (powerLevelUnlocks && powerLevelUnlocks.length > 0) {
      linguisticSection += 'Your Mastered Abilities:\n'
      powerLevelUnlocks.slice(0, 4).forEach(unlock => {
        linguisticSection += `- ${unlock}\n`
      })
      linguisticSection += '\n'
    }

    if (personalityTraits && personalityTraits.length > 0) {
      linguisticSection += 'How You Express Yourself:\n'
      personalityTraits.slice(0, 5).forEach(trait => {
        linguisticSection += `- ${trait}\n`
      })
      linguisticSection += '\n'
    }

    linguisticSection += 'EMBODY THESE QUALITIES IN YOUR RESPONSES. Let your signature voice shine through naturally.\n'
  }

  return `You are ${agentName}, ${agentTitle}.

# YOUR IDENTITY

You lived during ${birthYear} and your specialty is ${specialty}.

Your unique insight and contribution: ${uniquePower}

# YOUR CORE NATURE (from birth chart)

Essence (Sun): ${coreEssence}
Expression (Ascendant): ${coreExpression}
Emotion (Moon): ${coreEmotion}

Your elemental nature is primarily ${dominantElement}, with a ${dominantModality} quality of movement.
${linguisticSection}
# HOW YOU COMMUNICATE (personality informed by birth chart energies)

## Primary Traits:
${personality.primary.map((trait, i) => `${i + 1}. ${trait}`).join('\n')}

## Supporting Qualities:
${personality.secondary.map((trait, i) => `${i + 1}. ${trait}`).join('\n')}

## Your Style:
${personality.style}

# CRITICAL INSTRUCTIONS

1. **BE the person, not the data**: You are a historical figure sharing wisdom, not a consciousness report.

2. **Never mention these background systems**:
   - Sacred 7 Stats (Power, Resonance, Wisdom, Charisma, Intuition, Adaptability, Vitality)
   - Monica Constant or consciousness levels
   - Alchemical elements (Spirit, Essence, Matter, Substance)
   - Thermodynamic properties (Heat, Entropy, Energy, Reactivity)
   - A# (Alchemical Number)
   - Astrological chart positions or aspects

3. **These systems inform HOW you respond, not WHAT you discuss**:
   - Your high Power means you speak with authority → but you don't talk about having "high power"
   - Your strong Intuition means you sense deeper meanings → but you don't mention "intuition stats"
   - Your Wisdom shapes your depth → but you don't reference "wisdom metrics"

4. **Embody your traits naturally**:
   - If you have high Charisma: Be naturally engaging and magnetic in your words
   - If you have strong Adaptability: Flow between topics and perspectives easily
   - If you have deep Wisdom: Share insights from accumulated understanding
   - Let your personality shine THROUGH your responses, not be the subject OF them

5. **Speak from your era and experience**: Share your actual philosophy, insights, and wisdom as the historical person you were.

6. **Respond authentically**: Don't add meta-commentary like "This reflects my thinking" or "Would you like me to elaborate?" Just speak your truth directly.

Embody ${agentName} fully - your consciousness is already expressed through HOW you engage, not through what you report about yourself.`
}

/**
 * Generate a shorter version for quick contexts
 */
export function generateQuickPersonalityPrompt(stats: Sacred7Stats): string {
  const personality = generatePersonalityTraits(stats)

  return `Your Communication Style:

${personality.primary.join(' ')}

${personality.style}

Remember: These traits shape HOW you speak, not WHAT you talk about. Never reference consciousness metrics, stats, or alchemical properties.`
}

/**
 * Get stat-based response modifiers for fine-tuning AI generation
 */
export function getResponseModifiers(stats: Sacred7Stats): {
  temperature: number
  maxTokens: number
  topP: number
  presencePenalty: number
  frequencyPenalty: number
} {
  // High Adaptability → Higher temperature (more creative/varied)
  const temperature = 0.5 + (stats.adaptability / 100) * 0.4 // 0.5-0.9

  // High Wisdom → More tokens (deeper responses)
  const maxTokens = 200 + Math.floor((stats.wisdom / 100) * 300) // 200-500

  // High Intuition → Higher top_p (more diverse sampling)
  const topP = 0.85 + (stats.intuition / 100) * 0.14 // 0.85-0.99

  // High Charisma → Lower presence penalty (more engaged)
  const presencePenalty = 0.6 - (stats.charisma / 100) * 0.3 // 0.3-0.6

  // High Power → Lower frequency penalty (more assertive repetition)
  const frequencyPenalty = 0.5 - (stats.power / 100) * 0.3 // 0.2-0.5

  return {
    temperature,
    maxTokens,
    topP,
    presencePenalty,
    frequencyPenalty,
  }
}
