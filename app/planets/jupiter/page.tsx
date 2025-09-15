'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HistoricalTransitCard } from '@/components/historical-transit-card'
import { getTransitsByPlanet, getCurrentTransits } from '@/lib/historical-transit-data'
import { identifyPlanetaryThemes } from '@/lib/transit-patterns'
import { getCurrentPlanetaryPositions } from '@/lib/calculate-transits'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Sparkles, Calendar, TrendingUp } from 'lucide-react'

export default function JupiterPage() {
  const [currentPosition, setCurrentPosition] = useState<{ sign: string; degree: string } | null>(
    null
  )
  const [jupiterTransits, setJupiterTransits] = useState<any[]>([])
  const [currentThemes, setCurrentThemes] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current Jupiter position
        const positions = getCurrentPlanetaryPositions()
        if (positions['Jupiter']) {
          setCurrentPosition(positions['Jupiter'])

          // Get themes for current position
          const themes = identifyPlanetaryThemes('Jupiter', positions['Jupiter'].sign)
          setCurrentThemes(themes)
        }

        // Get Jupiter's historical transits
        const transits = getTransitsByPlanet('Jupiter')
        setJupiterTransits(transits.slice(-10)) // Last 10 transits

        setLoading(false)
      } catch (error) {
        console.error('Error loading Jupiter data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading Jupiter's wisdom...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-full">
            <span className="text-3xl">♃</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold">Jupiter</h1>
            <p className="text-muted-foreground">Expansion, Wisdom & Higher Learning</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/planets/sun">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sun
            </Button>
          </Link>
          <Link href="/planets/moon">
            <Button variant="outline" size="sm">
              Moon
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {currentPosition && (
        <Card className="mb-6 border-blue-500/20 bg-blue-50/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Jupiter Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="default" className="text-lg py-1 px-3">
                {currentPosition.sign} {currentPosition.degree}°
              </Badge>
              <span className="text-sm text-muted-foreground">
                Jupiter expands consciousness through {currentPosition.sign}
              </span>
            </div>

            {currentThemes && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Current Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentThemes.themes?.slice(0, 4).map((theme: string) => (
                      <Badge key={theme} variant="outline">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Active Archetypes</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentThemes.archetypes?.slice(0, 3).map((archetype: string) => (
                      <Badge key={archetype} variant="secondary">
                        {archetype}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historical Jupiter Transits
              </CardTitle>
              <CardDescription>Jupiter's journey through the zodiac over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jupiterTransits.map((transit, index) => (
                  <HistoricalTransitCard
                    key={index}
                    transit={transit}
                    compact={true}
                    showProgress={true}
                    showEvents={true}
                    showThemes={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Jupiter Essentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cycle Length</p>
                <p className="font-semibold">12 years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Domicile Signs</p>
                <div className="flex gap-2">
                  <Badge variant="default">Sagittarius</Badge>
                  <Badge variant="default">Pisces</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Exaltation</p>
                <Badge variant="secondary">Cancer</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {['Expansion', 'Wisdom', 'Growth', 'Teaching', 'Philosophy'].map(keyword => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jupiter Returns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">Age 12</p>
                <p className="text-xs text-muted-foreground">First expansion of consciousness</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">Age 24</p>
                <p className="text-xs text-muted-foreground">Career and purpose clarification</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">Age 36</p>
                <p className="text-xs text-muted-foreground">Professional mastery phase</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">Age 48</p>
                <p className="text-xs text-muted-foreground">Wisdom teaching phase</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consult Jupiter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with Jupiter's expansive wisdom
              </p>
              <Button
                className="w-full"
                onClick={() =>
                  (window.location.href = `/agents/Jupiter/${encodeURIComponent(currentPosition?.sign || 'Sagittarius')}/15`)
                }
              >
                Chat with Jupiter Agent
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
