"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Clock,
  Sparkles,
  Target,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import type { CraftedAgent } from "@/lib/agent-types"

interface DynamicAspect {
  planet1: string
  planet2: string
  type: string
  applying: boolean
  separating: boolean
  orbVelocity: number
  daysToExact: number
  daysSinceExact: number
  strength: 'building' | 'peak' | 'waning' | 'fading'
  evolutionaryImpact: number
}

interface AspectIndicatorProps {
  selectedAgents: CraftedAgent[]
  showDetails?: boolean
  compact?: boolean
}

interface AgentAspectConnection {
  agent1: string
  agent2: string
  aspects: DynamicAspect[]
  harmony: number
  recommendedInteraction: boolean
  optimalWindow?: {
    start: Date
    end: Date
    reason: string
  }
}

// Mock aspect calculation for demonstration
const calculateMockAspects = (agents: CraftedAgent[]): AgentAspectConnection[] => {
  if (agents.length < 2) return []

  const connections: AgentAspectConnection[] = []

  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const agent1 = agents[i]
      const agent2 = agents[j]

      // Generate mock aspects based on agent compatibility
      const mockAspects: DynamicAspect[] = []

      // Simulate applying trine for high-consciousness agents
      if (agent1.id === 'leonardo-da-vinci' && agent2.id === 'carl-jung') {
        mockAspects.push({
          planet1: 'Mercury',
          planet2: 'Moon',
          type: 'trine',
          applying: true,
          separating: false,
          orbVelocity: -0.15,
          daysToExact: 3,
          daysSinceExact: 0,
          strength: 'building',
          evolutionaryImpact: 0.85
        })
      }

      // Simulate separating square for growth tension
      if (agent1.id === 'albert-einstein' || agent2.id === 'albert-einstein') {
        mockAspects.push({
          planet1: 'Saturn',
          planet2: 'Mercury',
          type: 'square',
          applying: false,
          separating: true,
          orbVelocity: 0.08,
          daysToExact: 0,
          daysSinceExact: 2,
          strength: 'waning',
          evolutionaryImpact: 0.72
        })
      }

      // Simulate conjunction for fusion energies
      if (agent1.id === 'nikola-tesla' && agent2.id === 'galileo-galilei') {
        mockAspects.push({
          planet1: 'Uranus',
          planet2: 'Mercury',
          type: 'conjunction',
          applying: true,
          separating: false,
          orbVelocity: -0.25,
          daysToExact: 1,
          daysSinceExact: 0,
          strength: 'building',
          evolutionaryImpact: 0.93
        })
      }

      const harmony = mockAspects.reduce((sum, aspect) =>
        sum + (aspect.type === 'trine' || aspect.type === 'sextile' ? 0.3 :
               aspect.type === 'conjunction' ? 0.2 : 0.1), 0)

      if (mockAspects.length > 0) {
        connections.push({
          agent1: agent1.id,
          agent2: agent2.id,
          aspects: mockAspects,
          harmony,
          recommendedInteraction: harmony > 0.4 || mockAspects.some(a => a.applying && a.daysToExact <= 3),
          optimalWindow: mockAspects.some(a => a.applying) ? {
            start: new Date(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            reason: 'Peak consciousness synergy period'
          } : undefined
        })
      }
    }
  }

  return connections
}

const getAspectSymbol = (type: string): string => {
  const symbols: Record<string, string> = {
    conjunction: '☌',
    opposition: '☍',
    trine: '△',
    square: '□',
    sextile: '⚹',
    quincunx: '⚻'
  }
  return symbols[type] || '?'
}

const getAspectColor = (type: string, applying: boolean): string => {
  const baseColors: Record<string, string> = {
    conjunction: '#8B4513',
    opposition: '#FF0000',
    trine: '#0000FF',
    square: '#FF6600',
    sextile: '#00AA00',
    quincunx: '#800080'
  }

  const color = baseColors[type] || '#808080'
  return applying ? color : `${color}80` // Fade separating aspects
}

const getStrengthIcon = (strength: string) => {
  switch (strength) {
    case 'building': return <TrendingUp className="h-3 w-3" />
    case 'peak': return <Zap className="h-3 w-3" />
    case 'waning': return <TrendingDown className="h-3 w-3" />
    case 'fading': return <Minus className="h-3 w-3" />
    default: return <Clock className="h-3 w-3" />
  }
}

