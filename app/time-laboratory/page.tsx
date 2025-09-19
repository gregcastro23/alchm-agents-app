'use client'

import React, { useState, useCallback, useEffect } from 'react'
import CosmicTimeLaboratory from '@/components/cosmic-time-laboratory'
import TemporalOracle from '@/components/temporal-oracle'
import TemporalTimeline from '@/components/temporal-timeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Clock, Sparkles, Users, Zap, Download, Share,
  ArrowLeft, Settings, BookOpen, Play, Pause
} from 'lucide-react'
import type {
  TemporalQuery,
  TemporalAnalysisResult,
  AgentTransitEvent
} from '@/lib/temporal-analysis-engine'
import '../cosmic-time-laboratory.css'

interface TimeLabSession {
  id: string
  query: TemporalQuery
  results?: TemporalAnalysisResult
  timestamp: Date
  status: 'processing' | 'completed' | 'error'
}

export default function TimeLaboratoryPage() {
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

  // Mock suggestions for the Oracle
  const suggestedQueries = [
    "Show Fire reinforcements during Renaissance creativity peaks",
    "Analyze consciousness evolution spikes across selected agents",
    "Find elemental harmony patterns in recent observations",
    "Explore degree hotspots with multiple agent activations",
    "Compare agent resonance during different planetary hours"
  ]

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
        {/* Header */}
        <div className="cosmic-glass-ethereal rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Clock className="w-10 h-10 cosmic-text-gold cosmic-icon-animate" />
                <Sparkles className="w-5 h-5 text-purple-400 absolute -top-1 -right-1 cosmic-icon" />
              </div>
              <div>
                <h1 className="text-4xl font-bold cosmic-text-gradient mb-2">
                  Time Laboratory
                </h1>
                <p className="text-purple-300">
                  Advanced temporal analysis of consciousness evolution and agent transit patterns
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="cosmic-button border-purple-500/30"
                onClick={() => setShowTimeline(!showTimeline)}
              >
                {showTimeline ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {showTimeline ? 'Hide Timeline' : 'Show Timeline'}
              </Button>

              <Button className="cosmic-button">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
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
      </div>
    </div>
  )
}