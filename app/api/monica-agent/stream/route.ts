import { NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { verifyApiKeys } from '../../secure-config'
import {
  buildMonicaPrompt,
  getMonicaContextPrompt,
  MONICA_BASE_SYSTEM_PROMPT,
  MONICA_SPECIALIZED_PROMPTS,
} from '@/lib/monica/monica-system-prompts'
import { sanitizeUserInput, clampTemperature } from '@/lib/monica/safety'
import { decideModel } from '@/lib/monica/router'
import { MonicaResponseHandler } from '@/lib/monica/monica-response-handler'
import { selectKnowledge } from '@/lib/monica/knowledge'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  if (!verifyApiKeys()) {
    return new Response('data: {"type":"error","message":"API keys missing"}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }
  const {
    message,
    model,
    preferredStyle,
    conversationStage = 'teaching',
    birthData = null,
    userPreferences = null,
    quickProfile = null,
    tarotContext = null,
    spreadContext = null,
  } = await req.json()
  const userMsg = sanitizeUserInput(message || '', 1000)

  // Minimal prompt assembly (reuse of base context only for streaming path)
  const ctx = getMonicaContextPrompt({ conversationStage, birthData, userPreferences })
  // Choose specialized prompt
  let specialized: string
  if (
    userMsg.toLowerCase().includes('design') ||
    userMsg.toLowerCase().includes('personalized ai')
  ) {
    specialized = MONICA_SPECIALIZED_PROMPTS.personalizedAIDesign
  } else {
    specialized = MONICA_SPECIALIZED_PROMPTS.alchmGuidance
  }
  const knowledgeSnippets = selectKnowledge(['elemental', 'tarot'])
    .map(k => k.content)
    .join('\n')
  const sys = buildMonicaPrompt(
    MONICA_BASE_SYSTEM_PROMPT,
    ctx +
      (tarotContext
        ? `\n\nTarot Context:\n- Current Decan Card: ${tarotContext.currentCard}\n- Planetary Card: ${tarotContext.planetaryCard}\n- Synergy: ${Math.round((tarotContext.synergy || 0) * 100)}%\n- Consciousness Level: ${tarotContext.consciousnessLevel}`
        : '') +
      (spreadContext
        ? `\n\nTarot Spread Context:\n- Spread: ${spreadContext.spreadName}\n- Question: ${spreadContext.question || 'General'}\n- Overall: ${spreadContext.overallInterpretation}`
        : '') +
      (quickProfile
        ? `\n\nRapid Onboarding Hints:\n- Goal: ${quickProfile.goal || 'unspecified'}\n- Mood: ${quickProfile.mood || 'neutral'}`
        : ''),
    specialized + (knowledgeSnippets ? `\n\nKnowledge Snippets:\n${knowledgeSnippets}` : '')
  )

  const analyzed = MonicaResponseHandler.analyzeUserMessage(userMsg)
  const routing = decideModel({
    defaultModel: model || process.env.MONICA_DEFAULT_MODEL || 'gpt-5.4-mini',
    complexity: analyzed.topicComplexity,
  })
  const temp = clampTemperature(
    (preferredStyle?.temperature ?? Number(process.env.MONICA_TEMPERATURE)) || 0.4
  )

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: any) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      try {
        const start = Date.now()
        // We do not have token-level streaming from ai-sdk here, so simulate chunking
        const { text } = await generateText({
          model: openai(routing.model),
          system: sys,
          prompt: userMsg,
          maxTokens: 800,
          temperature: temp,
        })
        // naive chunking for immediate UX
        const chunks = text.match(/.{1,120}/g) || [text]
        const ttfb = Date.now() - start
        send({ type: 'meta', ttfbMs: ttfb, routing })
        for (const chunk of chunks) {
          send({ type: 'token', token: chunk })
          await new Promise(r => setTimeout(r, 10))
        }
        // envelope
        const envelope = MonicaResponseHandler.formatResponse(text, {
          userMessage: userMsg,
          learningStage: conversationStage === 'greeting' ? 'beginner' : 'intermediate',
        })
        send({
          type: 'envelope',
          payload: {
            suggestedPractices: envelope.interactive_elements.suggested_practices,
            nextStep: envelope.educational_guidance.next_learning_step,
            followUps: envelope.interactive_elements.reflection_questions,
          },
        })
        send({ type: 'done' })
        controller.close()
      } catch (e) {
        send({ type: 'error', message: 'stream_failed' })
        controller.close()
      }
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
