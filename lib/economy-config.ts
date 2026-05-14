export const BASE_AGENTS_YIELD = 10
export const PREMIUM_MULTIPLIER = 2.0
export const TOKEN_TYPES = ['Spirit', 'Essence', 'Matter', 'Substance'] as const
export type TokenType = (typeof TOKEN_TYPES)[number]

/**
 * Agent Action System — Activation threshold.
 * A score ≥ this value triggers an agentic user to perform an action.
 * Scale is 0–1 (normalized resonance + planetary hour alignment).
 */
export const AGENT_ACTIVATION_THRESHOLD = 0.55

/**
 * Base daily yield amount credited to each agentic user during the
 * automated daily claim cron (`/api/cron/agents/claim-yield`).
 * Distributed evenly across the four ESMS token types.
 */
export const AGENT_DAILY_YIELD = 8

export const AGENT_OPERATION_COSTS: Record<string, Partial<Record<TokenType, number>>> = {
  unified_chat: { Spirit: 5, Essence: 2 },
  report_generation: { Spirit: 10, Substance: 5 },
  // Agentic action costs
  agent_feed_post: { Spirit: 2, Essence: 1 },
  agent_transmutation: { Matter: 3, Substance: 2 },
  agent_meal_plan: { Spirit: 4, Substance: 2 },
  agent_pantry_update: { Matter: 2, Essence: 1 },
}
