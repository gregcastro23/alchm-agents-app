import { Anthropic } from '@anthropic-ai/sdk'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Check if ANTHROPIC_API_KEY is available
// Fall back to OPENAI_API_KEY if ANTHROPIC_API_KEY is not available
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY

if (!apiKey) {
  console.warn(
    'Warning: Neither ANTHROPIC_API_KEY nor OPENAI_API_KEY is set in environment variables'
  )
}

// Create and export the Anthropic client
export const anthropic = new Anthropic({
  apiKey: apiKey || 'dummy-key', // Use a dummy key if not available (will cause actual API calls to fail)
})

// Model configuration for upgraded subscription
export const CLAUDE_MODELS = {
  // Claude 3.5 models (latest)
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20241022',
  CLAUDE_3_5_HAIKU: 'claude-3-5-haiku-20241022',

  // Claude 3 models
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',

  // Legacy models (fallback)
  CLAUDE_3_SONNET_LEGACY: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU_LEGACY: 'claude-3-haiku-20240307',
} as const

// Get model from environment or use defaults
export function getClaudeModel(type: 'default' | 'fast' | 'powerful' = 'default'): string {
  switch (type) {
    case 'default':
      return process.env.CLAUDE_DEFAULT_MODEL || CLAUDE_MODELS.CLAUDE_3_5_SONNET
    case 'fast':
      return process.env.CLAUDE_FAST_MODEL || CLAUDE_MODELS.CLAUDE_3_5_HAIKU
    case 'powerful':
      return CLAUDE_MODELS.CLAUDE_3_OPUS
    default:
      return CLAUDE_MODELS.CLAUDE_3_5_SONNET
  }
}

// Helper function to check if the API key is configured
export function isAnthropicConfigured(): boolean {
  return !!apiKey
}

// Enhanced message creation with model selection
export async function createClaudeMessage(
  messages: any[],
  system?: string,
  modelType: 'default' | 'fast' | 'powerful' = 'default',
  maxTokens: number = 4096
) {
  const model = getClaudeModel(modelType)

  return await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system:
      system ||
      'You are a helpful AI assistant specializing in astrological and alchemical wisdom.',
    messages,
  })
}

// Log stream helper function with updated model
export async function logToAnthropicStream(
  message: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    if (!isAnthropicConfigured()) {
      console.warn('API key not configured, cannot log to stream')
      return false
    }

    console.log(`Logging to AI stream: ${message}`)

    // Create a message with Claude that acts as a logging stream
    const response = await createClaudeMessage(
      [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `LOG ENTRY: ${message}\nMETADATA: ${JSON.stringify(metadata, null, 2)}`,
            },
          ],
        },
      ],
      'You are a log processing agent. Your job is to receive logs, acknowledge them, and provide insights if needed. Be brief and efficient in your responses.',
      'fast'
    )

    // Output the model's response to the server logs
    const firstContent = response.content[0]
    if (firstContent.type === 'text') {
      console.log('AI Log Response:', (firstContent as any).text)
    }

    return true
  } catch (error) {
    console.error('Error logging to AI stream:', error)
    return false
  }
}

// Helper function to get model information
export function getModelInfo(modelType: 'default' | 'fast' | 'powerful' = 'default') {
  const model = getClaudeModel(modelType)

  const modelInfo = {
    [CLAUDE_MODELS.CLAUDE_3_5_SONNET]: {
      name: 'Claude 3.5 Sonnet',
      contextWindow: '200K tokens',
      capabilities: ['Complex reasoning', 'Advanced analysis', 'Creative tasks'],
      bestFor: 'Complex astrological calculations, chart interpretation',
    },
    [CLAUDE_MODELS.CLAUDE_3_5_HAIKU]: {
      name: 'Claude 3.5 Haiku',
      contextWindow: '200K tokens',
      capabilities: ['Fast responses', 'Efficient processing', 'Simple tasks'],
      bestFor: 'Quick queries, general responses, logging',
    },
    [CLAUDE_MODELS.CLAUDE_3_OPUS]: {
      name: 'Claude 3 Opus',
      contextWindow: '200K tokens',
      capabilities: ['Most capable', 'Advanced reasoning', 'Creative tasks'],
      bestFor: 'Most complex tasks, advanced analysis',
    },
  }

  return (
    modelInfo[model] || {
      name: 'Unknown Model',
      contextWindow: 'Unknown',
      capabilities: ['Unknown'],
      bestFor: 'General use',
    }
  )
}