export function DynamicAspectsIndicators({ selectedAgents, showDetails = true, compact = false }: AspectIndicatorProps) {
  const [connections, setConnections] = useState<AgentAspectConnection[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setConnections(calculateMockAspects(selectedAgents))
  }, [selectedAgents, refreshKey])

  // Auto-refresh every 30 seconds for dynamic updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (selectedAgents.length < 2) {
    return (
      <Card className={compact ? "p-2" : ""}>
        <CardHeader className={compact ? "p-2 pb-1" : ""}>
          <CardTitle className={compact ? "text-sm" : "text-base"}>
            Dynamic Aspects
          </CardTitle>
        </CardHeader>
        <CardContent className={compact ? "p-2 pt-1" : ""}>
          <p className="text-sm text-muted-foreground">
            Select 2+ agents to see aspect connections
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={compact ? "p-2" : ""}>
      <CardHeader className={compact ? "p-2 pb-1" : ""}>
        <CardTitle className={`${compact ? "text-sm" : "text-base"} flex items-center gap-2`}>
          <Sparkles className="h-4 w-4 text-purple-500" />
          Dynamic Aspects
          {connections.some(c => c.recommendedInteraction) && (
            <Badge variant="secondary" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Optimal
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? "p-2 pt-1" : ""}>
        <div className="space-y-3">
          {connections.map((connection, index) => {
            const agent1 = selectedAgents.find(a => a.id === connection.agent1)
            const agent2 = selectedAgents.find(a => a.id === connection.agent2)

            if (!agent1 || !agent2) return null

            return (
              <div key={index} className="border rounded-lg p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{agent1.name}</span>
                    <div className="flex items-center gap-1">
                      {connection.aspects.map((aspect, aspectIndex) => (
                        <div key={aspectIndex} className="relative">
                          <Badge
                            variant="outline"
                            className="text-xs px-1 py-0 cursor-help"
                            style={{
                              borderColor: getAspectColor(aspect.type, aspect.applying),
                              color: getAspectColor(aspect.type, aspect.applying)
                            }}
                            title={`${aspect.type} ${aspect.planet1}-${aspect.planet2}: ${aspect.applying ? `Applying, ${aspect.daysToExact} days to exact` : `Separating, ${aspect.daysSinceExact} days since exact`}. Impact: ${(aspect.evolutionaryImpact * 100).toFixed(0)}%`}
                          >
                            {getAspectSymbol(aspect.type)}
                            {aspect.applying ? (
                              <ArrowUp className="h-2 w-2 ml-1 text-green-600" />
                            ) : (
                              <ArrowDown className="h-2 w-2 ml-1 text-orange-600" />
                            )}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-medium">{agent2.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {connection.recommendedInteraction && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Target className="h-3 w-3 mr-1" />
                        Optimal
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor: `hsl(${connection.harmony * 120}, 70%, 90%)`,
                        borderColor: `hsl(${connection.harmony * 120}, 70%, 60%)`
                      }}
                    >
                      {Math.round(connection.harmony * 100)}% harmony
                    </Badge>
                  </div>
                </div>

                {showDetails && connection.aspects.length > 0 && (
                  <div className="space-y-1">
                    {connection.aspects.map((aspect, aspectIndex) => (
                      <div key={aspectIndex} className="text-xs text-muted-foreground flex items-center gap-2">
                        {getStrengthIcon(aspect.strength)}
                        <span>
                          {aspect.planet1}-{aspect.planet2} {aspect.type}
                          {aspect.applying ? (
                            <span className="text-green-600 ml-1">
                              applying (peaks in {aspect.daysToExact}d)
                            </span>
                          ) : (
                            <span className="text-orange-600 ml-1">
                              separating ({aspect.daysSinceExact}d ago)
                            </span>
                          )}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {(aspect.evolutionaryImpact * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {connection.optimalWindow && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {connection.optimalWindow.reason}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {connections.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No significant aspects detected between selected agents
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function CompactAspectsIndicator({ selectedAgents }: { selectedAgents: CraftedAgent[] }) {
  return <DynamicAspectsIndicators selectedAgents={selectedAgents} showDetails={false} compact />
}