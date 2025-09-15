export type RoutingDecision = {
  model: string
  reason: 'default' | 'complexity_elevate' | 'risk_elevate'
}

export function decideModel(opts: {
  defaultModel?: string
  complexity?: 'simple' | 'moderate' | 'complex'
  hallucinationRisk?: 'low' | 'med' | 'high'
}): RoutingDecision {
  const base = opts.defaultModel || process.env.MONICA_DEFAULT_MODEL || 'gpt-4o-mini'
  let model = base
  let reason: RoutingDecision['reason'] = 'default'
  if (opts.complexity === 'complex' || opts.hallucinationRisk === 'high') {
    model = 'gpt-4o'
    reason = opts.complexity === 'complex' ? 'complexity_elevate' : 'risk_elevate'
  }
  return { model, reason }
}
