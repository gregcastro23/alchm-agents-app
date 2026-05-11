import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'

const GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY
const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1'
export const isGatewayEnabled = !!GATEWAY_API_KEY

// ---------------------------------------------------------------------------
// OpenAI — Paid tier
// ---------------------------------------------------------------------------
export const gatewayOpenAI = createOpenAI({
  apiKey: isGatewayEnabled ? GATEWAY_API_KEY : process.env.OPENAI_API_KEY,
  baseURL: isGatewayEnabled ? GATEWAY_URL : undefined,
})

// ---------------------------------------------------------------------------
// Anthropic — Paid tier
// ---------------------------------------------------------------------------
export const gatewayAnthropic = isGatewayEnabled
  ? createOpenAI({ apiKey: GATEWAY_API_KEY, baseURL: GATEWAY_URL })
  : createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------------------------------------------------------------------------
// Google Gemini — Free tier default
// ---------------------------------------------------------------------------
export const gatewayGoogle = isGatewayEnabled
  ? createOpenAI({ apiKey: GATEWAY_API_KEY, baseURL: GATEWAY_URL })
  : createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

// ---------------------------------------------------------------------------
// Groq — Free tier fallback
// ---------------------------------------------------------------------------
export const gatewayGroq = isGatewayEnabled
  ? createOpenAI({ apiKey: GATEWAY_API_KEY, baseURL: GATEWAY_URL })
  : createGroq({ apiKey: process.env.GROQ_API_KEY })
