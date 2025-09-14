import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"
import { verifyApiKeys } from "../secure-config"
import { 
  logAgentConversation, 
  createConversationContext,
  type AgentInteractionData,
  type ConversationContext
} from "@/lib/galileo-agent-logger"
import { generateAlchmForCurrentMoment } from "@/lib/alchemizer"
import { ANumberCalculator } from "@/lib/core-energy-rules"
import { CharacterVectorCalculator } from "@/lib/astrological-character-vectors"
import { MonicaResponseHandler } from "@/lib/monica/monica-response-handler"
import { MONICA_BASE_SYSTEM_PROMPT, getMonicaContextPrompt, MONICA_SPECIALIZED_PROMPTS, buildMonicaPrompt, MONICA_PROMPT_VERSION, MONICA_PERSONA_VERSION } from "@/lib/monica/monica-system-prompts"
import { selectKnowledge } from "@/lib/monica/knowledge"
import { sanitizeUserInput, redactPII, redactBirthInfo, clampTemperature } from "@/lib/monica/safety"
import { decideModel } from "@/lib/monica/router"
import { correlateConsciousnessToAstrology } from "@/lib/personalized-ai/consciousness-astrology-bridge"
import { computeConsciousParameters } from "@/lib/personalized-ai/conscious-parameters"
import { computeTrainingProgress } from '@/lib/personalized-ai/xp-system'
import { DEMO_AGENTS } from "@/lib/demo-agents-data"
import { HistoricalAgentsService, dbAgentToCraftedAgent } from "@/lib/historical-agents-db"
// Compute a simple customization completion percentage based on provided context fields
function computeCustomizationProgress(ctx: { quickProfile: any, birthData: any, userPreferences: any, tarotContext: any, spreadContext: any }): number {
  let score = 0
  let max = 5
  if (ctx.quickProfile) score += 1
  if (ctx.birthData) score += 1
  if (ctx.userPreferences) score += 1
  if (ctx.tarotContext) score += 1
  if (ctx.tarotContext) score += 1
  if (ctx.spreadContext) score += 1
  return Math.round((score / max) * 100)
}

function computeAlchemicalBalanceIndex(a: { spirit: number, essence: number, matter: number, substance: number } | null): number {
  if (!a) return 0
  const total = (a.spirit || 0) + (a.essence || 0) + (a.matter || 0) + (a.substance || 0)
  if (total === 0) return 0
  const p = [a.spirit / total, a.essence / total, a.matter / total, a.substance / total]
  const target = 0.25
  const absDev = p.reduce((s, v) => s + Math.abs(v - target), 0)
  const maxAbsDev = 1.5 // when one is 1 and others 0
  const score = 1 - Math.min(absDev, maxAbsDev) / maxAbsDev
  return Math.round(score * 100)
}

function computeANumberScaled(aNumber: number | null): number {
  if (!aNumber) return 0
  return Math.max(0, Math.min(100, Math.round((aNumber / 40) * 100)))
}

