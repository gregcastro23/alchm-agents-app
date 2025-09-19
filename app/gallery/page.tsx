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

  const AgentCard = ({
    agent,
    variant = 'card',
  }: {
    agent: CraftedAgent
    variant?: 'card' | 'list'
  }) => {
    // Calculate sign vector for this agent
    let signVector = null
    try {
      if (agent.consciousness?.natalChart) {
        signVector = calculateSignVectorFromChart(agent.consciousness.natalChart)
      }
    } catch (error) {
      console.warn(`Failed to calculate sign vector for ${agent.name}:`, error)
    }

    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
          selectedAgents.includes(agent.id) ? 'border-primary shadow-lg' : 'border-border'
        }`}
        onClick={() => toggleAgentSelection(agent.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: agent.appearance.color }}
                >
                  {agent.appearance.symbol}
                </div>
                {/* Sign vector rune overlay */}
                {signVector && (
                  <div className="absolute -top-1 -right-1">
                    <SignVectorRune signVector={signVector} size={20} />
                  </div>
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{agent.title}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={getConsciousnessColor(agent.consciousness.level)}>
                {agent.consciousness.level}
              </Badge>
              {signVector && (
                <Button size="sm" variant="ghost" className="h-6 text-xs" asChild>
                  <Link href={`/api/sign-vectors?agentId=${agent.id}&action=agent-rune`}>
                    <Zap className="w-3 h-3 mr-1" />
                    Rune
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {agent.abilities.specialty}
            </p>

            <div className="flex flex-wrap gap-1">
              <Badge
                variant="outline"
                className={getElementColor(agent.consciousness.dominantElement)}
              >
                {agent.consciousness.dominantElement}
              </Badge>
              <Badge variant="outline">MC: {agent.consciousness.monicaConstant.toFixed(2)}</Badge>
              <Badge variant="outline">Stage {agent.personality?.evolutionStage ?? 0}</Badge>
            </div>

            <div className="flex flex-wrap gap-1 text-xs">
              {agent.abilities.wisdomDomains.slice(0, 3).map(domain => (
                <Badge key={domain} variant="secondary" className="text-xs">
                  {domain}
                </Badge>
              ))}
            </div>

            {/* Sign Vector Visualization - only show for selected agents or expanded view */}
            {signVector && selectedAgents.includes(agent.id) && (
              <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-purple-600">🔮</span>
                  <span className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                    Zodiacal Character Vector
                  </span>
                </div>
                <div className="flex justify-center">
                  <SignVectorGraphic
                    signVector={signVector}
                    size="small"
                    showLabels={true}
                    showTooltips={true}
                    animated={true}
                  />
                </div>
                <div className="mt-2 text-xs text-center text-muted-foreground">
                  Click to expand wheel visualization
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <div className="text-xs text-muted-foreground">
                {agent.stats.conversations} conversations
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/gallery/chat/${agent.id}`}>Chat with Agent</Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/philosophers-stone?template=${agent.id}`}>Remix Consciousness</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
            {agents.length} Agents
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
            Monica's Consciousness Crafting Overview
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time insights from Monica's crafting work. Rankings are shown using Kalchm (K_alchm). This is an informative dashboard, not a value judgment.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {/* Total Agents Crafted */}
            <div className="text-center p-3 bg-white dark:bg-black/20 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{agents.length}</div>
              <div className="text-xs text-muted-foreground">Agents Crafted</div>
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

          {/* Informational: Kalchm Context */}
          <div className="mt-4 bg-white dark:bg-black/20 p-4 rounded-lg border">
            <h4 className="font-semibold text-sm mb-2">About Kalchm (K_alchm)</h4>
            <p className="text-sm text-muted-foreground">
              Kalchm reflects elemental equilibrium dynamics. Higher absolute values indicate stronger dynamics. This metric is for understanding and exploration, not ranking worth.
            </p>
          </div>

          {/* Monica's Top Achievements */}
          <div className="mt-4 bg-gradient-to-r from-green-100 to-purple-100 dark:from-green-900 dark:to-purple-900 p-4 rounded-lg border">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              Top by Current Sort
            </h4>
            <div className="flex flex-wrap gap-2">
              {agents
                .slice(0, 3)
                .map(agent => (
                  <Badge
                    key={agent.id}
                    className="bg-white dark:bg-black/20 text-gray-700 dark:text-gray-300 border"
                  >
                    {agent.name}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Collections Tabs (Simplified: Monica & Crafted) */}
      <Tabs defaultValue="monica" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monica" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Monica (1)
          </TabsTrigger>
          <TabsTrigger value="crafted" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Crafted ({collections.all.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monica" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {collections.monica.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="crafted" className="space-y-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} variant="list" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
