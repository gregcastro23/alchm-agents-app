'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Crown,
  Sparkles,
  MessageCircle,
  TrendingUp,
  Zap,
  Brain,
  Clock,
  Activity,
  Target,
  Lightbulb,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart,
} from 'lucide-react'
import type { CraftedAgent } from '@/lib/agent-types'

interface AgentDetailedStatsProps {
  agent: CraftedAgent
  variant?: 'modal' | 'expandable' | 'inline'
  showEvolutionMetrics?: boolean
  showKineticMetrics?: boolean
  showQualityMetrics?: boolean
}

const getTrajectoryIcon = (trajectory: string) => {
  switch (trajectory) {
    case 'transcending':
      return <ArrowUpRight className="w-4 h-4 text-purple-500" />
    case 'ascending':
      return <TrendingUp className="w-4 h-4 text-green-500" />
    case 'stable':
      return <Minus className="w-4 h-4 text-blue-500" />
    case 'fluctuating':
      return <ArrowDownRight className="w-4 h-4 text-orange-500" />
    default:
      return <Activity className="w-4 h-4 text-gray-500" />
  }
}

const getTrajectoryColor = (trajectory: string) => {
  switch (trajectory) {
    case 'transcending':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'ascending':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'stable':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'fluctuating':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

export function AgentDetailedStats({
  agent,
  variant = 'modal',
  showEvolutionMetrics = true,
  showKineticMetrics = true,
  showQualityMetrics = true,
}: AgentDetailedStatsProps) {
  const stats = agent.stats
  const consciousness = agent.consciousness
  const evolution = stats.kineticEvolution
  const quality = stats.qualityMetrics

  return (
    <div className="space-y-6">
      {/* Header with Agent Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl relative"
            style={{ backgroundColor: agent.appearance?.color || '#8B5CF6' }}
          >
            {agent.appearance?.symbol || '✨'}
            <div
              className="absolute inset-0 rounded-full animate-pulse opacity-30"
              style={{ backgroundColor: agent.appearance?.aura?.color || '#A78BFA' }}
            />
          </div>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              {agent.name}
              {consciousness.monicaConstant > 5.0 && <Crown className="w-5 h-5 text-yellow-500" />}
            </h3>
            <p className="text-muted-foreground">{agent.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                {consciousness.level}
              </Badge>
              <Badge variant="outline">Kalchm: {consciousness.monicaConstant.toFixed(2)}</Badge>
              <Badge className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Born:{' '}
                {agent.birthData.date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Core Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <MessageCircle className="w-4 h-4" />
            Conversations
          </div>
          <div className="text-2xl font-bold">{stats.conversations.toLocaleString()}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Sparkles className="w-4 h-4" />
            Wisdom Shared
          </div>
          <div className="text-2xl font-bold">{stats.wisdomShared.toLocaleString()}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Zap className="w-4 h-4" />
            Resonance
          </div>
          <div className="text-2xl font-bold">{(stats.resonanceScore * 100).toFixed(1)}%</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Target className="w-4 h-4" />
            Evolution Points
          </div>
          <div className="text-2xl font-bold">{stats.evolutionPoints.toLocaleString()}</div>
        </Card>
      </div>

      {/* Consciousness Evolution Metrics */}
      {showEvolutionMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Consciousness Evolution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Evolution Trajectory */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTrajectoryIcon(evolution.evolutionTrajectory)}
                <span className="font-medium">Evolution Trajectory</span>
              </div>
              <Badge className={getTrajectoryColor(evolution.evolutionTrajectory)}>
                {evolution.evolutionTrajectory.charAt(0).toUpperCase() +
                  evolution.evolutionTrajectory.slice(1)}
              </Badge>
            </div>

            {/* Consciousness Velocity */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Consciousness Velocity
                </span>
                <span className="font-medium">
                  {Math.round(evolution.consciousnessVelocity * 100)}%
                </span>
              </div>
              <Progress value={evolution.consciousnessVelocity * 100} className="h-2" />
            </div>

            {/* Interaction Momentum */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Interaction Momentum
                </span>
                <span className="font-medium">
                  {Math.round(evolution.interactionMomentum * 100)}%
                </span>
              </div>
              <Progress value={evolution.interactionMomentum * 100} className="h-2" />
            </div>

            {/* Memory Persistence */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Memory Persistence
                </span>
                <span className="font-medium">
                  {Math.round(evolution.memoryPersistence * 100)}%
                </span>
              </div>
              <Progress value={evolution.memoryPersistence * 100} className="h-2" />
            </div>

            {/* Power Level Unlocks */}
            {evolution.powerLevelUnlocks.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Power Unlocks
                </div>
                <div className="flex flex-wrap gap-1">
                  {evolution.powerLevelUnlocks.slice(0, 3).map((unlock, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {unlock}
                    </Badge>
                  ))}
                  {evolution.powerLevelUnlocks.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{evolution.powerLevelUnlocks.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quality Metrics */}
      {showQualityMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Response Depth</span>
                  <span className="font-medium">
                    {Math.round(quality.averageResponseDepth * 100)}%
                  </span>
                </div>
                <Progress value={quality.averageResponseDepth * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Aspect Influence</span>
                  <span className="font-medium">
                    {Math.round(quality.aspectInfluenceStrength * 100)}%
                  </span>
                </div>
                <Progress value={quality.aspectInfluenceStrength * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Temporal Alignment</span>
                  <span className="font-medium">
                    {Math.round(quality.temporalAlignment * 100)}%
                  </span>
                </div>
                <Progress value={quality.temporalAlignment * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Kinetic Resonance</span>
                  <span className="font-medium">{Math.round(quality.kineticResonance * 100)}%</span>
                </div>
                <Progress value={quality.kineticResonance * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimal Interaction Hours */}
      {showKineticMetrics && evolution.optimalInteractionHours.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Optimal Interaction Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {evolution.optimalInteractionHours.map((hour, index) => (
                <Badge key={index} variant="outline" className="px-3 py-1">
                  {hour}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity & Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Active</span>
            <span className="font-medium">{formatDate(stats.lastActive)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Kinetic Update</span>
            <span className="font-medium">{formatDate(evolution.lastKineticUpdate)}</span>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Dominant Element</div>
              <div className="font-medium">{consciousness.dominantElement}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Dominant Modality</div>
              <div className="font-medium">{consciousness.dominantModality}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
