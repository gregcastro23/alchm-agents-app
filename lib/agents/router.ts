import { agentRegistry, type AgentDefinition } from './registry'

export type RouterTask =
  | { kind: 'alchemize'; payload: any }
  | { kind: 'monica_mc'; payload: any }
  | { kind: 'synastry'; payload: any }
  | { kind: 'tarot'; payload: any }
  | { kind: 'temporal_delta'; payload: any }

export interface RoutedResult<T = any> {
  output: T | null
  agentId: string
  degraded?: boolean
  confidence?: number
  latencyMs?: number
}

export async function routeTask(task: RouterTask): Promise<RoutedResult> {
  const start = Date.now()
  let agent: AgentDefinition | undefined
  switch (task.kind) {
    case 'alchemize':
      agent = agentRegistry.get('alchemizer');
      break;
    case 'monica_mc':
      agent = agentRegistry.get('monica_mc');
      break;
    case 'synastry':
      agent = agentRegistry.get('synastry');
      break;
    case 'tarot':
      agent = agentRegistry.get('tarot');
      break;
    case 'temporal_delta':
      agent = agentRegistry.get('temporal_delta');
      break;
    default:
      agent = agentRegistry.get('router');
  }

  if (!agent || !agent.handler) {
    return { output: null, agentId: agent?.id || 'router', degraded: true, latencyMs: Date.now() - start }
  }

  try {
    const output = await agent.handler((task as any).payload)
    return { output, agentId: agent.id, degraded: false, confidence: agent.confidenceThreshold || 0.7, latencyMs: Date.now() - start }
  } catch (_e) {
    return { output: null, agentId: agent.id, degraded: true, confidence: 0.0, latencyMs: Date.now() - start }
  }
}


