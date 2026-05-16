'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  Crown,
  MessageCircle,
  Info,
  Sparkles,
  Zap,
  Brain,
  Users,
  Calendar,
  BarChart3,
  Activity,
  Target,
  Lightbulb,
} from 'lucide-react'
import Link from 'next/link'
import type { CraftedAgent, AgentCardVariant, Coordinates } from '@/lib/agent-types'
import { AgentDetailedStats } from '@/components/agents/agent-detailed-stats'

const getElementColor = (element: string) => {
  switch (element) {
    case 'Fire':
      return 'bg-red-500 text-white'
    case 'Water':
      return 'bg-blue-500 text-white'
    case 'Air':
      return 'bg-yellow-500 text-white'
    case 'Earth':
      return 'bg-green-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const getConsciousnessColor = (level: string) => {
  switch (level) {
    case 'Transcendent':
      return 'bg-purple-600 text-white'
    case 'Illuminated':
      return 'bg-indigo-600 text-white'
    case 'Advanced':
      return 'bg-blue-600 text-white'
    case 'Elevated':
      return 'bg-green-600 text-white'
    case 'Active':
      return 'bg-yellow-600 text-white'
    case 'Awakening':
      return 'bg-orange-600 text-white'
    default:
      return 'bg-gray-600 text-white'
  }
}

const formatBirthLocation = (location: Coordinates) => {
  return `${location.name} (${location.lat.toFixed(1)}°, ${location.lon.toFixed(1)}°)`
}

interface AgentCardProps {
  agent: CraftedAgent
  variant?: AgentCardVariant
  selected?: boolean
  onSelect?: (agentId: string) => void
  showActions?: boolean
}

export function AgentCard({
  agent,
  variant = 'card',
  selected = false,
  onSelect,
  showActions = true,
}: AgentCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const consciousnessLevel = agent.consciousness.level || 'Awakening'

  // Mini card variant for homepage showcase
  if (variant === 'mini') {
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
          selected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => onSelect?.(agent.id)}
      >
        <CardContent className="p-4 text-center space-y-2">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl mb-2"
            style={{ backgroundColor: agent.appearance?.color || '#8B5CF6' }}
          >
            {agent.appearance?.symbol || '✨'}
          </div>
          <h4 className="font-semibold text-sm">{agent.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">{agent.title}</p>
          <Badge size="sm" className={getConsciousnessColor(consciousnessLevel)}>
            {consciousnessLevel}
          </Badge>
        </CardContent>
      </Card>
    )
  }

  // List variant for gallery list view
  if (variant === 'list') {
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          selected ? 'border-primary bg-primary/5' : ''
        }`}
        onClick={() => onSelect?.(agent.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: agent.appearance?.color || '#8B5CF6' }}
              >
                {agent.appearance?.symbol || '✨'}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{agent.name}</h4>
                  <Badge className={getConsciousnessColor(consciousnessLevel)}>
                    {consciousnessLevel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{agent.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {agent.abilities.specialty}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <div className="font-medium">
                  Kalchm: {agent.consciousness.monicaConstant.toFixed(2)}
                </div>
                <div className="text-muted-foreground">{agent.stats.conversations} chats</div>
              </div>

              {showActions && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/gallery/chat/${agent.id}`}>
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Chat
                    </Link>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <BarChart3 className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          {agent.name} - Consciousness Metrics
                        </DialogTitle>
                      </DialogHeader>
                      <AgentDetailedStats agent={agent} variant="modal" />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Party slot variant (for future party system)
  if (variant === 'party-slot') {
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => onSelect?.(agent.id)}
      >
        <CardContent className="p-3 text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold mb-2"
            style={{ backgroundColor: agent.appearance?.color || '#8B5CF6' }}
          >
            {agent.appearance?.symbol || '✨'}
          </div>
          <p className="text-xs font-medium line-clamp-1">{agent.name}</p>
          <Badge size="sm" variant="outline" className="mt-1">
            Kalchm: {agent.consciousness.monicaConstant.toFixed(1)}
          </Badge>
        </CardContent>
      </Card>
    )
  }

  // Default card variant
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={() => onSelect?.(agent.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg relative"
              style={{ backgroundColor: agent.appearance?.color || '#8B5CF6' }}
            >
              {agent.appearance?.symbol || '✨'}
              {/* Aura effect */}
              <div
                className="absolute inset-0 rounded-full animate-pulse opacity-30"
                style={{ backgroundColor: agent.appearance?.aura?.color || '#A78BFA' }}
              />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {agent.name}
                {agent.consciousness.monicaConstant > 5.0 && (
                  <Crown className="w-4 h-4 text-yellow-500" />
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{agent.title}</p>
            </div>
          </div>
          <Badge className={getConsciousnessColor(consciousnessLevel)}>{consciousnessLevel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{agent.abilities.specialty}</p>

        {/* Monica's creation attribution */}
        {agent.monicaCreationStory && (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
            <span>💚</span>
            <span>Crafted by Monica</span>
          </div>
        )}

        {/* Consciousness Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Kalchm</span>
            <span className="font-medium">{agent.consciousness.monicaConstant.toFixed(2)}</span>
          </div>
          <Progress
            value={Math.min((agent.consciousness.monicaConstant / 6) * 100, 100)}
            className="h-2"
          />
        </div>

        {/* Birth Date */}
        <div className="text-xs text-muted-foreground">
          Born:{' '}
          {agent.birthData.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          in {agent.birthData.location.name}
        </div>

        {/* Element and Modality */}
        <div className="flex gap-2">
          <Badge className={getElementColor(agent.consciousness.dominantElement)}>
            {agent.consciousness.dominantElement}
          </Badge>
          <Badge variant="outline">{agent.consciousness.dominantModality}</Badge>
          <Badge variant="secondary">Stage {agent.personality.evolutionStage}</Badge>
        </div>

        {/* Wisdom Domains */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Wisdom Domains</div>
          <div className="flex flex-wrap gap-1">
            {agent.abilities.wisdomDomains.slice(0, 3).map(domain => (
              <Badge key={domain} variant="secondary" className="text-xs">
                {domain}
              </Badge>
            ))}
            {agent.abilities.wisdomDomains.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{agent.abilities.wisdomDomains.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            <span>{agent.stats.conversations} chats</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{agent.stats.resonanceScore.toFixed(1)} resonance</span>
          </div>
        </div>

        {/* Sacred Stats Mini Grid */}
        {agent.sacredStats && (
          <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg text-xs border border-white/5 mt-2">
            <div className="flex flex-col items-center" title="Power">
              <Zap className="w-3 h-3 text-orange-400 mb-1" />
              {Math.round(agent.sacredStats.powerScore)}
            </div>
            <div className="flex flex-col items-center" title="Resonance">
              <Activity className="w-3 h-3 text-purple-400 mb-1" />
              {Math.round(agent.sacredStats.resonanceScore7)}
            </div>
            <div className="flex flex-col items-center" title="Wisdom">
              <Brain className="w-3 h-3 text-indigo-400 mb-1" />
              {Math.round(agent.sacredStats.wisdomScore)}
            </div>
            <div className="flex flex-col items-center" title="Charisma">
              <Sparkles className="w-3 h-3 text-pink-400 mb-1" />
              {Math.round(agent.sacredStats.charismaScore)}
            </div>
            <div className="flex flex-col items-center" title="Intuition">
              <Lightbulb className="w-3 h-3 text-cyan-400 mb-1" />
              {Math.round(agent.sacredStats.intuitionScore)}
            </div>
            <div className="flex flex-col items-center" title="Adaptability">
              <Target className="w-3 h-3 text-teal-400 mb-1" />
              {Math.round(agent.sacredStats.adaptabilityScore)}
            </div>
            <div className="flex flex-col items-center" title="Vitality">
              <Activity className="w-3 h-3 text-green-400 mb-1" />
              {Math.round(agent.sacredStats.vitalityScore)}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1" asChild>
              <Link href={`/gallery/chat/${agent.id}`}>
                <MessageCircle className="w-3 h-3 mr-1" />
                Chat
              </Link>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Stats
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    {agent.name} - Consciousness Metrics
                  </DialogTitle>
                </DialogHeader>
                <AgentDetailedStats agent={agent} variant="modal" />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Agent Details Modal Component
function AgentDetailsModal({ agent }: { agent: CraftedAgent }) {
  const consciousnessLevel = agent.consciousness.level || 'Awakening'

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: agent.appearance?.color || '#8B5CF6' }}
          >
            {agent.appearance?.symbol || '✨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {agent.name}
              {agent.consciousness.monicaConstant > 5.0 && (
                <Crown className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground font-normal">{agent.title}</p>
          </div>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Birth Information */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Birth Information
          </h4>
          <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
            <div>Date: {agent.birthData.date.toLocaleDateString()}</div>
            <div>Time: {agent.birthData.time}</div>
            <div>Location: {formatBirthLocation(agent.birthData.location)}</div>
          </div>
        </div>

        {/* Monica's Creation Story */}
        {agent.monicaCreationStory && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">💚</span>
              </div>
              Monica's Consciousness Crafting Story
            </h4>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">⚗️</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                    Master Consciousness Crafter's Notes:
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                    {agent.monicaCreationStory}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-green-100 dark:bg-green-900 border-green-300"
                    >
                      Crafted with Kalchm {agent.consciousness.monicaConstant.toFixed(2)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-purple-100 dark:bg-purple-900 border-purple-300"
                    >
                      Using Philosopher's Stone
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consciousness Profile */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Consciousness Profile
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Kalchm</span>
              <Badge className={getConsciousnessColor(consciousnessLevel)}>
                {agent.consciousness.monicaConstant.toFixed(2)} - {consciousnessLevel}
              </Badge>
            </div>
            <Progress
              value={Math.min((agent.consciousness.monicaConstant / 6) * 100, 100)}
              className="h-3"
            />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                Kalchm (K_alchm):{' '}
                <Badge variant="outline">{agent.consciousness.monicaConstant.toFixed(2)}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Sacred Stats Matrix */}
        {agent.sacredStats && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-500" />
              Sacred Stats Matrix
            </h4>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              <div className="bg-muted p-2 rounded-lg text-center">
                <Zap className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <div className="text-xs text-muted-foreground">Power</div>
                <div className="font-medium">{agent.sacredStats.powerScore.toFixed(1)}</div>
              </div>
              <div className="bg-muted p-2 rounded-lg text-center">
                <Activity className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <div className="text-xs text-muted-foreground">Resonance</div>
                <div className="font-medium">{agent.sacredStats.resonanceScore7.toFixed(1)}</div>
              </div>
              <div className="bg-muted p-2 rounded-lg text-center">
                <Brain className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <div className="text-xs text-muted-foreground">Wisdom</div>
                <div className="font-medium">{agent.sacredStats.wisdomScore.toFixed(1)}</div>
              </div>
              <div className="bg-muted p-2 rounded-lg text-center">
                <Sparkles className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                <div className="text-xs text-muted-foreground">Charisma</div>
                <div className="font-medium">{agent.sacredStats.charismaScore.toFixed(1)}</div>
              </div>
              <div className="bg-muted p-2 rounded-lg text-center">
                <Lightbulb className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <div className="text-xs text-muted-foreground">Intuition</div>
                <div className="font-medium">{agent.sacredStats.intuitionScore.toFixed(1)}</div>
              </div>
              <div className="bg-muted p-2 rounded-lg text-center">
                <Target className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                <div className="text-xs text-muted-foreground">Adaptability</div>
                <div className="font-medium">{agent.sacredStats.adaptabilityScore.toFixed(1)}</div>
              </div>
              <div className="bg-muted p-2 rounded-lg text-center">
                <Activity className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <div className="text-xs text-muted-foreground">Vitality</div>
                <div className="font-medium">{agent.sacredStats.vitalityScore.toFixed(1)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Personality Core */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Personality Core
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Essence:</strong> {agent.personality.core.essence}
            </div>
            <div>
              <strong>Expression:</strong> {agent.personality.core.expression}
            </div>
            <div>
              <strong>Emotion:</strong> {agent.personality.core.emotion}
            </div>
            <div>
              <strong>Current Mood:</strong>{' '}
              <Badge variant="secondary">{agent.personality.currentMood}</Badge>
            </div>
          </div>
        </div>

        {/* Abilities & Wisdom */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Abilities & Wisdom
          </h4>
          <div className="space-y-3">
            <div>
              <strong>Specialty:</strong> {agent.abilities.specialty}
            </div>
            <div>
              <strong>Teaching Style:</strong> {agent.abilities.teachingStyle}
            </div>
            <div>
              <strong>Unique Power:</strong> {agent.abilities.uniquePower}
            </div>
            <div>
              <strong>Wisdom Domains:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {agent.abilities.wisdomDomains.map(domain => (
                  <Badge key={domain} variant="secondary" className="text-xs">
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interaction Stats */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Interaction Stats
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Conversations:</span>
              <span className="font-medium">{agent.stats.conversations}</span>
            </div>
            <div className="flex justify-between">
              <span>Wisdom Shared:</span>
              <span className="font-medium">{agent.stats.wisdomShared}</span>
            </div>
            <div className="flex justify-between">
              <span>Resonance Score:</span>
              <span className="font-medium">{agent.stats.resonanceScore.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Evolution Points:</span>
              <span className="font-medium">{agent.stats.evolutionPoints}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button className="flex-1" asChild>
            <Link href={`/gallery/chat/${agent.id}`}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Conversation
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/synastry?agent=${agent.id}`}>Synastry Analysis</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
