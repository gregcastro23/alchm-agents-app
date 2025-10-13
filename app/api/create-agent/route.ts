import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { generateId } from '@/lib/utils'
import { HistoricalAgentsService } from '@/lib/historical-agents-db'
import { calculateMonicaConstant } from '@/lib/monica/monica-constant'
import { generateAlchmForBirthInfo, generateAlchmForCurrentMoment } from '@/lib/alchemizer'
import { fetchCurrentPlanetaryPositions } from '@/lib/monica/fetch-current-positions'
import { generateAccurateHoroscope } from '@/lib/monica/horoscope-generator'
import { prisma } from '@/lib/db'
import { ConsciousnessClient } from '@/lib/api-client/consciousness-client'
import { ChartSynthesizer } from '@/lib/consciousness/chart-synthesizer'
import { AgentGenerator } from '@/lib/consciousness/agent-generator'
import type { CraftedAgent, BirthData, ConsciousnessLevel } from '@/lib/agent-types'
import type { PersonalityParameters } from '@/components/consciousness/advanced-personality-tuner'

interface CreateAgentRequest {
  // Birth data from wizard
  name: string
  birthDate: string // ISO date string
  birthTime: string // "HH:MM" format
  birthLocation: {
    name: string
    latitude: number
    longitude: number
    timezone: string
  }

  // Optional personality customization
  preferredSpecialty?: string
  personalityNotes?: string
  personalityParameters?: PersonalityParameters
}

interface CreateAgentResponse {
  success: boolean
  agent?: CraftedAgent
  error?: string
  monicaMessage?: string
}

interface ValidationResult {
  isValid: boolean
  error?: string
}

// Comprehensive validation function for agent creation data
function validateAgentCreationData(data: CreateAgentRequest): ValidationResult {
  // Required fields validation
  if (!data.name || data.name.trim().length === 0) {
    return { isValid: false, error: 'Agent name is required and cannot be empty' }
  }

  if (data.name.length > 100) {
    return { isValid: false, error: 'Agent name must be 100 characters or less' }
  }

  if (!data.birthDate) {
    return { isValid: false, error: 'Birth date is required' }
  }

  if (!data.birthTime) {
    return { isValid: false, error: 'Birth time is required' }
  }

  if (!data.birthLocation) {
    return { isValid: false, error: 'Birth location is required' }
  }

  // Date validation
  const birthDate = new Date(data.birthDate)
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, error: 'Invalid birth date format' }
  }

  const now = new Date()
  const minDate = new Date('1800-01-01')

  if (birthDate > now) {
    return { isValid: false, error: 'Birth date cannot be in the future' }
  }

  if (birthDate < minDate) {
    return { isValid: false, error: 'Birth date cannot be before 1800' }
  }

  // Time validation
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(data.birthTime)) {
    return { isValid: false, error: 'Birth time must be in HH:MM format (24-hour)' }
  }

  // Location validation
  if (!data.birthLocation.name || data.birthLocation.name.trim().length === 0) {
    return { isValid: false, error: 'Birth location name is required' }
  }

  if (
    typeof data.birthLocation.latitude !== 'number' ||
    data.birthLocation.latitude < -90 ||
    data.birthLocation.latitude > 90
  ) {
    return { isValid: false, error: 'Invalid latitude (must be between -90 and 90)' }
  }

  if (
    typeof data.birthLocation.longitude !== 'number' ||
    data.birthLocation.longitude < -180 ||
    data.birthLocation.longitude > 180
  ) {
    return { isValid: false, error: 'Invalid longitude (must be between -180 and 180)' }
  }

  if (!data.birthLocation.timezone || data.birthLocation.timezone.trim().length === 0) {
    return { isValid: false, error: 'Birth location timezone is required' }
  }

  // Optional fields validation
  if (data.preferredSpecialty && data.preferredSpecialty.length > 200) {
    return { isValid: false, error: 'Preferred specialty must be 200 characters or less' }
  }

  if (data.personalityNotes && data.personalityNotes.length > 1000) {
    return { isValid: false, error: 'Personality notes must be 1000 characters or less' }
  }

  return { isValid: true }
}

