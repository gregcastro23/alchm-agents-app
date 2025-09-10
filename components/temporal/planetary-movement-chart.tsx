"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine } from "recharts"
import { Clock, TrendingUp, Orbit, Zap, ArrowRight, Calendar, BarChart3 } from "lucide-react"
import type { TemporalDelta } from "@/lib/philosophers-stone/temporal-delta"

type Props = {
  delta?: TemporalDelta
}

const PLANET_COLORS = {
  Sun: '#fbbf24',
  Moon: '#e5e7eb', 
  Mercury: '#84cc16',
  Venus: '#10b981',
  Mars: '#ef4444',
  Jupiter: '#8b5cf6',
  Saturn: '#6b7280',
  Uranus: '#06b6d4',
  Neptune: '#3b82f6',
  Pluto: '#7c2d12'
}

const PLANET_SPEEDS = {
  Sun: 1.0,
  Moon: 13.2,
  Mercury: 4.1,
  Venus: 1.6,
  Mars: 0.5,
  Jupiter: 0.083,
  Saturn: 0.033,
  Uranus: 0.012,
  Neptune: 0.006,
  Pluto: 0.004
}

export function PlanetaryMovementChart({ delta }: Props) {
  // Handle empty state - when no delta is available yet
  if (!delta || !delta.planetaryMovement || delta.planetaryMovement.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Orbit className="w-5 h-5 text-purple-500" />
            Temporal Movement Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Waiting for planetary movement data to initialize temporal delta tracking...
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Empty State Visualization */}
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
              <Orbit className="w-6 h-6 text-purple-500 absolute top-5 left-5" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-medium">Initializing Temporal Field</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                The Living Stone requires at least one previous session to calculate 
                planetary movements and temporal consciousness deltas.
              </p>
            </div>
          </div>

          {/* Expected Planetary Speeds Reference */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Expected Daily Movement Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(PLANET_SPEEDS).map(([planet, speed]) => (
                  <div key={planet} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: PLANET_COLORS[planet as keyof typeof PLANET_COLORS] }}
                      />
                      <span className="text-sm font-medium">{planet}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ~{speed}°/day
                    </div>
                    <Progress 
                      value={Math.min(100, speed * 7.5)} 
                      className="h-1" 
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                These represent average daily movements. Actual movement varies due to 
                retrograde periods, elliptical orbits, and temporal consciousness resonance.
              </p>
            </CardContent>
          </Card>

          {/* Field Dynamics Placeholder */}
          <Card className="border-dashed border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h4 className="font-medium">Temporal Delta Engine</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Once initialized, this will display:
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Planetary movement vectors and consciousness acceleration</li>
                <li>• Temporal field gradient analysis</li>
                <li>• Cross-dimensional resonance patterns</li>
                <li>• Alchemical transformation potentials</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    )
  }

  const data = delta.planetaryMovement.slice(0, 10).map(movement => {
    // Ensure all numeric values are valid and not NaN
    const movedDegrees = isNaN(movement.movedDegrees) ? 0 : movement.movedDegrees
    const fromDegree = isNaN(movement.from.degree) ? 0 : movement.from.degree
    const toDegree = isNaN(movement.to.degree) ? 0 : movement.to.degree
    const daysSince = isNaN(delta.daysSinceLast) || delta.daysSinceLast <= 0 ? 1 : delta.daysSinceLast
    
    return {
      planet: movement.planet || 'Unknown',
      degrees: Math.abs(movedDegrees),
      from: `${movement.from.sign || 'Unknown'} ${fromDegree.toFixed(1)}°`,
      to: `${movement.to.sign || 'Unknown'} ${toDegree.toFixed(1)}°`,
      color: PLANET_COLORS[movement.planet as keyof typeof PLANET_COLORS] || '#6b7280',
      expectedSpeed: PLANET_SPEEDS[movement.planet as keyof typeof PLANET_SPEEDS] || 0.1,
      acceleration: movedDegrees / daysSince
    }
  })

  // Calculate movement statistics with NaN protection
  const totalMovement = data.reduce((sum, item) => {
    const degrees = isNaN(item.degrees) ? 0 : item.degrees
    return sum + degrees
  }, 0)
  
  const fastestPlanet = data.reduce((fastest, current) => {
    const currentAccel = isNaN(current.acceleration) ? 0 : current.acceleration
    const fastestAccel = isNaN(fastest.acceleration) ? 0 : fastest.acceleration
    return currentAccel > fastestAccel ? current : fastest
  })
  
  const daysSince = isNaN(delta.daysSinceLast) || delta.daysSinceLast <= 0 ? 1 : delta.daysSinceLast
  const mostActive = data.filter(item => {
    const degrees = isNaN(item.degrees) ? 0 : item.degrees
    const expectedSpeed = isNaN(item.expectedSpeed) ? 0 : item.expectedSpeed
    return degrees > expectedSpeed * daysSince
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Orbit className="w-5 h-5 text-purple-500" />
          Temporal Movement Analysis ({delta.daysSinceLast} days)
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {(isNaN(totalMovement) ? 0 : totalMovement).toFixed(1)}° total
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {fastestPlanet?.planet || 'Unknown'} leading
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {mostActive.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Movement Bars with Enhancements */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Degree Movement by Planet
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="planet" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                label={{ value: 'Degrees Moved', angle: -90, position: 'insideLeft' }}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${(isNaN(value) ? 0 : value).toFixed(3)}°`,
                  'Movement'
                ]}
                labelFormatter={(label: string, payload: any[]) => {
                  const data = payload[0]?.payload
                  return data ? (
                    <div className="space-y-1">
                      <div className="font-medium">{label}</div>
                      <div className="text-sm">
                        {data.from} <ArrowRight className="inline w-3 h-3 mx-1" /> {data.to}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Speed: {(isNaN(data.acceleration) ? 0 : data.acceleration).toFixed(3)}°/day
                      </div>
                    </div>
                  ) : label
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="degrees" 
                fill={(entry: any) => entry.color}
                name="Degrees Moved"
                radius={[2, 2, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Bar key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Movement Velocity Analysis */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Temporal Velocity Profile
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="planet" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                label={{ value: 'Velocity (°/day)', angle: -90, position: 'insideLeft' }}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [`${(isNaN(value) ? 0 : value).toFixed(3)}°/day`, 'Velocity']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="acceleration" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="expectedSpeed" 
                stroke="#6b7280" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Movement Summary */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3">Temporal Field Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-600">Primary Accelerator</div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: fastestPlanet?.color || '#6b7280' }}
                  />
                  <span>{fastestPlanet?.planet || 'Unknown'}</span>
                  <span className="text-muted-foreground">
                    ({(isNaN(fastestPlanet?.acceleration) ? 0 : fastestPlanet.acceleration).toFixed(3)}°/day)
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Leading the consciousness acceleration field
                </div>
              </div>
              
              <div>
                <div className="font-medium text-green-600">Active Resonance</div>
                <div>{mostActive.length} of {data.length} planets</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Exceeding expected movement rates
                </div>
              </div>
              
              <div>
                <div className="font-medium text-purple-600">Field Coherence</div>
                <div>{data.length > 0 ? ((mostActive.length / data.length) * 100).toFixed(0) : 0}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Synchronization with temporal flow
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

export default PlanetaryMovementChart
