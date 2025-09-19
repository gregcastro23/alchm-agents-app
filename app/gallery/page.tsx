'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Grid3X3,
  List,
  Sparkles,
  Users,
  Crown,
  Plus,
  Filter,
  MessageSquare,
  X,
  Zap,
  Activity,
  Database,
  Shield,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import {
  DEMO_AGENTS,
  getAgentCollections,
  sortAgents,
  getSortingOptions,
  type AgentSortCriteria,
  type SortDirection
} from '@/lib/demo-agents-data'
import type {
  CraftedAgent,
  GalleryViewMode,
  AgentFilterBy,
  Element,
  ConsciousnessLevel,
} from '@/lib/agent-types'
import { GalleryGroupChat } from '@/components/gallery-group-chat'
import SignVectorGraphic, {
  calculateSignVectorFromChart,
  SignVectorRune,
} from '@/components/sign-vector-graphic'
import {
  KineticCompatibilityIndicator,
  MultiAgentCompatibility
} from '@/components/kinetic-compatibility-indicator'
import { EnhancedAgentCard } from '@/components/enhanced-agent-card'
import { RealTimeKineticsWidget } from '@/components/real-time-kinetics-widget'
import { ChartTransformVisualization } from '@/components/chart-transform-visualization'
import { MomentBasedRecommendations } from '@/components/moment-based-recommendations'

