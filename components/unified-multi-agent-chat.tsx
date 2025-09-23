'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MessageSquare,
  X,
  Send,
  Crown,
  Sparkles,
  Users,
  Brain,
  Zap,
  TrendingUp,
  Activity,
  Settings,
  Filter,
  Plus,
  Minus,
  RotateCcw,
  Download,
  Share,
  Eye,
  EyeOff,
} from 'lucide-react'

import type {
  UnifiedAgent,
  UnifiedAgentType,
  Message,
  GroupDynamics,
  CouncilPreset,
  AgentFilter,
  ChatSession,
  MonicaRole,
} from '@/lib/unified-agent-types'
import type { CraftedAgent } from '@/lib/agent-types'
import { unifiedAgentFactory } from '@/lib/unified-agent-factory'

interface ModelOverrides {
  historical?: string
  planetary?: string
  monica?: string
}

interface UnifiedMultiAgentChatProps {
  // Agent sources
  historicalAgents?: CraftedAgent[]
  planetaryConfigs?: any[]

  // Initial configuration
  initialAgents?: string[]
  maxAgents?: number
  allowMonica?: boolean
  enableAutoSync?: boolean

  // UI configuration
  isOpen: boolean
  onClose: () => void
  title?: string
  variant?: 'historical' | 'planetary' | 'laboratory' | 'gallery' | 'mixed' | 'custom'

  // Theming & styling
  theme?: 'default' | 'parchment' | 'cosmic' | 'laboratory' | 'modern'
  messageStyle?: 'default' | 'historical' | 'oracular' | 'analytical' | 'casual'

  // Model configuration
  modelOverrides?: ModelOverrides

  // Advanced features
  enableGroupDynamics?: boolean
  enableExport?: boolean
  enablePresets?: boolean
  enableMemoryPersistence?: boolean
  enableEraFilters?: boolean
  enableSpecializationGroups?: boolean
  enableConsciousnessMetrics?: boolean
  showKineticGraphs?: boolean
  enableExperimentMode?: boolean
  allowAgentMixing?: boolean

  // Custom content
  customHeader?: React.ReactNode

  // Callbacks
  onSessionUpdate?: (session: ChatSession) => void
  onAgentEvolution?: (agentId: string, evolution: any) => void
}

