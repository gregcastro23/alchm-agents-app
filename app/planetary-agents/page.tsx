'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentPlanetaryPositions } from '@/lib/calculate-transits'
import { getPlanetaryDignity } from '@/lib/astrological-data'
import { MoonPhaseAgentChat } from '@/components/misc/moon-phase-agent-chat'
import UnifiedMultiAgentChat from '@/components/misc/unified-multi-agent-chat'
import { SiteNavigation } from '@/components/misc/site-navigation'
import { createDefaultPlanetaryConfigs } from '@/lib/planetary-config-helper'
import { PLANETARY_COUNCIL_PRESETS, type PlanetaryCouncilPreset } from '@/lib/council-presets'
import { Users, Moon as MoonIcon, Sparkles, Crown, Star, X } from 'lucide-react'

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '⛢',
  Neptune: '♆',
  Pluto: '♇',
}

const ORDERED_PLANETS = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
] as const

function getDignityLabel(dignity: string) {
  switch (dignity) {
    case 'domicile':
      return 'Domicile'
    case 'exaltation':
      return 'Exalted'
    case 'detriment':
      return 'Detriment'
    case 'fall':
      return 'Fall'
    default:
      return 'Peregrine'
  }
}

function PlanetaryAgentsContent() {
  const [positions, setPositions] = useState<Record<string, { sign: string; degree: number }>>({})
  const [showMoonChat, setShowMoonChat] = useState(false)
  const [showGroupChat, setShowGroupChat] = useState(false)
  const [showCouncilSelection, setShowCouncilSelection] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<PlanetaryCouncilPreset | null>(null)
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()
  const agentId = searchParams.get('agent')

  // Get planetary configs
  const planetaryConfigs = useMemo(() => createDefaultPlanetaryConfigs(), [])

  useEffect(() => {
    if (agentId) {
      router.replace(`/gallery/chat/${agentId}`)
    }
  }, [agentId, router])

  useEffect(() => {
    // Load current planetary positions once on mount
    // Planetary movements are slow - positions remain accurate for the session
    const current = getCurrentPlanetaryPositions(Date.now())
    setPositions(current)
  }, [])

  const cards = useMemo(() => {
    return ORDERED_PLANETS.map(planet => {
      const pos = positions[planet]
      const sign = pos?.sign || '—'
      const degreeVal: number | null = typeof pos?.degree === 'number' ? pos.degree : null
      const degreeNum = degreeVal !== null ? Math.max(0, Math.min(29, Math.round(degreeVal))) : null
      const dignity = sign !== '—' ? getPlanetaryDignity(planet, sign) : 'peregrine'
      const dignityLabel = getDignityLabel(dignity)
      const href = degreeNum !== null
        ? `/agents/${encodeURIComponent(planet)}/${encodeURIComponent(sign)}/${degreeNum}`
        : undefined

      return (
        <Link
          key={planet}
          href={href || '#'}
          aria-disabled={!href}
          className={!href ? 'pointer-events-none opacity-60' : ''}
        >
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardHeader className="text-center">
              <div className="text-4xl mb-2">{PLANET_SYMBOLS[planet]}</div>
              <CardTitle className="text-lg">{planet}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <div className="text-sm">
                {sign !== '—' && degreeNum !== null ? (
                  <span className="font-medium">
                    {sign} {degreeNum}°
                  </span>
                ) : (
                  <span className="text-muted-foreground">Loading position…</span>
                )}
              </div>
              <div>
                <Badge variant="outline">{dignityLabel}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Click to consult degree-specific agent
              </div>
            </CardContent>
          </Card>
        </Link>
      )
    })
  }, [positions])

  if (agentId) {
    return (
      <div className="container py-8 text-center">
        <p>Redirecting to agent chat...</p>
      </div>
    )
  }

  // Handle preset selection
  const handlePresetSelect = (preset: PlanetaryCouncilPreset) => {
    setSelectedPreset(preset)
    setSelectedPlanets(preset.planetaryAgentIds)
    setShowCouncilSelection(false)
    setShowGroupChat(true)
  }

  // Active planetary agent IDs
  const activePlanetIds = useMemo(() => {
    if (selectedPreset) {
      return selectedPreset.planetaryAgentIds
    }
    return selectedPlanets
  }, [selectedPreset, selectedPlanets])

  // Filter planetary configs to active agents
  const activePlanetaryConfigs = useMemo(() => {
    return planetaryConfigs.filter(config => activePlanetIds.includes(config.planet))
  }, [planetaryConfigs, activePlanetIds])

  return (
    <>
      <SiteNavigation />

      <div className="container py-8">
        <h1 className="text-3xl font-bold text-center mb-2">Planetary Wisdom Agents</h1>
        <p className="text-center mb-8 max-w-2xl mx-auto text-muted-foreground">
          Consult planetary consciousness at their current zodiac positions. Each planet offers unique wisdom based on their sign, degree, and dignity.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Button
            onClick={() => setShowMoonChat(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <MoonIcon className="w-4 h-4" />
            Moon Phase Oracle
          </Button>
          <Button
            onClick={() => setShowCouncilSelection(!showCouncilSelection)}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
          >
            <Users className="w-4 h-4" />
            {showCouncilSelection ? 'Hide Council Selection' : 'Select Planetary Council'}
          </Button>
        </div>

        {/* Council Selection Section - Nested on page */}
        {showCouncilSelection && (
          <Card className="mb-8 border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Choose Your Celestial Council
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLANETARY_COUNCIL_PRESETS.map(preset => (
                  <Card
                    key={preset.id}
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 border-2"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{preset.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {preset.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{preset.planetaryAgentIds.length}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{preset.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium">Focus:</span>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6">
                          {preset.astrological_focus}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {preset.planetCombination.map(planet => {
                          const symbol = PLANET_SYMBOLS[planet as keyof typeof PLANET_SYMBOLS] || ''
                          return (
                            <Badge key={planet} variant="outline" className="text-xs">
                              {symbol} {planet}
                            </Badge>
                          )
                        })}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Crown
                          className={`w-4 h-4 ${preset.includeMonica ? 'text-purple-500' : 'text-gray-300'}`}
                        />
                        <span className="text-sm">
                          {preset.includeMonica
                            ? `Monica as ${preset.monicaRole}`
                            : 'Pure planetary wisdom'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {preset.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planetary position cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{cards}</div>

        <div className="text-center text-xs text-muted-foreground mt-6">
          Current planetary positions calculated using Swiss Ephemeris. Positions remain accurate throughout your session.
        </div>
      </div>

      {/* Moon Phase Chat Modal */}
      {showMoonChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Moon Phase Oracle</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowMoonChat(false)}>
                ×
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <MoonPhaseAgentChat />
            </div>
          </div>
        </div>
      )}

      {/* Planetary Group Chat - Left side bubble like gallery */}
      <UnifiedMultiAgentChat
        isOpen={showGroupChat}
        onClose={() => setShowGroupChat(false)}
        title={selectedPreset ? selectedPreset.name : 'Planetary Council'}
        variant="planetary"
        historicalAgents={[]}
        planetaryConfigs={activePlanetaryConfigs}
        initialAgents={activePlanetIds}
        maxAgents={7}
        allowMonica={selectedPreset?.includeMonica || true}
        enableGroupDynamics={true}
        enableExport={true}
        enableAutoSync={true}
      />
    </>
  )
}

export default function PlanetaryAgentsPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading...</div>}>
      <PlanetaryAgentsContent />
    </Suspense>
  )
}
