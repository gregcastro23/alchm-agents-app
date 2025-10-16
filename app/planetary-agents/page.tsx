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
import { PlanetaryWisdomChat } from '@/components/misc/planetary-wisdom-chat'
import { SiteNavigation } from '@/components/misc/site-navigation'
import { Users, Moon as MoonIcon } from 'lucide-react'

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
  const searchParams = useSearchParams()
  const router = useRouter()
  const agentId = searchParams.get('agent')

  useEffect(() => {
    if (agentId) {
      router.replace(`/gallery/chat/${agentId}`)
    }
  }, [agentId, router])

  useEffect(() => {
    // Load and periodically refresh current planetary positions
    const load = () => {
      const current = getCurrentPlanetaryPositions(Date.now()) // bypass cache to avoid stale positions
      setPositions(current)
    }
    load()
    const interval = setInterval(load, 60_000) // refresh every 60s
    return () => clearInterval(interval)
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
            onClick={() => setShowGroupChat(true)}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
          >
            <Users className="w-4 h-4" />
            Planetary Council Chat
          </Button>
        </div>

        {/* Planetary position cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{cards}</div>

        <div className="text-center text-xs text-muted-foreground mt-6">
          Real-time planetary positions update every 60 seconds. Positions are calculated using Swiss Ephemeris.
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

      {/* Planetary Group Chat */}
      <PlanetaryWisdomChat
        isOpen={showGroupChat}
        onClose={() => setShowGroupChat(false)}
        title="Planetary Council"
        maxAgents={7}
        allowMonica={true}
        enableAutoSync={true}
        showCurrentSkyChart={true}
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
