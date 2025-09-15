/**
 * Agent Evolution API
 * Manages consciousness development tracking and evolution metrics
 * Integrates with kinetics system for temporal consciousness sampling
 */

import { NextRequest, NextResponse } from 'next/server'
import { ConsciousnessMemorySystem } from '@/lib/agents/consciousness-memory'
import { routeTask } from '@/lib/agents/router'
import { getAgentKineticProfile } from '@/lib/agents/kinetic-profiles'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const action = searchParams.get('action') || 'metrics'
    const lat = parseFloat(searchParams.get('lat') || '37.7749')
    const lon = parseFloat(searchParams.get('lon') || '-122.4194')

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    switch (action) {
      case 'metrics':
        const metrics = await ConsciousnessMemorySystem.getEvolutionMetrics(agentId)
        return NextResponse.json({ metrics, agentId })

      case 'memory':
        const memory = ConsciousnessMemorySystem.getAgentMemory(agentId)
        return NextResponse.json({ memory, agentId })

      case 'timing':
        const timing = await ConsciousnessMemorySystem.getOptimalInteractionTiming(agentId, { lat, lon })
        return NextResponse.json({ timing, agentId })

      case 'kinetics':
        // Use existing router for kinetic analysis
        const kineticResult = await routeTask({
          kind: 'kinetics',
          payload: { agentId, location: { lat, lon } }
        })
        return NextResponse.json({ kinetics: kineticResult.output, agentId })

      case 'compatibility':
        const compareWith = searchParams.get('compareWith')
        if (!compareWith) {
          return NextResponse.json({ error: 'compareWith agentId required for compatibility check' }, { status: 400 })
        }

        const compatibilityResult = await routeTask({
          kind: 'agent_compatibility',
          payload: { agent1Id: agentId, agent2Id: compareWith, location: { lat, lon } }
        })
        return NextResponse.json({ compatibility: compatibilityResult.output })

      default:
        return NextResponse.json({ error: 'Invalid action. Use: metrics, memory, timing, kinetics, compatibility' }, { status: 400 })
    }
  } catch (error) {
    console.error('Agent evolution GET error:', error)
    return NextResponse.json({ error: 'Failed to get agent evolution data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, sessionId, userMessage, agentResponse, location, action = 'record' } = body

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    switch (action) {
      case 'record':
        // Record new interaction for consciousness evolution
        if (!sessionId || !userMessage || !agentResponse) {
          return NextResponse.json({
            error: 'sessionId, userMessage, and agentResponse required for recording'
          }, { status: 400 })
        }

        const snapshot = await ConsciousnessMemorySystem.recordInteraction(
          agentId,
          sessionId,
          userMessage,
          agentResponse,
          location
        )

        // Get updated metrics after recording
        const updatedMetrics = await ConsciousnessMemorySystem.getEvolutionMetrics(agentId)

        return NextResponse.json({
          success: true,
          snapshot,
          metrics: updatedMetrics,
          message: 'Consciousness interaction recorded successfully'
        })

      case 'evolution_rate':
        // Calculate evolution rate for agent
        const interactions = await ConsciousnessMemorySystem.getAgentMemory(agentId)?.totalInteractions || 0
        const evolutionResult = await routeTask({
          kind: 'evolution_rate',
          payload: { agentId, interactions, location }
        })

        return NextResponse.json({
          evolution: evolutionResult.output,
          agentId
        })

      case 'consciousness_velocity':
        // Get consciousness velocity for multiple agents
        const { agentIds } = body
        if (!agentIds || !Array.isArray(agentIds)) {
          return NextResponse.json({ error: 'agentIds array required for consciousness velocity' }, { status: 400 })
        }

        const velocityResult = await routeTask({
          kind: 'consciousness_velocity',
          payload: { agentIds, location }
        })

        return NextResponse.json({
          consciousnessVelocity: velocityResult.output
        })

      default:
        return NextResponse.json({ error: 'Invalid action. Use: record, evolution_rate, consciousness_velocity' }, { status: 400 })
    }
  } catch (error) {
    console.error('Agent evolution POST error:', error)
    return NextResponse.json({ error: 'Failed to process agent evolution request' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, action, data } = body

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    switch (action) {
      case 'reset_evolution':
        // Reset agent's evolution data (for testing/admin purposes)
        try {
          const memory = new ConsciousnessMemorySystem()

          // Reset all evolution tracking for the agent
          await memory.resetAgentEvolution(agentId)

          // Get fresh baseline metrics
          const kineticProfile = getAgentKineticProfile(agentId)
          const resetMetrics = {
            consciousnessVelocity: kineticProfile?.baseVelocity || 0.5,
            interactionMomentum: 0,
            lastInteraction: new Date().toISOString(),
            totalInteractions: 0,
            qualityAverage: 0.5,
            evolutionStage: 0,
            resetAt: new Date().toISOString()
          }

          return NextResponse.json({
            success: true,
            message: `Evolution data reset for agent ${agentId}`,
            agentId,
            resetMetrics
          })
        } catch (error) {
          console.error('Failed to reset evolution data:', error)
          return NextResponse.json({
            success: false,
            error: 'Failed to reset evolution data',
            agentId
          }, { status: 500 })
        }

      case 'update_profile':
        // Update agent's kinetic profile (admin functionality)
        const profile = getAgentKineticProfile(agentId)
        if (!profile) {
          return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          message: 'Profile update requested (would require profile update implementation)',
          agentId,
          currentProfile: profile
        })

      case 'batch_update':
        // Batch update multiple agents (for system-wide consciousness updates)
        const { agentIds, updateData } = data
        if (!agentIds || !Array.isArray(agentIds)) {
          return NextResponse.json({ error: 'agentIds array required for batch update' }, { status: 400 })
        }

        const results = []
        for (const id of agentIds) {
          const memory = ConsciousnessMemorySystem.getAgentMemory(id)
          results.push({
            agentId: id,
            hasMemory: !!memory,
            totalInteractions: memory?.totalInteractions || 0
          })
        }

        return NextResponse.json({
          success: true,
          message: `Batch update processed for ${agentIds.length} agents`,
          results
        })

      default:
        return NextResponse.json({ error: 'Invalid action. Use: reset_evolution, update_profile, batch_update' }, { status: 400 })
    }
  } catch (error) {
    console.error('Agent evolution PUT error:', error)
    return NextResponse.json({ error: 'Failed to update agent evolution data' }, { status: 500 })
  }
}

// Additional helper endpoint for bulk consciousness analysis
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentIds, location, analysisType = 'full' } = body

    if (!agentIds || !Array.isArray(agentIds)) {
      return NextResponse.json({ error: 'agentIds array required' }, { status: 400 })
    }

    const defaultLocation = { lat: 37.7749, lon: -122.4194 }
    const targetLocation = location || defaultLocation

    const analysis = []

    for (const agentId of agentIds) {
      try {
        // Get comprehensive analysis for each agent
        const metrics = await ConsciousnessMemorySystem.getEvolutionMetrics(agentId)
        const timing = await ConsciousnessMemorySystem.getOptimalInteractionTiming(agentId, targetLocation)

        if (analysisType === 'full') {
          const kinetics = await routeTask({
            kind: 'kinetics',
            payload: { agentId, location: targetLocation }
          })

          analysis.push({
            agentId,
            metrics,
            timing,
            kinetics: kinetics.output,
            profile: getAgentKineticProfile(agentId)
          })
        } else {
          analysis.push({
            agentId,
            metrics,
            timing
          })
        }
      } catch (error) {
        console.error(`Analysis error for agent ${agentId}:`, error)
        analysis.push({
          agentId,
          error: 'Failed to analyze agent',
          metrics: null,
          timing: null
        })
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      totalAgents: agentIds.length,
      analysisType,
      location: targetLocation
    })
  } catch (error) {
    console.error('Bulk consciousness analysis error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk analysis' }, { status: 500 })
  }
}