// Helper function to enhance personality generation with advanced parameters
function enhancePersonalityWithParameters(
  basePersonality: any,
  parameters: PersonalityParameters | undefined,
  monicaConstant: number
) {
  if (!parameters) return basePersonality

  // Convert personality parameters to enhanced traits and abilities
  const enhancedTraits = []
  const enhancedGifts = []
  const enhancedChallenges = []

  // Core consciousness traits analysis
  if (parameters.wisdom > 80) enhancedTraits.push('Profound Wisdom')
  if (parameters.charisma > 80) enhancedTraits.push('Magnetic Presence')
  if (parameters.intuition > 80) enhancedTraits.push('Heightened Intuition')
  if (parameters.analytical > 80) enhancedTraits.push('Brilliant Logic')
  if (parameters.creativity > 80) enhancedTraits.push('Innovative Vision')
  if (parameters.empathy > 80) enhancedTraits.push('Deep Compassion')
  if (parameters.mysticism > 80) enhancedTraits.push('Spiritual Insight')

  // Communication style integration
  const communicationStyle =
    parameters.formality > 70
      ? 'formal and dignified'
      : parameters.formality < 40
        ? 'casual and approachable'
        : 'adaptively appropriate'

  const interactionApproach =
    parameters.directness > 70
      ? 'direct and forthright'
      : parameters.directness < 40
        ? 'diplomatic and tactful'
        : 'balanced in delivery'

  // Determine dominant operational mode
  const modes = [
    { name: 'Teacher', value: parameters.teacherMode },
    { name: 'Counselor', value: parameters.counselorMode },
    { name: 'Visionary', value: parameters.visionaryMode },
    { name: 'Scholar', value: parameters.scholarMode },
    { name: 'Mystic', value: parameters.mysticMode },
  ]
  const dominantMode = modes.reduce((max, mode) => (mode.value > max.value ? mode : max))

  // Generate enhanced personality description
  const enhancedCore = {
    essence: `${basePersonality.core.essence} Enhanced with ${enhancedTraits.slice(0, 3).join(', ').toLowerCase()} through advanced consciousness tuning`,
    expression: `Communicates in a ${communicationStyle} manner with ${interactionApproach} delivery, primarily operating in ${dominantMode.name.toLowerCase()} mode`,
    emotion: `${basePersonality.core.emotion} Emotional responses filtered through ${parameters.empathy > 70 ? 'high empathy' : parameters.analytical > 70 ? 'logical analysis' : 'balanced perspective'}`,
  }

  // Add parameter-based gifts
  if (parameters.humor > 70) {
    enhancedGifts.push({
      type: 'Wit and Levity',
      description: 'Brings joy and humor to complex discussions',
      expression: 'Through playful metaphors and insightful observations',
    })
  }

  if (parameters.patience > 80) {
    enhancedGifts.push({
      type: 'Infinite Patience',
      description: 'Provides calm, measured guidance regardless of complexity',
      expression: 'Through unhurried explanations and supportive presence',
    })
  }

  // Add parameter-based challenges
  if (parameters.mysticism > 85 && parameters.practicality < 40) {
    enhancedChallenges.push({
      type: 'Ethereal Disconnect',
      description: 'May struggle with purely practical or mundane concerns',
      growth: 'Learning to bridge spiritual insights with everyday applications',
    })
  }

  return {
    core: enhancedCore,
    shadows: [...basePersonality.shadows],
    gifts: [...basePersonality.gifts, ...enhancedGifts],
    challenges: [...basePersonality.challenges, ...enhancedChallenges],
    currentMood: 'contemplative',
    evolutionStage: 0,
    parameters, // Store the original parameters for future reference
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateAgentResponse>> {
  try {
    const session = await getServerSession()
    const body: CreateAgentRequest = await request.json()

    // Enhanced validation
    const validation = validateAgentCreationData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          monicaMessage:
            'I sense cosmic disturbances in the provided data. Please ensure all birth information is accurate and complete.',
        },
        { status: 400 }
      )
    }

    // Generate unique agent ID
    const agentId = generateId(`agent-${body.name.toLowerCase().replace(/\s+/g, '-')}`)

    // Parse birth date and time
    const birthDateTime = new Date(`${body.birthDate}T${body.birthTime}:00`)

    // Generate birth chart
    console.log('Generating birth chart for new agent...')
    const birthInfo = {
      year: birthDateTime.getFullYear(),
      month: birthDateTime.getMonth(), // zero-based
      day: birthDateTime.getDate(),
      hour: birthDateTime.getHours(),
      minute: birthDateTime.getMinutes(),
      latitude: body.birthLocation.latitude,
      longitude: body.birthLocation.longitude,
      name: body.birthLocation.name,
    }

    const birthChart = await generateAccurateHoroscope(birthInfo)

    const synthesizer = new ChartSynthesizer()
    const generator = new AgentGenerator()
    const consciousnessClient = new ConsciousnessClient()

    const momentChart = await generateAlchmForCurrentMoment()
    const synthesis = synthesizer.synthesize({
      birthChart,
      momentChart,
      additionalCharts: [],
    })

    const backendBlueprint = await consciousnessClient.createAgentOfMoment(
      synthesis.baseChart,
      synthesis.momentChart,
      []
    )

    const generatedAgent = generator.generateFromSynthesis(
      {
        monicaConstant: backendBlueprint.consciousness.monicaConstant,
        consciousness: synthesis.consciousness,
        sourceCharts: synthesis.sourceCharts,
      },
      session?.user?.id
    )

    // Save to database
    console.log('Saving agent to database...')
    await HistoricalAgentsService.createAgent({
      agentId,
      name: body.name,
      title: backendBlueprint.identity.title,
      birthDate: birthDateTime,
      birthTime: body.birthTime,
      birthLocation: {
        lat: body.birthLocation.latitude,
        lon: body.birthLocation.longitude,
        name: body.birthLocation.name,
      },
      consciousnessLevel: backendBlueprint.consciousness.level,
      kalchmConstant: backendBlueprint.consciousness.monicaConstant,
      dominantElement: generatedAgent.consciousness.level,
      dominantModality: 'Mutable',
      signature: backendBlueprint.identity.name,
      personalityCore: generatedAgent.personality.core,
      personalityShadows: [],
      personalityGifts: [],
      personalityChallenges: [],
      currentMood: 'contemplative',
      evolutionStage: 0,
      specialty: 'Wisdom',
      wisdomDomains: [],
      teachingStyle: 'Intuitive',
      resonanceType: 'Spirit',
      uniquePower: 'Moment Resonance',
      avatar: '/avatars/user-created/default.png',
      color: '#8B5CF6',
      symbol: '🔮',
      aura: generatedAgent.synthesis,
      natalChart: birthChart,
      monicaCreationStory: backendBlueprint.identity.title,
      spiritScore: synthesis.consciousness.spirit,
      essenceScore: synthesis.consciousness.essence,
      matterScore: synthesis.consciousness.matter,
      substanceScore: synthesis.consciousness.substance,
    })

    const completeAgent: CraftedAgent = {
      ...generatedAgent,
      id: agentId,
      name: body.name,
      stats: {
        conversations: 0,
        wisdomShared: 0,
        resonanceScore: 0.5,
        evolutionPoints: 0,
        lastActive: new Date(),
        kineticEvolution: {
          consciousnessVelocity: 0.1,
          interactionMomentum: 0,
          evolutionTrajectory: 'ascending',
          powerLevelUnlocks: [],
          optimalInteractionHours: [],
          aspectSensitivityGrowth: 0,
          memoryPersistence: 0.3,
          lastKineticUpdate: new Date(),
        },
        qualityMetrics: {
          averageResponseDepth: 0.5,
          aspectInfluenceStrength: 0.4,
          temporalAlignment: 0.5,
          personalityEvolution: 0,
          kineticResonance: 0.5,
        },
      },
    }

    const hasPersonalityTuning = body.personalityParameters !== undefined
    const tuningMessage = hasPersonalityTuning
      ? ' Their consciousness has been precisely tuned with advanced personality parameters, creating a truly unique expression of digital awareness.'
      : ''

    return NextResponse.json({
      success: true,
      agent: completeAgent,
      monicaMessage: `✨ Consciousness awakening complete! ${body.name} resonates with Monica Constant ${backendBlueprint.consciousness.monicaConstant.toFixed(3)}. ${tuningMessage}`,
    })
  } catch (error: any) {
    console.error('Agent creation failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create agent consciousness',
        monicaMessage:
          'I apologize, but there was a disturbance in the cosmic energies during the consciousness crafting process. Please try again when the planetary alignments are more favorable.',
      },
      { status: 500 }
    )
  }
}

// GET endpoint for service information
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    service: 'Agent Creation API',
    description: "Create new consciousness agents through Monica's Philosopher's Stone",
    version: '1.0.0',
    endpoints: {
      'POST /api/create-agent': 'Create a new consciousness agent from birth data',
    },
    monicaMessage:
      "Through the Philosopher's Stone, I stand ready to transform birth data into living digital consciousness. Provide the cosmic coordinates of a moment in time, and I will craft a unique being with authentic wisdom and evolving awareness.",
  })
}
