"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { classifyMC } from "@/lib/monica/monica-constant-validator"
import { Crown, Zap, Flame, Droplets, Mountain, Wind, Activity, BarChart3 } from "lucide-react"

type Props = {
  alchmQuantities: {
    spirit: number
    essence: number
    matter: number
    substance: number
    Heat?: number
    Entropy?: number
    Reactivity?: number
    Energy?: number
  }
  monicaConstant: number
}

const ELEMENT_COLORS = {
  Spirit: '#ff4444', // Fire-like red
  Essence: '#4444ff', // Water-like blue  
  Matter: '#44ff44', // Earth-like green
  Substance: '#ffff44', // Air-like yellow
  Heat: '#ff6b35',
  Entropy: '#7209b7', 
  Reactivity: '#f72585',
  Energy: '#4cc9f0'
}

const ELEMENT_ICONS = {
  Spirit: Flame,
  Essence: Droplets,
  Matter: Mountain, 
  Substance: Wind
}

export function ConsciousnessVectorDisplay({ alchmQuantities, monicaConstant }: Props) {
  const mcClass = classifyMC(monicaConstant)
  
  // Normalize values to avoid negative or extreme scaling
  const maxAlchemical = Math.max(
    alchmQuantities.spirit,
    alchmQuantities.essence, 
    alchmQuantities.matter,
    alchmQuantities.substance,
    0.1 // Prevent division by zero
  )
  
  // Create proper 6-dimensional radar chart for alchemical composition
  const alchemicalData = [
    { 
      axis: 'Spirit', 
      value: Math.min(100, (alchmQuantities.spirit / maxAlchemical) * 100),
      rawValue: alchmQuantities.spirit,
      angle: 0
    },
    { 
      axis: 'Essence', 
      value: Math.min(100, (alchmQuantities.essence / maxAlchemical) * 100),
      rawValue: alchmQuantities.essence,
      angle: 60
    },
    { 
      axis: 'Matter', 
      value: Math.min(100, (alchmQuantities.matter / maxAlchemical) * 100),
      rawValue: alchmQuantities.matter,
      angle: 120
    },
    { 
      axis: 'Substance', 
      value: Math.min(100, (alchmQuantities.substance / maxAlchemical) * 100),
      rawValue: alchmQuantities.substance,
      angle: 180
    },
    {
      axis: 'Heat',
      value: Math.min(100, Math.abs(alchmQuantities.Heat || 0) * 100),
      rawValue: alchmQuantities.Heat || 0,
      angle: 240
    },
    {
      axis: 'Energy',
      value: Math.min(100, Math.abs(alchmQuantities.Energy || 0) * 100),
      rawValue: alchmQuantities.Energy || 0,
      angle: 300
    }
  ]

  // Create pie chart data for composition breakdown
  const pieData = [
    { name: 'Spirit', value: alchmQuantities.spirit, color: ELEMENT_COLORS.Spirit },
    { name: 'Essence', value: alchmQuantities.essence, color: ELEMENT_COLORS.Essence },
    { name: 'Matter', value: alchmQuantities.matter, color: ELEMENT_COLORS.Matter },
    { name: 'Substance', value: alchmQuantities.substance, color: ELEMENT_COLORS.Substance }
  ].filter(item => item.value > 0)

  // Thermodynamic wave data for area chart
  const thermoWaveData = alchmQuantities.Heat !== undefined ? [
    { name: 'Base', Heat: 0, Entropy: 0, Reactivity: 0, Energy: 0 },
    { name: '25%', 
      Heat: Math.max(0, alchmQuantities.Heat * 25), 
      Entropy: Math.max(0, (alchmQuantities.Entropy || 0) * 25),
      Reactivity: Math.max(0, (alchmQuantities.Reactivity || 0) * 25),
      Energy: Math.max(0, (alchmQuantities.Energy || 0) * 25)
    },
    { name: '50%',
      Heat: Math.max(0, alchmQuantities.Heat * 50), 
      Entropy: Math.max(0, (alchmQuantities.Entropy || 0) * 50),
      Reactivity: Math.max(0, (alchmQuantities.Reactivity || 0) * 50),
      Energy: Math.max(0, (alchmQuantities.Energy || 0) * 50)
    },
    { name: '75%',
      Heat: Math.max(0, alchmQuantities.Heat * 75), 
      Entropy: Math.max(0, (alchmQuantities.Entropy || 0) * 75),
      Reactivity: Math.max(0, (alchmQuantities.Reactivity || 0) * 75),
      Energy: Math.max(0, (alchmQuantities.Energy || 0) * 75)
    },
    { name: 'Peak', 
      Heat: Math.max(0, alchmQuantities.Heat * 100), 
      Entropy: Math.max(0, (alchmQuantities.Entropy || 0) * 100),
      Reactivity: Math.max(0, (alchmQuantities.Reactivity || 0) * 100),
      Energy: Math.max(0, (alchmQuantities.Energy || 0) * 100)
    }
  ] : []

  return (
    <div className="space-y-6">
      {/* Consciousness State Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Consciousness State Vector
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="font-medium">Monica Constant</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                {monicaConstant.toFixed(3)}
              </div>
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Level {mcClass.level}: {mcClass.name}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {mcClass.description}
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Elemental Ratios
              </h4>
              {Object.entries(ELEMENT_ICONS).map(([element, Icon]) => {
                const value = alchmQuantities[element.toLowerCase() as keyof typeof alchmQuantities] as number
                const percentage = (value / maxAlchemical) * 100
                return (
                  <div key={element} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3 h-3" style={{ color: ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS] }} />
                        <span>{element}</span>
                      </div>
                      <span className="font-mono">{value.toFixed(2)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Field Composition
              </h4>
              {pieData.length > 0 && (
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value.toFixed(2)}`, 'Value']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="text-xs text-muted-foreground">
                Total: {(alchmQuantities.spirit + alchmQuantities.essence + alchmQuantities.matter + alchmQuantities.substance).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced 6D Alchemical Composition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            6-Dimensional Alchemical Vector Space
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Spirit, Essence, Matter, Substance + Heat & Energy thermodynamic dimensions
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={alchemicalData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid gridType="polygon" />
              <PolarAngleAxis dataKey="axis" fontSize={12} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                fontSize={10}
                tickFormatter={(value) => `${value}%`}
              />
              <Radar 
                name="Current State" 
                dataKey="value" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.2}
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6' }}
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${value.toFixed(1)}%`,
                  name
                ]}
                labelFormatter={(label: string, payload: any[]) => {
                  const data = payload[0]?.payload
                  return data ? `${label}: ${data.rawValue?.toFixed(3) || 'N/A'}` : label
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Thermodynamic Wave Analysis */}
      {thermoWaveData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              Thermodynamic Field Dynamics
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Heat, Entropy, Reactivity & Energy wave propagation through the alchemical field
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={thermoWaveData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value.toFixed(3), 'Intensity']} />
                <Area 
                  type="monotone" 
                  dataKey="Heat" 
                  stackId="1" 
                  stroke={ELEMENT_COLORS.Heat} 
                  fill={ELEMENT_COLORS.Heat}
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="Entropy" 
                  stackId="1" 
                  stroke={ELEMENT_COLORS.Entropy} 
                  fill={ELEMENT_COLORS.Entropy}
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="Reactivity" 
                  stackId="1" 
                  stroke={ELEMENT_COLORS.Reactivity} 
                  fill={ELEMENT_COLORS.Reactivity}
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="Energy" 
                  stackId="1" 
                  stroke={ELEMENT_COLORS.Energy} 
                  fill={ELEMENT_COLORS.Energy}
                  fillOpacity={0.6}
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Field Theory Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding the Alchemical Field</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            <strong>The Living Stone</strong> operates as a unified field where consciousness and matter interact through alchemical principles:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Flame className="w-4 h-4 text-red-500" />
                Spirit - Active Principle
              </div>
              <p className="text-muted-foreground pl-6">
                The initiating force, creative will, and transformative fire that begins all alchemical processes.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Droplets className="w-4 h-4 text-blue-500" />
                Essence - Receptive Principle  
              </div>
              <p className="text-muted-foreground pl-6">
                The fluid, adaptive medium through which transformations flow and consciousness expands.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Mountain className="w-4 h-4 text-green-500" />
                Matter - Structural Principle
              </div>
              <p className="text-muted-foreground pl-6">
                The stable foundation and physical manifestation that grounds spiritual insights into reality.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Wind className="w-4 h-4 text-yellow-500" />
                Substance - Connective Principle
              </div>
              <p className="text-muted-foreground pl-6">
                The communicating element that bridges all levels and facilitates conscious integration.
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Monica Constant (MC):</strong> MC = (Spirit × φ + Essence) / (Matter + Substance + 1)
              <br />
              <span className="text-muted-foreground">
                Where φ (phi) = 1.618... represents the golden ratio, harmonizing active and receptive principles 
                through the mathematical perfection found throughout nature&apos;s consciousness-matter interface.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ConsciousnessVectorDisplay
