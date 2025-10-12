import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextResponse } from 'next/server'
import { calculatePlanetaryPosition, getHistoricalInterpretation } from '../../../../lib/astrological-tools'
import {
  logAgentConversation,
  createConversationContext,
  type AgentInteractionData,
  type ConversationContext,
} from '../../../../lib/galileo-agent-logger'
import { generateAlchmForCurrentMoment } from '../../../../lib/alchemizer'
import { ANumberCalculator } from '../../../../lib/core-energy-rules'

export async function POST(req: Request) {
  try {
    const { query, birthData, sessionId } = await req.json()

    // Create or use existing conversation context
    let conversationContext: ConversationContext
    if (sessionId) {
      conversationContext = {
        sessionId,
        sessionName: 'advanced-agent-chat',
        startTime: Date.now(),
        conversationCount: 1, // Would increment from stored value in production
      }
    } else {
      conversationContext = createConversationContext()
      conversationContext.sessionName = 'advanced-agent-chat'
    }

    // Calculate A-number for current moment to provide additional context
    let aNumberInfo:
      | {
          aNumber: number
          category: string
          components: { spirit: number; essence: number; matter: number; substance: number }
        }
      | undefined = undefined
    try {
      const alchmData = await generateAlchmForCurrentMoment()
      const spirit = alchmData?.['Alchemy Effects']?.['Total Spirit'] || 0
      const essence = alchmData?.['Alchemy Effects']?.['Total Essence'] || 0
      const matter = alchmData?.['Alchemy Effects']?.['Total Matter'] || 0
      const substance = alchmData?.['Alchemy Effects']?.['Total Substance'] || 0
      const aNumber = spirit + essence + matter + substance
      const category = ANumberCalculator.categorizeANumber(aNumber)

      aNumberInfo = {
        aNumber: Math.round(aNumber * 100) / 100,
        category,
        components: { spirit, essence, matter, substance },
      }
    } catch (aNumberError) {
      console.error('Failed to calculate A-number for advanced agent context:', aNumberError)
    }

    const startTime = Date.now()

    const systemPrompt = `You are an advanced astrological agent with access to precise astronomical calculations and historical texts.

${
  aNumberInfo
    ? `Current Alchemical Context:
- A-Number: ${aNumberInfo.aNumber} (${aNumberInfo.category})
- Spirit: ${aNumberInfo.components.spirit}, Essence: ${aNumberInfo.components.essence}, Matter: ${aNumberInfo.components.matter}, Substance: ${aNumberInfo.components.substance}
- Factor this A-Number context into your interpretations - higher A-Numbers indicate times of greater alchemical potential and energy.`
    : ''
}

Provide comprehensive astrological analysis that incorporates both traditional techniques and the current alchemical energy levels.`

    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: query || 'Tell me about my chart',
      tools: {
        calculatePlanetaryPosition,
        getHistoricalInterpretation,
      },
    })

    const processingTime = Date.now() - startTime

    // Log the conversation to Galileo
    const interactionData: AgentInteractionData = {
      sessionId: conversationContext.sessionId,
      userMessage: query || 'Tell me about my chart',
      agentResponse: text,
      aNumberInfo: aNumberInfo || {
        aNumber: 0,
        category: 'Unknown',
        components: { spirit: 0, essence: 0, matter: 0, substance: 0 },
      },
      processingTimeMs: processingTime,
      agentType: 'advanced',
    }

    conversationContext.conversationCount += 1

    // Log to Galileo (don't await to avoid blocking response)
    logAgentConversation(interactionData, conversationContext).catch(error => {
      console.error('Failed to log advanced agent conversation to Galileo:', error)
    })

    return NextResponse.json({
      response: text,
      sessionId: conversationContext.sessionId,
      aNumberInfo,
    })
  } catch (error) {
    console.error('Error in advanced agent:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
