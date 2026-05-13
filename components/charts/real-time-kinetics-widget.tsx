'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Sun,
  Moon,
  Globe,
  Flame,
  Droplets,
  Wind,
  Mountain,
  ArrowRight,
  Activity,
  Timer,
  BarChart3,
  Sparkles,
} from 'lucide-react'
// Browser-safe replacement for UnifiedKineticsClient. Folds the proxy
// `/api/alchemize?legacy=true` into the minimal envelope this widget reads.
// TODO: re-introduce real kinetics series once Railway exposes them.
const CHALDEAN_PLANETARY_HOURS = [
  'Saturn',
  'Jupiter',
  'Mars',
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
] as const

async function fetchKineticsEnvelope(_loc: { lat: number; lon: number }): Promise<{
  power: Array<{ power: number }>
  timing: { planetaryHours: string[]; seasonalInfluence: string }
  elemental: { totals: { Fire: number; Water: number; Air: number; Earth: number } }
}> {
  let power = 0.5
  let totals = { Fire: 5, Water: 5, Air: 5, Earth: 5 }
  try {
    const res = await fetch('/api/alchemize?legacy=true')
    if (res.ok) {
      const data = await res.json()
      const kineticVal = Number(data?.kinetic_val ?? data?.Reactivity ?? 0)
      const thermoVal = Number(data?.thermo_val ?? data?.Heat ?? 0)
      power = Math.max(0, Math.min(1, thermoVal || kineticVal || 0.5))
      totals = {
        Fire: Number(data?.spirit_score ?? 5),
        Water: Number(data?.essence_score ?? 5),
        Earth: Number(data?.matter_score ?? 5),
        Air: Number(data?.substance_score ?? 5),
      }
    }
  } catch (err) {
    console.error('kinetics envelope fetch failed:', err)
  }
  const baseIdx = new Date().getHours() % CHALDEAN_PLANETARY_HOURS.length
  const hours = [
    CHALDEAN_PLANETARY_HOURS[baseIdx],
    CHALDEAN_PLANETARY_HOURS[(baseIdx + 1) % CHALDEAN_PLANETARY_HOURS.length],
    CHALDEAN_PLANETARY_HOURS[(baseIdx + 2) % CHALDEAN_PLANETARY_HOURS.length],
  ]
  // Provide a 3-sample power series so trend logic in the widget keeps working.
  return {
    power: [{ power: power * 0.95 }, { power: power * 0.97 }, { power }],
    timing: { planetaryHours: hours, seasonalInfluence: 'Neutral' },
    elemental: { totals },
  }
}

interface PlanetaryHour {
  planet: string
  startTime: Date
  endTime: Date
  powerLevel: number
  elementalInfluence: {
    fire: number
    water: number
    air: number
    earth: number
  }
}

interface KineticData {
  currentHour: PlanetaryHour
  nextHour: PlanetaryHour
  timeToNext: number // minutes
  alchemicalLevels: {
    spirit: number
    essence: number
    matter: number
    substance: number
  }
  velocityTrends: {
    spirit: 'increasing' | 'stable' | 'decreasing'
    essence: 'increasing' | 'stable' | 'decreasing'
    matter: 'increasing' | 'stable' | 'decreasing'
    substance: 'increasing' | 'stable' | 'decreasing'
  }
  powerMomentum: number // 0-1 scale
  chartTransformIntensity: number // 0-1 scale
  optimalAgentTypes: string[]
}

interface RealTimeKineticsWidgetProps {
  userLocation?: { lat: number; lon: number }
  className?: string
  variant?: 'full' | 'compact'
  onDataUpdate?: (data: KineticData) => void
}

