/**
 * Mock RAG Response Generator
 * Used for testing when Anthropic API is unavailable
 * Simulates realistic responses based on retrieved sources
 */

import type { SearchResult } from '@/lib/llamaindex/semantic-search'

export interface MockGenerationOptions {
  agent: {
    id: string
    name: string
    era?: string
  }
  userMessage: string
  sources: SearchResult[]
  conversationHistory?: Array<{ role: string; content: string }>
}

/**
 * Generate a mock response that references the retrieved sources
 * This simulates what Claude would do - synthesizing sources into an answer
 */
export function generateMockResponse(options: MockGenerationOptions): string {
  const { agent, userMessage, sources } = options

  // Extract key concepts from query
  const query = userMessage.toLowerCase()
  const isQuestion = query.includes('?') || query.includes('what') ||
                     query.includes('how') || query.includes('why') ||
                     query.includes('when') || query.includes('where') ||
                     query.includes('who')

  // Build response based on sources
  const response: string[] = []

  // Opening based on agent and query type
  if (isQuestion) {
    response.push(`Based on my knowledge and experience${agent.era ? ` during ${agent.era}` : ''}, `)
  } else {
    response.push(`Regarding your inquiry about this matter, `)
  }

  if (sources.length === 0) {
    // No sources - graceful fallback
    response.push(
      `I don't have specific documented knowledge about "${userMessage.slice(0, 50)}..." ` +
      `in my available sources. However, I'd be happy to discuss this topic from my ` +
      `philosophical perspective if you'd like to explore it further.`
    )
  } else if (sources.length === 1) {
    // Single source - direct reference
    const source = sources[0]
    const excerpt = source.content.slice(0, 200).trim()
    response.push(
      `I can speak to this from my writings. ${excerpt}... ` +
      `This reflects my thinking on the matter. Would you like me to elaborate on any aspect?`
    )
  } else {
    // Multiple sources - synthesize
    response.push(`I have several relevant thoughts on this matter:\n\n`)

    // Include up to 3 sources with excerpts
    sources.slice(0, 3).forEach((source, idx) => {
      const excerpt = source.content.slice(0, 150).trim()
      response.push(`${idx + 1}. ${excerpt}...\n\n`)
    })

    response.push(
      `These perspectives from my work address different facets of your question. ` +
      `The interplay between these ideas reveals the complexity of the matter. ` +
      `I'm happy to explore any of these concepts more deeply if you wish.`
    )
  }

  return response.join('')
}

/**
 * Simulate generation timing for realistic testing
 * Returns a promise that resolves after a random delay (500-1500ms)
 * to mimic real API call latency
 */
export function simulateGenerationDelay(): Promise<void> {
  // Random delay between 500-1500ms to simulate API call
  const delay = 500 + Math.random() * 1000
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Check if we should use mock generation
 * Returns true if Anthropic API is unavailable or forced mock mode
 */
export function shouldUseMockGeneration(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const forceMock = process.env.USE_MOCK_GENERATION === 'true'

  // Use mock if explicitly enabled OR if no valid API key
  return forceMock || !apiKey || apiKey.length < 20
}

/**
 * Get mock generation status message
 * Returns a user-friendly status string
 */
export function getMockGenerationStatus(): string {
  const forceMock = process.env.USE_MOCK_GENERATION === 'true'
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length >= 20

  if (forceMock) {
    return 'Mock generation enabled (USE_MOCK_GENERATION=true)'
  } else if (!hasApiKey) {
    return 'Mock generation active (no valid Anthropic API key)'
  } else {
    return 'Real generation active (Anthropic API connected)'
  }
}
