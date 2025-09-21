'use client'

import React, { useState, useCallback, useEffect } from 'react'
import CosmicTimeLaboratory from '@/components/cosmic-time-laboratory'
import TemporalOracle from '@/components/temporal-oracle'
import TemporalTimeline from '@/components/temporal-timeline'
import AlchemicalMetricsChart from '@/components/alchemical-metrics-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { DatePickerWithRange } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Clock, Sparkles, Users, Zap, Download, Share, ArrowLeft, Settings, BookOpen, Play, Pause,
  Atom, BarChart3, MapPin, Calendar, Layers, Activity, Target, TrendingUp, Eye
} from 'lucide-react'
import { AspectPhaseWidget } from '@/components/aspect-phase-indicator'
import type {
  TemporalQuery,
  TemporalAnalysisResult,
  AgentTransitEvent
} from '@/lib/temporal-analysis-engine'
import type {
  CelestialMoment,
  Location,
  TimeSeriesOptions
} from '@/lib/celestial-energy-calculator'
import type {
  DegreeActivation,
  AgentActivationDetail
} from '@/lib/degree-agent-matcher'
import '../cosmic-time-laboratory.css'

interface TimeLabSession {
  id: string
  query: TemporalQuery
  results?: TemporalAnalysisResult
  timestamp: Date
  status: 'processing' | 'completed' | 'error'
}

interface CelestialSession {
  id: string
  timeRange: { start: Date; end: Date }
  location: Location
  interval: 'minute' | 'hour' | 'day' | 'week'
  metrics: ('A#' | 'SMES' | 'kinetic' | 'thermo')[]
  data?: CelestialMoment[]
  agentActivations?: AgentActivationDetail[]
  timestamp: Date
  status: 'processing' | 'completed' | 'error'
}

