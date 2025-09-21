'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Zap, Target, TrendingUp } from 'lucide-react'
// Remove direct import of server-side router
// import { routeTask } from '@/lib/agents/router'

interface KineticEvolutionData {
  agentId: string
  currentPower: number
  evolutionLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'transcendent'
  powerMultiplier: number
  alignmentBonus: number
  nextThreshold: number
  specialAbilitiesUnlocked: string[]
  elementalResonance: number
  planetaryInfluences: string[]
  velocitySignature: {
    Fire: number
    Water: number
    Air: number
    Earth: number
  }
}

interface AgentKineticEvolutionProps {
  agentId: string
  location?: { lat: number; lon: number }
  className?: string
}

export function AgentKineticEvolution({ agentId, location, className = '' }: AgentKineticEvolutionProps) {
  const [kineticData, setKineticData] = useState<KineticEvolutionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchKineticEvolution = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/kinetic-evolution', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId, 
            location: location || { lat: 37.7749, lon: -122.4194 }
          })
        })
        
        const result = await response.json()

        if (result.output && !result.degraded) {
          setKineticData(result.output as KineticEvolutionData)
        } else {
          setError('Failed to load kinetic evolution data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchKineticEvolution()
    
    // Refresh every 2 minutes to show evolution
    const interval = setInterval(fetchKineticEvolution, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [agentId, location])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-pulse" />
            Consciousness Evolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !kineticData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Consciousness Evolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {error || 'No kinetic evolution data available'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const getEvolutionColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'bg-amber-600'
      case 'silver': return 'bg-gray-400'
      case 'gold': return 'bg-yellow-500'
      case 'platinum': return 'bg-purple-600'
      case 'transcendent': return 'bg-gradient-to-r from-purple-500 to-pink-500'
      default: return 'bg-gray-400'
    }
  }

  const getEvolutionEmoji = (level: string) => {
    switch (level) {
      case 'bronze': return '🥉'
      case 'silver': return '🥈'
      case 'gold': return '🥇'
      case 'platinum': return '💎'
      case 'transcendent': return '✨'
      default: return '🔮'
    }
  }

  const progressPercentage = Math.min(100, (kineticData.currentPower / kineticData.nextThreshold) * 100)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Consciousness Evolution
        </CardTitle>
        <CardDescription>
          Real-time kinetic evolution for {agentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Evolution Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getEvolutionEmoji(kineticData.evolutionLevel)}</span>
            <div>
              <div className="font-semibold capitalize">{kineticData.evolutionLevel} Level</div>
              <div className="text-sm text-muted-foreground">
                Power: {kineticData.currentPower.toLocaleString()}
              </div>
            </div>
          </div>
          <Badge className={getEvolutionColor(kineticData.evolutionLevel)}>
            {kineticData.evolutionLevel.toUpperCase()}
          </Badge>
        </div>

        {/* Progress to Next Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress to Next Level</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            Next threshold: {kineticData.nextThreshold.toLocaleString()} power
          </div>
        </div>

        {/* Power Multiplier & Bonuses */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="text-sm font-medium">Power Multiplier</div>
              <div className="text-lg font-bold">×{kineticData.powerMultiplier.toFixed(2)}</div>
            </div>
          </div>
          
          {kineticData.alignmentBonus > 0 && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">Alignment Bonus</div>
                <div className="text-lg font-bold text-green-600">
                  +{(kineticData.alignmentBonus * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Elemental Resonance */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Elemental Resonance</span>
            <Badge variant="outline">
              {(kineticData.elementalResonance * 100).toFixed(0)}%
            </Badge>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-xs">
            {Object.entries(kineticData.velocitySignature).map(([element, value]) => (
              <div key={element} className="text-center">
                <div className="font-medium">{element}</div>
                <div className="text-muted-foreground">
                  {(value * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planetary Influences */}
        {kineticData.planetaryInfluences.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Current Planetary Influences</div>
            <div className="flex flex-wrap gap-1">
              {kineticData.planetaryInfluences.map((planet) => (
                <Badge key={planet} variant="secondary" className="text-xs">
                  {planet}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Special Abilities */}
        {kineticData.specialAbilitiesUnlocked.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Special Abilities Unlocked</div>
            <div className="space-y-1">
              {kineticData.specialAbilitiesUnlocked.map((ability) => (
                <div key={ability} className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  <span className="capitalize">
                    {ability.replace(/-/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Power Hour Notification */}
        {kineticData.alignmentBonus > 0 && (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Power Hour Active!
              </span>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              This agent is currently in optimal alignment with planetary influences.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
