import { resolveDefaultModel } from '../models/registry'
import type { LanguageModel } from 'ai'

export type RoutingDecision = {
  modelId: string
  model: LanguageModel
  reason: 'default' | 'complexity_elevate' | 'risk_elevate'
}

export function decideModel(opts: {
  defaultModel?: string
  complexity?: 'simple' | 'moderate' | 'complex'
  hallucinationRisk?: 'low' | 'med' | 'high'
}): RoutingDecision {
  let tier: 'default' | 'powerful' = 'default'
  let reason: RoutingDecision['reason'] = 'default'

  if (opts.complexity === 'complex' || opts.hallucinationRisk === 'high') {
    tier = 'powerful'
    reason = opts.complexity === 'complex' ? 'complexity_elevate' : 'risk_elevate'
  }

  const model = resolveDefaultModel(tier)
  const modelId = opts.defaultModel || process.env.MONICA_DEFAULT_MODEL || 'gemini-2.0-flash'

  return { modelId, model, reason }
}