export default function TimeLaboratoryPage() {
  // Legacy temporal analysis state
  const [activeSession, setActiveSession] = useState<TimeLabSession | null>(null)
  const [sessions, setSessions] = useState<TimeLabSession[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([
    'leonardo-da-vinci',
    'albert-einstein',
    'carl-jung',
    'nikola-tesla'
  ])
  const [showTimeline, setShowTimeline] = useState(false)

  // Enhanced celestial energy state
  const [activeCelestialSession, setActiveCelestialSession] = useState<CelestialSession | null>(null)
  const [celestialSessions, setCelestialSessions] = useState<CelestialSession[]>([])
  const [isCelestialProcessing, setIsCelestialProcessing] = useState(false)
  const [activeView, setActiveView] = useState<'legacy' | 'celestial' | 'combined'>('celestial')

  // Celestial configuration state
  const [timeRange, setTimeRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    end: new Date()
  })
  const [location, setLocation] = useState<Location>({
    lat: 37.7749,
    lon: -122.4194,
    name: 'San Francisco, CA',
    timezone: 'America/Los_Angeles'
  })
  const [interval, setInterval] = useState<'minute' | 'hour' | 'day' | 'week'>('hour')
  const [selectedMetrics, setSelectedMetrics] = useState<('A#' | 'SMES' | 'kinetic' | 'thermo')[]>(['A#', 'SMES'])
  const [includeAgentInsights, setIncludeAgentInsights] = useState(true)
  const [realTimeMode, setRealTimeMode] = useState(false)
  const [showAgentActivations, setShowAgentActivations] = useState(true)

  // Enhanced suggestions for both modes
  const legacyQueries = [
    "Show Fire reinforcements during Renaissance creativity peaks",
    "Analyze consciousness evolution spikes across selected agents",
    "Find elemental harmony patterns in recent observations",
    "Explore degree hotspots with multiple agent activations",
    "Compare agent resonance during different planetary hours"
  ]

  const celestialQueries = [
    "Calculate A# energy patterns over the last 24 hours",
    "Show SMES elemental flows during peak consciousness periods",
    "Analyze kinetic velocity changes during planetary transits",
    "Track thermodynamic energy spikes with agent activations",
    "Compare consciousness evolution across different time periods"
  ]

  const suggestedQueries = activeView === 'legacy' ? legacyQueries : celestialQueries

  const handleQuerySubmit = useCallback(async (query: TemporalQuery) => {
    setIsProcessing(true)

    const newSession: TimeLabSession = {
      id: `session_${Date.now()}`,
      query,
      timestamp: new Date(),
      status: 'processing'
    }

    setActiveSession(newSession)
    setSessions(prev => [newSession, ...prev.slice(0, 9)]) // Keep last 10 sessions

    try {
      // Simulate API call to temporal analysis
      const response = await fetch('/api/temporal-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          useCache: true,
          cacheFor: 60
        })
      })

      if (response.ok) {
        const data = await response.json()

        if (data.success) {
          const completedSession: TimeLabSession = {
            ...newSession,
            results: data.data,
            status: 'completed'
          }

          setActiveSession(completedSession)
          setSessions(prev => prev.map(s => s.id === newSession.id ? completedSession : s))
          setShowTimeline(true)
        } else {
          throw new Error(data.error || 'Analysis failed')
        }
      } else {
        throw new Error('Network error')
      }
    } catch (error) {
      console.error('Temporal analysis error:', error)

      const errorSession: TimeLabSession = {
        ...newSession,
        status: 'error'
      }

      setActiveSession(errorSession)
      setSessions(prev => prev.map(s => s.id === newSession.id ? errorSession : s))
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleDegreeSelect = useCallback((degree: number) => {
    console.log('Selected degree:', degree)
    // Could trigger focused analysis on this degree
  }, [])

  const handleSuggestionRequest = useCallback((context: { agents?: string[]; elements?: string[] }) => {
    // Generate contextual suggestions based on current state
    console.log('Suggestion request:', context)
  }, [])

  // Enhanced celestial energy analysis handler
  const handleCelestialAnalysis = useCallback(async () => {
    setIsCelestialProcessing(true)

    const newSession: CelestialSession = {
      id: `celestial_${Date.now()}`,
      timeRange,
      location,
      interval,
      metrics: selectedMetrics,
      timestamp: new Date(),
      status: 'processing'
    }

    setActiveCelestialSession(newSession)
    setCelestialSessions(prev => [newSession, ...prev.slice(0, 9)]) // Keep last 10 sessions

    try {
      const response = await fetch('/api/celestial-energy-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: timeRange.start.toISOString(),
          endDate: timeRange.end.toISOString(),
          interval,
          location,
          metrics: selectedMetrics,
          includeAgentInsights,
          smoothingWindow: 3,
          highPrecision: true
        })
      })

      if (response.ok) {
        const data = await response.json()

        if (data.success) {
          const completedSession: CelestialSession = {
            ...newSession,
            data: data.data.timeline,
            agentActivations: data.data.agentActivations,
            status: 'completed'
          }

          setActiveCelestialSession(completedSession)
          setCelestialSessions(prev => prev.map(s => s.id === newSession.id ? completedSession : s))
        } else {
          throw new Error(data.error || 'Celestial analysis failed')
        }
      } else {
        throw new Error('Network error')
      }
    } catch (error) {
      console.error('Celestial analysis error:', error)

      const errorSession: CelestialSession = {
        ...newSession,
        status: 'error'
      }

      setActiveCelestialSession(errorSession)
      setCelestialSessions(prev => prev.map(s => s.id === newSession.id ? errorSession : s))
    } finally {
      setIsCelestialProcessing(false)
    }
  }, [timeRange, location, interval, selectedMetrics, includeAgentInsights])

  // Real-time updates
  useEffect(() => {
    if (!realTimeMode) return

    const interval = setInterval(() => {
      if (activeView === 'celestial' && !isCelestialProcessing) {
        // Update end time to current time and refresh
        setTimeRange(prev => ({
          ...prev,
          end: new Date()
        }))
        handleCelestialAnalysis()
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [realTimeMode, activeView, isCelestialProcessing, handleCelestialAnalysis])

  // Handle metric toggle
  const toggleMetric = useCallback((metric: 'A#' | 'SMES' | 'kinetic' | 'thermo') => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    )
  }, [])

  // Handle location presets
  const handleLocationPreset = useCallback((preset: Location) => {
    setLocation(preset)
  }, [])

  // Export handler for celestial data
  const handleCelestialExport = useCallback((format: 'png' | 'svg' | 'csv') => {
    if (!activeCelestialSession?.data) return

    const filename = `celestial-energy-${timeRange.start.toISOString().split('T')[0]}-to-${timeRange.end.toISOString().split('T')[0]}`

    if (format === 'csv') {
      // Generate CSV data
      const csvData = activeCelestialSession.data.map(moment => ({
        timestamp: moment.timestamp.toISOString(),
        A_number: moment.alchemical.A_number,
        spirit: moment.alchemical.spirit,
        matter: moment.alchemical.matter,
        essence: moment.alchemical.essence,
        substance: moment.alchemical.substance,
        power: moment.kinetic.power,
        inertia: moment.kinetic.inertia,
        heat: moment.thermodynamic.heat,
        entropy: moment.thermodynamic.entropy,
        reactivity: moment.thermodynamic.reactivity,
        energy: moment.thermodynamic.energy,
        resonanceLevel: moment.consciousness.resonanceLevel,
        evolutionPhase: moment.consciousness.evolutionPhase
      }))

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // For PNG/SVG, would integrate with chart export functionality
      console.log(`Export ${format} for celestial data:`, filename)
    }
  }, [activeCelestialSession, timeRange])

  const formatQueryText = (query: TemporalQuery) => {
    return query.query.length > 60 ? `${query.query.slice(0, 60)}...` : query.query
  }

  const getSessionStatusIcon = (status: TimeLabSession['status']) => {
    switch (status) {
      case 'processing': return <Clock className="w-4 h-4 text-blue-400 animate-spin" />
      case 'completed': return <Sparkles className="w-4 h-4 text-green-400" />
      case 'error': return <Zap className="w-4 h-4 text-red-400" />
    }
  }

  return (
    <div className="cosmic-time-laboratory min-h-screen">
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="cosmic-glass-ethereal rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {activeView === 'celestial' ? (
                  <Atom className="w-10 h-10 cosmic-text-gold cosmic-icon-animate" />
                ) : (
                  <Clock className="w-10 h-10 cosmic-text-gold cosmic-icon-animate" />
                )}
                <Sparkles className="w-5 h-5 text-purple-400 absolute -top-1 -right-1 cosmic-icon" />
              </div>
              <div>
                <h1 className="text-4xl font-bold cosmic-text-gradient mb-2">
                  {activeView === 'celestial' ? 'Celestial Energy Laboratory' : 'Time Laboratory'}
                </h1>
                <p className="text-purple-300">
                  {activeView === 'celestial'
                    ? 'Quantify and visualize A#, SMES, Kinetic, and Thermodynamic celestial energies'
                    : 'Advanced temporal analysis of consciousness evolution and agent transit patterns'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* View mode selector */}
              <Tabs
                value={activeView}
                onValueChange={(value) => setActiveView(value as any)}
              >
                <TabsList className="cosmic-tabs">
                  <TabsTrigger value="celestial" className="cosmic-tab">
                    <Atom className="w-4 h-4 mr-2" />
                    Celestial
                  </TabsTrigger>
                  <TabsTrigger value="legacy" className="cosmic-tab">
                    <Clock className="w-4 h-4 mr-2" />
                    Legacy
                  </TabsTrigger>
                  <TabsTrigger value="combined" className="cosmic-tab">
                    <Layers className="w-4 h-4 mr-2" />
                    Combined
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Real-time toggle */}
              {activeView === 'celestial' && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <Switch
                    checked={realTimeMode}
                    onCheckedChange={setRealTimeMode}
                  />
                  <span className="text-xs text-purple-300">Live</span>
                </div>
              )}

              {/* Legacy timeline toggle */}
              {activeView === 'legacy' && (
                <Button
                  variant="outline"
                  className="cosmic-button border-purple-500/30"
                  onClick={() => setShowTimeline(!showTimeline)}
                >
                  {showTimeline ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {showTimeline ? 'Hide Timeline' : 'Show Timeline'}
                </Button>
              )}

              <Button className="cosmic-button">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Enhanced Interface */}
        {activeView === 'celestial' && (
          <div className="space-y-6">
            {/* Celestial Energy Controls */}
            <Card className="cosmic-glass">
              <CardHeader>
                <CardTitle className="text-gold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Celestial Energy Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Time Range Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-300">Time Range</label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="cosmic-button"
                        onClick={() => setTimeRange({
                          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                          end: new Date()
                        })}
                      >
                        24h
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cosmic-button"
                        onClick={() => setTimeRange({
                          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                          end: new Date()
                        })}
                      >
                        7d
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cosmic-button"
                        onClick={() => setTimeRange({
                          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                          end: new Date()
                        })}
                      >
                        30d
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-300">Interval</label>
                    <Select value={interval} onValueChange={(value: any) => setInterval(value)}>
                      <SelectTrigger className="cosmic-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minute">Every Minute</SelectItem>
                        <SelectItem value="hour">Hourly</SelectItem>
                        <SelectItem value="day">Daily</SelectItem>
                        <SelectItem value="week">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-purple-300">Location</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-100">{location.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="cosmic-button ml-auto"
                      onClick={() => {
                        // Quick location presets
                        const presets = [
                          { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
                          { name: 'New York, NY', lat: 40.7128, lon: -74.0060 },
                          { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
                          { name: 'Paris, France', lat: 48.8566, lon: 2.3522 }
                        ]
                        const currentIndex = presets.findIndex(p => p.name === location.name)
                        const nextIndex = (currentIndex + 1) % presets.length
                        setLocation({ ...presets[nextIndex], timezone: 'auto' })
                      }}
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Cycle
                    </Button>
                  </div>
                </div>

                {/* Metrics Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-purple-300">Metrics to Visualize</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: 'A#', label: 'A# (Alchemical Number)', icon: <Atom className="w-4 h-4" />, color: '#FFD700' },
                      { key: 'SMES', label: 'Spirit-Matter-Essence-Substance', icon: <Layers className="w-4 h-4" />, color: '#8B5CF6' },
                      { key: 'kinetic', label: 'Kinetic Properties', icon: <TrendingUp className="w-4 h-4" />, color: '#10B981' },
                      { key: 'thermo', label: 'Thermodynamic Values', icon: <Activity className="w-4 h-4" />, color: '#F59E0B' }
                    ].map(metric => (
                      <Button
                        key={metric.key}
                        size="sm"
                        variant={selectedMetrics.includes(metric.key as any) ? "default" : "outline"}
                        className={`cosmic-button text-xs ${
                          selectedMetrics.includes(metric.key as any)
                            ? 'text-white'
                            : 'text-purple-300 border-purple-500/30'
                        }`}
                        style={{
                          backgroundColor: selectedMetrics.includes(metric.key as any) ? metric.color : 'transparent',
                          borderColor: metric.color
                        }}
                        onClick={() => toggleMetric(metric.key as any)}
                      >
                        {metric.icon}
                        <span className="ml-1">{metric.key}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={includeAgentInsights}
                        onCheckedChange={setIncludeAgentInsights}
                      />
                      <span className="text-sm text-purple-300">Agent Insights</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showAgentActivations}
                        onCheckedChange={setShowAgentActivations}
                      />
                      <span className="text-sm text-purple-300">Show Activations</span>
                    </div>
                  </div>

                  <Button
                    className="cosmic-button"
                    onClick={handleCelestialAnalysis}
                    disabled={isCelestialProcessing || selectedMetrics.length === 0}
                  >
                    {isCelestialProcessing ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analyze Celestial Energy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Celestial Energy Visualization */}
            {activeCelestialSession?.data && (
              <AlchemicalMetricsChart
                data={activeCelestialSession.data}
                isLoading={isCelestialProcessing}
                height={600}
                realTimeMode={realTimeMode}
                onExport={handleCelestialExport}
                onAgentActivation={(activations) => {
                  console.log('Agent activations:', activations)
                }}
              />
            )}

            {/* Agent Activations Panel */}
            {showAgentActivations && activeCelestialSession?.agentActivations && (
              <Card className="cosmic-glass">
                <CardHeader>
                  <CardTitle className="text-gold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Agent Activations ({activeCelestialSession.agentActivations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeCelestialSession.agentActivations.slice(0, 6).map((activation, index) => (
                      <div
                        key={index}
                        className="p-4 border border-purple-500/20 rounded-lg cosmic-glass"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="cosmic-badge">
                            {(activation.resonanceLevel * 100).toFixed(0)}%
                          </Badge>
                          <span className="font-medium text-purple-100">
                            {activation.agentName}
                          </span>
                        </div>
                        <p className="text-sm text-purple-300 mb-2">
                          {activation.message}
                        </p>
                        <p className="text-xs text-purple-400">
                          Activation: {activation.activationType} •
                          Orb: {activation.orb.toFixed(1)}°
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Legacy Time Laboratory Interface */}
        {activeView === 'legacy' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Oracle Interface */}
            <div className="lg:col-span-1 space-y-6">
            <TemporalOracle
              onQuerySubmit={handleQuerySubmit}
              suggestedQueries={suggestedQueries}
              selectedAgents={selectedAgents}
              isProcessing={isProcessing}
              onSuggestionRequest={handleSuggestionRequest}
            />

            {/* Session History */}
            {sessions.length > 0 && (
              <Card className="cosmic-glass">
                <CardHeader>
                  <CardTitle className="text-gold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Recent Explorations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sessions.slice(0, 5).map(session => (
                    <div
                      key={session.id}
                      onClick={() => setActiveSession(session)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        activeSession?.id === session.id
                          ? 'border-gold/50 bg-gold/10'
                          : 'border-purple-500/20 hover:bg-purple-500/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getSessionStatusIcon(session.status)}
                        <div className="flex-1">
                          <p className="text-sm text-purple-100 mb-1">
                            {formatQueryText(session.query)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-purple-400">
                              {session.timestamp.toLocaleTimeString()}
                            </span>
                            {session.results && (
                              <Badge className="cosmic-badge text-xs">
                                {session.results.transitEvents.length} events
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Agent Selection */}
            <Card className="cosmic-glass">
              <CardHeader>
                <CardTitle className="text-gold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'leonardo-da-vinci',
                    'albert-einstein',
                    'carl-jung',
                    'nikola-tesla',
                    'william-shakespeare',
                    'marie-curie'
                  ].map(agentId => (
                    <button
                      key={agentId}
                      onClick={() => {
                        setSelectedAgents(prev =>
                          prev.includes(agentId)
                            ? prev.filter(id => id !== agentId)
                            : [...prev, agentId]
                        )
                      }}
                      className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
                        selectedAgents.includes(agentId)
                          ? 'cosmic-button text-white'
                          : 'border-purple-500/30 text-purple-300 hover:bg-purple-800/40'
                      }`}
                    >
                      {agentId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            </div>

          {/* Right Panel - Results and Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Session Results */}
            {activeSession?.results && (
              <Card className="cosmic-glass-ethereal">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="cosmic-text-gold">
                      Analysis Results
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="cosmic-badge">
                        {activeSession.results.transitEvents.length} events
                      </Badge>
                      <Badge className="cosmic-badge">
                        {activeSession.results.patterns.length} patterns
                      </Badge>
                      <Button size="sm" variant="outline" className="cosmic-button">
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Key Metrics */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-purple-300">Key Insights</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-purple-400">Dominant Elements:</span>
                          <span className="text-purple-100">
                            {activeSession.results.insights.dominantElements.join(', ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-400">Peak Periods:</span>
                          <span className="text-purple-100">
                            {activeSession.results.insights.peakPeriods.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-400">Degree Hotspots:</span>
                          <span className="text-purple-100">
                            {activeSession.results.insights.degreeHotspots.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reinforcement Scores */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-purple-300">Elemental Reinforcement</h4>
                      <div className="space-y-2">
                        {activeSession.results.reinforcementScores.map(score => (
                          <div key={score.element} className="flex justify-between">
                            <span className="text-purple-400">{score.element}:</span>
                            <span className="text-purple-100">
                              {(score.score * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {activeSession.results.recommendations.deepDiveOpportunities.length > 0 && (
                    <div className="border border-purple-500/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-300 mb-2">
                        Recommended Deep Dives
                      </h4>
                      <div className="space-y-1">
                        {activeSession.results.recommendations.deepDiveOpportunities.map((rec, index) => (
                          <p key={index} className="text-sm text-purple-200">
                            • {rec}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline Visualization */}
            {showTimeline && activeSession?.results && (
              <TemporalTimeline
                data={activeSession.results.transitEvents}
                agents={selectedAgents}
                patterns={activeSession.results.patterns}
                onDegreeSelect={handleDegreeSelect}
                reinforcementMode={true}
                isLoading={isProcessing}
              />
            )}

            {/* No Results State */}
            {!activeSession && (
              <Card className="cosmic-glass h-96 flex items-center justify-center">
                <div className="text-center text-purple-300">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50 cosmic-icon-animate" />
                  <h3 className="text-xl font-semibold mb-2">Welcome to the Time Laboratory</h3>
                  <p className="text-purple-400">
                    Begin your temporal exploration by consulting the Oracle
                  </p>
                </div>
              </Card>
            )}
          </div>
          </div>
        )}

        {/* Combined View */}
        {activeView === 'combined' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Legacy Oracle */}
              <Card className="cosmic-glass">
                <CardHeader>
                  <CardTitle className="text-gold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Temporal Oracle (Legacy)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TemporalOracle
                    onQuerySubmit={handleQuerySubmit}
                    suggestedQueries={legacyQueries}
                    selectedAgents={selectedAgents}
                    isProcessing={isProcessing}
                    onSuggestionRequest={handleSuggestionRequest}
                  />
                </CardContent>
              </Card>

              {/* Celestial Energy Controls */}
              <Card className="cosmic-glass">
                <CardHeader>
                  <CardTitle className="text-gold flex items-center gap-2">
                    <Atom className="w-5 h-5" />
                    Celestial Energy (Enhanced)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'A#', icon: <Atom className="w-4 h-4" />, color: '#FFD700' },
                      { key: 'SMES', icon: <Layers className="w-4 h-4" />, color: '#8B5CF6' },
                      { key: 'kinetic', icon: <TrendingUp className="w-4 h-4" />, color: '#10B981' },
                      { key: 'thermo', icon: <Activity className="w-4 h-4" />, color: '#F59E0B' }
                    ].map(metric => (
                      <Button
                        key={metric.key}
                        size="sm"
                        variant={selectedMetrics.includes(metric.key as any) ? "default" : "outline"}
                        className="cosmic-button text-xs"
                        style={{
                          backgroundColor: selectedMetrics.includes(metric.key as any) ? metric.color : 'transparent',
                          borderColor: metric.color
                        }}
                        onClick={() => toggleMetric(metric.key as any)}
                      >
                        {metric.icon}
                        <span className="ml-1">{metric.key}</span>
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="cosmic-button w-full"
                    onClick={handleCelestialAnalysis}
                    disabled={isCelestialProcessing || selectedMetrics.length === 0}
                  >
                    {isCelestialProcessing ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analyze Energy
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Combined Visualizations */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Legacy Timeline */}
              {showTimeline && activeSession?.results && (
                <TemporalTimeline
                  data={activeSession.results.transitEvents}
                  agents={selectedAgents}
                  patterns={activeSession.results.patterns}
                  onDegreeSelect={handleDegreeSelect}
                  reinforcementMode={true}
                  isLoading={isProcessing}
                />
              )}

              {/* Celestial Metrics */}
              {activeCelestialSession?.data && (
                <AlchemicalMetricsChart
                  data={activeCelestialSession.data}
                  isLoading={isCelestialProcessing}
                  height={400}
                  realTimeMode={realTimeMode}
                  onExport={handleCelestialExport}
                />
              )}

              {/* Aspect Dynamics Indicator */}
              <Card className="cosmic-glass mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg cosmic-text-gradient flex items-center gap-2">
                    <Activity className="w-5 h-5 cosmic-icon-animate" />
                    Applying & Separating Aspects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AspectPhaseWidget
                    location={location}
                    planets={['Sun', 'Moon', 'Mercury', 'Venus', 'Mars']}
                    className="mt-2"
                  />
                  <p className="text-xs text-purple-400 mt-3">
                    Real-time aspect phase analysis: Blue=Applying, Green=Exact, Orange=Separating
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* No Data State for Celestial Mode */}
        {activeView === 'celestial' && !activeCelestialSession && (
          <Card className="cosmic-glass h-96 flex items-center justify-center">
            <div className="text-center text-purple-300">
              <Atom className="w-16 h-16 mx-auto mb-4 opacity-50 cosmic-icon-animate" />
              <h3 className="text-xl font-semibold mb-2">Celestial Energy Laboratory</h3>
              <p className="text-purple-400 mb-4">
                Configure your parameters and begin quantifying celestial energies
              </p>
              <Button
                className="cosmic-button"
                onClick={handleCelestialAnalysis}
                disabled={selectedMetrics.length === 0}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Start Analysis
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}