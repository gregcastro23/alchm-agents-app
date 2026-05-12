export const BASE_AGENTS_YIELD = 10
export const PREMIUM_MULTIPLIER = 2.0
export const TOKEN_TYPES = ['Spirit', 'Essence', 'Matter', 'Substance'] as const
export type TokenType = (typeof TOKEN_TYPES)[number]

export const AGENT_OPERATION_COSTS: Record<string, Partial<Record<TokenType, number>>> = {
  unified_chat: { Spirit: 5, Essence: 2 },
  report_generation: { Spirit: 10, Substance: 5 },
}