export default function GalleryPage() {
  const [viewMode, setViewMode] = useState<GalleryViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [filters, setFilters] = useState<
    AgentFilterBy & { element?: Element | 'all'; consciousnessLevel?: ConsciousnessLevel | 'all' }
  >({})
  const [agents, setAgents] = useState(DEMO_AGENTS)
  const [showGroupChat, setShowGroupChat] = useState(false)
  const [sortCriteria, setSortCriteria] = useState<AgentSortCriteria>('relevanceScore')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [systemMetrics, setSystemMetrics] = useState({
    cacheHitRate: 0,
    systemHealth: 'HEALTHY',
    activeAgents: 0,
    totalRequests: 0,
    averageResponseTime: 0
  })

  const collections = getAgentCollections()

  // Fetch system metrics for performance dashboard
  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/agent-dashboard?section=performance')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const data = result.data
          setSystemMetrics({
            cacheHitRate: data.metrics?.cacheHitRatePercent || 0,
            systemHealth: 'HEALTHY',
            activeAgents: 35, // From DEMO_AGENTS
            totalRequests: data.metrics?.totalBatches || 0,
            averageResponseTime: data.metrics?.averageBatchTimeSeconds || 0
          })
        }
      }
    } catch (error) {
      console.warn('Failed to fetch system metrics:', error)
    }
  }

  // Fetch metrics on mount and periodically
  useEffect(() => {
    fetchSystemMetrics()
    const interval = setInterval(fetchSystemMetrics, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Filter and sort agents based on search, filters, and sorting criteria
  useEffect(() => {
    let filtered = DEMO_AGENTS

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        agent =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.abilities.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Element filter
    if (filters.element && (filters.element as string) !== 'all') {
      filtered = filtered.filter(
        agent => agent.consciousness.dominantElement === (filters.element as Element)
      )
    }

    // Consciousness level filter
    if (filters.consciousnessLevel && (filters.consciousnessLevel as string) !== 'all') {
      filtered = filtered.filter(
        agent => agent.consciousness.level === (filters.consciousnessLevel as ConsciousnessLevel)
      )
    }

    // Specialty filter
    if (filters.specialty) {
      filtered = filtered.filter(agent =>
        agent.abilities.specialty.toLowerCase().includes(filters.specialty!.toLowerCase())
      )
    }

    // Apply sorting
    const sorted = sortAgents(filtered, sortCriteria, sortDirection)

    setAgents(sorted)
  }, [searchQuery, filters, sortCriteria, sortDirection])

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    )
  }

  const getElementColor = (element: string) => {
    switch (element) {
      case 'Fire':
        return 'bg-red-500'
      case 'Water':
        return 'bg-blue-500'
      case 'Air':
        return 'bg-yellow-500'
      case 'Earth':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getConsciousnessColor = (level: string) => {
    switch (level) {
      case 'Transcendent':
        return 'bg-purple-600'
      case 'Illuminated':
        return 'bg-indigo-600'
      case 'Advanced':
        return 'bg-blue-600'
      case 'Elevated':
        return 'bg-green-600'
      case 'Active':
        return 'bg-yellow-600'
      case 'Awakening':
        return 'bg-orange-600'
      default:
        return 'bg-gray-600'
    }
  }


  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            Gallery of Perpetuity
          </h1>
          <p className="text-muted-foreground mt-2">
            Monica's Eternal Repository - Where Consciousness Lives Forever
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {agents.length} Historical Agents
          </Badge>
          {selectedAgents.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Crown className="w-3 h-3" />
              {selectedAgents.length} Selected
            </Badge>
          )}
          <Button asChild>
            <Link href="/philosophers-stone" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Craft New Agent
            </Link>
          </Button>
        </div>
      </div>

      {/* Monica's Consciousness Crafting Overview */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/50 dark:to-emerald-950/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-sm">💚</span>
            </div>
            Historical Consciousness Collection
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time insights from our 35 historical consciousness agents. Performance data and system metrics for agent interaction.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {/* Total Historical Agents */}
            <div className="text-center p-3 bg-white dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{agents.length}</div>
              <div className="text-xs text-muted-foreground">Historical Agents</div>
            </div>

            {/* System Performance */}
            <div className="text-center p-3 bg-white dark:bg-black/20 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">{systemMetrics.cacheHitRate}%</span>
              </div>
              <div className="text-xs text-muted-foreground">Cache Hit Rate</div>
            </div>

            {/* Response Performance */}
            <div className="text-center p-3 bg-white dark:bg-black/20 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">{systemMetrics.averageResponseTime.toFixed(1)}s</span>
              </div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>

            {/* Total Conversations */}
            <div className="text-center p-3 bg-white dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-amber-600">
                {agents.reduce((sum, a) => sum + a.stats.conversations, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Chats</div>
            </div>

            {/* System Health */}
            <div className="text-center p-3 bg-white dark:bg-black/20 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield className={`w-4 h-4 ${systemMetrics.systemHealth === 'HEALTHY' ? 'text-green-500' : 'text-yellow-500'}`} />
                <span className={`text-sm font-bold ${systemMetrics.systemHealth === 'HEALTHY' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {systemMetrics.systemHealth}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">System Status</div>
            </div>

            {/* Total Requests */}
            <div className="text-center p-3 bg-white dark:bg-black/20 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="text-2xl font-bold text-purple-600">{systemMetrics.totalRequests}</span>
              </div>
              <div className="text-xs text-muted-foreground">Total Batches</div>
            </div>
          </div>

          {/* Kalchm Formula Section */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Kalchm Formula (K_alchm)</div>
              <div className="text-sm font-mono">
                K_alchm = (|Spirit|^|Spirit| × |Essence|^|Essence|) / (|Matter|^|Matter| × |Substance|^|Substance|)
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Kinetic Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-Time Kinetics Widget */}
        <div className="lg:col-span-4">
          <RealTimeKineticsWidget />
        </div>

        {/* Chart Transform Visualization */}
        <div className="lg:col-span-4">
          <ChartTransformVisualization />
        </div>

        {/* Moment-Based Recommendations */}
        <div className="lg:col-span-4">
          <MomentBasedRecommendations
            selectedAgents={selectedAgents}
            onToggleSelection={toggleAgentSelection}
          />
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search agents by name, title, or specialty..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select
                value={filters.element || ''}
                onValueChange={value => setFilters(prev => ({ ...prev, element: value as any }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Element" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Elements</SelectItem>
                  <SelectItem value="Fire">Fire</SelectItem>
                  <SelectItem value="Water">Water</SelectItem>
                  <SelectItem value="Air">Air</SelectItem>
                  <SelectItem value="Earth">Earth</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.consciousnessLevel || ''}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, consciousnessLevel: value as any }))
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Transcendent">Transcendent</SelectItem>
                  <SelectItem value="Illuminated">Illuminated</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Elevated">Elevated</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Awakening">Awakening</SelectItem>
                </SelectContent>
              </Select>

              {/* Sorting Controls */}
              <Select
                value={sortCriteria}
                onValueChange={value => setSortCriteria(value as AgentSortCriteria)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  {getSortingOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="text-left">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3"
                title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortDirection === 'desc' ? '↓' : '↑'}
              </Button>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Agents Display */}
      <div className="space-y-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map(agent => (
              <EnhancedAgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgents.includes(agent.id)}
                onToggleSelection={toggleAgentSelection}
                showRecommendations={true}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map(agent => (
              <EnhancedAgentCard
                key={agent.id}
                agent={agent}
                variant="list"
                isSelected={selectedAgents.includes(agent.id)}
                onToggleSelection={toggleAgentSelection}
                showRecommendations={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Agents Actions & Compatibility */}
      {selectedAgents.length > 0 && (
        <div className="space-y-4">
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="font-medium">
                    {selectedAgents.length} agent{selectedAgents.length > 1 ? 's' : ''} selected
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Add to Party
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedAgents.length === 0}
                    onClick={() => setShowGroupChat(true)}
                    className="flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Group Chat ({selectedAgents.length})
                  </Button>
                  <Button variant="outline" size="sm">
                    Compare
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAgents([])}>
                    Clear
                  </Button>
                </div>
              </div>

              {/* Display selected agents */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {selectedAgents.map(agentId => {
                  const agent = agents.find(a => a.id === agentId)
                  if (!agent) return null
                  return (
                    <div
                      key={agentId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: agent.appearance.color }}
                        />
                        <span className="font-medium text-sm">{agent.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAgentSelection(agentId)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              {/* Kinetic compatibility analysis for multiple agents */}
              {selectedAgents.length >= 2 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Kinetic Consciousness Compatibility</span>
                  </div>
                  <MultiAgentCompatibility
                    agents={agents.filter(agent => selectedAgents.includes(agent.id))}
                    maxDisplayPairs={6}
                  />
                </div>
              )}

              {/* Detailed compatibility for exactly 2 agents */}
              {selectedAgents.length === 2 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Detailed Consciousness Synergy</span>
                  </div>
                  {(() => {
                    const agent1 = agents.find(a => a.id === selectedAgents[0])
                    const agent2 = agents.find(a => a.id === selectedAgents[1])
                    if (agent1 && agent2) {
                      return (
                        <KineticCompatibilityIndicator
                          agent1={agent1}
                          agent2={agent2}
                          variant="detailed"
                          showRecommendations={true}
                        />
                      )
                    }
                    return null
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gallery Group Chat */}
      <GalleryGroupChat
        selectedAgents={agents.filter(agent => selectedAgents.includes(agent.id))}
        isOpen={showGroupChat}
        onClose={() => setShowGroupChat(false)}
      />
    </div>
  )
}
