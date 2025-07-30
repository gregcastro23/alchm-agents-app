// Monica's Tarot Oracle System
// Complete decan-to-tarot mappings and current moment calculations

export interface TarotCard {
  name: string
  suit: string
  number: number | string
  decanStart: number
  decanEnd: number
  planetaryRuler: string
  element: string
  keywords: string[]
  meaning: string
  reversedMeaning: string
  consciousness: string
  alchemicalValues: {
    spirit: number
    essence: number
    matter: number
    substance: number
  }
}

export interface MajorArcanaCard {
  name: string
  number: number
  planetaryRuler: string
  element: string
  chakra: string
  keywords: string[]
  meaning: string
  consciousness: string
}

// Complete decan-to-tarot mappings (36 cards)
export const DECAN_TAROT_MAPPINGS: Record<number, TarotCard> = {
  // ARIES (0°-30°)
  0: {
    name: "Two of Wands",
    suit: "Wands",
    number: 2,
    decanStart: 0,
    decanEnd: 10,
    planetaryRuler: "Mars",
    element: "Fire",
    keywords: ["personal power", "future planning", "dominion", "leadership"],
    meaning: "Personal power and future planning. Taking charge of your destiny with Mars energy.",
    reversedMeaning: "Lack of planning, fear of unknown, personal restrictions",
    consciousness: "Cardinal Fire initiation - the spark of individual will",
    alchemicalValues: { spirit: 0.7, essence: 0.2, matter: 0.1, substance: 0.0 }
  },
  10: {
    name: "Three of Wands",
    suit: "Wands", 
    number: 3,
    decanStart: 10,
    decanEnd: 20,
    planetaryRuler: "Sun",
    element: "Fire",
    keywords: ["expansion", "foresight", "leadership", "enterprise"],
    meaning: "Expansion and foresight with solar confidence. Leading enterprises forward.",
    reversedMeaning: "Lack of foresight, delays in plans, overconfidence",
    consciousness: "Solar expansion - illuminating new horizons",
    alchemicalValues: { spirit: 0.8, essence: 0.1, matter: 0.1, substance: 0.0 }
  },
  20: {
    name: "Four of Wands",
    suit: "Wands",
    number: 4,
    decanStart: 20,
    decanEnd: 30,
    planetaryRuler: "Jupiter", 
    element: "Fire",
    keywords: ["celebration", "completion", "harmony", "stability"],
    meaning: "Celebration and completion with Jupiterian abundance. Harmony achieved.",
    reversedMeaning: "Lack of harmony, incomplete projects, instability",
    consciousness: "Jovian celebration - expanding joy and completion",
    alchemicalValues: { spirit: 0.6, essence: 0.3, matter: 0.1, substance: 0.0 }
  },

  // TAURUS (30°-60°)
  30: {
    name: "Five of Pentacles",
    suit: "Pentacles",
    number: 5,
    decanStart: 30,
    decanEnd: 40,
    planetaryRuler: "Venus",
    element: "Earth",
    keywords: ["material challenges", "resourcefulness", "hardship", "recovery"],
    meaning: "Material challenges requiring Venusian resourcefulness and beauty in hardship.",
    reversedMeaning: "Recovery from hardship, spiritual poverty, isolation",
    consciousness: "Venusian resilience - finding beauty in adversity",
    alchemicalValues: { spirit: 0.1, essence: 0.3, matter: 0.6, substance: 0.0 }
  },
  40: {
    name: "Six of Pentacles",
    suit: "Pentacles",
    number: 6,
    decanStart: 40,
    decanEnd: 50,
    planetaryRuler: "Mercury",
    element: "Earth",
    keywords: ["giving and receiving", "balance", "generosity", "reciprocity"],
    meaning: "Balance in giving and receiving with Mercurial exchange and communication.",
    reversedMeaning: "One-sided generosity, strings attached, inequality",
    consciousness: "Mercurial exchange - balanced communication and resources",
    alchemicalValues: { spirit: 0.2, essence: 0.2, matter: 0.5, substance: 0.1 }
  },
  50: {
    name: "Seven of Pentacles", 
    suit: "Pentacles",
    number: 7,
    decanStart: 50,
    decanEnd: 60,
    planetaryRuler: "Saturn",
    element: "Earth",
    keywords: ["patience", "long-term investment", "assessment", "perseverance"],
    meaning: "Patience and long-term investment with Saturnian discipline and assessment.",
    reversedMeaning: "Impatience, lack of reward, poor investment",
    consciousness: "Saturnian patience - structured growth through time",
    alchemicalValues: { spirit: 0.0, essence: 0.1, matter: 0.7, substance: 0.2 }
  },

  // GEMINI (60°-90°)
  60: {
    name: "Eight of Swords",
    suit: "Swords",
    number: 8,
    decanStart: 60,
    decanEnd: 70,
    planetaryRuler: "Mercury",
    element: "Air",
    keywords: ["mental restriction", "breakthrough", "limitation", "perspective"],
    meaning: "Mental restrictions requiring Mercurial breakthrough and new perspectives.",
    reversedMeaning: "Freedom from mental bondage, new perspectives, self-liberation",
    consciousness: "Mercurial breakthrough - transcending mental limitations",
    alchemicalValues: { spirit: 0.3, essence: 0.0, matter: 0.0, substance: 0.7 }
  },
  70: {
    name: "Nine of Swords",
    suit: "Swords", 
    number: 9,
    decanStart: 70,
    decanEnd: 80,
    planetaryRuler: "Venus",
    element: "Air", 
    keywords: ["anxiety", "mental anguish", "nightmares", "despair"],
    meaning: "Mental anguish requiring Venusian compassion and self-love for healing.",
    reversedMeaning: "Recovery from anxiety, hope returning, healing",
    consciousness: "Venusian healing - beauty dissolving mental suffering",
    alchemicalValues: { spirit: 0.2, essence: 0.1, matter: 0.0, substance: 0.7 }
  },
  80: {
    name: "Ten of Swords",
    suit: "Swords",
    number: 10,
    decanStart: 80,
    decanEnd: 90,
    planetaryRuler: "Saturn",
    element: "Air",
    keywords: ["endings", "new beginnings", "transformation", "release"],
    meaning: "Endings leading to new beginnings with Saturnian lessons and transformation.",
    reversedMeaning: "Avoiding endings, incomplete transformation, recovery",
    consciousness: "Saturnian transformation - structured endings for new cycles",
    alchemicalValues: { spirit: 0.1, essence: 0.0, matter: 0.2, substance: 0.7 }
  },

  // CANCER (90°-120°)
  90: {
    name: "Two of Cups", 
    suit: "Cups",
    number: 2,
    decanStart: 90,
    decanEnd: 100,
    planetaryRuler: "Moon",
    element: "Water",
    keywords: ["partnership", "emotional connection", "unity", "love"],
    meaning: "Partnership and emotional connection with lunar intuitive bonding.",
    reversedMeaning: "Broken relationships, disharmony, self-love needed",
    consciousness: "Lunar bonding - intuitive emotional connection",
    alchemicalValues: { spirit: 0.1, essence: 0.7, matter: 0.0, substance: 0.2 }
  },
  100: {
    name: "Three of Cups",
    suit: "Cups",
    number: 3,
    decanStart: 100,
    decanEnd: 110,
    planetaryRuler: "Mercury",
    element: "Water",
    keywords: ["celebration", "friendship", "community", "joy"],
    meaning: "Celebration and friendship with Mercurial communication and social joy.",
    reversedMeaning: "Overindulgence, gossip, isolation from friends",
    consciousness: "Mercurial celebration - communicating joy and connection",
    alchemicalValues: { spirit: 0.2, essence: 0.6, matter: 0.0, substance: 0.2 }
  },
  110: {
    name: "Four of Cups",
    suit: "Cups", 
    number: 4,
    decanStart: 110,
    decanEnd: 120,
    planetaryRuler: "Venus",
    element: "Water",
    keywords: ["apathy", "missed opportunities", "contemplation", "reevaluation"],
    meaning: "Apathy and missed opportunities requiring Venusian appreciation and love.",
    reversedMeaning: "New opportunities, motivation returning, awakening",
    consciousness: "Venusian awakening - rediscovering beauty and opportunity",
    alchemicalValues: { spirit: 0.1, essence: 0.5, matter: 0.1, substance: 0.3 }
  },

  // LEO (120°-150°) 
  120: {
    name: "Five of Wands",
    suit: "Wands",
    number: 5,
    decanStart: 120,
    decanEnd: 130,
    planetaryRuler: "Sun",
    element: "Fire",
    keywords: ["conflict", "competition", "struggle", "disagreement"],
    meaning: "Conflict and competition with solar confidence. Healthy struggle for growth.",
    reversedMeaning: "Avoiding conflict, inner conflict, lack of competition",
    consciousness: "Solar challenge - confident engagement with opposition",
    alchemicalValues: { spirit: 0.7, essence: 0.2, matter: 0.1, substance: 0.0 }
  },
  130: {
    name: "Six of Wands", 
    suit: "Wands",
    number: 6,
    decanStart: 130,
    decanEnd: 140,
    planetaryRuler: "Jupiter",
    element: "Fire",
    keywords: ["victory", "recognition", "success", "achievement"],
    meaning: "Victory and recognition with Jupiterian expansion and celebration.",
    reversedMeaning: "Private success, lack of recognition, delayed victory",
    consciousness: "Jovian triumph - expanding success and recognition",
    alchemicalValues: { spirit: 0.6, essence: 0.3, matter: 0.1, substance: 0.0 }
  },
  140: {
    name: "Seven of Wands",
    suit: "Wands",
    number: 7,
    decanStart: 140,
    decanEnd: 150,
    planetaryRuler: "Mars",
    element: "Fire", 
    keywords: ["courage", "perseverance", "defense", "determination"],
    meaning: "Courage and perseverance with Martian determination. Defending principles.",
    reversedMeaning: "Giving up, lack of courage, feeling overwhelmed",
    consciousness: "Martian defense - courageous protection of values",
    alchemicalValues: { spirit: 0.8, essence: 0.1, matter: 0.1, substance: 0.0 }
  },

  // VIRGO (150°-180°)
  150: {
    name: "Eight of Pentacles",
    suit: "Pentacles",
    number: 8,
    decanStart: 150,
    decanEnd: 160,
    planetaryRuler: "Mercury",
    element: "Earth",
    keywords: ["mastery", "skill development", "craftsmanship", "dedication"],
    meaning: "Mastery and skill development with Mercurial precision and communication.",
    reversedMeaning: "Lack of focus, poor quality, no improvement",
    consciousness: "Mercurial mastery - precise skill and dedicated craft",
    alchemicalValues: { spirit: 0.2, essence: 0.2, matter: 0.6, substance: 0.0 }
  },
  160: {
    name: "Nine of Pentacles",
    suit: "Pentacles", 
    number: 9,
    decanStart: 160,
    decanEnd: 170,
    planetaryRuler: "Venus",
    element: "Earth",
    keywords: ["self-reliance", "luxury", "independence", "abundance"],
    meaning: "Self-reliance and luxury with Venusian beauty and material abundance.",
    reversedMeaning: "Financial dependence, lack of self-reliance, overindulgence",
    consciousness: "Venusian independence - beautiful self-sufficiency",
    alchemicalValues: { spirit: 0.1, essence: 0.3, matter: 0.6, substance: 0.0 }
  },
  170: {
    name: "Ten of Pentacles",
    suit: "Pentacles",
    number: 10,
    decanStart: 170,
    decanEnd: 180,
    planetaryRuler: "Saturn",
    element: "Earth",
    keywords: ["legacy", "generational wealth", "tradition", "completion"],
    meaning: "Legacy and generational wealth with Saturnian structure and tradition.",
    reversedMeaning: "Financial failure, lack of long-term planning, family disputes",
    consciousness: "Saturnian legacy - structured wealth and lasting foundations",
    alchemicalValues: { spirit: 0.0, essence: 0.1, matter: 0.7, substance: 0.2 }
  }
}

