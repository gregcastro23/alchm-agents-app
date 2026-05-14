'use client'

import React, { useState, useEffect, useCallback } from 'react'
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

// Classical planetary sequence (Chaldean order)
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const

// Seasonal elemental base values [fire, water, air, earth] — Northern Hemisphere
const SEASON_BASES: Record<string, [number, number, number, number]> = {
  Spring: [0.60, 0.50, 0.70, 0.40],
  Summer: [0.85, 0.40, 0.65, 0.35],
  Autumn: [0.50, 0.65, 0.50, 0.70],
  Winter: [0.30, 0.70, 0.40, 0.80],
}

function clampUnit(v: number): number {
  return Math.max(0, Math.min(1, isFinite(v) ? v : 0))
}

function getSeason(month: number): string {
  if (month <= 1 || month === 11) return 'Winter'
  if (month <= 4) return 'Spring'
  if (month <= 7) return 'Summer'
  return 'Autumn'
}

/**
 * Pure client-side kinetic calculation using:
 * - Chaldean planetary hours (current UTC hour mod 7)
 * - Seasonal elemental bases (month of year)
 * - Daily solar wave (sinusoidal peak at solar noon)
 * - Birth chart resonance bonus when birthInfo is provided
 *
 * Formulas mirror lib/alchemical-kinetics.ts:
 *   Velocity (Celeritas)  — Mercury principle; rate of elemental transformation
 *   Inertia (Stabilitas)  — max(1, 1 + matter + earth + substance/2), normalized
 *   Momentum (Impetus)    — inertia × velocity, Mars/Saturn boosted
 *   Power (Potentia)      — solar principle; dEnergy/dt × solar amplification
 */
export function computeLocalKinetics(
  now: Date,
  birthInfo?: { year: number; month: number; day: number; hour: number; minute: number }
): KineticMetrics {
  const utcHour = now.getUTCHours()
  const utcMin = now.getUTCMinutes()
  const month = now.getUTCMonth() // 0-based

  const planetaryHour = PLANETS[utcHour % 7]
  const dayFraction = (utcHour + utcMin / 60) / 24
  const isNight = utcHour < 6 || utcHour >= 18

  // Solar wave: peaks at hour 12, troughs at midnight [0.15, 0.85]
  const solarWave = clampUnit(0.5 + 0.35 * Math.sin((dayFraction - 0.25) * 2 * Math.PI))

  const [bFire, bWater, bAir, bEarth] = SEASON_BASES[getSeason(month)]

  // Planetary velocity modifiers — from alchemical-kinetics.ts getPlanetaryVelocityModifier
  const modFire = planetaryHour === 'Sun' || planetaryHour === 'Mars' ? 1.2 : 1.0
  const modWater = planetaryHour === 'Moon' || planetaryHour === 'Venus' ? 1.15 : 1.0
  const modAir = planetaryHour === 'Mercury' ? 1.15 : 1.0
  const modEarth = planetaryHour === 'Saturn' ? 1.1 : 1.0

  const fire = clampUnit(bFire * modFire)
  const water = clampUnit(bWater * modWater)
  const air = clampUnit(bAir * modAir)
  const earth = clampUnit(bEarth * modEarth)

  // SMES — Spirit (Air/Fire active), Essence (Water fluid), Matter (Earth grounded), Substance (Earth dense)
  const spirit = clampUnit(air * 0.55 + fire * 0.35 + solarWave * 0.10)
  const essence = clampUnit(water * 0.70 + air * 0.20 + (isNight ? 0.08 : 0))
  const matter = clampUnit(earth * 0.80 + water * 0.12 + 0.05)
  const substance = clampUnit(earth * 0.55 + fire * 0.25 + water * 0.12 + 0.08)

  // Velocity (Celeritas) — Mercury principle; peaks in Mercury/Sun hours
  const velMod = planetaryHour === 'Mercury' ? 1.2 : planetaryHour === 'Sun' ? 1.1 : 1.0
  const velocity = clampUnit(solarWave * velMod * (spirit + essence) * 0.55)

  // Inertia (Stabilitas) — m(t) = max(1, 1 + matter + earth + substance/2), normalized [1,3]→[0,1]
  const inertiaMod = planetaryHour === 'Saturn' ? 1.1 : 1.0
  const rawInertia = (1 + matter + earth + substance * 0.5) * inertiaMod
  const inertia = clampUnit((rawInertia - 1) / 2.5)

  // Momentum (Impetus) — p = m × v, Mars/Saturn synthesis boost
  const momMod = planetaryHour === 'Mars' || planetaryHour === 'Saturn' ? 1.15 : 1.0
  const momentum = clampUnit(inertia * velocity * momMod * 1.6)

  // Power (Potentia) — Solar principle; dEnergy/dt × solar amplification (+30% on Sun hour)
  const solarAmp = planetaryHour === 'Sun' ? 1.3 : 1.0
  const power = clampUnit(solarWave * solarAmp * (spirit * 0.40 + fire * 0.35 + air * 0.25))

  // Alchemical Number: composite of all four kinetics, range [0, 2]
  const A = ((velocity + momentum + power + inertia) / 4) * 2

  // Consciousness — derived from active elemental resonance
  let resonance = clampUnit(spirit * 0.40 + power * 0.35 + solarWave * 0.25)
  let amplitude = clampUnit((spirit + essence + power + fire) / 4)
  let activation = clampUnit(velocity * 0.45 + momentum * 0.30 + power * 0.25)

  // Birth chart resonance: matching planetary hour and season amplify all three
  if (birthInfo) {
    const birthPlanet = PLANETS[birthInfo.hour % 7]
    const birthSeason = getSeason(birthInfo.month)
    const hourBonus = birthPlanet === planetaryHour ? 0.12 : 0
    const seasonBonus = birthSeason === getSeason(month) ? 0.08 : 0
    resonance = clampUnit(resonance + hourBonus + seasonBonus)
    amplitude = clampUnit(amplitude + hourBonus * 0.5)
    activation = clampUnit(activation + hourBonus * 0.4)
  }

  return {
    A,
    SMES: { spirit, matter, essence, substance },
    kinetic: { velocity, momentum, power, inertia },
    consciousness: { resonance, amplitude, activation },
  }
}

export interface KineticMetrics {
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

  const fetchKineticData = useCallback(async () => {
    setMetrics(null)
    try {
      setLoading(true)

      const payload = birthInfo
        ? {
            birthInfo,
            includeAgentInsights: true,
            calculateMoment: realTimeMode,
            agentIds: ['local-kinetic-calc'], // Provide dummy agentId to satisfy API if we are just fetching alchemical data
          }
        : {
            calculateMoment: true,
            includeAgentInsights: true,
            agentIds: ['local-kinetic-calc'],
          }

      const response = await fetch('/api/agent-kinetics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data.kinetics)
        setLastUpdate(new Date())
        setError(null)
      } else {
        setError('Backend unavailable. Unable to load cosmic kinetics.')
      }
    } catch (e: any) {
      setError(e.message || 'Network error while fetching kinetics data.')
    } finally {
      setLoading(false)
    }
  }, [birthInfo, realTimeMode])

  useEffect(() => {
    fetchKineticData()

    // Auto-refresh for real-time mode
    if (realTimeMode) {
      const interval = setInterval(fetchKineticData, 2 * 60 * 1000) // 2 minutes
      return () => clearInterval(interval)
    }
    return undefined
  }, [fetchKineticData, realTimeMode])

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