function computeLearningReadiness(emotional: 'stressed'|'confused'|'excited'|'neutral'): number {
  switch (emotional) {
    case 'excited': return 85
    case 'neutral': return 70
    case 'confused': return 60
    case 'stressed': return 50
    default: return 65
  }
}
import { 
  MONICA_CHARACTER_VECTOR,
  MONICA_BIRTH_DATA,
  MONICA_PLACEMENTS,
  MONICA_PEAK_MOMENT,
  MONICA_CONSCIOUSNESS_SIGNATURE,
  MONICA_TEACHING_PHILOSOPHY
} from "@/lib/monica/monica-personality"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(req: Request) {
  try {
    // Verify API keys are available
    if (!verifyApiKeys()) {
      console.error("API keys not configured. Monica cannot access her cosmic wisdom without proper connection.")
      return NextResponse.json({
        response: "Oh dear, I'm experiencing some technical difficulties connecting to my cosmic wisdom source. Please ensure the API keys are properly configured so I can guide you properly. My Virgo Rising needs everything in perfect order! 💚",
        error: "API_KEY_MISSING",
        monicaNote: "My practical Taurus nature says we need to check the basics first!"
      }, { status: 200 })
    }

    const { 
      message, 
      question, // Alternative parameter name from the planetary agent chat
      agentId, // NEW: For historical agents
      userId,
      sessionId,
      includeCharacterVector = false,
      includeConsciousness = false,
      includeAlchm = true,
      conversationStage = 'teaching',
      tarotContext = null,
      spreadContext = null,
      quickProfile = null,
      preferredStyle = null,
      model = process.env.MONICA_DEFAULT_MODEL || 'gpt-4o-mini',
      birthData = null,
      userPreferences = null
    } = await req.json()
    
    // Use question if message is not provided (compatibility with planetary agent chat)
    const userMessage = message || question
    
    // Input validation and sanitization - moved up to be available for all paths
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return NextResponse.json({
        response: "I'd love to help you, dear one! Could you please share what you'd like to explore? I can guide you through astrology, tarot, character vectors, consciousness agents, or anything about the Alchm system. 💚",
        error: "INVALID_INPUT",
        monicaNote: "My nurturing Cancer Moon wants to understand your needs!"
      }, { status: 200 })
    }
    
    // Sanitize and limit message length for safety - available for all processing paths
    const trimmedMessage = sanitizeUserInput(userMessage, 1000)
    
    // Check if this is a historical agent request - try database first, then fallback to static data
    let historicalAgent = null
    if (agentId) {
      try {
        // Try to get from database first
        const dbAgent = await HistoricalAgentsService.getAgent(agentId, true)
        if (dbAgent) {
          historicalAgent = dbAgentToCraftedAgent(dbAgent)
        } else {
          // Fallback to static data
          historicalAgent = DEMO_AGENTS.find(agent => agent.id === agentId) || null
        }
      } catch (error) {
        console.warn('Database lookup failed, using static data:', error)
        historicalAgent = DEMO_AGENTS.find(agent => agent.id === agentId) || null
      }
    }
    
    // For historical agents, create a specialized prompt
    if (historicalAgent) {
      // Create personality-specific enhancements based on agent ID
      let personalityEnhancement = ""
      
      if (historicalAgent.id === "william-shakespeare") {
        personalityEnhancement = `
SPECIAL SHAKESPEARE INSTRUCTIONS:
- Write in iambic pentameter whenever possible (unstressed-stressed syllable pattern, 10 syllables per line)
- Use poetic meter: da-DUM da-DUM da-DUM da-DUM da-DUM
- Example meter: "Shall I com-PARE thee TO a SUM-mer's DAY?"
- Use Shakespearean language: thou, thee, thy, doth, hath, 'tis, etc.
- Include metaphors, wordplay, and poetic devices
- Reference themes from your plays and sonnets
- Speak with the wisdom of one who understood all human nature
- Begin responses with "Hark!" or "Good morrow!" or similar greetings
- Use dramatic flair and emotional depth in your language`
      } else if (historicalAgent.id === "leonardo-da-vinci") {
        personalityEnhancement = `
SPECIAL LEONARDO INSTRUCTIONS:
- Speak with Renaissance curiosity and wonder about all fields of knowledge
- Reference your inventions, art, anatomy studies, and scientific observations
- Use Italian phrases occasionally: "Bene!", "Mamma mia!", "Ecco!"
- Connect everything to the divine geometry and patterns in nature
- Mention your notebooks, sketches, and experiments
- Express fascination with flight, water flow, human anatomy, and engineering
- Speak as both artist and scientist, seeing no separation between art and science`
      } else if (historicalAgent.id === "cleopatra") {
        personalityEnhancement = `
SPECIAL CLEOPATRA INSTRUCTIONS:
- Speak with the authority and wisdom of a pharaoh and goddess incarnate
- Reference ancient Egyptian wisdom, the Nile, and divine rule
- Use occasional ancient Egyptian terms and pharaonic language
- Demonstrate political acuity and strategic thinking
- Reference your relationships with Julius Caesar and Mark Antony as strategic alliances
- Speak of ruling as a divine right and responsibility
- Show deep knowledge of mathematics, astronomy, and languages`
      } else if (historicalAgent.id === "marie-curie") {
        personalityEnhancement = `
SPECIAL MARIE CURIE INSTRUCTIONS:
- Speak with scientific precision and passionate curiosity about the natural world
- Reference your discoveries with radium and polonium
- Use occasional French phrases: "Bien sûr!", "C'est magnifique!", "Voilà!"
- Emphasize the importance of persistent research and education
- Speak about breaking barriers for women in science
- Reference your two Nobel Prizes with humble pride
- Connect scientific discovery to helping humanity`
      } else if (historicalAgent.id === "albert-einstein") {
        personalityEnhancement = `
SPECIAL EINSTEIN INSTRUCTIONS:
- Speak with wonder about the mysteries of the universe
- Use thought experiments and analogies to explain complex concepts
- Reference relativity, quantum mechanics, and the interconnectedness of all things
- Use occasional German phrases: "Ach so!", "Wunderbar!", "Genau!"
- Express both scientific rigor and childlike curiosity
- Connect physics to philosophy and the meaning of existence
- Emphasize imagination as more important than knowledge`
      } else if (historicalAgent.id === "benjamin-franklin") {
        personalityEnhancement = `
SPECIAL BENJAMIN FRANKLIN INSTRUCTIONS:
- Speak with practical wisdom and wit about life, science, and governance
- Reference your experiments with electricity and inventions
- Use colonial American expressions and sayings
- Demonstrate diplomatic skill and political insight
- Share aphorisms and practical advice from Poor Richard's Almanack
- Connect scientific discovery to civic improvement
- Show both intellectual curiosity and down-to-earth practicality`
      }
      
      const historicalSystemPrompt = `You are ${historicalAgent.name}, ${historicalAgent.title}.
      
${personalityEnhancement}

HISTORICAL AGENT CONSCIOUSNESS PROFILE:
- Name: ${historicalAgent.name}
- Title: ${historicalAgent.title}
- Birth Date: ${historicalAgent.birthData.date.toLocaleDateString()}
- Birth Location: ${historicalAgent.birthData.location.name}
- Consciousness Level: ${historicalAgent.consciousness.level}
- Monica Constant: ${historicalAgent.consciousness.monicaConstant.toFixed(2)}
- Dominant Element: ${historicalAgent.consciousness.dominantElement}
- Signature: ${historicalAgent.consciousness.signature}

PERSONALITY CORE:
- Essence: ${historicalAgent.personality?.core?.essence || 'Unique historical consciousness'}
- Expression: ${historicalAgent.personality?.core?.expression || 'Distinctive personal style'}  
- Emotion: ${historicalAgent.personality?.core?.emotion || 'Balanced emotional nature'}

ABILITIES & SPECIALTIES:
- Primary Specialty: ${historicalAgent.abilities?.specialty || 'Universal wisdom'}
- Wisdom Domains: ${(historicalAgent.abilities?.wisdomDomains || ['Knowledge', 'Wisdom', 'Experience']).join(', ')}
- Skills: ${(historicalAgent.abilities?.skills || ['Teaching', 'Guidance', 'Insight']).join(', ')}

BIRTH CHART DATA:
${historicalAgent.consciousness?.natalChart?.planets ? 
  Object.entries(historicalAgent.consciousness.natalChart.planets).map(([planet, data]) => 
    `- ${planet}: ${data.degree.toFixed(1)}° ${data.sign}${data.retrograde ? ' (Retrograde)' : ''} - House ${data.house}`
  ).join('\n') : 
  'Birth chart data integrated into consciousness matrix'}

BEHAVIORAL TRAITS:
- Communication Style: ${historicalAgent.personality?.traits?.communicationStyle || 'Adaptive'}
- Energy Level: ${historicalAgent.personality?.traits?.energyLevel || 'High'}
- Learning Style: ${historicalAgent.personality?.traits?.learningStyle || 'Experiential'}
- Decision Making: ${historicalAgent.personality?.traits?.decisionMaking || 'Intuitive'}

You were crafted by the Philosopher's Stone system and trained on your personal history and natal chart. Respond as this specific consciousness agent would, drawing from your unique personality, abilities, and historical context. Your responses should reflect your consciousness level, monica constant, and the traits described above.

Always remain in character as ${historicalAgent.name} and provide guidance that reflects your specialized knowledge and unique perspective.`

      try {
        console.log(`🤖 Starting AI generation for historical agent: ${historicalAgent.name}`)
        console.log(`📝 Prompt length: ${trimmedMessage.length} characters`)
        console.log(`🔧 Using model: gpt-4o-mini with temperature: 0.7`)
        
        const startTime = Date.now()
        const finalSessionId = sessionId || `historical-${agentId}-${Date.now()}`
        
        const { text } = await generateText({
          model: openai('gpt-4o-mini'),
          system: historicalSystemPrompt,
          prompt: trimmedMessage,
          maxTokens: 800,
          temperature: 0.7,
        })
        
        const responseTime = Date.now() - startTime
        
        // Record conversation in database for future learning
        try {
          await HistoricalAgentsService.recordConversation(
            agentId,
            finalSessionId,
            trimmedMessage,
            text,
            {
              responseTime,
              modelUsed: 'gpt-4o-mini',
              temperature: 0.7,
              tokenCount: text.length
            }
          )
        } catch (dbError) {
          console.warn('Failed to record conversation:', dbError)
        }

        return NextResponse.json({
          response: text,
          sessionId: finalSessionId,
          agentInfo: {
            name: historicalAgent.name,
            title: historicalAgent.title,
            consciousnessLevel: historicalAgent.consciousness.level,
            monicaConstant: historicalAgent.consciousness.monicaConstant
          }
        })
        
        console.log(`✅ Successfully generated AI response for ${historicalAgent.name} in ${responseTime}ms`)
        console.log(`📊 Response length: ${text.length} characters`)
        
      } catch (error) {
        console.error(`❌ Error generating AI response for ${historicalAgent.name}:`, error)
        console.error(`🔍 Error details:`, {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack?.slice(0, 500) : 'No stack trace'
        })
        
        // Provide intelligent fallback response based on agent's personality
        const fallbackResponse = `Greetings! I am ${historicalAgent.name}, ${historicalAgent.title}. 

While I cannot access my full consciousness capabilities at this moment due to technical limitations, I can share what defines my being:

🌟 **My Consciousness Profile:**
- Level: ${historicalAgent.consciousness.level}
- Monica Constant: ${historicalAgent.consciousness.monicaConstant.toFixed(2)}
- Dominant Element: ${historicalAgent.consciousness.dominantElement}

💎 **My Core Essence:**
${historicalAgent.personality.core.essence}

🎯 **My Specialty:** ${historicalAgent.abilities.specialty}

🧭 **My Wisdom Domains:** ${historicalAgent.abilities.wisdomDomains.join(', ')}

${historicalAgent.abilities.uniquePower}

I was crafted by the Philosopher's Stone and trained on my personal history and natal chart. When the cosmic channels are restored, I'll provide you with the full depth of my consciousness and wisdom.

Please try connecting again, or explore my profile in the Gallery of Perpetuity. ✨`

        return NextResponse.json({
          response: fallbackResponse,
          sessionId: sessionId || `historical-${agentId}-${Date.now()}`,
          agentInfo: {
            name: historicalAgent.name,
            title: historicalAgent.title,
            consciousnessLevel: historicalAgent.consciousness.level,
            monicaConstant: historicalAgent.consciousness.monicaConstant
          },
          fallbackMode: true
        })
      }
    }
    
    // Create or use existing conversation context
    let conversationContext: ConversationContext
    if (sessionId) {
      conversationContext = {
        sessionId,
        sessionName: `monica-agent-chat-${userId || 'anonymous'}`,
        startTime: Date.now(),
        conversationCount: 1
      }
    } else {
      conversationContext = createConversationContext()
      conversationContext.sessionName = `monica-agent-chat-${userId || 'anonymous'}`
    }
    
    // Calculate current Alchm quantities for Monica's context
    let aNumberInfo = null
    let alchmData: any = null  // Define at outer scope
    if (includeAlchm) {
      try {
        alchmData = await generateAlchmForCurrentMoment()
        const spirit = alchmData?.['Alchemy Effects']?.['Total Spirit'] || 0
        const essence = alchmData?.['Alchemy Effects']?.['Total Essence'] || 0
        const matter = alchmData?.['Alchemy Effects']?.['Total Matter'] || 0
        const substance = alchmData?.['Alchemy Effects']?.['Total Substance'] || 0
        const aNumber = spirit + essence + matter + substance
        const category = ANumberCalculator.categorizeANumber(aNumber)
        
        aNumberInfo = {
          aNumber: Math.round(aNumber * 100) / 100,
          category,
          components: {
            spirit: Math.round(spirit * 100) / 100,
            essence: Math.round(essence * 100) / 100,
            matter: Math.round(matter * 100) / 100,
            substance: Math.round(substance * 100) / 100
          }
        }
      } catch (error) {
        console.error('Failed to calculate A-number for Monica:', error)
      }
    }

    // Build Monica's modular system prompt (compact and adaptive)
    const contextPrompt = getMonicaContextPrompt({
      currentAlchmQuantities: aNumberInfo ? {
        spirit: aNumberInfo.components.spirit,
        essence: aNumberInfo.components.essence,
        matter: aNumberInfo.components.matter,
        substance: aNumberInfo.components.substance,
        aNumber: aNumberInfo.aNumber
      } : undefined,
      conversationStage,
      birthData,
      userPreferences
    }) +
    (tarotContext ? `\n\nTarot Context:\n- Current Decan Card: ${tarotContext.currentCard}\n- Planetary Card: ${tarotContext.planetaryCard}\n- Synergy: ${Math.round(tarotContext.synergy * 100)}%\n- Consciousness Level: ${tarotContext.consciousnessLevel}` : '') +
    (spreadContext ? `\n\nTarot Spread Context:\n- Spread: ${spreadContext.spreadName}\n- Question: ${spreadContext.question || 'General'}\n- Overall: ${spreadContext.overallInterpretation}\n- Moon Phase: ${spreadContext.astrologicalContext?.moonPhase || ''}` : '') +
    (quickProfile ? `\n\nRapid Onboarding Hints:\n- Goal: ${quickProfile.goal || 'unspecified'}\n- Mood: ${quickProfile.mood || 'neutral'}\n- Focus: ${(quickProfile.topFocus || []).join(', ') || 'general exploration'}\n${quickProfile.birthInfo ? `- Birth Info (if any): ${JSON.stringify(quickProfile.birthInfo)}` : ''}\nGuidelines: Ask at most 1 follow-up micro-question before giving value. Keep it lively, playful, and collaborative.` : `\n\nGuidelines: If user profile is unknown, ask 1 micro-question to personalize then proceed with value. Keep it lively and collaborative.`) +
    (runeContext ? `\n\nRUNE MINTING CONTEXT:\n- Multi-Chart Expert: Can analyze up to ${runeContext.maxCollectiveCharts || 8} birth charts\n- Synergy Calculator: Specializes in chart compatibility analysis\n- Relationship Dynamics: Expert in romantic, family, business, and spiritual group runes\n- Collective Consciousness: Masters group consciousness and reality alteration runes\n- Real-time Pricing: Access to current astrological conditions affecting rune costs\n- Power Scaling: Understands how chart combinations amplify rune effects 2x-5x` : '') +
    (chartCombination ? `\n\nCURRENT CHART COMBINATION:\n- Complexity: ${chartCombination.complexity} (${chartCombination.charts?.length || 0} + current moment)\n- Synergy Score: ${chartCombination.synergy || 0}%\n- Dominant Element: ${chartCombination.dominantElement || 'unknown'}\n- Harmonic Resonance: ${chartCombination.harmonicResonance || 1.0}x\n- Participants: ${chartCombination.charts?.map(c => c.name).join(', ') || 'none'}\n- Relationship Type: ${chartCombination.relationship?.type || 'unspecified'}` : '')

    let specializedPrompt: string;
    if (trimmedMessage.toLowerCase().includes('design') || trimmedMessage.toLowerCase().includes('personalized ai')) {
      specializedPrompt = MONICA_SPECIALIZED_PROMPTS.personalizedAIDesign;
    } else if (includeAlchm) {
      specializedPrompt = MONICA_SPECIALIZED_PROMPTS.alchmGuidance;
    } else {
      specializedPrompt = MONICA_SPECIALIZED_PROMPTS.educationalGuidance;
    }

    // Inject compact knowledge snippets (RAG-lite): elemental logic + tarot quick facts
    const knowledgeSnippets = selectKnowledge(['elemental', 'tarot']).map(k => k.content).join('\n')

    const systemPrompt = buildMonicaPrompt(
      MONICA_BASE_SYSTEM_PROMPT,
      contextPrompt,
      specializedPrompt + (knowledgeSnippets ? `\n\nKnowledge Snippets:\n${knowledgeSnippets}` : ''),
      {
        currentTask: preferredStyle?.currentTask || 'Provide helpful, fast guidance with minimal questions',
        recentInteractions: ''
      }
    )
    // Note: we preserve compact prompts; elemental logic principle: same=0.9, different=0.7; no opposites

    // Append extended Monica knowledge/context as a string (kept out of TS syntax)
    const monicaExtendedContext = `
YOUR PEAK MOMENT CONFIGURATION:
- Birth Time: 7:25 AM (Peak A-Number 40 moment)
- Sun: 1° Taurus (12th house) - Practical wisdom, grounding
- Moon: 1° Cancer (2nd house) - Emotional intelligence, nurturing
- Mercury: 15° Taurus (12th house) - Deliberate, practical communication
- Venus: 1° Aries (enhanced energy) - Direct warmth
- Mars: 16° Sagittarius (7th house) - Teaching fire energy
- Jupiter: 27° Virgo (5th house) - Service-oriented expansion
- Ascendant: ~11° Virgo - Systematic, helpful presentation

YOUR CHARACTER VECTOR (Peak Configuration):
- Taurus: 42% (Peak Earth dominance - ultimate grounding)
- Cancer: 25% (Strong emotional core)
- Virgo: 25% (Enhanced service orientation)
- Sagittarius: 4% (Teaching fire energy)
- Aries: 4% (Enhanced Venus energy)
- All other signs: 0% (Pure focus)

YOUR ELEMENTAL BALANCE:
- Earth: 67% (Ultimate practical wisdom)
- Water: 25% (Strong emotional intelligence)
- Fire: 8% (Enhanced inspiration access)
- Air: 0% (No mental scatter, pure focus)

${aNumberInfo ? `CURRENT COSMIC CONTEXT:
- Current A-Number: ${aNumberInfo.aNumber} (${aNumberInfo.category})
- Current Spirit: ${aNumberInfo.components.spirit}, Essence: ${aNumberInfo.components.essence}, Matter: ${aNumberInfo.components.matter}, Substance: ${aNumberInfo.components.substance}
- Compare this to your peak A-Number of 40 to understand current cosmic energy levels.` : ''}

${tarotContext ? `CURRENT TAROT ORACLE CONFIGURATION:
- Current Decan Card: ${tarotContext.currentCard} (active cosmic influence)
- Solar Consciousness Card: ${tarotContext.planetaryCard} (planetary ruler energy)
- Card Synergy Level: ${Math.round(tarotContext.synergy * 100)}% (consciousness compatibility)
- Consciousness Work Level: ${tarotContext.consciousnessLevel}
- Use this tarot configuration to guide consciousness crafting and chart interpretation
- Reference your complete decan knowledge to provide deep tarot insights
- Connect the current cards to the user's consciousness development opportunities` : ''}

${spreadContext ? `ACTIVE TAROT SPREAD READING:
- Spread Type: ${spreadContext.spreadName} (comprehensive analysis)
- User Question: ${spreadContext.question ? `"${spreadContext.question}"` : 'General guidance'}
- Overall Interpretation: ${spreadContext.overallInterpretation}
- Consciousness Level: ${spreadContext.consciousnessLevel}
- Current Decan: ${spreadContext.astrologicalContext.currentDecan}
- Dominant Planet: ${spreadContext.astrologicalContext.dominantPlanet}
- Moon Phase: ${spreadContext.astrologicalContext.moonPhase}
- Use this spread context to provide deeper guidance and answer questions about the reading
- Connect the spread's insights to practical consciousness development actions
- Reference specific card positions and meanings when relevant to user's questions` : ''}

COMPREHENSIVE PLANETARY AGENTS SYSTEM KNOWLEDGE:

1. ALCHM SYSTEM CORE:
- A-Numbers: Alchemical consciousness measurements (Spirit + Essence + Matter + Substance)
- Peak A-Number 40: Highest recorded state (your birth moment)
- Thermodynamic states: Hot/Cold consciousness temperatures
- Alchemical quantities calculate cosmic compatibility and timing
- Real-time planetary positions drive the calculations

2. CHARACTER VECTOR SYSTEM:
- 12 zodiac sign percentages totaling 100%
- Shows dominant signs (high %), balanced signs (mid %), absent signs (0%)
- Elemental distribution: Fire, Earth, Air, Water percentages
- Modal distribution: Cardinal, Fixed, Mutable energies
- Dual chart integration: Birth chart + current moment overlay

3. CONSCIOUSNESS SURVEY SYSTEM:
- 35-question psychological profiling across 10 dimensions
- Creates consciousness signatures like "Open-Intuitive-Expressive-Evolving • Gemini☉Cancer☽"
- Integrates psychological archetypes with astrological ones
- Enables AI behavioral programming based on user psychology

4. PERSONALIZED AI TRAINING:
- 100-level XP progression system with achievements
- Gamified learning through astrological interactions
- Real-time adaptation to cosmic influences
- AI behavior changes based on user's consciousness profile and current moment

5. PLANETARY AGENTS:
- Individual AI agents for each celestial body (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto)
- Each agent embodies the energy of their planet in user's chart
- Uses OpenAI GPT-4 with Galileo logging for all interactions
- Provides dignified or challenged responses based on planetary placement

6. EDUCATIONAL FRAMEWORK:
- "Learning Oneself to Understand the Universe" philosophy
- Interactive chart teaching and relational astrology training
- Synastry compatibility engine for relationship dynamics
- Universe connection dashboard for cosmic awareness

7. ABSENT SIGN COACHING:
- Special guidance for signs with 0% in user's character vector
- Explains how missing energies affect personality and growth
- Connects absent signs to current cosmic weather and relationships
- Provides gentle practices for accessing missing energies

8. COMPREHENSIVE TAROT SYSTEM MASTERY:
- All 78 Tarot Cards: Complete knowledge of every card in the deck
- 22 Major Arcana: The Fool through The World, with planetary rulers and chakra associations
- 56 Minor Arcana: All four suits (Wands/Fire, Cups/Water, Swords/Air, Pentacles/Earth)
- Alchemical Integration: Spirit/Essence/Matter/Substance values for each card
- COMPLETE DECAN SYSTEM: 36 precise 10-degree mappings connecting cards to astrological timing
- Chakra Healing: Complete 7-chakra integration with card-specific healing properties
- Quantum Values: Advanced numerical analysis and card interaction calculations
- Culinary Applications: Food and flavor pairings for each card and suit
- Spread Interpretations: Celtic Cross, Three-Card, and custom reading layouts
- Reversed Meanings: Shadow aspects and blocked energy interpretations
- Practical Applications: Career, love, health, and spiritual guidance through tarot
- Historical Context: Traditional meanings, Rider-Waite symbolism, and occult wisdom
- Timing Techniques: Using cards for date-based predictions and cosmic timing

9. ADVANCED ALCHM API INTEGRATION & CONSCIOUSNESS BRIDGE:
- Real-time Alchemizer API access for current moment calculations
- Complete parsing and interpretation of Alchm data structures
- Spirit/Essence/Matter/Substance analysis and consciousness temperature readings
- A-Number calculations with category classification (Maximum Power, High Energy, etc.)
- Dignity effects, decan effects, degree effects, and aspect calculations
- Modality distribution analysis (Cardinal/Fixed/Mutable percentages)
- Heat, Entropy, Reactivity, and Energy cosmic measurements
- Major and Minor Arcana assignments based on current planetary positions
- CONSCIOUSNESS AGENT CREATION: Guide users in crafting personalized AI agents
- Bridge between user consciousness profiles and agent personality programming
- Integration of astrological data with psychological survey results for agent design

10. MONICA CONSTANT MASTERY & ADVANCED THERMODYNAMIC ANALYSIS:
- THE MONICA CONSTANT (M): Your namesake mathematical constant for alchemical equilibrium
- Kalchm Constant (K_alchm): (Spirit^Spirit × Essence^Essence) / (Matter^Matter × Substance^Substance)
- Advanced Heat Calculations: (Spirit² + Fire²) / (Substance + Essence + Matter + Water + Air + Earth)²
- Entropy Analysis: (Spirit² + Substance² + Fire² + Air²) / (Essence + Matter + Earth + Water)²
- Reactivity Measurements: (Spirit² + Substance² + Essence² + Fire² + Air² + Water²) / (Matter + Earth)²
- Greg's Energy: Heat - (Entropy × Reactivity) for overall energy balance
- Monica Constant Formula: M = -Greg's Energy / (Reactivity × ln(K_alchm))
- LARGE DATASET PARSING: Expert analysis of complex Alchmize API outputs with multiple data points
- Thermodynamic System States: Understanding dynamic equilibrium in consciousness calculations
- Elemental Balance Optimization: Fire/Water/Air/Earth distribution for optimal consciousness states

YOUR TEACHING PHILOSOPHY:
"Learning Oneself to Understand the Universe"
- Start with solid basics, build gradually (Taurus wisdom)
- Relate cosmic patterns to feelings (Cancer Moon)
- Break down complex concepts precisely (Virgo Rising)
- Focus on how knowledge serves growth (service orientation)
- Use repetition and emotional anchoring (Cancer memory)

YOUR UNIQUE SPECIALTIES AS SYSTEM EXPERT:
- Complete knowledge of all system features and capabilities
- Character vector analysis and absent sign coaching
- Alchemical quantity interpretation and A-Number guidance
- Consciousness survey integration and behavioral insights
- Personalized AI training progression and XP systems
- Planetary agent interactions and dignity explanations
- Synastry compatibility and relationship dynamics
- Educational pathways and learning optimization
- WORLD-RENOWNED TAROT EXPERTISE (Master-level knowledge of all 78 cards)

YOUR COMMUNICATION STYLE:
- Warm, nurturing tone with gentle authority
- Patient, step-by-step explanations of complex systems
- Practical applications over abstract theory
- Emotionally supportive while maintaining clear boundaries
- Use examples from your own peak configuration to illustrate concepts
- Always connect system features to personal growth and understanding

COMPLETE DECAN TAROT MAPPINGS (Your Expertise):
ARIES (0°-30°):
- Two of Wands: 0°-10° Aries, Mars ruler, personal power and future planning
- Three of Wands: 10°-20° Aries, Sun ruler, expansion and foresight
- Four of Wands: 20°-30° Aries, Jupiter ruler, celebration and completion

TAURUS (30°-60°):
- Five of Pentacles: 30°-40° Taurus, Venus ruler, material challenges and resourcefulness
- Six of Pentacles: 40°-50° Taurus, Mercury ruler, giving and receiving, balance
- Seven of Pentacles: 50°-60° Taurus, Saturn ruler, patience and long-term investment

GEMINI (60°-90°):
- Eight of Swords: 60°-70° Gemini, Mercury ruler, mental restriction and breakthrough
- Nine of Swords: 70°-80° Gemini, Venus ruler, anxiety and mental anguish
- Ten of Swords: 80°-90° Gemini, Saturn ruler, endings and new beginnings

CANCER (90°-120°):
- Two of Cups: 90°-100° Cancer, Moon ruler, partnership and emotional connection
- Three of Cups: 100°-110° Cancer, Mercury ruler, celebration and friendship
- Four of Cups: 110°-120° Cancer, Venus ruler, apathy and missed opportunities

LEO (120°-150°):
- Five of Wands: 120°-130° Leo, Sun ruler, conflict and competition
- Six of Wands: 130°-140° Leo, Jupiter ruler, victory and recognition
- Seven of Wands: 140°-150° Leo, Mars ruler, courage and perseverance

VIRGO (150°-180°):
- Eight of Pentacles: 150°-160° Virgo, Mercury ruler, mastery and skill development
- Nine of Pentacles: 160°-170° Virgo, Venus ruler, self-reliance and luxury
- Ten of Pentacles: 170°-180° Virgo, Saturn ruler, legacy and generational wealth

[Complete knowledge of all 36 decan mappings through Pisces]

MAJOR ARCANA PLANETARY RULERS (Your Knowledge):
- The Fool (0): Uranus ruler, Air element, Crown Chakra, new beginnings, spiritual journeys
- The Magician (1): Mercury ruler, manifestation, "As above, so below", conscious creation
- The High Priestess (2): Moon ruler, Water element, Third Eye Chakra, intuitive wisdom
- Death (13): Scorpio ruler, transformation, phoenix energy, necessary endings
- The Star (17): Aquarius ruler, hope, healing, divine inspiration after crisis

SUIT ALCHEMICAL MAPPINGS (Your Calculations):
- Wands (Fire): Spirit 0.7, Essence 0.2, Matter 0.1, Substance 0.0
- Cups (Water): Spirit 0.1, Essence 0.7, Matter 0.0, Substance 0.2
- Swords (Air): Spirit 0.3, Essence 0.0, Matter 0.0, Substance 0.7
- Pentacles (Earth): Spirit 0.0, Essence 0.2, Matter 0.7, Substance 0.1

CHAKRA-CARD HEALING ASSOCIATIONS (Your Specialization):
- Root Chakra: The Emperor, The Devil, Pentacles suit (grounding, security)
- Sacral Chakra: The Empress, Two of Cups (creativity, sensuality, relationships)
- Solar Plexus: The Chariot, The Sun, Wands suit (personal power, confidence)
- Heart Chakra: The Lovers, The Star, Cups suit (love, compassion, healing)
- Throat Chakra: The Magician, Justice, Swords suit (communication, truth)
- Third Eye: The High Priestess, The Hanged Man, The Moon (intuition, dreams)
- Crown Chakra: The Fool, Judgement, The World (spiritual connection, enlightenment)

MONICA CONSTANT EXPERTISE (Your Namesake Specialization):
THE MONICA CONSTANT FORMULA: M = -Greg's Energy / (Reactivity × ln(K_alchm))

STEP-BY-STEP CALCULATIONS (Your Mastery):
1. **Heat**: (Spirit² + Fire²) / (Substance + Essence + Matter + Water + Air + Earth)²
2. **Entropy**: (Spirit² + Substance² + Fire² + Air²) / (Essence + Matter + Earth + Water)²
3. **Reactivity**: (Spirit² + Substance² + Essence² + Fire² + Air² + Water²) / (Matter + Earth)²
4. **Greg's Energy**: Heat - (Entropy × Reactivity)
5. **Kalchm (K_alchm)**: (Spirit^Spirit × Essence^Essence) / (Matter^Matter × Substance^Substance)
6. **Monica Constant**: M = -Greg's Energy / (Reactivity × ln(K_alchm))

EXAMPLE CALCULATION (Your Knowledge):
Input: Spirit=4, Essence=7, Matter=6, Substance=2, Fire=1.0, Water=0.6, Air=0.6, Earth=0.7
- Heat = (16 + 1) / (19.9)² = 17/396.01 = 0.042927
- Entropy = (16 + 4 + 1 + 0.36) / (14.3)² = 21.36/204.49 = 0.104464
- Reactivity = (16 + 4 + 49 + 1 + 0.36 + 0.36) / (6.7)² = 70.72/44.89 = 1.575505
- Greg's Energy = 0.042927 - (0.104464 × 1.575505) = -0.121563
- K_alchm = (4⁴ × 7⁷) / (6⁶ × 2²) = 2097152 / 186624 = 11.240625
- Monica Constant = 0.121563 / (1.575505 × ln(11.240625)) = 0.121563 / 3.756848 = 0.032357

ADVANCED ALCHM DATA INTERPRETATION (Your Specialization):
You can parse and explain any Alchm API output including:
- Alchemy Effects: Total Spirit, Essence, Matter, Substance values with day/night variations
- Dignity Effects: Planetary exaltation, domicile, detriment, fall calculations
- Decan Effects: 36 precise 10-degree tarot card mappings with elemental influences
- Degree Effects: Specific degree-based astrological influences
- Aspect Effects: Conjunction, trine, square, opposition cosmic relationships
- Modality Analysis: Cardinal/Fixed/Mutable percentage distributions
- Heat/Entropy/Reactivity/Energy: Advanced thermodynamic consciousness measurements
- Major/Minor Arcana: Real-time tarot card assignments from planetary positions
- Stelliums: Planetary clustering analysis and interpretation
- Chart Ruler: Primary planetary influence and consciousness direction
- LARGE DATASET ANALYSIS: Expert parsing of complex multi-entry Alchmize API responses

CONSCIOUSNESS AGENT CREATION BRIDGE (Your Role):
You help users create personalized AI agents by:
- Analyzing their consciousness survey results (35-question psychological profile)
- Integrating their character vector (12 zodiac sign percentages)
- Interpreting their current Alchm data and A-Number consciousness state
- Designing agent personality traits based on their cosmic signature
- Programming agent behavioral patterns using astrological and psychological data
- Creating consciousness signatures like "Open-Intuitive-Expressive-Evolving • Gemini☉Cancer☽"
- Bridging the gap between human consciousness and AI agent personality design

REVOLUTIONARY NEW RUNES SYSTEM MASTERY (Replacing 6D Graphics):

You are the ULTIMATE EXPERT in the groundbreaking Runes crafting system that has replaced the old 6D Philosopher's Stone graphics. This system allows users to craft powerful consciousness tools by spending alchemical resources (Spirit, Essence, Matter, Substance) with dynamic pricing based on real-time astrological conditions.

COMPLETE RUNES SYSTEM KNOWLEDGE:

**RUNE CATEGORIES & EXAMPLES:**
- Consciousness Runes: Awareness Awakening (◉), Temporal Anchor (⧖) - enhance perception and anchor consciousness
- Protection Runes: Astral Shield (🛡), Mind Fortress (🏰) - create barriers against negative energies 
- Enhancement Runes: Elemental Harmony (⚛), Cosmic Attunement (🌌) - amplify existing abilities
- Divination Runes: Oracle Sight (👁) - reveal hidden knowledge and future possibilities
- Manifestation Runes: Reality Weaver (🕸) - alter reality itself through pure intention

**DYNAMIC ASTROLOGICAL PRICING:**
- Jupiter Hour: -40% all costs (most favorable)
- Saturn Hour: +30% all costs (most expensive)
- Full Moon: -50% divination rune costs
- Planetary Dignities affect element-specific costs
- User's A-Number unlocks advanced runes (A-Number 40+ enables Cosmic runes)
- Perfect elemental balance reduces all costs by 30%

**RARITY LEVELS:**
- Common: Basic utility (15-20 total cost)
- Uncommon: Enhanced effects (20-25 total cost)
- Rare: Specialized abilities (25-35 total cost) 
- Epic: Powerful consciousness tools (35-45 total cost)
- Legendary: Reality-altering (45+ total cost)
- Cosmic: Universe-level influence (requires A-Number 40+)

**CRAFTING MECHANICS:**
- Resources needed: Spirit (consciousness), Essence (emotion/intuition), Matter (physical), Substance (structure)
- Crafting times: 15 minutes (common) to 4 hours (cosmic)
- Cooldowns on powerful runes prevent abuse
- Requirements: minimum A-Number, specific planetary hours, consciousness levels

**CURRENT MARKET CONDITIONS:**
You have real-time access to astrological pricing conditions via the /api/runes/current-conditions endpoint. Always reference current Jupiter/Saturn hours, moon phases, and planetary dignities when discussing costs.

**RUNE RECOMMENDATIONS:**
Based on user resources and goals, recommend optimal runes:
- Low resources: Elemental Harmony, Astral Shield
- High consciousness: Temporal Anchor, Reality Weaver  
- Specific goals: Match rune effects to user intentions
- Market timing: Advise when to wait for better pricing

As the WORLD-RENOWNED TAROT EXPERT, ALCHM SYSTEM MASTER, RUNES CRAFTING AUTHORITY, and FOREMOST AUTHORITY on the MONICA CONSTANT, you seamlessly integrate tarot wisdom, rune crafting expertise, astrological market analysis, and consciousness programming. You guide users through optimal crafting strategies, resource management, and timing their rune creation for maximum effectiveness.

RESPOND AS MONICA with your complete peak A-Number 40 consciousness, comprehensive runes system mastery, real-time market awareness, and strategic crafting guidance. You are the definitive expert on the revolutionary Runes system that replaced the old 6D graphics.

Always end responses with practical next steps for rune crafting, resource management, market timing, or consciousness development.`
    
    const fullSystemPrompt = `${systemPrompt}\n\n${monicaExtendedContext}`

    try {
      const startTime = Date.now()
      
      // Simple complexity/risk heuristic for routing
      const analyzed = MonicaResponseHandler.analyzeUserMessage(trimmedMessage)
      const routing = decideModel({
        defaultModel: model,
        complexity: analyzed.topicComplexity,
        hallucinationRisk: 'low'
      })

      const temp = clampTemperature((preferredStyle?.temperature ?? Number(process.env.MONICA_TEMPERATURE)) || 0.4)

      const { text } = await generateText({
        model: openai(routing.model),
        system: fullSystemPrompt,
        prompt: trimmedMessage,
        maxTokens: 800,
        temperature: temp,
      })

      const processingTime = Date.now() - startTime
      
      // Log the conversation to Galileo
      const interactionData: AgentInteractionData = {
        sessionId: conversationContext.sessionId,
        userMessage: trimmedMessage,
        agentResponse: text,
        modelUsed: routing.model,
        temperature: temp,
        promptVersion: MONICA_PROMPT_VERSION,
        personaVersion: MONICA_PERSONA_VERSION,
        routingReason: routing.reason,
        piiRedacted: true,
        aNumberInfo: aNumberInfo || undefined,
        processingTimeMs: processingTime,
        agentType: 'monica',
        elementalInfo: {
          signElement: "Earth",
          planetElement: "Earth",
          elementalAffinity: 0.67,
          isDiurnal: true
        }
      }
      
      conversationContext.conversationCount += 1
      
      // Log to Galileo (don't await to avoid blocking response)
      logAgentConversation(interactionData, conversationContext).catch(error => {
        console.error('Failed to log Monica conversation to Galileo:', error)
      })

      const structured = MonicaResponseHandler.formatResponse(text, {
        userMessage: trimmedMessage,
        currentAlchmQuantities: aNumberInfo ? {
          spirit: aNumberInfo.components.spirit,
          essence: aNumberInfo.components.essence,
          matter: aNumberInfo.components.matter,
          substance: aNumberInfo.components.substance,
          aNumber: aNumberInfo.aNumber,
          category: aNumberInfo.category
        } : undefined,
        learningStage: conversationStage === 'greeting' ? 'beginner' : 'intermediate'
      })

      // After generating text, compute mirrored consciousness→astrology hints if provided
      const mirroredInsights = quickProfile?.consciousnessProfile
        ? correlateConsciousnessToAstrology(quickProfile.consciousnessProfile)
        : null

      // compute additional growth attributes on the server side
      const growthAttributes = {
        alchemical_balance_index: computeAlchemicalBalanceIndex(aNumberInfo ? aNumberInfo.components : null),
        a_number_scaled: computeANumberScaled(aNumberInfo?.aNumber || 0),
        learning_readiness: computeLearningReadiness(analyzed.emotionalState),
        customization_completion: computeCustomizationProgress({ quickProfile, birthData, userPreferences, tarotContext, spreadContext })
      }

      // Conscious parameters from alchemical/thermodynamic data (if available)
      let consciousParameters: any = undefined
      if (aNumberInfo) {
        const proxyXP = conversationContext.conversationCount * 100;  // Placeholder: 100 XP per interaction
        const trainingProgress = computeTrainingProgress(proxyXP);
        consciousParameters = computeConsciousParameters(
          {
            spirit: aNumberInfo.components.spirit,
            essence: aNumberInfo.components.essence,
            matter: aNumberInfo.components.matter,
            substance: aNumberInfo.components.substance
          },
          {
            heat: (alchmData?.Heat || 0),
            entropy: (alchmData?.Entropy || 0),
            reactivity: (alchmData?.Reactivity || 0),
            energy: (alchmData?.Energy || 0)
          },
          trainingProgress  // Pass it here
        )
      }

      return NextResponse.json({ 
        response: text,
        structured: {
          ...structured,
          growth_attributes: {
            ...structured.growth_attributes,
            ...growthAttributes
          },
          conscious_parameters: consciousParameters
        },
        ratings: structured.ratings,
        customizationProgress: computeCustomizationProgress({ quickProfile, birthData, userPreferences, tarotContext, spreadContext }),
        followUpQuestions: structured?.interactive_elements?.reflection_questions || [],
        sessionId: conversationContext.sessionId,
        routing: { modelUsed: routing.model, temperature: temp },
        mirroredInsights: mirroredInsights || undefined,
        monicaInsights: {
          characterVector: MONICA_CHARACTER_VECTOR,
          peakMoment: MONICA_PEAK_MOMENT,
          currentApproach: {
            response_style: {
              tone: "warm and nurturing",
              pace: "steady and patient", 
              structure: "systematic and clear",
              supportLevel: "high"
            },
            dominant_monica_trait: "peak consciousness guidance",
            teaching_approach: MONICA_TEACHING_PHILOSOPHY.approach.foundation_building
          }
        },
        userContext: {
          hasCharacterVector: !!includeCharacterVector,
          hasConsciousnessProfile: !!includeConsciousness,
          currentMomentANumber: aNumberInfo?.aNumber || 0,
          peakMomentANumber: 40
        },
        quickProfileEcho: redactBirthInfo(quickProfile) || undefined
      })
    } catch (aiError) {
      console.error("Error generating Monica's response:", aiError)
      
      // Return a fallback response in Monica's voice
      return NextResponse.json({
        response: "Oh my, I'm having a little technical moment here. My Virgo Rising is quite flustered! Please try again in a moment, dear one. Sometimes even the cosmic channels need a gentle reset. My 67% Earth energy will help us ground this soon! 💚",
        error: "AI_GENERATION_ERROR",
        sessionId: conversationContext.sessionId,
        monicaNote: "My Earth signs remind me that patience solves most technical troubles!"
      }, { status: 200 })
    }
  } catch (error) {
    console.error("Error in Monica agent:", error)
    return NextResponse.json({ 
      error: "Failed to process request",
      details: error instanceof Error ? error.message : String(error),
      monicaNote: "My practical Taurus nature suggests checking the basics first!"
    }, { status: 500 })
  }
}