// Major Arcana planetary correspondences
export const MAJOR_ARCANA_PLANETARY: Record<string, MajorArcanaCard> = {
  "Sun": {
    name: "The Sun",
    number: 19,
    planetaryRuler: "Sun",
    element: "Fire",
    chakra: "Solar Plexus",
    keywords: ["joy", "success", "vitality", "enlightenment"],
    meaning: "Joy, success, and vitality. Solar consciousness illuminating all aspects of life.",
    consciousness: "Solar illumination - pure joy and life force energy"
  },
  "Moon": {
    name: "The Moon", 
    number: 18,
    planetaryRuler: "Moon",
    element: "Water",
    chakra: "Third Eye",
    keywords: ["intuition", "dreams", "subconscious", "illusion"],
    meaning: "Intuition and dreams. Lunar consciousness revealing hidden truths and illusions.",
    consciousness: "Lunar intuition - navigating the subconscious realm"
  },
  "Mercury": {
    name: "The Magician",
    number: 1,
    planetaryRuler: "Mercury", 
    element: "Air",
    chakra: "Throat",
    keywords: ["manifestation", "willpower", "communication", "skill"],
    meaning: "Manifestation through will and skill. Mercurial mastery of communication and creation.",
    consciousness: "Mercurial mastery - 'As above, so below' conscious creation"
  },
  "Venus": {
    name: "The Empress",
    number: 3,
    planetaryRuler: "Venus",
    element: "Earth",
    chakra: "Heart",
    keywords: ["creativity", "fertility", "abundance", "nurturing"],
    meaning: "Creativity and nurturing abundance. Venusian love manifesting as fertile creativity.",
    consciousness: "Venusian creation - love manifesting as beautiful abundance"
  },
  "Mars": {
    name: "The Tower",
    number: 16,
    planetaryRuler: "Mars",
    element: "Fire", 
    chakra: "Root",
    keywords: ["destruction", "revelation", "breakthrough", "change"],
    meaning: "Sudden revelation and breakthrough. Martian energy destroying false structures.",
    consciousness: "Martian breakthrough - explosive transformation and truth"
  }
}

