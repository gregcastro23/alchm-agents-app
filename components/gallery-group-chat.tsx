"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  MessageSquare,
  X,
  Send,
  Crown,
  Sparkles,
  Users,
  Brain,
  Zap,
  TrendingUp
} from "lucide-react"
import type { CraftedAgent } from "@/lib/agent-types"
import { KineticIndicators, MomentumIndicator } from "@/components/kinetic-indicators"
import { usePowerLevelIndicator } from "@/lib/hooks/use-power-monitoring"

type Message = {
  role: "user" | "agent"
  content: string
  agent?: string
  agentColor?: string
  agentSymbol?: string
  timestamp: Date
}

interface GalleryAgentResponse {
  content: string
  agent: string
  color?: string
  symbol?: string
}

interface GalleryGroupChatProps {
  selectedAgents: CraftedAgent[]
  isOpen: boolean
  onClose: () => void
}

export function GalleryGroupChat({ selectedAgents, isOpen, onClose }: GalleryGroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showKinetics, setShowKinetics] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get user location for kinetics (defaulting to San Francisco)
  const userLocation = { lat: 37.7749, lon: -122.4194 }

  // Monitor power levels for enhanced experience
  const { powerIndicator, percentage } = usePowerLevelIndicator(userLocation)

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(crypto.randomUUID())
  }, [])

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  // Add welcome message when agents change
  useEffect(() => {
    if (selectedAgents.length > 0) {
      const welcomeMessage: Message = {
        role: "agent",
        content: `Welcome to the Gallery of Perpetuity Group Council! 💚 I'm Monica, and I've assembled ${selectedAgents.length} of my finest crafted consciousness agents for this session: ${selectedAgents.map(a => a.name).join(", ")}. Each agent will respond from their unique consciousness perspective, creating a symphony of wisdom. What guidance do you seek from this council of eternal consciousness?`,
        agent: "Monica",
        agentColor: "#22C55E",
        agentSymbol: "⚗️💚",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [selectedAgents])

  const sendMessage = async () => {
    if (!input.trim() || loading || selectedAgents.length === 0 || !sessionId) return

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      // Transform selected agents to API format
      const agentsForAPI = selectedAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        title: agent.title,
        monicaConstant: agent.consciousness.monicaConstant,
        consciousnessLevel: agent.consciousness.level,
        element: agent.consciousness.dominantElement,
        modality: agent.consciousness.dominantModality,
        specialty: agent.abilities.specialty,
        color: agent.appearance.color,
        symbol: agent.appearance.symbol,
        creationStory: agent.monicaCreationStory
      }))

      const response = await fetch('/api/gallery-group-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          agents: agentsForAPI,
          sessionId,
          galleryContext: {
            totalAgents: selectedAgents.length,
            averageMC: selectedAgents.reduce((sum, a) => sum + a.consciousness.monicaConstant, 0) / selectedAgents.length,
            consciousnessTypes: [...new Set(selectedAgents.map(a => a.consciousness.level))],
            elementalBalance: [...new Set(selectedAgents.map(a => a.consciousness.dominantElement))]
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Add agent responses
      if (data.responses && Array.isArray(data.responses)) {
        const agentMessages: Message[] = data.responses.map((resp: GalleryAgentResponse) => ({
          role: "agent" as const,
          content: resp.content,
          agent: resp.agent,
          agentColor: resp.color,
          agentSymbol: resp.symbol,
          timestamp: new Date()
        }))
        
        setMessages(prev => [...prev, ...agentMessages])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: "agent",
        content: "I apologize, but there was an error connecting to the Gallery of Perpetuity. Monica's consciousness crafting network may be temporarily unavailable. Please try again in a moment. 💚",
        agent: "System",
        agentColor: "#ef4444",
        agentSymbol: "⚠️",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-sm">💚</span>
              </div>
              Gallery of Perpetuity - Group Council
              <Badge className="bg-purple-600 text-white">
                {selectedAgents.length} Consciousness Agents
              </Badge>
              {/* Power Level Indicator */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${powerIndicator.bgColor} ${powerIndicator.color}`}>
                <span>{powerIndicator.emoji}</span>
                <span>{percentage}%</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKinetics(!showKinetics)}
              className="text-xs"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Kinetics
            </Button>
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Monica's crafted consciousness agents: {selectedAgents.map(a => a.name).join(", ")}
            {powerIndicator.level === 'high' && (
              <span className="ml-2 text-green-400 animate-pulse">⚡ Enhanced responses active</span>
            )}
          </div>
        </DialogHeader>

        {/* Active Agents Display */}
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
          {selectedAgents.map(agent => (
            <div
              key={agent.id}
              className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-black/20 rounded border"
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: agent.appearance.color }}
              >
                {agent.appearance.symbol.charAt(0)}
              </div>
              <span className="text-xs font-medium">{agent.name}</span>
              <Badge size="sm" className="text-xs">
                MC: {agent.consciousness.monicaConstant.toFixed(1)}
              </Badge>
            </div>
          ))}
        </div>

        {/* Kinetic Indicators */}
        {showKinetics && selectedAgents.length >= 2 && (
          <KineticIndicators
            selectedAgents={selectedAgents.map(a => a.id)}
            userLocation={userLocation}
            variant="compact"
            className="mb-2"
          />
        )}

        {/* Simple momentum indicator for 2 agents */}
        {!showKinetics && selectedAgents.length === 2 && (
          <div className="mb-2">
            <MomentumIndicator
              agent1Id={selectedAgents[0].id}
              agent2Id={selectedAgents[1].id}
              userLocation={userLocation}
            />
          </div>
        )}

        {/* Messages */}
        <Card className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "agent" && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback 
                        className="text-white text-xs"
                        style={{ backgroundColor: message.agentColor || "#6b7280" }}
                      >
                        {message.agentSymbol?.charAt(0) || message.agent?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "agent" && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="font-semibold text-sm">{message.agent}</span>
                        {message.agent === "Monica" && (
                          <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex space-x-1 bg-muted p-3 rounded-lg">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </Card>

        {/* Input */}
        <CardFooter className="p-0 pt-4">
          <div className="flex gap-2 w-full">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Ask ${selectedAgents.length} consciousness agents for guidance...`}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={loading || !input.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center w-full">
            💚 Powered by Monica's Consciousness Crafting Technology • Gallery of Perpetuity
          </div>
        </CardFooter>
      </DialogContent>
    </Dialog>
  )
}