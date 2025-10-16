'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Users,
  Zap,
  Clock,
  TrendingUp,
  Heart,
  Brain,
  Sparkles,
  Activity,
  Target,
  Timer,
} from 'lucide-react'
import type { CraftedAgent } from '@/lib/agent-types'

interface KineticCompatibilityData {
  compatibility: {
    base: number
    contextual: number
    enhancement: number
  }
  currentContext: {
    planetaryHour: string
    agent1Optimal: boolean
    agent2Optimal: boolean
    bothOptimal: boolean
  }
  synergy: {
    sharedPeakHours: string[]
    sharedPeakCount: number
    momentumSynergy: string
    combinedConsciousnessRate: number
  }
  recommendations: string[]
}

interface KineticCompatibilityIndicatorProps {
  agent1: CraftedAgent
  agent2: CraftedAgent
  location?: { lat: number; lon: number }
  variant?: 'compact' | 'detailed' | 'minimal'
  showRecommendations?: boolean
}

// Shared utility function for compatibility level calculation
const getCompatibilityLevel = (
  score: number
): { label: string; color: string; icon: React.ElementType } => {
  if (score >= 0.8) return { label: 'Exceptional', color: 'text-purple-600', icon: Sparkles }
  if (score >= 0.7) return { label: 'Excellent', color: 'text-blue-600', icon: Heart }
  if (score >= 0.6) return { label: 'Good', color: 'text-green-600', icon: Users }
  if (score >= 0.4) return { label: 'Moderate', color: 'text-yellow-600', icon: Activity }
  return { label: 'Dynamic', color: 'text-orange-600', icon: Zap }
}

