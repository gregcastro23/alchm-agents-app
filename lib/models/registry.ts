/**
 * Centralized AI Model Registry
 * 
 * Single source of truth for all AI model identifiers used across the project.
 * Updated May 2026 to reflect the current model landscape.
 * 
 * When models are deprecated or new ones released, update ONLY this file.
 */

// ============================================================================
// ANTHROPIC (CLAUDE) MODELS
// ============================================================================

export const CLAUDE = {
  // Claude 3.5/3 — Current verified production models
  OPUS:    'claude-3-opus-20240229',        // Flagship — complex reasoning, agentic coding
  SONNET:  'claude-3-5-sonnet-20241022',    // Balanced — speed + intelligence for professional use
  HAIKU:   'claude-3-5-haiku-20241022',     // Fast — high-volume, cost-efficient tasks

  // Aliases kept for backward compat
  LEGACY_SONNET_3_5: 'claude-3-5-sonnet-20241022',
  LEGACY_HAIKU_3_5:  'claude-3-5-haiku-20241022',
  LEGACY_OPUS_3:     'claude-3-opus-20240229',
  LEGACY_SONNET_3:   'claude-3-sonnet-20240229',
  LEGACY_HAIKU_3:    'claude-3-haiku-20240307',
} as const

export type ClaudeModelId = (typeof CLAUDE)[keyof typeof CLAUDE]

// ============================================================================
// OPENAI MODELS
// ============================================================================

export const OPENAI = {
  // GPT-4o — Current verified production models
  GPT_5_5:      'gpt-4o',          // Flagship — complex reasoning, coding, agentic workflows
  GPT_5_4_MINI: 'gpt-4o-mini',     // Balanced — lower latency and cost
  GPT_5_4_NANO: 'gpt-4o-mini',     // Fastest — maps to gpt-4o-mini

  // Explicit aliases
  LEGACY_GPT_4O:      'gpt-4o',
  LEGACY_GPT_4O_MINI: 'gpt-4o-mini',
  LEGACY_GPT_4_TURBO: 'gpt-4-turbo-preview',
  LEGACY_GPT_3_5:     'gpt-3.5-turbo',
} as const

export type OpenAIModelId = (typeof OPENAI)[keyof typeof OPENAI]

// ============================================================================
// EMBEDDING MODELS
// ============================================================================

export const EMBEDDINGS = {
  OPENAI_LARGE: 'text-embedding-3-large',
  OPENAI_SMALL: 'text-embedding-3-small',  // Legacy default
} as const

export type EmbeddingModelId = (typeof EMBEDDINGS)[keyof typeof EMBEDDINGS]

// ============================================================================
// MODEL TIERS — Semantic accessors for the codebase
// ============================================================================

/**
 * Use these throughout the app instead of raw model IDs.
 * Each tier maps to the best available model for that purpose.
 */
export const MODEL_TIERS = {
  /** Deep reasoning, complex multi-step tasks, agentic coding */
  POWERFUL: {
    claude: CLAUDE.OPUS,
    openai: OPENAI.GPT_5_5,
  },
  /** General-purpose, balanced speed/quality */
  DEFAULT: {
    claude: CLAUDE.SONNET,
    openai: OPENAI.GPT_5_4_MINI,
  },
  /** Fast responses, high-volume, logging, simple queries */
  FAST: {
    claude: CLAUDE.HAIKU,
    openai: OPENAI.GPT_5_4_NANO,
  },
} as const

// ============================================================================
// FALLBACK CHAINS — Graceful degradation if a model is unavailable
// ============================================================================

export const CLAUDE_FALLBACK_CHAIN: readonly ClaudeModelId[] = [
  CLAUDE.SONNET,
  CLAUDE.HAIKU,
  CLAUDE.OPUS,
]

export const OPENAI_FALLBACK_CHAIN: readonly OpenAIModelId[] = [
  OPENAI.GPT_5_4_MINI,   // gpt-4o-mini
  OPENAI.GPT_5_5,        // gpt-4o
  OPENAI.LEGACY_GPT_3_5,
]

// ============================================================================
// HELPER: Resolve model from environment or default
// ============================================================================

/**
 * Resolve a Claude model — checks env var first, then uses the tier default.
 */
export function resolveClaudeModel(
  tier: 'powerful' | 'default' | 'fast' = 'default'
): string {
  const envModel = process.env.CLAUDE_DEFAULT_MODEL
  if (envModel) return envModel

  switch (tier) {
    case 'powerful': return MODEL_TIERS.POWERFUL.claude
    case 'fast':     return MODEL_TIERS.FAST.claude
    default:         return MODEL_TIERS.DEFAULT.claude
  }
}

/**
 * Resolve an OpenAI model — checks env var first, then uses the tier default.
 */
export function resolveOpenAIModel(
  tier: 'powerful' | 'default' | 'fast' = 'default'
): string {
  const envModel = process.env.OPENAI_DEFAULT_MODEL || process.env.MONICA_DEFAULT_MODEL
  if (envModel) return envModel

  switch (tier) {
    case 'powerful': return MODEL_TIERS.POWERFUL.openai
    case 'fast':     return MODEL_TIERS.FAST.openai
    default:         return MODEL_TIERS.DEFAULT.openai
  }
}

/**
 * Resolve embedding model from environment or default.
 */
export function resolveEmbeddingModel(): string {
  return process.env.EMBEDDINGS_MODEL || EMBEDDINGS.OPENAI_LARGE
}
