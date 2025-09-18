"use client"

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentPlanetaryPositions } from '@/lib/calculate-transits'
import { getPlanetaryDignity } from '@/lib/astrological-data'

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
  const [positions, setPositions] = useState<Record<string, { sign: string; degree: string }>>({})
  const searchParams = useSearchParams()
  const router = useRouter()
  const agentId = searchParams.get('agent')

  useEffect(() => {
    if (agentId) {
      router.replace(`/gallery/chat/${agentId}`)
    }
  }, [agentId, router])

  useEffect(() => {
    // Load current planetary positions (cached by helper internally)
    const current = getCurrentPlanetaryPositions()
    setPositions(current)
  }, [])

  const cards = useMemo(() => {
    return ORDERED_PLANETS.map(planet => {
      const pos = positions[planet]
      const sign = pos?.sign || '—'
      const degreeStr = pos?.degree || '—'
      const degreeNum = degreeStr && degreeStr !== '—' ? Math.max(1, Math.min(29, Math.floor(parseFloat(degreeStr)))) : null
      const dignity = sign !== '—' ? getPlanetaryDignity(planet, sign) : 'peregrine'
      const dignityLabel = getDignityLabel(dignity)
      const href = degreeNum
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
                  <span>
                    {sign} {degreeNum}°
                  </span>
                ) : (
                  <span>Loading position…</span>
                )}
              </div>
              <div>
                <Badge variant="outline">{dignityLabel}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">Click to open degree-specific agent</div>
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
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Planetary Wisdom Agents</h1>
      <p className="text-center mb-8 max-w-2xl mx-auto">
        Select a planet to consult its consciousness at the current zodiac position. You’ll be taken
        to a dedicated degree-specific interface enriched with historical and temporal context.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{cards}</div>

      <div className="text-center text-xs text-muted-foreground mt-6">
        Positions are approximate based on current transit windows.
      </div>
    </div>
  )
}

export default function PlanetaryAgentsPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading...</div>}>
      <PlanetaryAgentsContent />
    </Suspense>
  )
}
