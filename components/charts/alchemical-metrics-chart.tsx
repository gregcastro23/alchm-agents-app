'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  ComposedChart,
  LineChart,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Area,
  ReferenceLine,
  Brush,
  ScatterChart,
  Scatter,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Atom,
  Waves,
  Mountain,
  Flame,
  Droplets,
  Wind,
  Circle,
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  Target,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import type { CelestialMoment } from '@/lib/celestial-energy-calculator'

interface AlchemicalMetricsChartProps {
  data: CelestialMoment[]
  isLoading?: boolean
  height?: number
  realTimeMode?: boolean
  onExport?: (format: 'png' | 'svg' | 'csv') => void
}

interface MetricToggle {
  key: string
  label: string
  color: string
  icon: React.ReactNode
  enabled: boolean
  category: 'alchemical' | 'kinetic' | 'thermo' | 'elemental' | 'consciousness'
}

interface ChartConfig {
  type: 'line' | 'area' | 'scatter' | 'radial' | 'composite'
  smoothing: boolean
  showTrends: boolean
  showPatterns: boolean
  timeWindow: number // hours to show
  zoomLevel: number
  animationSpeed: number
}

interface PatternHighlight {
  start: number
  end: number
  type: string
  color: string
  significance: number
}

export default function AlchemicalMetricsChart({
  data,
  isLoading = false,
  height = 500,
  realTimeMode = false,
  onExport,
}: AlchemicalMetricsChartProps) {
  // State management
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'composite',
    smoothing: true,
    showTrends: true,
    showPatterns: true,
    timeWindow: 24,
    zoomLevel: 1,
    animationSpeed: 1000,
  })

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [metricToggles, setMetricToggles] = useState<MetricToggle[]>([
    // Alchemical metrics
    {
      key: 'A_number',
      label: 'A#',
      color: '#FFD700',
      icon: <Atom className="w-4 h-4" />,
      enabled: true,
      category: 'alchemical',
    },
    {
      key: 'spirit',
      label: 'Spirit',
      color: '#9333EA',
      icon: <Flame className="w-4 h-4" />,
      enabled: true,
      category: 'alchemical',
    },
    {
      key: 'matter',
      label: 'Matter',
      color: '#059669',
      icon: <Mountain className="w-4 h-4" />,
      enabled: true,
      category: 'alchemical',
    },
    {
      key: 'essence',
      label: 'Essence',
      color: '#DC2626',
      icon: <Droplets className="w-4 h-4" />,
      enabled: true,
      category: 'alchemical',
    },
    {
      key: 'substance',
      label: 'Substance',
      color: '#2563EB',
      icon: <Circle className="w-4 h-4" />,
      enabled: true,
      category: 'alchemical',
    },

    // Kinetic metrics
    {
      key: 'power',
      label: 'Power',
      color: '#F59E0B',
      icon: <Zap className="w-4 h-4" />,
      enabled: false,
      category: 'kinetic',
    },
    {
      key: 'inertia',
      label: 'Inertia',
      color: '#6B7280',
      icon: <Minus className="w-4 h-4" />,
      enabled: false,
      category: 'kinetic',
    },

    // Thermodynamic metrics
    {
      key: 'heat',
      label: 'Heat',
      color: '#EF4444',
      icon: <TrendingUp className="w-4 h-4" />,
      enabled: false,
      category: 'thermo',
    },
    {
      key: 'entropy',
      label: 'Entropy',
      color: '#8B5CF6',
      icon: <Waves className="w-4 h-4" />,
      enabled: false,
      category: 'thermo',
    },
    {
      key: 'reactivity',
      label: 'Reactivity',
      color: '#10B981',
      icon: <Activity className="w-4 h-4" />,
      enabled: false,
      category: 'thermo',
    },
    {
      key: 'energy',
      label: 'Energy',
      color: '#F97316',
      icon: <Target className="w-4 h-4" />,
      enabled: false,
      category: 'thermo',
    },

    // Elemental metrics
    {
      key: 'Fire',
      label: 'Fire',
      color: '#DC2626',
      icon: <Flame className="w-4 h-4" />,
      enabled: false,
      category: 'elemental',
    },
    {
      key: 'Water',
      label: 'Water',
      color: '#2563EB',
      icon: <Droplets className="w-4 h-4" />,
      enabled: false,
      category: 'elemental',
    },
    {
      key: 'Air',
      label: 'Air',
      color: '#F59E0B',
      icon: <Wind className="w-4 h-4" />,
      enabled: false,
      category: 'elemental',
    },
    {
      key: 'Earth',
      label: 'Earth',
      color: '#059669',
      icon: <Mountain className="w-4 h-4" />,
      enabled: false,
      category: 'elemental',
    },

    // Consciousness metrics
    {
      key: 'resonanceLevel',
      label: 'Resonance',
      color: '#8B5CF6',
      icon: <Waves className="w-4 h-4" />,
      enabled: false,
      category: 'consciousness',
    },
    {
      key: 'spiritualAmplitude',
      label: 'Spiritual Amplitude',
      color: '#EC4899',
      icon: <TrendingUp className="w-4 h-4" />,
      enabled: false,
      category: 'consciousness',
    },
  ])

  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [selectedTimeRange, setSelectedTimeRange] = useState<[number, number]>([0, 100])
  const [patternHighlights, setPatternHighlights] = useState<PatternHighlight[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  // Process chart data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []

    return data.map((moment, index) => {
      const timestampDate =
        moment.timestamp instanceof Date ? moment.timestamp : new Date(moment.timestamp)
      const safeNum = (val: any) => {
        if (val === null || val === undefined || Number.isNaN(Number(val))) return 0
        return Number(val)
      }

      const processedMoment: any = {
        index,
        timestamp: timestampDate.getTime(),
        formattedTime: timestampDate.toLocaleTimeString(),
        formattedDate: timestampDate.toLocaleDateString(),
        A_number: safeNum(moment.alchemical?.A_number),
        spirit: safeNum(moment.alchemical?.spirit),
        matter: safeNum(moment.alchemical?.matter),
        essence: safeNum(moment.alchemical?.essence),
        substance: safeNum(moment.alchemical?.substance),
        power: safeNum(moment.kinetic?.power),
        inertia: safeNum(moment.kinetic?.inertia),
        heat: safeNum(moment.thermodynamic?.heat),
        entropy: safeNum(moment.thermodynamic?.entropy),
        reactivity: safeNum(moment.thermodynamic?.reactivity),
        energy: safeNum(moment.thermodynamic?.energy),
        Fire: safeNum(moment.elemental?.Fire),
        Water: safeNum(moment.elemental?.Water),
        Air: safeNum(moment.elemental?.Air),
        Earth: safeNum(moment.elemental?.Earth),
        resonanceLevel: safeNum(moment.consciousness?.resonanceLevel) * 100,
        spiritualAmplitude: safeNum(moment.consciousness?.spiritualAmplitude),
        evolutionPhase: moment.consciousness?.evolutionPhase ?? 'dormant',
        dominantPlanet: moment.planetary?.dominantPlanet ?? 'Unknown',
      }

      return processedMoment
    })
  }, [data])

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!processedData.length) return []

    const startIndex = Math.floor((selectedTimeRange[0] / 100) * processedData.length)
    const endIndex = Math.ceil((selectedTimeRange[1] / 100) * processedData.length)

    return processedData.slice(startIndex, endIndex)
  }, [processedData, selectedTimeRange])

  // Get enabled metrics data
  const enabledMetrics = useMemo(() => {
    return metricToggles.filter(toggle => toggle.enabled)
  }, [metricToggles])

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!filteredData.length) return {}

    const stats: any = {}

    enabledMetrics.forEach(metric => {
      const values = filteredData.map(d => d[metric.key]).filter(v => typeof v === 'number')
      if (values.length > 0) {
        stats[metric.key] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          trend: values[values.length - 1] - values[0],
        }
      }
    })

    return stats
  }, [filteredData, enabledMetrics])

  // Detect patterns
  useEffect(() => {
    if (!filteredData.length || !chartConfig.showPatterns) return

    const patterns: PatternHighlight[] = []

    // Detect A# peaks
    const aNumbers = filteredData.map(d => d.A_number)
    const avgA = aNumbers.reduce((sum, val) => sum + val, 0) / aNumbers.length
    const threshold = avgA * 1.2

    let peakStart = -1
    for (let i = 0; i < aNumbers.length; i++) {
      if (aNumbers[i] > threshold && peakStart === -1) {
        peakStart = i
      } else if (aNumbers[i] <= threshold && peakStart !== -1) {
        patterns.push({
          start: peakStart,
          end: i,
          type: 'A# Peak',
          color: '#FFD700',
          significance: 0.8,
        })
        peakStart = -1
      }
    }

    setPatternHighlights(patterns)
  }, [filteredData, chartConfig.showPatterns])

  // Playback animation
  useEffect(() => {
    if (!isPlaying || !filteredData.length) return

    const interval = setInterval(() => {
      setPlaybackPosition(prev => {
        const next = prev + 1
        if (next >= filteredData.length) {
          setIsPlaying(false)
          return 0
        }
        return next
      })
    }, chartConfig.animationSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, filteredData.length, chartConfig.animationSpeed])

  // Handle metric toggle
  const toggleMetric = useCallback((key: string) => {
    setMetricToggles(prev =>
      prev.map(toggle => (toggle.key === key ? { ...toggle, enabled: !toggle.enabled } : toggle))
    )
  }, [])

  // Handle category toggle
  const toggleCategory = useCallback((category: string, enabled: boolean) => {
    setMetricToggles(prev =>
      prev.map(toggle => (toggle.category === category ? { ...toggle, enabled } : toggle))
    )
  }, [])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]?.payload
    if (!data) return null

    return (
      <div className="cosmic-glass border border-purple-500/30 rounded-lg p-4 max-w-sm">
        <p className="text-gold font-semibold mb-2">
          {data.formattedDate} {data.formattedTime}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-purple-300 text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.dataKey}:
              </span>
              <span className="text-purple-100 font-medium">
                {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              </span>
            </div>
          ))}
        </div>
        {data.evolutionPhase && (
          <div className="mt-2 pt-2 border-t border-purple-500/20">
            <p className="text-xs text-purple-400">Evolution: {data.evolutionPhase}</p>
            <p className="text-xs text-purple-400">Dominant: {data.dominantPlanet}</p>
          </div>
        )}
      </div>
    )
  }

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    }

    switch (chartConfig.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="formattedTime" stroke="#9CA3AF" fontSize={12} tickLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {enabledMetrics.map(metric => (
              <Line
                key={metric.key}
                type={chartConfig.smoothing ? 'monotone' : 'linear'}
                dataKey={metric.key}
                stroke={metric.color}
                strokeWidth={2}
                dot={false}
                name={metric.label}
                animationDuration={chartConfig.animationSpeed}
              />
            ))}
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="formattedTime" stroke="#9CA3AF" fontSize={12} tickLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {enabledMetrics.map(metric => (
              <Area
                key={metric.key}
                type={chartConfig.smoothing ? 'monotone' : 'linear'}
                dataKey={metric.key}
                stackId="1"
                stroke={metric.color}
                fill={metric.color}
                fillOpacity={0.3}
                name={metric.label}
                animationDuration={chartConfig.animationSpeed}
              />
            ))}
          </AreaChart>
        )

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              tickFormatter={timestamp => new Date(timestamp).toLocaleTimeString()}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {enabledMetrics.map(metric => (
              <Scatter
                key={metric.key}
                dataKey={metric.key}
                fill={metric.color}
                name={metric.label}
              />
            ))}
          </ScatterChart>
        )

      default: // composite
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="formattedTime" stroke="#9CA3AF" fontSize={12} tickLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Pattern highlights */}
            {chartConfig.showPatterns &&
              patternHighlights.map((pattern, index) => (
                <ReferenceLine
                  key={index}
                  x={filteredData[pattern.start]?.formattedTime}
                  stroke={pattern.color}
                  strokeDasharray="5 5"
                  opacity={0.5}
                  label={{ value: pattern.type, position: 'top' }}
                />
              ))}

            {/* Metrics lines */}
            {enabledMetrics.map(metric => (
              <Line
                key={metric.key}
                type={chartConfig.smoothing ? 'monotone' : 'linear'}
                dataKey={metric.key}
                stroke={metric.color}
                strokeWidth={2}
                dot={false}
                name={metric.label}
                animationDuration={chartConfig.animationSpeed}
              />
            ))}

            {/* Playback position indicator */}
            {isPlaying && (
              <ReferenceLine
                x={filteredData[playbackPosition]?.formattedTime}
                stroke="#FFD700"
                strokeWidth={3}
                label={{ value: 'Now', position: 'top' }}
              />
            )}

            {/* Time range brush */}
            <Brush
              dataKey="formattedTime"
              height={30}
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.2}
            />
          </ComposedChart>
        )
    }
  }

  if (isLoading) {
    return (
      <Card className="cosmic-glass">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
            <p className="text-purple-300">Calculating celestial energies...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`cosmic-glass ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="cosmic-text-gold flex items-center gap-2">
              <Atom className="w-6 h-6" />
              Celestial Energy Metrics
            </CardTitle>
            {realTimeMode && (
              <Badge className="cosmic-badge animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Chart type selector */}
            <Tabs
              value={chartConfig.type}
              onValueChange={value => setChartConfig(prev => ({ ...prev, type: value as any }))}
            >
              <TabsList className="cosmic-tabs">
                <TabsTrigger value="composite" className="cosmic-tab">
                  <BarChart3 className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="line" className="cosmic-tab">
                  <LineChartIcon className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="area" className="cosmic-tab">
                  <Mountain className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="scatter" className="cosmic-tab">
                  <Circle className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Playback controls */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="cosmic-button"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="cosmic-button"
                onClick={() => {
                  setIsPlaying(false)
                  setPlaybackPosition(0)
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Expand/collapse */}
            <Button
              size="sm"
              variant="outline"
              className="cosmic-button"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Statistics row */}
        <div className="flex items-center gap-4 text-sm">
          {enabledMetrics.slice(0, 4).map(metric => {
            const stat = statistics[metric.key]
            if (!stat) return null

            return (
              <div key={metric.key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
                <span className="text-purple-300">{metric.label}:</span>
                <span className="text-purple-100 font-medium">{stat.avg.toFixed(2)}</span>
                {stat.trend > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : stat.trend < 0 ? (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                ) : (
                  <Minus className="w-3 h-3 text-gray-400" />
                )}
              </div>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metric toggles */}
        <div className="space-y-4">
          {['alchemical', 'kinetic', 'thermo', 'elemental', 'consciousness'].map(category => {
            const categoryMetrics = metricToggles.filter(m => m.category === category)
            const enabledCount = categoryMetrics.filter(m => m.enabled).length

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-purple-300 capitalize">
                    {category} Metrics ({enabledCount}/{categoryMetrics.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="cosmic-button text-xs"
                      onClick={() => toggleCategory(category, true)}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="cosmic-button text-xs"
                      onClick={() => toggleCategory(category, false)}
                    >
                      None
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categoryMetrics.map(metric => (
                    <Button
                      key={metric.key}
                      size="sm"
                      variant={metric.enabled ? 'default' : 'outline'}
                      className={`cosmic-button text-xs ${
                        metric.enabled ? 'text-white' : 'text-purple-300 border-purple-500/30'
                      }`}
                      style={{
                        backgroundColor: metric.enabled ? metric.color : 'transparent',
                        borderColor: metric.color,
                      }}
                      onClick={() => toggleMetric(metric.key)}
                    >
                      {metric.icon}
                      <span className="ml-1">{metric.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <Separator className="bg-purple-500/20" />

        {/* Chart configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-purple-300">Smoothing</label>
            <Switch
              checked={chartConfig.smoothing}
              onCheckedChange={checked => setChartConfig(prev => ({ ...prev, smoothing: checked }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-purple-300">Show Patterns</label>
            <Switch
              checked={chartConfig.showPatterns}
              onCheckedChange={checked =>
                setChartConfig(prev => ({ ...prev, showPatterns: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-purple-300">
              Animation Speed: {chartConfig.animationSpeed}ms
            </label>
            <Slider
              value={[chartConfig.animationSpeed]}
              onValueChange={([value]) =>
                setChartConfig(prev => ({ ...prev, animationSpeed: value }))
              }
              min={100}
              max={2000}
              step={100}
              className="cosmic-slider"
            />
          </div>
        </div>

        <Separator className="bg-purple-500/20" />

        {/* Chart */}
        <div className="relative">
          {filteredData.length > 0 ? (
            <div className="w-full" style={{ height: isExpanded ? 600 : height, minWidth: 100 }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-purple-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No data available</p>
                <p className="text-xs">Enable metrics and select a time range</p>
              </div>
            </div>
          )}
        </div>

        {/* Time range selector */}
        <div className="space-y-2">
          <label className="text-sm text-purple-300">
            Time Range: {selectedTimeRange[0]}% - {selectedTimeRange[1]}%
          </label>
          <Slider
            value={selectedTimeRange}
            onValueChange={(val: number[]) => setSelectedTimeRange(val as [number, number])}
            min={0}
            max={100}
            step={1}
            className="cosmic-slider"
          />
        </div>

        {/* Export options */}
        {onExport && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="cosmic-button"
              onClick={() => onExport('png')}
            >
              <Download className="w-4 h-4 mr-1" />
              PNG
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="cosmic-button"
              onClick={() => onExport('svg')}
            >
              <Download className="w-4 h-4 mr-1" />
              SVG
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="cosmic-button"
              onClick={() => onExport('csv')}
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