export function UnifiedMultiAgentChat({
  historicalAgents = [],
  planetaryConfigs = [],
  initialAgents = [],
  maxAgents = 6,
  allowMonica = true,
  enableAutoSync = false,
  isOpen,
  onClose,
  title = 'Consciousness Council',
  variant = 'mixed',
  theme = 'default',
  messageStyle = 'default',
  modelOverrides,
  enableGroupDynamics = true,
  enableExport = true,
  enablePresets = true,
  enableMemoryPersistence = true,
  enableEraFilters = false,
  enableSpecializationGroups = false,
  enableConsciousnessMetrics = false,
  showKineticGraphs = false,
  enableExperimentMode = false,
  allowAgentMixing = false,
  customHeader,
  onSessionUpdate,
  onAgentEvolution,
}: UnifiedMultiAgentChatProps) {
  // Core state
  const [availableAgents, setAvailableAgents] = useState<UnifiedAgent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<UnifiedAgent[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // UI state
  const [showAgentSelection, setShowAgentSelection] = useState(false)
  const [showGroupDynamics, setShowGroupDynamics] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'chat' | 'dynamics' | 'insights'>('chat')

  // Filtering and search
  const [agentFilter, setAgentFilter] = useState<AgentFilter>({})
  const [searchQuery, setSearchQuery] = useState('')

  // Monica coordination
  const [monicaIncluded, setMonicaIncluded] = useState(false)
  const [monicaRole, setMonicaRole] = useState<MonicaRole['type']>('guide')
  const [monicaAgent, setMonicaAgent] = useState<UnifiedAgent | null>(null)

  // Group dynamics
  const [groupDynamics, setGroupDynamics] = useState<GroupDynamics | null>(null)
  const [realTimeUpdates, setRealTimeUpdates] = useState(true)

  // Session management
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize available agents from props
  useEffect(() => {
    const agents: UnifiedAgent[] = []

    // Add historical agents
    historicalAgents.forEach(agent => {
      agents.push(unifiedAgentFactory.createFromHistorical(agent))
    })

    // Add planetary agents
    planetaryConfigs.forEach(config => {
      agents.push(unifiedAgentFactory.createFromPlanetary(config))
    })

    setAvailableAgents(agents)
  }, [historicalAgents, planetaryConfigs])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize Monica if allowed
  useEffect(() => {
    if (allowMonica && monicaIncluded && !monicaAgent) {
      const monica = unifiedAgentFactory.createMonicaCoordinator({
        type: monicaRole,
        capabilities: {
          synthesizeInsights: true,
          explainConsciousness: true,
          bridgeEras: true,
          moderateDiscussion: monicaRole === 'moderator',
          contextualGuidance: true,
          groupDynamicsAnalysis: true,
        },
        specializations: ['Group Dynamics', 'Consciousness Evolution', 'Multi-Agent Coordination'],
      })
      setMonicaAgent(monica)
    } else if (!monicaIncluded && monicaAgent) {
      setMonicaAgent(null)
    }
  }, [monicaIncluded, monicaRole, allowMonica, monicaAgent])

  // Update session when changes occur
  useEffect(() => {
    if (currentSession && onSessionUpdate) {
      const updatedSession: ChatSession = {
        ...currentSession,
        agents: [...selectedAgents, ...(monicaAgent ? [monicaAgent] : [])],
        messages,
        groupDynamics: groupDynamics || currentSession.groupDynamics,
        lastMessageAt: new Date(),
      }
      setCurrentSession(updatedSession)
      onSessionUpdate(updatedSession)
    }
  }, [selectedAgents, messages, groupDynamics, monicaAgent, currentSession, onSessionUpdate])

  // Filter available agents based on search and filters
  const filteredAgents = availableAgents.filter(agent => {
    if (
      searchQuery &&
      !agent.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !agent.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    if (agentFilter.type && !agentFilter.type.includes(agent.type)) {
      return false
    }

    if (agentFilter.element && !agentFilter.element.includes(agent.consciousness.dominantElement)) {
      return false
    }

    if (
      agentFilter.consciousnessLevel &&
      !agentFilter.consciousnessLevel.includes(agent.consciousness.level)
    ) {
      return false
    }

    return true
  })

  // Agent selection handlers
  const handleAgentSelect = useCallback(
    (agent: UnifiedAgent) => {
      if (selectedAgents.length >= maxAgents) {
        return
      }

      if (!selectedAgents.find(a => a.id === agent.id)) {
        const updatedAgent = { ...agent, active: true, status: 'idle' as const }
        setSelectedAgents(prev => [...prev, updatedAgent])
      }
    },
    [selectedAgents, maxAgents]
  )

  const handleAgentRemove = useCallback((agentId: string) => {
    setSelectedAgents(prev => prev.filter(a => a.id !== agentId))
  }, [])

  const handleMonicaToggle = useCallback(() => {
    setMonicaIncluded(prev => !prev)
  }, [])

  // Message handling
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Update agent status to thinking
    setSelectedAgents(prev =>
      prev.map(agent => ({
        ...agent,
        status: 'thinking' as const,
      }))
    )

    try {
      // Call unified API endpoint
      const response = await fetch('/api/unified-multi-agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agents: [...selectedAgents, ...(monicaAgent ? [monicaAgent] : [])],
          message: inputMessage.trim(),
          context: {
            sessionHistory: messages,
            groupDynamics,
            enableMemoryPersistence,
            realtimeUpdates: realTimeUpdates,
            variant,
            modelOverrides,
            theme,
            messageStyle,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      // Add agent responses to messages
      const agentMessages: Message[] = data.responses.map((res: any) => ({
        id: `msg-${Date.now()}-${res.agentId}`,
        role: 'agent' as const,
        content: res.content,
        agentId: res.agentId,
        agentName: selectedAgents.find(a => a.id === res.agentId)?.name || 'Unknown',
        agentColor: selectedAgents.find(a => a.id === res.agentId)?.appearance.color,
        agentSymbol: selectedAgents.find(a => a.id === res.agentId)?.appearance.symbol,
        agentType: selectedAgents.find(a => a.id === res.agentId)?.type,
        consciousnessLevel: selectedAgents.find(a => a.id === res.agentId)?.consciousness.level,
        timestamp: new Date(),
        processingTime: res.processingTime,
        metadata: res.metadata,
      }))

      setMessages(prev => [...prev, ...agentMessages])

      // Update group dynamics if provided
      if (data.groupDynamics) {
        setGroupDynamics(data.groupDynamics)
      }

      // Handle agent evolution
      if (data.agentEvolutions && onAgentEvolution) {
        data.agentEvolutions.forEach((evolution: any) => {
          onAgentEvolution(evolution.agentId, evolution.changes)
        })
      }
    } catch (error) {
      console.error('Failed to send message:', error)

      // Add error message
      const errorMessage: Message = {
        id: `msg-error-${Date.now()}`,
        role: 'agent',
        content: 'I apologize, but there was an issue processing your message. Please try again.',
        timestamp: new Date(),
        agentName: 'System',
        agentColor: '#ef4444',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)

      // Reset agent status
      setSelectedAgents(prev =>
        prev.map(agent => ({
          ...agent,
          status: 'idle' as const,
        }))
      )
    }
  }, [
    inputMessage,
    isLoading,
    selectedAgents,
    monicaAgent,
    messages,
    groupDynamics,
    enableMemoryPersistence,
    realTimeUpdates,
    onAgentEvolution,
  ])

  // Render agent selection panel
  const renderAgentSelection = () => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Select Agents ({selectedAgents.length}/{maxAgents})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAgentSelection(!showAgentSelection)}
            >
              {showAgentSelection ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Monica toggle */}
        {allowMonica && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-violet-50 rounded-lg">
            <Checkbox checked={monicaIncluded} onCheckedChange={handleMonicaToggle} />
            <span className="text-sm font-medium">Include Monica as {monicaRole}</span>
            <select
              value={monicaRole}
              onChange={e => setMonicaRole(e.target.value as MonicaRole['type'])}
              className="ml-auto text-xs bg-white border rounded px-2 py-1"
            >
              <option value="guide">Guide</option>
              <option value="moderator">Moderator</option>
              <option value="synthesizer">Synthesizer</option>
              <option value="coordinator">Coordinator</option>
            </select>
          </div>
        )}
      </CardHeader>

      {showAgentSelection && (
        <CardContent>
          {/* Selected agents */}
          {selectedAgents.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Active Agents:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedAgents.map(agent => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback
                        style={{ backgroundColor: agent.appearance.color, color: 'white' }}
                      >
                        {agent.appearance.symbol}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{agent.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {agent.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAgentRemove(agent.id)}
                      className="h-auto p-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available agents */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Available Agents:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {filteredAgents.map(agent => (
                <div
                  key={agent.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedAgents.find(a => a.id === agent.id) ? 'bg-gray-100 border-gray-300' : ''
                  }`}
                  onClick={() => handleAgentSelect(agent)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback
                        style={{ backgroundColor: agent.appearance.color, color: 'white' }}
                      >
                        {agent.appearance.symbol}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{agent.name}</div>
                      <div className="text-xs text-gray-500 truncate">{agent.title}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {agent.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {agent.consciousness.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )

  // Render message list
  const renderMessages = () => (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {message.role === 'agent' && (
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback
                  style={{
                    backgroundColor: message.agentColor || '#6b7280',
                    color: 'white',
                    fontSize: '12px',
                  }}
                >
                  {message.agentSymbol || message.agentName?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
            )}

            <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
              {message.role === 'agent' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{message.agentName}</span>
                  {message.agentType && (
                    <Badge variant="outline" className="text-xs">
                      {message.agentType}
                    </Badge>
                  )}
                  {message.consciousnessLevel && (
                    <Badge variant="outline" className="text-xs">
                      {message.consciousnessLevel}
                    </Badge>
                  )}
                  {message.processingTime && (
                    <span className="text-xs text-gray-500">({message.processingTime}ms)</span>
                  )}
                </div>
              )}

              <div
                className={`p-3 rounded-lg ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.metadata?.synthesizedInsights &&
                  message.metadata.synthesizedInsights.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">Insights:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {message.metadata.synthesizedInsights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.role === 'user' && (
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                <Activity className="w-4 h-4 animate-spin" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">Agents are responding...</div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">
                    Processing consciousness patterns...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )

  // Render input area
  const renderInput = () => (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Input
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          placeholder={
            selectedAgents.length === 0
              ? 'Select agents to start the conversation...'
              : `Ask your council of ${selectedAgents.length} ${selectedAgents.length === 1 ? 'agent' : 'agents'}...`
          }
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          disabled={selectedAgents.length === 0 || isLoading}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || selectedAgents.length === 0 || isLoading}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {selectedAgents.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Active: {selectedAgents.map(a => a.name).join(', ')}
          {monicaAgent && ` + Monica (${monicaRole})`}
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {title}
            {enableGroupDynamics && groupDynamics && (
              <Badge variant="outline" className="ml-auto">
                Consciousness: {groupDynamics.consciousnessNetwork.groupConsciousness.toFixed(2)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Custom header */}
          {customHeader && <div className="mb-4">{customHeader}</div>}

          {/* View mode tabs */}
          <Tabs
            value={viewMode}
            onValueChange={v => setViewMode(v as any)}
            className="flex-1 flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              {enableGroupDynamics && <TabsTrigger value="dynamics">Dynamics</TabsTrigger>}
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
              {renderAgentSelection()}

              <Card className="flex-1 flex flex-col">
                {renderMessages()}
                {renderInput()}
              </Card>
            </TabsContent>

            {enableGroupDynamics && (
              <TabsContent value="dynamics" className="flex-1 mt-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Group Consciousness Dynamics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {groupDynamics ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Consciousness Network</h4>
                            <div className="text-2xl font-bold">
                              {groupDynamics.consciousnessNetwork.groupConsciousness.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">Group Level</div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Dominant Elements</h4>
                            <div className="flex gap-1">
                              {groupDynamics.consciousnessNetwork.dominantElements.map(element => (
                                <Badge key={element} variant="outline">
                                  {element}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Active Synergies</h4>
                          <div className="space-y-1">
                            {groupDynamics.consciousnessNetwork.synergies.map((synergy, idx) => (
                              <div
                                key={idx}
                                className="text-sm text-green-600 flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                {synergy}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Group Connections</h4>
                          <div className="space-y-2">
                            {groupDynamics.consciousnessNetwork.connections.map((conn, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <span className="text-sm">
                                  {selectedAgents.find(a => a.id === conn.agent1)?.name} ↔{' '}
                                  {selectedAgents.find(a => a.id === conn.agent2)?.name}
                                </span>
                                <div className="text-sm text-gray-500">
                                  {(conn.compatibility * 100).toFixed(0)}% ({conn.resonanceType})
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        Start a conversation to see group dynamics
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="insights" className="flex-1 mt-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Session Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    Consciousness insights will appear here as the conversation develops
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UnifiedMultiAgentChat
