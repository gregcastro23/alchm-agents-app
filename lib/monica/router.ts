import { resolveOpenAIModel, OPENAI } from '../models/registry'

export type RoutingDecision = {
  model: string
  reason: 'default' | 'complexity_elevate' | 'risk_elevate'
}

export function decideModel(opts: {
  defaultModel?: string
  complexity?: 'simple' | 'moderate' | 'complex'
  hallucinationRisk?: 'low' | 'med' | 'high'
}): RoutingDecision {
  const base = opts.defaultModel || process.env.MONICA_DEFAULT_MODEL || resolveOpenAIModel('default')
  let model = base
  let reason: RoutingDecision['reason'] = 'default'
  if (opts.complexity === 'complex' || opts.hallucinationRisk === 'high') {
    model = resolveOpenAIModel('powerful')
    reason = opts.complexity === 'complex' ? 'complexity_elevate' : 'risk_elevate'
  }
  return { model, reason }
}