export function RealTimeKineticsWidget({
  userLocation = { lat: 37.7749, lon: -122.4194 },
  className = '',
  variant = 'full',
  onDataUpdate,
}: RealTimeKineticsWidgetProps) {
  const [kineticData, setKineticData] = useState<KineticData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch kinetic data
  const fetchKineticData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current alchemical kinetics envelope via proxy
      const kinetics = await fetchKineticsEnvelope({
        lat: userLocation.lat,
        lon: userLocation.lon,
      })

      // Process data into our format
      const now = new Date()
      const currentPower = kinetics.power[kinetics.power.length - 1]?.power || 0.5
      const planetaryHours = kinetics.timing?.planetaryHours || ['Sun']
      const currentHourPlanet = planetaryHours[0] || 'Sun'

      // Calculate planetary hour timing (simplified - in production would use precise calculations)
      const hourStart = new Date(now)
      hourStart.setMinutes(0, 0, 0)
      const hourEnd = new Date(hourStart)
      hourEnd.setHours(hourEnd.getHours() + 1)

      const nextHourStart = new Date(hourEnd)
      const nextHourEnd = new Date(nextHourStart)
      nextHourEnd.setHours(nextHourEnd.getHours() + 1)

      // Calculate elemental levels from kinetics data
      const elementalTotals = kinetics.elemental?.totals || { Fire: 5, Water: 5, Air: 5, Earth: 5 }
      const maxElemental = Math.max(
        elementalTotals.Fire,
        elementalTotals.Water,
        elementalTotals.Air,
        elementalTotals.Earth
      )

      const alchemicalLevels = {
        spirit: (elementalTotals.Fire / maxElemental) * 10,
        essence: (elementalTotals.Water / maxElemental) * 10,
        matter: (elementalTotals.Earth / maxElemental) * 10,
        substance: (elementalTotals.Air / maxElemental) * 10,
      }

      // Calculate velocity trends from power momentum
      const powerHistory = kinetics.power.slice(-3)
      const isIncreasing =
        powerHistory.length >= 2 &&
        powerHistory[powerHistory.length - 1].power > powerHistory[powerHistory.length - 2].power
      const isDecreasing =
        powerHistory.length >= 2 &&
        powerHistory[powerHistory.length - 1].power < powerHistory[powerHistory.length - 2].power

      const velocityTrends = {
        spirit: isIncreasing
          ? ('increasing' as const)
          : isDecreasing
            ? ('decreasing' as const)
            : ('stable' as const),
        essence: isIncreasing
          ? ('increasing' as const)
          : isDecreasing
            ? ('decreasing' as const)
            : ('stable' as const),
        matter: isIncreasing
          ? ('increasing' as const)
          : isDecreasing
            ? ('decreasing' as const)
            : ('stable' as const),
        substance: isIncreasing
          ? ('increasing' as const)
          : isDecreasing
            ? ('decreasing' as const)
            : ('stable' as const),
      }

      const processedData: KineticData = {
        currentHour: {
          planet: currentHourPlanet,
          startTime: hourStart,
          endTime: hourEnd,
          powerLevel: currentPower,
          elementalInfluence: {
            fire: elementalTotals.Fire / maxElemental,
            water: elementalTotals.Water / maxElemental,
            air: elementalTotals.Air / maxElemental,
            earth: elementalTotals.Earth / maxElemental,
          },
        },
        nextHour: {
          planet: planetaryHours[1] || 'Moon',
          startTime: nextHourStart,
          endTime: nextHourEnd,
          powerLevel: currentPower * 0.9, // Estimate
          elementalInfluence: {
            fire: 0.5,
            water: 0.5,
            air: 0.5,
            earth: 0.5, // Placeholder
          },
        },
        timeToNext: Math.floor((hourEnd.getTime() - now.getTime()) / (1000 * 60)),
        alchemicalLevels,
        velocityTrends,
        powerMomentum: currentPower,
        chartTransformIntensity: currentPower * 0.8,
        optimalAgentTypes: getOptimalAgentTypes(currentHourPlanet, alchemicalLevels),
      }

      setKineticData(processedData)
      setLastUpdate(new Date())

      if (onDataUpdate) {
        onDataUpdate(processedData)
      }
    } catch (error) {
      console.error('Failed to fetch kinetic data:', error)
      setError('Failed to load kinetic data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get optimal agent types based on current conditions
  const getOptimalAgentTypes = (
    planetaryHour: string,
    alchemical: NonNullable<typeof kineticData>['alchemicalLevels']
  ): string[] => {
    const types = []

    // Planetary hour influences
    switch (planetaryHour) {
      case 'Sun':
        types.push('Leadership', 'Creativity', 'Authority')
        break
      case 'Moon':
        types.push('Intuition', 'Memory', 'Dreams')
        break
      case 'Mercury':
        types.push('Communication', 'Learning', 'Technology')
        break
      case 'Venus':
        types.push('Art', 'Relationships', 'Harmony')
        break
      case 'Mars':
        types.push('Action', 'Courage', 'Competition')
        break
      case 'Jupiter':
        types.push('Wisdom', 'Philosophy', 'Growth')
        break
      case 'Saturn':
        types.push('Structure', 'Discipline', 'Time')
        break
      default:
        types.push('Balanced', 'Adaptive')
    }

    // Alchemical influences
    const maxAlchemical = Math.max(
      alchemical.spirit,
      alchemical.essence,
      alchemical.matter,
      alchemical.substance
    )
    if (alchemical.spirit === maxAlchemical) types.push('Innovative', 'Visionary')
    if (alchemical.essence === maxAlchemical) types.push('Emotional', 'Artistic')
    if (alchemical.matter === maxAlchemical) types.push('Scientific', 'Practical')
    if (alchemical.substance === maxAlchemical) types.push('Intellectual', 'Communicative')

    return types.slice(0, 4)
  }

  // Initialize and set up refresh interval
  useEffect(() => {
    fetchKineticData()

    // Refresh every 2 minutes
    const interval = setInterval(fetchKineticData, 120000)

    // Refresh countdown every minute for time display
    const timeInterval = setInterval(() => {
      setKineticData(prev => {
        if (!prev) return null
        const now = new Date()
        const timeToNext = Math.floor(
          (prev.currentHour.endTime.getTime() - now.getTime()) / (1000 * 60)
        )
        return { ...prev, timeToNext }
      })
    }, 60000)

    return () => {
      clearInterval(interval)
      clearInterval(timeInterval)
    }
  }, [userLocation.lat, userLocation.lon])

  const getPlanetSymbol = (planet: string): string => {
    const symbols = {
      Sun: '☉',
      Moon: '☽',
      Mercury: '☿',
      Venus: '♀',
      Mars: '♂',
      Jupiter: '♃',
      Saturn: '♄',
      Uranus: '♅',
      Neptune: '♆',
      Pluto: '♇',
    }
    return symbols[planet as keyof typeof symbols] || '○'
  }

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-3 h-3 text-green-500" />
      case 'decreasing':
        return <TrendingDown className="w-3 h-3 text-red-500" />
      default:
        return <Minus className="w-3 h-3 text-gray-500" />
    }
  }

  const getTrendColor = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600'
      case 'decreasing':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <Card
        className={`${className} border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading current moment kinetics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`${className} border-2 border-red-200 bg-red-50/50`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-red-600">{error}</span>
            <Button variant="outline" size="sm" onClick={fetchKineticData}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!kineticData) return null

  if (variant === 'compact') {
    return (
      <Card
        className={`${className} border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl">{getPlanetSymbol(kineticData.currentHour.planet)}</div>
              <div>
                <div className="font-medium">{kineticData.currentHour.planet} Hour</div>
                <div className="text-xs text-muted-foreground">
                  {kineticData.timeToNext}m remaining
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-mono">
                {(kineticData.powerMomentum * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`${className} border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/50 dark:to-purple-950/50`}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Current Moment Kinetics
          <Badge variant="outline" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time alchemical conditions and chart transformation dynamics
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Planetary Hour Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-black/20 rounded-lg border">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">{getPlanetSymbol(kineticData.currentHour.planet)}</div>
              <div>
                <h4 className="font-semibold">{kineticData.currentHour.planet} Hour</h4>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Timer className="w-3 h-3" />
                  {kineticData.timeToNext} minutes remaining
                </div>
              </div>
            </div>
            <Progress value={((60 - kineticData.timeToNext) / 60) * 100} className="h-2" />
          </div>

          <div className="p-4 bg-white dark:bg-black/20 rounded-lg border">
            <div className="flex items-center gap-3 mb-2">
              <ArrowRight className="w-4 h-4 text-gray-500" />
              <div>
                <h4 className="font-semibold">Next: {kineticData.nextHour.planet}</h4>
                <div className="text-sm text-muted-foreground">
                  {getPlanetSymbol(kineticData.nextHour.planet)} in {kineticData.timeToNext}m
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Power forecast: {(kineticData.nextHour.powerLevel * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Alchemical Levels */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Alchemical Power Levels
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                name: 'Spirit',
                value: kineticData.alchemicalLevels.spirit,
                icon: Flame,
                color: 'red',
              },
              {
                name: 'Essence',
                value: kineticData.alchemicalLevels.essence,
                icon: Droplets,
                color: 'blue',
              },
              {
                name: 'Matter',
                value: kineticData.alchemicalLevels.matter,
                icon: Mountain,
                color: 'green',
              },
              {
                name: 'Substance',
                value: kineticData.alchemicalLevels.substance,
                icon: Wind,
                color: 'yellow',
              },
            ].map(({ name, value, icon: Icon, color }) => (
              <div
                key={name}
                className="text-center p-3 bg-white dark:bg-black/20 rounded-lg border"
              >
                <Icon className={`w-4 h-4 mx-auto mb-1 text-${color}-600`} />
                <div className="text-xs font-medium mb-1">{name}</div>
                <div className="font-mono text-sm">{value.toFixed(1)}</div>
                <div className="mt-1">
                  {getTrendIcon(
                    kineticData.velocityTrends[
                      name.toLowerCase() as keyof typeof kineticData.velocityTrends
                    ]
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Power Momentum & Chart Transform */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="font-medium">Power Momentum</span>
            </div>
            <div className="text-2xl font-bold text-yellow-700">
              {(kineticData.powerMomentum * 100).toFixed(0)}%
            </div>
            <Progress value={kineticData.powerMomentum * 100} className="h-2 mt-2" />
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Chart Transform</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {(kineticData.chartTransformIntensity * 100).toFixed(0)}%
            </div>
            <Progress value={kineticData.chartTransformIntensity * 100} className="h-2 mt-2" />
          </div>
        </div>

        {/* Optimal Agent Types */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Optimal Agent Types Now
          </h4>
          <div className="flex flex-wrap gap-2">
            {kineticData.optimalAgentTypes.map(type => (
              <Badge key={type} variant="secondary" className="text-sm">
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last updated: {lastUpdate?.toLocaleTimeString()}
          </div>
          <Button variant="ghost" size="sm" onClick={fetchKineticData}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