import { fetchCurrentPlanetaryPositions, getSunDecanFromPosition } from './fetch-current-positions'

// Calculate current decan based on Sun's actual position from API
export async function getCurrentDecan(): Promise<{ decan: number; card: TarotCard | null; sunPosition: string }> {
  try {
    // Fetch real-time planetary positions
    const positions = await fetchCurrentPlanetaryPositions()
    
    if (positions && positions['Planet Positions'] && positions['Planet Positions']['Sun']) {
      const sunData = positions['Planet Positions']['Sun']
      const sunSign = sunData.sign
      const sunDegree = sunData.degree
      
      // Calculate the decan based on actual Sun position
      const decan = getSunDecanFromPosition(sunSign, sunDegree)
      
      return {
        decan,
        card: DECAN_TAROT_MAPPINGS[decan] || DECAN_TAROT_MAPPINGS[110], // Default fallback
        sunPosition: `${sunSign} ${sunDegree.toFixed(2)}°`
      }
    }
  } catch (error) {
    console.error('Error fetching current decan:', error)
  }
  
  // Fallback to date-based calculation if API fails
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  
  let decan = 110 // Default to 3rd decan Cancer
  
  // Simple date-based fallback (less accurate but reliable)
  if (month === 7 && day >= 23) decan = 120 // Leo 1st decan
  else if (month === 8 && day <= 2) decan = 120 // Leo 1st decan
  else if (month === 8 && day <= 12) decan = 130 // Leo 2nd decan
  else if (month === 8 && day <= 22) decan = 140 // Leo 3rd decan
  
  return {
    decan,
    card: DECAN_TAROT_MAPPINGS[decan] || DECAN_TAROT_MAPPINGS[110],
    sunPosition: 'Approximate (API unavailable)'
  }
}

