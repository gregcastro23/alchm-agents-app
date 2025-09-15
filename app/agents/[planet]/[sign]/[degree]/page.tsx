'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { identifyPlanetaryThemes, findHistoricalPatterns } from '@/lib/transit-patterns'
import {
  findLastOccurrence,
  findNextOccurrence,
  getPlanetCycleLength,
} from '@/lib/historical-transits'
import { getTransitsByPlanet } from '@/lib/historical-transit-data'
import {
  DegreeSpecificHistoryService,
  type DegreeHistoricalData,
} from '@/lib/degree-specific-history'
import { HistoricalTransitCard } from '@/components/historical-transit-card'
import { getCurrentPlanetaryPositions } from '@/lib/calculate-transits'
import {
  getPlanetaryDignity,
  getSignElement,
  getPlanetaryElement,
  calculateElementalAffinity,
} from '@/lib/astrological-data'
import {
  ArrowLeft,
  Calendar,
  History,
  MessageCircle,
  Star,
  Clock,
  Globe,
  TrendingUp,
  Activity,
} from 'lucide-react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

export default function DegreeSpecificAgentPage() {
  const params = useParams()
  const planet = decodeURIComponent(params.planet as string)
  const sign = decodeURIComponent(params.sign as string)
  const degree = parseInt(params.degree as string)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historicalData, setHistoricalData] = useState<any>(null)
  const [planetaryThemes, setPlanetaryThemes] = useState<any>(null)
  const [degreeHistoricalData, setDegreeHistoricalData] = useState<DegreeHistoricalData | null>(
    null
  )
  const [currentTransitData, setCurrentTransitData] = useState<any>(null)
  const [recentTransits, setRecentTransits] = useState<any[]>([])

  useEffect(() => {
    loadHistoricalData()
    loadCurrentTransits()
  }, [planet, sign, degree])

  const loadHistoricalData = () => {
    // Load themes for this planet-sign combination
    const themes = identifyPlanetaryThemes(planet, sign)
    setPlanetaryThemes(themes)

    // Find historical patterns
    const patterns = findHistoricalPatterns(planet, sign)

    // Get last and next occurrences for this specific degree
    const lastOccurrence = findLastOccurrence(planet, sign, degree)
    const nextOccurrence = findNextOccurrence(planet, sign, degree)

    // Calculate more detailed transit information
    const cycleLength = getPlanetCycleLength(planet)
    const daysPerDegree = cycleLength / 360
    const approxDaysInSign = cycleLength / 12

    setHistoricalData({
      lastOccurrence,
      nextOccurrence,
      patterns: patterns.slice(0, 3),
      cycleLength,
      daysPerDegree: Math.round(daysPerDegree * 10) / 10,
      approxDaysInSign: Math.round(approxDaysInSign),
    })

    // Generate detailed degree-specific historical data for outer planets
    if (['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(planet)) {
      try {
        const degreeData = DegreeSpecificHistoryService.generateHistoricalData(planet, sign, degree)
        setDegreeHistoricalData(degreeData)
      } catch (error) {
        console.error('Error generating degree-specific history:', error)
      }
    }

    // Calculate recent transits for this degree
    calculateRecentTransits()
  }

  const loadCurrentTransits = () => {
    // Get current planetary positions
    const currentPositions = getCurrentPlanetaryPositions()
    const currentPlanetPosition = currentPositions[planet]

    if (currentPlanetPosition) {
      const currentDegree = parseFloat(currentPlanetPosition.degree)
      const degreeDifference = Math.abs(currentDegree - degree)
      const isCurrentlyAtDegree = currentPlanetPosition.sign === sign && degreeDifference < 1

      setCurrentTransitData({
        currentSign: currentPlanetPosition.sign,
        currentDegree: currentDegree,
        isAtRequestedPosition: isCurrentlyAtDegree,
        degreeDifference: degreeDifference,
        daysUntilReturn: calculateDaysUntilReturn(planet, sign, degree, currentPlanetPosition),
      })
    }
  }

  const calculateDaysUntilReturn = (
    planet: string,
    targetSign: string,
    targetDegree: number,
    currentPosition: any
  ) => {
    const cycleLength = getPlanetCycleLength(planet)
    const degreesPerDay = 360 / cycleLength

    // Calculate absolute positions
    const signOrder = [
      'Aries',
      'Taurus',
      'Gemini',
      'Cancer',
      'Leo',
      'Virgo',
      'Libra',
      'Scorpio',
      'Sagittarius',
      'Capricorn',
      'Aquarius',
      'Pisces',
    ]
    const currentSignIndex = signOrder.indexOf(currentPosition.sign)
    const targetSignIndex = signOrder.indexOf(targetSign)

    const currentAbsolute = currentSignIndex * 30 + parseFloat(currentPosition.degree)
    const targetAbsolute = targetSignIndex * 30 + targetDegree

    let degreesToTravel = targetAbsolute - currentAbsolute
    if (degreesToTravel <= 0) {
      degreesToTravel += 360 // Need to go around the zodiac
    }

    return Math.round(degreesToTravel / degreesPerDay)
  }

  const calculateRecentTransits = () => {
    const cycleLength = getPlanetCycleLength(planet)
    const now = new Date()
    const transits = []

    // Calculate last 3-5 times this planet was at this degree
    for (let i = 1; i <= 5; i++) {
      const daysAgo = cycleLength * i
      const transitDate = new Date(now)
      transitDate.setDate(transitDate.getDate() - daysAgo)

      // Calculate what historical events might have occurred
      const year = transitDate.getFullYear()
      let historicalContext = ''

      if (year >= 2020) {
        historicalContext = 'Recent modern history'
      } else if (year >= 2000) {
        historicalContext = 'Early 21st century'
      } else if (year >= 1980) {
        historicalContext = 'Late 20th century'
      } else if (year >= 1950) {
        historicalContext = 'Mid 20th century'
      } else if (year >= 1900) {
        historicalContext = 'Early 20th century'
      } else {
        historicalContext = 'Historical period'
      }

      transits.push({
        date: transitDate,
        cycleNumber: i,
        yearsAgo: Math.round(
          (now.getTime() - transitDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        ),
        historicalContext,
      })
    }

    setRecentTransits(transits)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/planetary-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planet,
          sign,
          degree: degree.toString(),
          question: input,
          time: '12:00',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const agentMessage: Message = {
          role: 'agent',
          content: data.response,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, agentMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'agent',
        content:
          'I apologize, but I encountered an error while channeling the cosmic wisdom. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const getPlanetEmoji = (planet: string): string => {
    const emojis: Record<string, string> = {
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
    return emojis[planet] || '●'
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/planetary-agents">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{getPlanetEmoji(planet)}</div>
            <div>
              <h1 className="text-3xl font-bold">
                {planet} at {degree}° {sign}
              </h1>
              <p className="text-muted-foreground">Degree-Specific Planetary Consciousness</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Consultation with {planet} at {degree}° {sign}
              </CardTitle>
              <CardDescription>
                Channel the wisdom of this specific planetary degree
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Chat Messages */}
              <div className="h-[500px] overflow-y-auto border rounded-lg p-4 mb-4 bg-muted/20">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">{getPlanetEmoji(planet)}</div>
                    <h3 className="text-lg font-semibold mb-2">
                      {planet} at {degree}° {sign}
                    </h3>
                    <p className="text-sm">
                      Ask this specific degree of planetary consciousness for guidance
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          message.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-secondary/10 mr-8'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-sm text-muted-foreground min-w-0">
                            {message.role === 'user' ? 'You' : `${planet} Agent`}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`Ask ${planet} at ${degree}° ${sign} for guidance...`}
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  {loading ? 'Channeling...' : 'Send'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Historical Information */}
        <div className="space-y-6">
          {/* Current Transit Status */}
          {currentTransitData && (
            <Card
              className={
                currentTransitData.isAtRequestedPosition ? 'border-green-500 border-2' : ''
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Current Transit Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentTransitData.isAtRequestedPosition ? (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      🎯 Currently Active!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      {planet} is currently at {currentTransitData.currentDegree.toFixed(2)}° {sign}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Position:</span>
                      <Badge variant="secondary">
                        {currentTransitData.currentDegree.toFixed(2)}°{' '}
                        {currentTransitData.currentSign}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Days Until Return:</span>
                      <Badge variant="outline">{currentTransitData.daysUntilReturn} days</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Approximately{' '}
                      {Math.round((currentTransitData.daysUntilReturn / 365.25) * 10) / 10} years
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Current Position Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Position Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Planet:</span>
                <Badge variant="default">{planet}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sign:</span>
                <Badge variant="secondary">{sign}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Degree:</span>
                <Badge variant="outline">{degree}°</Badge>
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dignity:</span>
                  <Badge variant="outline">{getPlanetaryDignity(planet, sign)}</Badge>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Sign Element:</span>
                  <Badge variant="outline">{getSignElement(sign)}</Badge>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Time of Day:</span>
                  <Badge variant="outline">{(new Date().getHours() >= 6 && new Date().getHours() < 18) ? 'Day' : 'Night'}</Badge>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Planet Element:</span>
                  <Badge variant="outline">{getPlanetaryElement(planet, (new Date().getHours() >= 6 && new Date().getHours() < 18))}</Badge>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Affinity:</span>
                  <Badge variant="outline">{Math.round(calculateElementalAffinity(planet, sign, (new Date().getHours() >= 6 && new Date().getHours() < 18)) * 100)}%</Badge>
                </div>
              </div>
              {historicalData && (
                <>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Orbital Period:</span>
                    <span className="text-xs">{Math.round(historicalData.cycleLength)} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Days per Degree:</span>
                    <span className="text-xs">{historicalData.daysPerDegree} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Days in {sign}:</span>
                    <span className="text-xs">~{historicalData.approxDaysInSign} days</span>
                  </div>
                </>
              )}
              {planetaryThemes && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-2">Key Themes:</p>
                  <div className="flex flex-wrap gap-1">
                    {planetaryThemes.themes?.slice(0, 3).map((theme: string) => (
                      <Badge key={theme} variant="outline" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transit History */}
          {recentTransits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Transit History
                </CardTitle>
                <CardDescription>
                  Previous times {planet} was at {degree}° {sign}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentTransits.slice(0, 3).map((transit, index) => (
                    <div key={index} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{transit.date.getFullYear()}</span>
                        <Badge variant="outline" className="text-xs">
                          {transit.yearsAgo} years ago
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{transit.historicalContext}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cycle #{transit.cycleNumber}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Historical Occurrences */}
          {degreeHistoricalData && degreeHistoricalData.occurrences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historical Occurrences
                </CardTitle>
                <CardDescription>
                  When {planet} was at {degree}° {sign} in history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {degreeHistoricalData.occurrences.map((occurrence, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-semibold text-sm">{occurrence.year}</span>
                          <Badge variant="outline" className="text-xs">
                            Cycle {occurrence.cycleNumber}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Cultural Context:</p>
                        <p className="text-xs italic text-blue-600 dark:text-blue-400">
                          {occurrence.culturalContext}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Major Events:</p>
                        <ul className="text-xs space-y-1">
                          {occurrence.events.slice(0, 3).map((event, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-muted-foreground mt-0.5">•</span>
                              <span className="leading-tight">{event}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Planetary Significance:
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 leading-tight">
                          {occurrence.significance}
                        </p>
                      </div>
                    </div>
                  ))}

                  {degreeHistoricalData.nextOccurrence && (
                    <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-sm text-blue-600">Next Occurrence</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {planet} will return to {degree}° {sign} around{' '}
                        {degreeHistoricalData.nextOccurrence.getFullYear()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last/Next Occurrence */}
          {historicalData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Cycle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {historicalData.lastOccurrence && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-semibold mb-1">Last Occurrence</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(historicalData.lastOccurrence.date)}
                    </p>
                  </div>
                )}
                {historicalData.nextOccurrence && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-semibold mb-1">Next Occurrence</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(historicalData.nextOccurrence.date)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Explore More
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/planets/${planet.toLowerCase()}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  {planet} Overview
                </Button>
              </Link>
              <Link href="/planetary-council" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Planetary Council
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
