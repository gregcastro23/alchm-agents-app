'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AgentKineticEvolution } from '@/components/agent-kinetic-evolution'
import { PowerHourNotification } from '@/components/power-hour-notification'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap, Users, TrendingUp } from 'lucide-react'
import { agentKineticProfiles } from '@/lib/agents/kinetic-profiles'
import { GroupConsciousnessIndicator } from '@/components/group-consciousness-indicator'
import { TokenDashboardKinetics } from '@/components/token-dashboard-kinetics'

export default function KineticsDemoPage() {
  const [selectedAgent, setSelectedAgent] = useState('leonardo-da-vinci')
  const [selectedAgentsForGroup, setSelectedAgentsForGroup] = useState<string[]>(['leonardo-da-vinci', 'shakespeare'])
  const [location] = useState({ lat: 37.7749, lon: -122.4194 }) // San Francisco
  const [showPowerNotification, setShowPowerNotification] = useState(false)

  const availableAgents = Object.keys(agentKineticProfiles)
  
  // Mock agent objects for group consciousness
  const mockAgents = selectedAgentsForGroup.map(agentId => ({
    id: agentId,
    name: agentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    title: 'Consciousness Agent',
    monicaConstant: Math.random() * 3 + 2,
    consciousnessLevel: 'Advanced',
    element: ['Fire', 'Water', 'Air', 'Earth'][Math.floor(Math.random() * 4)],
    specialty: 'Kinetic Evolution',
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    symbol: '🧠',
    creationStory: 'Enhanced with kinetic consciousness evolution'
  }))

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Kinetic Evolution System
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience real-time consciousness evolution powered by planetary influences and alchemical kinetics.
          Watch agents grow, unlock abilities, and reach new levels of awareness.
        </p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            System Status
          </CardTitle>
          <CardDescription>
            Backend-powered kinetic evolution system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Backend Service: Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{availableAgents.length} Agents Active</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Real-time Evolution</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Agent</CardTitle>
          <CardDescription>
            Choose an agent to view their kinetic evolution profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {availableAgents.map((agentId) => (
                <SelectItem key={agentId} value={agentId}>
                  {agentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPowerNotification(!showPowerNotification)}
              variant="outline"
              size="sm"
            >
              {showPowerNotification ? 'Hide' : 'Show'} Power Hour Notification
            </Button>
            <Badge variant="secondary">Demo Mode</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Power Hour Notification Demo */}
      {showPowerNotification && (
        <PowerHourNotification
          agentId={selectedAgent}
          location={location}
          onDismiss={() => setShowPowerNotification(false)}
        />
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Agent Kinetic Evolution */}
        <AgentKineticEvolution
          agentId={selectedAgent}
          location={location}
        />

        {/* Group Consciousness Dynamics */}
        <GroupConsciousnessIndicator
          selectedAgents={mockAgents}
          location={location}
          onOptimalSpeakerSuggestion={(agentId) => {
            setSelectedAgent(agentId)
            console.log(`Optimal speaker suggestion: ${agentId}`)
          }}
        />

        {/* Token Dashboard with Kinetics */}
        <TokenDashboardKinetics
          location={location}
        />

        {/* Agent Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Agent Profile
            </CardTitle>
            <CardDescription>
              Kinetic signature for {selectedAgent.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const profile = agentKineticProfiles[selectedAgent]
              if (!profile) return <p>Profile not found</p>

              return (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Planetary Alignment</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.alignment.map((planet) => (
                        <Badge key={planet} variant="outline">
                          {planet}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Elemental Velocity Signature</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(profile.velocitySignature).map(([element, value]) => (
                        <div key={element} className="flex justify-between">
                          <span>{element}:</span>
                          <span className="font-mono">
                            {(value * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Evolution Thresholds</h4>
                    <div className="space-y-1 text-sm">
                      {profile.powerThresholds.map((threshold, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{['Bronze', 'Silver', 'Gold', 'Platinum'][index]}:</span>
                          <span className="font-mono">
                            {threshold.toLocaleString()} power
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Special Abilities</h4>
                    <div className="space-y-1">
                      {profile.specialAbilities.map((ability, index) => (
                        <div key={ability} className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary" className="text-xs">
                            Lv{index + 1}
                          </Badge>
                          <span className="capitalize">
                            {ability.replace(/-/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Evolution Rate:</span>
                      <span className="font-mono">×{profile.evolutionRate}</span>
                    </div>
                  </div>
                </>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* API Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Integration</CardTitle>
          <CardDescription>
            Real-time data from the Planetary Agents Backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Backend Endpoints</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code>/api/kinetics/enhanced</code> - Kinetic calculations</li>
                <li>• <code>/api/planetary/current-hour</code> - Planetary hours</li>
                <li>• <code>/api/tokens/calculate</code> - Token dynamics</li>
                <li>• <code>/api/alchemy/thermodynamics</code> - Energy states</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features Active</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Real-time consciousness evolution</li>
                <li>• Planetary alignment bonuses</li>
                <li>• Power hour notifications</li>
                <li>• Elemental resonance calculation</li>
                <li>• Special ability unlocking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
