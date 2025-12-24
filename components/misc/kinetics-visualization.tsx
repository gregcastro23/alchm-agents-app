'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import {
  Zap,
  Gauge,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { kinetics, type EnhancedKineticData } from '@/lib/kinetics-integration'
import { calculateDynamicAspects, type DynamicAspectsAnalysis } from '@/lib/dynamic-aspects-engine'
import { getCurrentPlanetaryPositions } from '@/lib/calculate-transits'
import type { PlanetPosition } from '@/lib/astrological-pattern-recognition'

type KineticMetrics = {
  velocity: number
  power: number
  momentum: 'building' | 'sustained' | 'peak' | 'waning'
  velocityModifier: number
  powerModifier: number
  timestamp: Date
}

type AspectKineticData = {
  planet1: string
  planet2: string
  type: string
  orb: number
  applying: boolean
  separating: boolean
  orbVelocity: number
  kineticImpact: number
  proximityWeight: number
}

export default function KineticsVisualization() {
  const [kineticData, setKineticData] = useState<EnhancedKineticData | null>(null)
  const [aspectAnalysis, setAspectAnalysis] = useState<DynamicAspectsAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metricsHistory, setMetricsHistory] = useState<KineticMetrics[]>([])
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    let isMounted = true

    async function loadKinetics() {
      if (!isMounted) return

      try {
        // Get user location (default to a central location if not available)
        const location = { lat: 40.7128, lon: -74.006 } // Default to NYC

        // Fetch enhanced kinetics with aspect optimization
        const enhanced = await kinetics.getEnhancedKinetics(location, {
          includeAgentOptimization: false,
          includePowerPrediction: true,
          includeResonanceMap: false,
        })

        // Get dynamic aspects analysis
        const positions = getCurrentPlanetaryPositions()
        const planets: PlanetPosition[] = Object.entries(positions)
          .filter(([_, data]) => data && data.sign && typeof data.degree === 'number')
          .map(([planet, data]) => ({
            planet,
            sign: data.sign || 'Aries',
            degree: Math.max(0, Math.min(29.9999, data.degree || 0)),
            house: 0,
            date: new Date(),
          }))

        let aspects: DynamicAspectsAnalysis | null = null
        if (planets.length >= 2) {
          aspects = await calculateDynamicAspects(planets, 7)
        }

        if (isMounted) {
          setKineticData(enhanced)
          if (aspects) {
            setAspectAnalysis(aspects)
          }

          // Calculate modifiers from aspects if available
          let velocityMod = 1.0
          let powerMod = 1.0
          if (aspects) {
            velocityMod = calculateVelocityModifier(aspects)
            powerMod = calculatePowerModifier(aspects)
          }

          // Add to history (keep last 20 points)
          const newMetric: KineticMetrics = {
            velocity: enhanced.velocity,
            power: enhanced.currentPower,
            momentum: enhanced.momentum,
            velocityModifier: velocityMod,
            powerModifier: powerMod,
            timestamp: new Date(),
          }

          setMetricsHistory(prev => {
            const updated = [...prev, newMetric]
            return updated.slice(-20) // Keep last 20 data points
          })

          setLoading(false)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching kinetics:', err)
          setError(err instanceof Error ? err.message : 'Failed to load kinetic data')
          setLoading(false)
        }
      }
    }

    // Initial load
    loadKinetics()

    // Set up interval for updates
    const intervalId = setInterval(loadKinetics, 30000) // Update every 30 seconds

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  // Calculate aspect kinetic impact data
  const aspectKineticData: AspectKineticData[] = aspectAnalysis
    ? aspectAnalysis.currentAspects.map(aspect => {
        const maxOrb = getMaxOrbForAspect(aspect.type)
        const orbWeight = calculateOrbProximityWeight(aspect.orb || Infinity, maxOrb)
        const velocityIntensity = calculateOrbVelocityIntensity(aspect.orbVelocity)

        // Calculate kinetic impact based on orb + status
        let kineticImpact = orbWeight
        if (aspect.applying) {
          kineticImpact *= 1.2 // Applying aspects have higher impact
        } else if (aspect.separating) {
          kineticImpact *= 0.8 // Separating aspects have lower impact
        }
        kineticImpact *= (1.0 + velocityIntensity * 0.2)

        return {
          planet1: aspect.planet1,
          planet2: aspect.planet2,
          type: aspect.type,
          orb: aspect.orb || 0,
          applying: aspect.applying,
          separating: aspect.separating,
          orbVelocity: aspect.orbVelocity || 0,
          kineticImpact,
          proximityWeight: orbWeight,
        }
      })
    : []

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>Error loading kinetic data: {error}</p>
      </div>
    )
  }

  if (!kineticData) {
    return null
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="aspects">Aspects</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Velocity Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {(kineticData.velocity * 100).toFixed(1)}%
                </div>
                <Progress value={kineticData.velocity * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Rate of elemental transformation
                </p>
              </CardContent>
            </Card>

            {/* Power Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Power
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {(kineticData.currentPower * 100).toFixed(1)}%
                </div>
                <Progress value={kineticData.currentPower * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Energy capacity for work
                </p>
              </CardContent>
            </Card>

            {/* Momentum Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Momentum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2 capitalize">
                  {kineticData.momentum}
                </div>
                <Badge
                  variant={
                    kineticData.momentum === 'peak'
                      ? 'default'
                      : kineticData.momentum === 'building'
                        ? 'secondary'
                        : 'outline'
                  }
                  className="mt-2"
                >
                  {getMomentumDescription(kineticData.momentum)}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Sustained force of change
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Aspect Modifiers */}
          {aspectAnalysis && aspectAnalysis.currentAspects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Aspect Kinetic Modifiers</CardTitle>
                <CardDescription>
                  Current aspects affecting kinetic calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Velocity Modifier</div>
                    <div className="text-2xl font-bold">
                      {calculateVelocityModifier(aspectAnalysis).toFixed(2)}x
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Power Modifier</div>
                    <div className="text-2xl font-bold">
                      {calculatePowerModifier(aspectAnalysis).toFixed(2)}x
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="aspects" className="space-y-4">
          {aspectKineticData.length > 0 ? (
            <div className="space-y-4">
              {aspectKineticData.map((aspect, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">
                          {aspect.planet1} {getAspectSymbol(aspect.type)} {aspect.planet2}
                        </h4>
                        <p className="text-sm text-muted-foreground capitalize">{aspect.type}</p>
                      </div>
                      <div className="flex gap-2">
                        {aspect.applying && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <ArrowDown className="h-3 w-3" />
                            Applying
                          </Badge>
                        )}
                        {aspect.separating && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <ArrowUp className="h-3 w-3" />
                            Separating
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Orb</div>
                        <div className="text-lg font-bold">{aspect.orb.toFixed(2)}°</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Proximity Weight</div>
                        <div className="text-lg font-bold">{(aspect.proximityWeight * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Orb Velocity</div>
                        <div className="text-lg font-bold">
                          {aspect.orbVelocity > 0 ? '+' : ''}
                          {aspect.orbVelocity.toFixed(3)}°/day
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Kinetic Impact</div>
                        <div className="text-lg font-bold">{(aspect.kineticImpact * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* Orb Proximity Visualization */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Orb Proximity</span>
                        <span>{getMaxOrbForAspect(aspect.type)}° max</span>
                      </div>
                      <Progress
                        value={(1 - aspect.orb / getMaxOrbForAspect(aspect.type)) * 100}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No active aspects detected
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Elemental Velocity</CardTitle>
              <CardDescription>Rate of change per element</CardDescription>
            </CardHeader>
            <CardContent>
              {kineticData.base?.elementalVelocity && kineticData.base.elementalVelocity.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        Fire: kineticData.base.elementalVelocity[kineticData.base.elementalVelocity.length - 1]?.v?.Fire || 0,
                        Water: kineticData.base.elementalVelocity[kineticData.base.elementalVelocity.length - 1]?.v?.Water || 0,
                        Air: kineticData.base.elementalVelocity[kineticData.base.elementalVelocity.length - 1]?.v?.Air || 0,
                        Earth: kineticData.base.elementalVelocity[kineticData.base.elementalVelocity.length - 1]?.v?.Earth || 0,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Fire" fill="#ef4444" name="Fire" />
                    <Bar dataKey="Water" fill="#3b82f6" name="Water" />
                    <Bar dataKey="Air" fill="#8b5cf6" name="Air" />
                    <Bar dataKey="Earth" fill="#22c55e" name="Earth" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground">No velocity data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          {metricsHistory.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Kinetic Metrics Over Time</CardTitle>
                <CardDescription>Velocity and Power trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="velocity"
                      stroke="#8b5cf6"
                      name="Velocity"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="power"
                      stroke="#ef4444"
                      name="Power"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions
function getMaxOrbForAspect(aspectType: string): number {
  const orbDefinitions: Record<string, number> = {
    conjunction: 10,
    opposition: 10,
    trine: 8,
    square: 8,
    sextile: 6,
    quincunx: 3,
    semisextile: 2,
    sesquiquadrate: 2,
    semisquare: 2,
    quintile: 2,
    biquintile: 2,
  }
  return orbDefinitions[aspectType] ?? 5
}

function calculateOrbProximityWeight(orb: number, maxOrb: number): number {
  if (orb <= 0) return 1.0
  if (orb >= maxOrb) return 0.0
  const normalizedOrb = orb / maxOrb
  return Math.exp(-normalizedOrb * 3)
}

function calculateOrbVelocityIntensity(orbVelocity: number | undefined): number {
  if (!orbVelocity || !Number.isFinite(orbVelocity)) return 0.5
  const absVelocity = Math.abs(orbVelocity)
  return Math.min(1.0, absVelocity / 0.5)
}

function getAspectSymbol(type: string): string {
  const symbols: Record<string, string> = {
    conjunction: '☌',
    opposition: '☍',
    trine: '△',
    square: '□',
    sextile: '⚹',
  }
  return symbols[type] || '•'
}

function getMomentumDescription(momentum: string): string {
  const descriptions: Record<string, string> = {
    building: 'Energy accumulating',
    sustained: 'Stable flow',
    peak: 'Maximum intensity',
    waning: 'Energy releasing',
  }
  return descriptions[momentum] || momentum
}

function calculateVelocityModifier(analysis: DynamicAspectsAnalysis): number {
  // This would use the same logic as kinetics-integration.ts
  // For now, return a simple calculation
  const aspects = analysis.currentAspects || []
  if (aspects.length === 0) return 1.0

  let totalWeight = 0
  let totalModifier = 0

  for (const aspect of aspects) {
    const maxOrb = getMaxOrbForAspect(aspect.type)
    const orb = aspect.orb || Infinity
    if (orb > maxOrb) continue

    const orbWeight = calculateOrbProximityWeight(orb, maxOrb)
    let modifier = 1.0

    if (orb <= 1.0) {
      modifier = 1.25
    } else if (aspect.applying) {
      modifier = 1.0 + (1.0 - orbWeight) * 0.25
    } else if (aspect.separating) {
      modifier = 1.0 + orbWeight * 0.15 * Math.exp(-orb / 2)
    }

    totalModifier += modifier * orbWeight
    totalWeight += orbWeight
  }

  return totalWeight > 0 ? totalModifier / totalWeight : 1.0
}

function calculatePowerModifier(analysis: DynamicAspectsAnalysis): number {
  // Similar to velocity but with applying boost
  const aspects = analysis.currentAspects || []
  if (aspects.length === 0) return 1.0

  let totalWeight = 0
  let totalModifier = 0

  for (const aspect of aspects) {
    const maxOrb = getMaxOrbForAspect(aspect.type)
    const orb = aspect.orb || Infinity
    if (orb > maxOrb) continue

    const orbWeight = calculateOrbProximityWeight(orb, maxOrb)
    let modifier = 1.0

    if (orb <= 1.0) {
      modifier = 1.25
    } else if (aspect.applying) {
      modifier = (1.0 + (1.0 - orbWeight) * 0.25) * 1.1
    } else if (aspect.separating) {
      modifier = 1.0
    }

    totalModifier += modifier * orbWeight
    totalWeight += orbWeight
  }

  return totalWeight > 0 ? totalModifier / totalWeight : 1.0
}

