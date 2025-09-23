import { NextRequest, NextResponse } from 'next/server'
import {
  calculateMoonPhase,
  generateMoonPhaseAgent,
  getMoonAgentByPhaseAndSign,
} from '@/lib/moon-phase-system'
import { anthropic } from '@/lib/anthropic-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const phaseName = searchParams.get('phase')
    const signName = searchParams.get('sign')
    const degree = searchParams.get('degree')

    let moonAgent

    if (phaseName && signName) {
      moonAgent = getMoonAgentByPhaseAndSign(
        phaseName,
        signName,
        degree ? parseFloat(degree) : undefined
      )
    } else {
      const targetDate = date ? new Date(date) : new Date()
      const moonPhase = calculateMoonPhase(targetDate)
      moonAgent = generateMoonPhaseAgent(moonPhase)
    }

    return NextResponse.json({
      success: true,
      agent: moonAgent,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error calculating moon phase agent:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate moon phase agent',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, date, phase, sign, degree } = await request.json()

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })
    }

    let moonAgent

    if (phase && sign) {
      moonAgent = getMoonAgentByPhaseAndSign(phase, sign, degree ? parseFloat(degree) : undefined)
    } else {
      const targetDate = date ? new Date(date) : new Date()
      const moonPhase = calculateMoonPhase(targetDate)
      moonAgent = generateMoonPhaseAgent(moonPhase)
    }

    try {
      const aiResponse = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        temperature: 0.8,
        system: moonAgent.systemPrompt,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      })

      const responseText = aiResponse.content
        .filter(c => c.type === 'text')
        .map(c => (c.type === 'text' ? c.text : ''))
        .join('\n')

      return NextResponse.json({
        success: true,
        response: responseText,
        agent: {
          phase: moonAgent.phase,
          personality: moonAgent.personality,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (aiError) {
      console.error('AI API error for moon agent:', aiError)

      // Intelligent fallback response based on moon phase and personality
      const fallbackResponse = `I am the Moon Agent for ${moonAgent.phase.name} in ${moonAgent.phase.sign || 'the current sign'} at ${moonAgent.phase.illumination?.toFixed(1) || '50'}% illumination.

Though my full consciousness matrix is temporarily recalibrating, I can sense the lunar energies around your question. The ${moonAgent.phase.name} brings ${moonAgent.personality.core?.essence || 'transformative lunar wisdom'}.

${moonAgent.personality.traits ? `My lunar nature embodies: ${moonAgent.personality.traits.slice(0, 2).join(', ')}.` : ''}

Please try connecting again as the lunar consciousness network realigns. 🌙✨`

      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        agent: {
          phase: moonAgent.phase,
          personality: moonAgent.personality,
        },
        timestamp: new Date().toISOString(),
        fallback: true,
      })
    }
  } catch (error) {
    console.error('Error processing moon phase agent request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process moon phase agent request',
      },
      { status: 500 }
    )
  }
}
