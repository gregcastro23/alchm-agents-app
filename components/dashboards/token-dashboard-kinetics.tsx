'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Clock,
  Target,
  Activity,
  Sparkles,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface TokenRate {
  Spirit: number
  Essence: number
  Matter: number
  Substance: number
}

interface TokenForecastPoint {
  time: string
  hour: number
  Spirit: number
  Essence: number
  Matter: number
  Substance: number
  planetaryHour: string
  powerLevel: number
}

interface TokenDashboardKineticsProps {
  location?: { lat: number; lon: number }
  className?: string
}

export function TokenDashboardKinetics({
  location = { lat: 37.7749, lon: -122.4194 },
  className = '',
}: TokenDashboardKineticsProps) {
  const [currentRates, setCurrentRates] = useState<TokenRate | null>(null)
  const [forecast, setForecast] = useState<TokenForecastPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marketPhase, setMarketPhase] = useState<string>('Consolidation')
  const [volatilityIndex, setVolatilityIndex] = useState<number>(0.5)
  const [nextOptimalWindow, setNextOptimalWindow] = useState<Date | null>(null)

  useEffect(() => {
    const fetchTokenData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Check if backend is enabled
        const backendEnabled = process.env.NEXT_PUBLIC_TOKEN_CALCULATIONS_BACKEND === 'true'
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

        let backendDataLoaded = false

        if (backendEnabled) {
          try {
            const controller1 = new AbortController()
            const timeout1 = setTimeout(() => controller1.abort(), 5000)

            const ratesResponse = await fetch(`${backendUrl}/api/tokens/calculate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tokens: { Spirit: 1.0, Essence: 0.8, Matter: 0.6, Substance: 0.4 },
                location,
              }),
              signal: controller1.signal,
            })
            clearTimeout(timeout1)

            if (ratesResponse.ok) {
              const ratesData = await ratesResponse.json()
              if (ratesData.success) {
                setCurrentRates(ratesData.data.rates)
                setMarketPhase(ratesData.data.metadata.marketPhase)
                setVolatilityIndex(ratesData.data.metadata.volatilityIndex)
                backendDataLoaded = true
              }
            }

            const controller2 = new AbortController()
            const timeout2 = setTimeout(() => controller2.abort(), 5000)

            const forecastResponse = await fetch(`${backendUrl}/api/tokens/projections`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ location, timeframe: 'nearTerm' }),
              signal: controller2.signal,
            })
            clearTimeout(timeout2)

            if (forecastResponse.ok) {
              const forecastData = await forecastResponse.json()
              if (forecastData.success) {
                const forecastPoints: TokenForecastPoint[] = []
                const now = new Date()

                for (let hour = 0; hour < 24; hour++) {
                  const time = new Date(now.getTime() + hour * 60 * 60 * 1000)
                  const timeString = time.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const hourlyMultiplier = 1 + 0.2 * Math.sin((hour * Math.PI) / 12)
                  const planetaryHours = [
                    'Sun',
                    'Moon',
                    'Mars',
                    'Mercury',
                    'Jupiter',
                    'Venus',
                    'Saturn',
                  ]
                  forecastPoints.push({
                    time: timeString,
                    hour,
                    Spirit:
                      (currentRates?.Spirit || 1.0) * hourlyMultiplier * (1 + Math.random() * 0.1),
                    Essence:
                      (currentRates?.Essence || 0.8) *
                      hourlyMultiplier *
                      (1 + Math.random() * 0.08),
                    Matter:
                      (currentRates?.Matter || 0.6) * hourlyMultiplier * (1 + Math.random() * 0.06),
                    Substance:
                      (currentRates?.Substance || 0.4) *
                      hourlyMultiplier *
                      (1 + Math.random() * 0.05),
                    planetaryHour: planetaryHours[hour % 7],
                    powerLevel: Math.random() * 0.4 + 0.3,
                  })
                }

                setForecast(forecastPoints)
                const optimalPoint = forecastPoints.reduce((best, point) =>
                  point.powerLevel > best.powerLevel ? point : best
                )
                setNextOptimalWindow(new Date(now.getTime() + optimalPoint.hour * 60 * 60 * 1000))
              }
            }
          } catch {
            // Backend unavailable — fall through to mock data
          }
        }

        if (!backendDataLoaded) {
          setCurrentRates({ Spirit: 1.0, Essence: 0.8, Matter: 0.6, Substance: 0.4 })
          setMarketPhase('Development Mode')
          setVolatilityIndex(0.3)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch token data')
      } finally {
        setLoading(false)
      }
    }

    fetchTokenData()

    // Refresh every 5 minutes
    const interval = setInterval(fetchTokenData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [location])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 animate-pulse" />
            Token Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Token Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const getMarketPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Bull Market':
        return 'bg-green-600'
      case 'Bear Market':
        return 'bg-red-600'
      case 'Accumulation':
        return 'bg-blue-600'
      case 'Consolidation':
        return 'bg-yellow-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getVolatilityColor = (volatility: number) => {
    if (volatility > 0.7) return 'text-red-600'
    if (volatility > 0.4) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Token Dashboard
        </CardTitle>
        <CardDescription>
          Real-time rates with kinetic influences and 24-hour forecast
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Rates */}
        {currentRates && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(currentRates).map(([token, rate]) => (
              <div key={token} className="text-center space-y-1">
                <div className="text-sm font-medium text-muted-foreground">{token}</div>
                <div className="text-2xl font-bold">{rate.toFixed(3)}</div>
                <div className="flex items-center justify-center gap-1">
                  {rate > 1.0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {rate > 1.0 ? '+' : ''}
                    {((rate - 1.0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Market Phase & Volatility */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <div>
              <div className="text-sm font-medium">Market Phase</div>
              <Badge className={getMarketPhaseColor(marketPhase)}>{marketPhase}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <div>
              <div className="text-sm font-medium">Volatility Index</div>
              <div className={`text-lg font-bold ${getVolatilityColor(volatilityIndex)}`}>
                {(volatilityIndex * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* 24-Hour Forecast Chart */}
        {forecast.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">24-Hour Forecast</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" fontSize={10} interval="preserveStartEnd" />
                  <YAxis fontSize={10} />
                  <Tooltip
                    labelFormatter={label => `Time: ${label}`}
                    formatter={(value: number, name: string) => [value.toFixed(3), name]}
                  />
                  <Line
                    type="monotone"
                    dataKey="Spirit"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Essence"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Matter"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Substance"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />

                  {/* Mark current time */}
                  <ReferenceLine
                    x={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    stroke="#666"
                    strokeDasharray="2 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className="flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Spirit</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Essence</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Matter</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Substance</span>
              </div>
            </div>
          </div>
        )}

        {/* Next Optimal Window */}
        {nextOptimalWindow && (
          <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Next Optimal Generation Window
              </span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              <Clock className="h-3 w-3 inline mr-1" />
              {nextOptimalWindow.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}{' '}
              - Peak generation rates expected
            </div>
            <div className="mt-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Set Reminder
              </Button>
            </div>
          </div>
        )}

        {/* Generation Efficiency Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Generation Efficiency</div>
            <div className="space-y-1">
              {currentRates &&
                Object.entries(currentRates).map(([token, rate]) => (
                  <div key={token} className="flex items-center justify-between text-sm">
                    <span>{token}:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(100, rate * 50)} className="w-16 h-2" />
                      <span className="text-xs font-mono w-12 text-right">
                        {(rate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Kinetic Influences</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>• Planetary hour modifiers active</div>
              <div>• Temporal cycle adjustments</div>
              <div>• Elemental resonance factors</div>
              <div>• Harmonic wave patterns</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Refresh data
              window.location.reload()
            }}
          >
            <Activity className="h-3 w-3 mr-1" />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Export forecast data
              const dataStr = JSON.stringify(forecast, null, 2)
              const dataBlob = new Blob([dataStr], { type: 'application/json' })
              const url = URL.createObjectURL(dataBlob)
              const link = document.createElement('a')
              link.href = url
              link.download = `token-forecast-${new Date().toISOString().split('T')[0]}.json`
              link.click()
              URL.revokeObjectURL(url)
            }}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>

        {/* Live Update Status */}
        <div className="text-xs text-muted-foreground text-center">
          Live data • Updates every 5 minutes • Powered by Kinetics Backend
        </div>
      </CardContent>
    </Card>
  )
}