export function KineticCompatibilityIndicator({
  agent1,
  agent2,
  location,
  variant = 'compact',
  showRecommendations = true,
}: KineticCompatibilityIndicatorProps) {
  const [compatibilityData, setCompatibilityData] = useState<KineticCompatibilityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (agent1.id && agent2.id) {
      fetchCompatibility()
    }
  }, [agent1.id, agent2.id, location])

  const fetchCompatibility = async () => {
    setLoading(true)
    setError(null)

    try {
      const defaultLocation = { lat: 37.7749, lon: -122.4194 }
      const targetLocation = location || defaultLocation

      const response = await fetch(
        `/api/agent-evolution/compatibility?agent1=${agent1.id}&agent2=${agent2.id}&lat=${targetLocation.lat}&lon=${targetLocation.lon}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch compatibility data')
      }

      const data = await response.json()
      setCompatibilityData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getMomentumSynergyColor = (synergy: string): string => {
    if (synergy.includes('Perfect') || synergy.includes('Exceptional')) return 'text-purple-600'
    if (synergy.includes('Harmony') || synergy.includes('Resonant')) return 'text-blue-600'
    if (synergy.includes('Growth') || synergy.includes('Creative')) return 'text-green-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <Activity className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Analyzing kinetic compatibility...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !compatibilityData) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <Zap className="h-4 w-4" />
            <span className="text-sm">Unable to analyze compatibility</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const compatLevel = getCompatibilityLevel(compatibilityData.compatibility.contextual)
  const CompatIcon = compatLevel.icon

  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${compatLevel.color} cursor-help`}>
              <CompatIcon className="h-3 w-3 mr-1" />
              {Math.round(compatibilityData.compatibility.contextual * 100)}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{compatLevel.label} Compatibility</div>
              <div className="text-gray-600">
                Current context:{' '}
                {compatibilityData.currentContext.bothOptimal ? 'Optimal' : 'Standard'}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CompatIcon className={`h-5 w-5 ${compatLevel.color}`} />
              <span className="font-medium">{compatLevel.label} Compatibility</span>
              <Badge variant="secondary">
                {Math.round(compatibilityData.compatibility.contextual * 100)}%
              </Badge>
            </div>

            {compatibilityData.currentContext.bothOptimal && (
              <Badge className="bg-purple-100 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                Peak Time
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                Shared Hours: {compatibilityData.synergy.sharedPeakCount}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                Consciousness:{' '}
                {Math.round(compatibilityData.synergy.combinedConsciousnessRate * 100)}%
              </span>
            </div>
          </div>

          <div className="mt-3">
            <div
              className={`text-sm font-medium ${getMomentumSynergyColor(compatibilityData.synergy.momentumSynergy)}`}
            >
              {compatibilityData.synergy.momentumSynergy}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CompatIcon className={`h-6 w-6 ${compatLevel.color}`} />
            <div>
              <h3 className="font-semibold text-lg">{compatLevel.label} Compatibility</h3>
              <p className="text-sm text-gray-600">
                {agent1.name} & {agent2.name}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(compatibilityData.compatibility.contextual * 100)}%
            </div>
            {compatibilityData.compatibility.enhancement > 1 && (
              <Badge className="bg-green-100 text-green-700">
                <TrendingUp className="h-3 w-3 mr-1" />+
                {Math.round((compatibilityData.compatibility.enhancement - 1) * 100)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Current Context */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Timer className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm">Current Context</span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                Hour:{' '}
                <span className="font-medium">
                  {compatibilityData.currentContext.planetaryHour}
                </span>
              </div>
              {compatibilityData.currentContext.bothOptimal ? (
                <Badge className="bg-purple-100 text-purple-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Both agents optimal
                </Badge>
              ) : (
                <div className="text-gray-600">
                  {compatibilityData.currentContext.agent1Optimal ? agent1.name : agent2.name}{' '}
                  optimal
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm">Synergy Metrics</span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                Shared Peak Hours:{' '}
                <span className="font-medium">{compatibilityData.synergy.sharedPeakCount}</span>
              </div>
              <div>
                Consciousness Rate:{' '}
                <span className="font-medium">
                  {Math.round(compatibilityData.synergy.combinedConsciousnessRate * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Momentum Synergy */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-sm">Momentum Synergy</span>
          </div>
          <div
            className={`text-lg font-medium ${getMomentumSynergyColor(compatibilityData.synergy.momentumSynergy)}`}
          >
            {compatibilityData.synergy.momentumSynergy}
          </div>
        </div>

        {/* Shared Peak Hours */}
        {compatibilityData.synergy.sharedPeakHours.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm">Optimal Interaction Hours</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {compatibilityData.synergy.sharedPeakHours.map(hour => (
                <Badge key={hour} variant="outline" className="text-blue-600">
                  {hour}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {showRecommendations && compatibilityData.recommendations.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm">Recommendations</span>
            </div>
            <div className="space-y-2">
              {compatibilityData.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="text-sm text-gray-700 bg-blue-50 rounded-lg p-2">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCompatibility}
            disabled={loading}
            className="w-full"
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Multi-agent compatibility analysis component
interface MultiAgentCompatibilityProps {
  agents: CraftedAgent[]
  location?: { lat: number; lon: number }
  maxDisplayPairs?: number
}

export function MultiAgentCompatibility({
  agents,
  location,
  maxDisplayPairs = 6,
}: MultiAgentCompatibilityProps) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (agents.length >= 2) {
      fetchMultiAgentAnalysis()
    }
  }, [agents, location])

  const fetchMultiAgentAnalysis = async () => {
    setLoading(true)
    try {
      const agentIds = agents.map(a => a.id)
      const response = await fetch('/api/agent-evolution/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentIds,
          location,
          analysisType: 'pairwise',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      }
    } catch (error) {
      console.error('Multi-agent compatibility analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <Activity className="h-5 w-5 animate-spin mx-auto mb-2" />
          <span className="text-sm text-gray-600">Analyzing group compatibility...</span>
        </CardContent>
      </Card>
    )
  }

  if (!analysis || !analysis.results) {
    return null
  }

  const topPairs = analysis.results
    .filter((result: any) => result.compatibility)
    .sort((a: any, b: any) => b.compatibility.baseCompatibility - a.compatibility.baseCompatibility)
    .slice(0, maxDisplayPairs)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-gray-600" />
          <span className="font-medium">Group Compatibility Analysis</span>
        </div>

        <div className="space-y-3">
          {topPairs.map((pair: any, index: number) => {
            const agent1 = agents.find(a => a.id === pair.agent1)
            const agent2 = agents.find(a => a.id === pair.agent2)

            if (!agent1 || !agent2) return null

            const compatibility = pair.compatibility.baseCompatibility || 0
            const compatLevel = getCompatibilityLevel(compatibility)

            return (
              <div
                key={`${pair.agent1}-${pair.agent2}`}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div className="text-sm">
                    <span className="font-medium">{agent1.name}</span>
                    <span className="text-gray-600"> & </span>
                    <span className="font-medium">{agent2.name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={compatLevel.color}>
                    {Math.round(compatibility * 100)}%
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
