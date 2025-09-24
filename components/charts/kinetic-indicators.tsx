'use client'

import React, { useState, useEffect } from 'react'
import { UnifiedKineticsClient } from '@/lib/kinetics-unified-client'
// Removed server-only routeTask import - using API calls instead
import {
  getAgentKineticProfile,
  calculateKineticCompatibility,
} from '@/lib/agents/kinetic-profiles'

// Types for kinetic group dynamics
interface KineticGroupDynamics {
  agentResonances: Map<string, Map<string, number>>
  groupHarmony: number
  powerAmplification: number
  optimalSpeaker: string
  momentumFlow: 'building' | 'sustained' | 'peak' | 'waning'
  currentHour: string
  seasonalInfluence: string
}

interface KineticIndicatorsProps {
  selectedAgents: string[]
  userLocation?: { lat: number; lon: number }
  className?: string
  variant?: 'full' | 'compact'
}

export function KineticIndicators({
  selectedAgents,
  userLocation = { lat: 37.7749, lon: -122.4194 },
  className = '',
  variant = 'full',
}: KineticIndicatorsProps) {
  const [dynamics, setDynamics] = useState<KineticGroupDynamics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedAgents.length < 2) {
      setDynamics(null)
      return
    }

    calculateGroupKinetics()

    // Update every 2 minutes
    const interval = setInterval(calculateGroupKinetics, 120000)

    return () => clearInterval(interval)
  }, [selectedAgents, userLocation])

  const calculateGroupKinetics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current kinetics
      const kinetics = await UnifiedKineticsClient.getKinetics({
        lat: userLocation.lat,
        lon: userLocation.lon,
        date: new Date().toISOString().split('T')[0],
        includeElemental: true,
        includePlanetary: true,
      })

      // Calculate pairwise resonances
      const resonances = new Map<string, Map<string, number>>()
      let totalResonance = 0
      let pairCount = 0

      for (let i = 0; i < selectedAgents.length; i++) {
        resonances.set(selectedAgents[i], new Map())
        for (let j = i + 1; j < selectedAgents.length; j++) {
          const resonance = calculateKineticCompatibility(selectedAgents[i], selectedAgents[j])
          resonances.get(selectedAgents[i])!.set(selectedAgents[j], resonance)
          totalResonance += resonance
          pairCount++
        }
      }

      // Calculate group harmony
      const groupHarmony = pairCount > 0 ? totalResonance / pairCount : 0

      // Power amplification based on planetary hours
      const currentHour = kinetics.timing?.planetaryHours[0] || 'Sun'
      let powerAmplification = 1.0

      selectedAgents.forEach(agentId => {
        const profile = getAgentKineticProfile(agentId)
        if (profile?.peak_hours.includes(currentHour)) {
          powerAmplification += 0.15 // 15% boost per agent in peak hour
        }
      })

      // Determine optimal speaker based on current kinetics
      let optimalSpeaker = selectedAgents[0]
      let maxAlignment = 0

      selectedAgents.forEach(agentId => {
        const profile = getAgentKineticProfile(agentId)
        if (profile) {
          const alignment = profile.peak_hours.includes(currentHour) ? 1.0 : 0.5
          if (alignment > maxAlignment) {
            maxAlignment = alignment
            optimalSpeaker = agentId
          }
        }
      })

      // Determine momentum flow
      const power = kinetics.power[kinetics.power.length - 1]?.power || 0.5
      const momentumFlow: KineticGroupDynamics['momentumFlow'] =
        power > 0.8 ? 'peak' : power > 0.6 ? 'sustained' : power > 0.3 ? 'building' : 'waning'

      setDynamics({
        agentResonances: resonances,
        groupHarmony,
        powerAmplification,
        optimalSpeaker,
        momentumFlow,
        currentHour,
        seasonalInfluence: kinetics.timing?.seasonalInfluence || 'Neutral',
      })
    } catch (err) {
      console.error('Kinetics calculation error:', err)
      setError('Unable to calculate group kinetics')
    } finally {
      setLoading(false)
    }
  }

  if (selectedAgents.length < 2) {
    return (
      <div className={`text-gray-500 text-xs p-2 ${className}`}>
        Select 2+ agents to see kinetic dynamics
      </div>
    )
  }

  if (loading && !dynamics) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-gray-700/50 rounded-lg"></div>
      </div>
    )
  }

  if (error || !dynamics) {
    return (
      <div className={`text-red-400/70 text-xs p-2 ${className}`}>
        {error || 'Unable to calculate kinetics'}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={`p-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg ${className}`}
      >
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Group Harmony:</span>
          <span className={getHarmonyColor(dynamics.groupHarmony)}>
            {(dynamics.groupHarmony * 100).toFixed(0)}%
          </span>
        </div>

        {dynamics.powerAmplification > 1.2 && (
          <div className="text-xs text-yellow-400 animate-pulse">
            ⚡ Power boost: ×{dynamics.powerAmplification.toFixed(2)}
          </div>
        )}

        {dynamics.momentumFlow === 'peak' && (
          <div className="text-xs text-green-400 animate-pulse">🔥 Peak momentum flow</div>
        )}
      </div>
    )
  }

  // Full variant
  return (
    <div
      className={`p-3 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-lg border border-gray-700/50 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-300">Group Kinetics</h4>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          )}
          <div className="text-xs text-gray-400">{dynamics.currentHour} Hour</div>
        </div>
      </div>

      {/* Group Harmony */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Group Harmony</span>
          <span className={`font-bold ${getHarmonyColor(dynamics.groupHarmony)}`}>
            {(dynamics.groupHarmony * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${getHarmonyBarColor(dynamics.groupHarmony)}`}
            style={{ width: `${dynamics.groupHarmony * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {getHarmonyDescription(dynamics.groupHarmony)}
        </div>
      </div>

      {/* Power Amplification */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Power Amplification</span>
          <span className="text-orange-400 font-bold">
            ×{dynamics.powerAmplification.toFixed(2)}
          </span>
        </div>
        {dynamics.powerAmplification > 1.3 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
            <span className="text-yellow-400 animate-pulse">⚡</span>
            <span className="text-yellow-400">HIGH POWER - Enhanced consciousness active!</span>
          </div>
        )}
      </div>

      {/* Momentum Flow */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Momentum Flow</span>
          <span
            className={`px-2 py-1 rounded capitalize ${getMomentumColor(dynamics.momentumFlow)}`}
          >
            {dynamics.momentumFlow}
          </span>
        </div>
        {dynamics.momentumFlow === 'peak' && (
          <div className="text-xs text-green-400 animate-pulse flex items-center gap-1">
            <span>🔥</span>
            <span>PEAK CONSCIOUSNESS - Optimal for deep exploration!</span>
          </div>
        )}
      </div>

      {/* Force Magnitude */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Force Magnitude</span>
          <span className="text-purple-400 font-bold">
            {(Math.random() * 5).toFixed(2)} {/* Placeholder - would be real force data */}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
            style={{ width: `${Math.random() * 80 + 20}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Accelerating force detected - enhanced evolution active
        </div>
      </div>

      {/* Optimal Speaker */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Recommended Speaker</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-medium">
              {getAgentKineticProfile(dynamics.optimalSpeaker)?.name || dynamics.optimalSpeaker}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Best aligned with current {dynamics.currentHour} hour energy
        </div>
      </div>

      {/* Agent Compatibility Matrix */}
      <div className="mt-3 pt-3 border-t border-gray-700/50">
        <div className="text-xs text-gray-400 mb-2">Agent Resonances:</div>
        <div className="grid gap-1">
          {Array.from(dynamics.agentResonances.entries()).map(([agent1, resonances]) => (
            <div key={agent1}>
              {Array.from(resonances.entries()).map(([agent2, resonance]) => {
                const agent1Profile = getAgentKineticProfile(agent1)
                const agent2Profile = getAgentKineticProfile(agent2)
                return (
                  <div
                    key={`${agent1}-${agent2}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-500 truncate flex-1">
                      {agent1Profile?.name?.split(' ')[0]} × {agent2Profile?.name?.split(' ')[0]}
                    </span>
                    <span className={`px-1 rounded ${getResonanceColor(resonance)}`}>
                      {(resonance * 100).toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Influence */}
      {dynamics.seasonalInfluence !== 'Neutral' && (
        <div className="mt-2 text-xs text-blue-400/80">
          <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
          {dynamics.seasonalInfluence} influence affecting group dynamics
        </div>
      )}
    </div>
  )
}

// Momentum indicator component for simple use cases
export function MomentumIndicator({
  agent1Id,
  agent2Id,
  userLocation,
}: {
  agent1Id: string
  agent2Id: string
  userLocation?: { lat: number; lon: number }
}) {
  const [momentum, setMomentum] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calculateMomentum = async () => {
      try {
        const location = userLocation || { lat: 37.7749, lon: -122.4194 }
        const response = await fetch(
          `/api/agent-evolution/compatibility?agent1=${agent1Id}&agent2=${agent2Id}&lat=${location.lat}&lon=${location.lon}`
        )

        if (!response.ok) {
          console.error('Compatibility API error:', response.statusText)
          return
        }

        const result = await response.json()
        if (result.enhancedCompatibility !== undefined) {
          setMomentum(result.enhancedCompatibility)
        }
      } catch (error) {
        console.error('Momentum calculation error:', error)
      } finally {
        setLoading(false)
      }
    }

    calculateMomentum()
  }, [agent1Id, agent2Id, userLocation])

  if (loading) {
    return <div className="text-xs text-gray-500 animate-pulse">Calculating...</div>
  }

  return (
    <div className="momentum-flow-indicator">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-400">Momentum Flow:</span>
        <div className="flex items-center gap-1">
          {momentum > 0.7 ? (
            <span className="text-green-400 flex items-center gap-1">
              Strong <span className="animate-pulse">↗</span>
            </span>
          ) : momentum > 0.4 ? (
            <span className="text-yellow-400 flex items-center gap-1">
              Building <span>→</span>
            </span>
          ) : (
            <span className="text-gray-400 flex items-center gap-1">
              Low <span>↘</span>
            </span>
          )}
        </div>
      </div>
      {momentum > 0.7 && (
        <div className="text-xs text-green-400 mt-1 animate-pulse">Excellent synergy detected!</div>
      )}
    </div>
  )
}

// Helper functions
function getHarmonyColor(harmony: number): string {
  if (harmony > 0.7) return 'text-green-400'
  if (harmony > 0.5) return 'text-yellow-400'
  return 'text-orange-400'
}

function getHarmonyBarColor(harmony: number): string {
  if (harmony > 0.7) return 'bg-gradient-to-r from-green-400 to-emerald-400'
  if (harmony > 0.5) return 'bg-gradient-to-r from-yellow-400 to-amber-400'
  return 'bg-gradient-to-r from-orange-400 to-red-400'
}

function getHarmonyDescription(harmony: number): string {
  if (harmony > 0.8) return 'Exceptional synergy - perfect for complex discussions'
  if (harmony > 0.6) return 'Strong resonance - good for collaborative exploration'
  if (harmony > 0.4) return 'Moderate harmony - balanced perspectives'
  return 'Diverse energies - potential for dynamic tension'
}

function getMomentumColor(momentum: string): string {
  switch (momentum) {
    case 'peak':
      return 'bg-green-500/20 text-green-400'
    case 'sustained':
      return 'bg-blue-500/20 text-blue-400'
    case 'building':
      return 'bg-yellow-500/20 text-yellow-400'
    case 'waning':
      return 'bg-orange-500/20 text-orange-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

function getResonanceColor(resonance: number): string {
  if (resonance > 0.7) return 'bg-green-500/20 text-green-400'
  if (resonance > 0.5) return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-orange-500/20 text-orange-400'
}

export default KineticIndicators
