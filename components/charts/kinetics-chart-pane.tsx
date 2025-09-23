'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Gauge,
  Brain,
  Timer,
} from 'lucide-react'

interface KineticMetrics {
  A: number // Alchemical Number
  SMES: {
    spirit: number
    matter: number
    essence: number
    substance: number
  }
  kinetic: {
    velocity: number
    momentum: number
    power: number
    inertia: number
  }
  consciousness: {
    resonance: number
    amplitude: number
    activation: number
  }
  agentInsights?: {
    activatedAgents: string[]
    peakHour: string
    optimalAspects: string[]
  }
}

interface KineticsChartPaneProps {
  birthInfo?: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    latitude: number
    longitude: number
    name?: string
  }
  className?: string
  realTimeMode?: boolean
}

export default function KineticsChartPane({
  birthInfo,
  className,
  realTimeMode = false,
}: KineticsChartPaneProps) {
  const [metrics, setMetrics] = useState<KineticMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchKineticData = async () => {
    try {
      setLoading(true)

      const payload = birthInfo
        ? {
            birthInfo,
            includeAgentInsights: true,
            calculateMoment: realTimeMode,
          }
        : {
            calculateMoment: true,
            includeAgentInsights: true,
          }

      const response = await fetch('/api/agent-kinetics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch kinetic data')
      }

      const data = await response.json()
      setMetrics(data.kinetics)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('Error fetching kinetic data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load kinetic data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKineticData()

    // Auto-refresh for real-time mode
    if (realTimeMode) {
      const interval = setInterval(fetchKineticData, 2 * 60 * 1000) // 2 minutes
      return () => clearInterval(interval)
    }
  }, [birthInfo, realTimeMode])

  const getTrendIcon = (value: number, threshold: number = 0.5) => {
    if (value > threshold) return <TrendingUp className="w-3 h-3 text-green-400" />
    if (value < -threshold) return <TrendingDown className="w-3 h-3 text-red-400" />
    return <Minus className="w-3 h-3 text-gray-400" />
  }

  const getIntensityColor = (value: number): string => {
    if (value > 0.8) return 'text-cosmic-gold'
    if (value > 0.6) return 'text-cosmic-celestial-purple'
    if (value > 0.4) return 'text-cosmic-ethereal-violet'
    return 'text-cosmic-starlight-lavender'
  }

  const getProgressColor = (value: number): string => {
    if (value > 0.8) return 'bg-gradient-to-r from-cosmic-gold to-elemental-fire'
    if (value > 0.6)
      return 'bg-gradient-to-r from-cosmic-celestial-purple to-cosmic-ethereal-violet'
    if (value > 0.4) return 'bg-gradient-to-r from-cosmic-ethereal-violet to-cosmic-stellar-blue'
    return 'bg-gradient-to-r from-cosmic-stellar-blue to-cosmic-nebula-purple'
  }

  if (loading) {
    return (
      <Card className={`cosmic-glass ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 cosmic-text-gradient">
            <Activity className="w-5 h-5" />
            Kinetic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 animate-spin text-cosmic-gold" />
            <span className="text-cosmic-starlight-lavender">Calculating cosmic energies...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`cosmic-glass ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 cosmic-text-gradient">
            <Activity className="w-5 h-5" />
            Kinetic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-400">
            <p className="text-sm">Unable to load kinetic data</p>
            <p className="text-xs text-cosmic-starlight-lavender mt-1">{error}</p>
            <Button
              onClick={fetchKineticData}
              variant="outline"
              size="sm"
              className="mt-3 cosmic-button"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) return null

  return (
    <Card className={`cosmic-glass-ethereal ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 cosmic-text-gradient">
            <Zap className="w-5 h-5" />
            Kinetic Analysis
          </CardTitle>
          {realTimeMode && (
            <Badge variant="outline" className="cosmic-glass text-cosmic-gold border-cosmic-gold">
              <Timer className="w-3 h-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
        <p className="text-xs text-cosmic-starlight-lavender">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alchemical Number */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-cosmic-starlight-lavender">
              Alchemical Number (A#)
            </span>
            <span className={`text-lg font-bold ${getIntensityColor(metrics.A)}`}>
              {metrics.A.toFixed(3)}
            </span>
          </div>
          <Progress
            value={Math.min(100, metrics.A * 50)}
            className="h-2 cosmic-glass"
            style={{ background: getProgressColor(metrics.A) }}
          />
        </div>

        {/* SMES Flow */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-cosmic-gold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            SMES Flow
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(metrics.SMES).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs capitalize text-cosmic-starlight-lavender">{key}</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(value - 0.5)}
                    <span className={`text-xs font-mono ${getIntensityColor(value)}`}>
                      {value.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Progress
                  value={value * 100}
                  className="h-1"
                  style={{ background: getProgressColor(value) }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Kinetic Metrics */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-cosmic-celestial-purple flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Kinetic Dynamics
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(metrics.kinetic).map(([key, value]) => (
              <div key={key} className="flex justify-between p-2 cosmic-glass rounded">
                <span className="capitalize text-cosmic-starlight-lavender">{key}</span>
                <span className={`font-mono ${getIntensityColor(value)}`}>{value.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Consciousness Metrics */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-cosmic-ethereal-violet flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Consciousness Activation
          </h4>
          <div className="space-y-2">
            {Object.entries(metrics.consciousness).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs capitalize text-cosmic-starlight-lavender">{key}</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={value * 100}
                    className="w-16 h-1"
                    style={{ background: getProgressColor(value) }}
                  />
                  <span className={`text-xs font-mono ${getIntensityColor(value)}`}>
                    {Math.round(value * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Insights */}
        {metrics.agentInsights && (
          <div className="space-y-3 pt-3 border-t border-cosmic-ethereal-violet/30">
            <h4 className="text-sm font-semibold text-cosmic-gold">Agent Insights</h4>

            {metrics.agentInsights.activatedAgents.length > 0 && (
              <div>
                <p className="text-xs text-cosmic-starlight-lavender mb-2">Activated Agents:</p>
                <div className="flex flex-wrap gap-1">
                  {metrics.agentInsights.activatedAgents.map(agent => (
                    <Badge key={agent} variant="outline" className="text-xs cosmic-glass">
                      {agent}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {metrics.agentInsights.peakHour && (
              <div className="text-xs">
                <span className="text-cosmic-starlight-lavender">Peak Hour: </span>
                <span className="text-cosmic-gold font-mono">{metrics.agentInsights.peakHour}</span>
              </div>
            )}

            {metrics.agentInsights.optimalAspects.length > 0 && (
              <div>
                <p className="text-xs text-cosmic-starlight-lavender mb-1">Optimal Aspects:</p>
                <div className="flex flex-wrap gap-1">
                  {metrics.agentInsights.optimalAspects.map(aspect => (
                    <Badge key={aspect} variant="secondary" className="text-xs">
                      {aspect}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Refresh Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-cosmic-ethereal-violet/30">
          <Button
            onClick={fetchKineticData}
            variant="outline"
            size="sm"
            className="cosmic-button text-xs"
            disabled={loading}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Refresh
          </Button>

          <div className="text-xs text-cosmic-starlight-lavender opacity-70">
            {realTimeMode ? 'Auto-updating' : 'Static analysis'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
