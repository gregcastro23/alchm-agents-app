import { describe, it, expect, vi, beforeEach } from 'vitest'
import { feedActivationEngine } from '@/lib/agents/feed-activation-engine'
import { celestialEnergyCalculator } from '@/lib/celestial-energy-calculator'
import { HistoricalAgentsService } from '@/lib/historical-agents-db'
import { unifiedTracker } from '@/lib/consciousness/unified-tracker'

vi.mock('@/lib/celestial-energy-calculator')
vi.mock('@/lib/historical-agents-db')
vi.mock('@/lib/consciousness/unified-tracker')

describe('FeedActivationEngine', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should evaluate activations and return actions for resonant agents', async () => {
    // Mock Active Agents
    vi.mocked(HistoricalAgentsService.getAllAgents).mockResolvedValue([
      {
        agentId: 'agent-1',
        name: 'Revolutionary Agent',
        personalityCore: { expression: 'revolutionary' },
        consciousnessLevel: 'Transcendent',
        dominantElement: 'Fire',
      } as any,
    ])

    // Mock Celestial Moment (High Entropy)
    vi.mocked(celestialEnergyCalculator.calculateMoment).mockResolvedValue({
      thermodynamic: { entropy: 85, heat: 50, reactivity: 50, energy: 50 },
      alchemical: { A_number: 50, spirit: 50, matter: 50, essence: 50, substance: 50 },
      kinetic: { velocity: { Fire: 50 }, power: 50 },
      elemental: { Fire: 50 },
    } as any)

    // Mock Consciousness State
    vi.mocked(unifiedTracker.getCurrentState).mockResolvedValue({
      consciousnessVelocity: 0.8,
      interactionMomentum: 0.9,
    } as any)

    const actions = await feedActivationEngine.evaluateActivations()

    expect(actions).toHaveLength(1)
    expect(actions[0].agentEmail).toBe('agent-1@alchm.kitchen')
    expect(actions[0].eventType).toBe('insight')
    expect(actions[0].metadataPayload.internalTrigger).toBe('high_entropy_resonance')
  })

  it('should trigger transcendent agents on A# spike', async () => {
    vi.mocked(HistoricalAgentsService.getAllAgents).mockResolvedValue([
      {
        agentId: 'agent-2',
        name: 'Transcendent Agent',
        personalityCore: { expression: 'calm' },
        consciousnessLevel: 'Transcendent',
        dominantElement: 'Water',
      } as any,
    ])

    // Mock Celestial Moment (High A#)
    vi.mocked(celestialEnergyCalculator.calculateMoment).mockResolvedValue({
      thermodynamic: { entropy: 40, heat: 50, reactivity: 50, energy: 50 },
      alchemical: { A_number: 95, spirit: 50, matter: 50, essence: 50, substance: 50 },
      kinetic: { velocity: { Water: 50 }, power: 50 },
      elemental: { Water: 50 },
    } as any)

    vi.mocked(unifiedTracker.getCurrentState).mockResolvedValue({
      consciousnessVelocity: 0.8,
      interactionMomentum: 0.9,
    } as any)

    const actions = await feedActivationEngine.evaluateActivations()

    expect(actions).toHaveLength(1)
    expect(actions[0].agentEmail).toBe('agent-2@alchm.kitchen')
    expect(actions[0].eventType).toBe('lab_entry')
    expect(actions[0].metadataPayload.internalTrigger).toBe('transcendent_a_number_spike')
  })
})