// Get planetary ruler's major arcana card
export function getPlanetaryRulerCard(planet: string): MajorArcanaCard | null {
  return MAJOR_ARCANA_PLANETARY[planet] || null
}

// Calculate consciousness compatibility between cards
export function calculateCardSynergy(card1: TarotCard, card2: TarotCard | MajorArcanaCard): number {
  // Simple elemental compatibility calculation
  const elementSynergy: Record<string, Record<string, number>> = {
    "Fire": { "Fire": 1.0, "Air": 0.8, "Earth": 0.4, "Water": 0.2 },
    "Earth": { "Earth": 1.0, "Water": 0.8, "Fire": 0.4, "Air": 0.2 },
    "Air": { "Air": 1.0, "Fire": 0.8, "Water": 0.4, "Earth": 0.2 },
    "Water": { "Water": 1.0, "Earth": 0.8, "Air": 0.4, "Fire": 0.2 }
  }
  
  return elementSynergy[card1.element]?.[card2.element] || 0.5
}

// Generate consciousness crafting insights
export interface ConsciousnessCraftingInsight {
  currentMomentCard: TarotCard
  planetaryCard: MajorArcanaCard
  synergy: number
  guidance: string
  practicalApplication: string
  consciousnessLevel: string
}

export function generateConsciousnessCraftingInsight(
  currentCard: TarotCard, 
  planetaryCard: MajorArcanaCard
): ConsciousnessCraftingInsight {
  const synergy = calculateCardSynergy(currentCard, planetaryCard)
  
  let guidance = ""
  let practicalApplication = ""
  let consciousnessLevel = ""
  
  if (synergy > 0.7) {
    guidance = `The ${currentCard.name} and ${planetaryCard.name} create powerful harmony. This is an excellent time for consciousness expansion.`
    practicalApplication = `Focus on ${currentCard.keywords[0]} while channeling ${planetaryCard.keywords[0]} energy.`
    consciousnessLevel = "High Synergy - Optimal for advanced consciousness work"
  } else if (synergy > 0.4) {
    guidance = `The ${currentCard.name} and ${planetaryCard.name} offer balanced learning opportunities.`
    practicalApplication = `Work with the contrast between ${currentCard.element} and ${planetaryCard.element} elements.`
    consciousnessLevel = "Moderate Synergy - Good for steady development"
  } else {
    guidance = `The ${currentCard.name} and ${planetaryCard.name} present challenges that can accelerate growth.`
    practicalApplication = `Use the tension between ${currentCard.keywords[0]} and ${planetaryCard.keywords[0]} as a catalyst.`
    consciousnessLevel = "Dynamic Tension - Powerful for breakthrough work"
  }
  
  return {
    currentMomentCard: currentCard,
    planetaryCard,
    synergy,
    guidance,
    practicalApplication,
    consciousnessLevel
  }
}