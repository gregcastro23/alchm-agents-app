'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Star, Calendar, Sparkles } from 'lucide-react'
import { fetchAstrologizeWheel, type AstrologizeWheelResponse } from '@/lib/astrologize'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTheme } from 'next-themes'
import KineticsChartPane from './kinetics-chart-pane'

interface CircularNatalHoroscopeProps {
  className?: string
  showKinetics?: boolean
  birthInfo?: {
    year: number
    month: number // zero-based
    day: number
    hour: number
    minute: number
    latitude: number
    longitude: number
    name?: string
  }
}

export default function CircularNatalHoroscope({
  className,
  showKinetics = false,
  birthInfo,
}: CircularNatalHoroscopeProps) {
  const [horoscope, setHoroscope] = useState<AstrologizeWheelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  useEffect(() => {
    const fetchCurrentMomentChart = async () => {
      try {
        let input = birthInfo
        if (!input) {
          const now = new Date()
          // Use UTC clock for consistency with enhanced planetary calculators and API
          input = {
            name: 'Current Moment (UTC)',
            year: now.getUTCFullYear(),
            month: now.getUTCMonth(), // zero-based
            day: now.getUTCDate(),
            hour: now.getUTCHours(),
            minute: now.getUTCMinutes(),
            // Location does not affect planetary longitudes; houses differ by location.
            // Keep a neutral default location.
            latitude: 0,
            longitude: 0,
          }
        }

        const result = await fetchAstrologizeWheel(input as any)
        setHoroscope(result)
        setError(null)
      } catch (err) {
        console.error('Error fetching horoscope:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch horoscope')
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentMomentChart()

    // Refresh every 5 minutes
    const interval = setInterval(fetchCurrentMomentChart, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [birthInfo])

  if (loading) {
    return (
      <div
        className={`${showKinetics ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''} ${className}`}
      >
        <Card className={`cosmic-glass ${showKinetics ? 'lg:col-span-2' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 cosmic-text-gradient">
              <Sparkles className="w-5 h-5" />
              {birthInfo?.name ? `${birthInfo.name}'s Chart` : 'Current Moment Chart'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 animate-spin text-cosmic-gold" />
              <span className="text-cosmic-starlight-lavender">Generating cosmic chart...</span>
            </div>
          </CardContent>
        </Card>
        {showKinetics && (
          <KineticsChartPane
            birthInfo={birthInfo}
            realTimeMode={!birthInfo}
            className="lg:col-span-1"
          />
        )}
      </div>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Current Moment Natal Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Unable to load the current moment chart: {error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`${showKinetics ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''} ${className}`}>
      <Card className={`cosmic-glass-ethereal ${showKinetics ? 'lg:col-span-2' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 cosmic-text-gradient">
            <Sparkles className="w-5 h-5" />
            {birthInfo?.name ? `${birthInfo.name}'s Cosmic Chart` : 'Current Moment Chart'}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-cosmic-starlight-lavender">
            <Calendar className="w-4 h-4" />
            <span>
              {birthInfo
                ? `${new Date(birthInfo.year, birthInfo.month, birthInfo.day).toLocaleDateString()}`
                : 'Live cosmic positions updated regularly'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {horoscope?.svg ? (
              <div className="flex justify-center">
                <div
                  className="w-full max-w-md aspect-square cosmic-chart-container"
                  dangerouslySetInnerHTML={{ __html: horoscope.svg }}
                  style={{
                    filter: isDarkMode ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.2))' : 'none',
                  }}
                />
              </div>
            ) : horoscope?.imageUrl ? (
              <div className="flex justify-center">
                <Image
                  src={horoscope.imageUrl}
                  alt="Cosmic natal chart"
                  width={400}
                  height={400}
                  className="w-full max-w-md aspect-square rounded-lg cosmic-glass"
                  style={{
                    filter: isDarkMode ? 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.3))' : 'none',
                  }}
                />
              </div>
            ) : horoscope?.meta?.localGenerationFailed ? (
              <div className="flex flex-col items-center justify-center h-48 text-center space-y-2">
                <div className="text-cosmic-starlight-lavender">
                  Chart generation temporarily unavailable
                </div>
                <div className="text-sm text-cosmic-starlight-lavender opacity-70">
                  Both external service and local generation failed
                </div>
                {horoscope.meta.error && (
                  <div className="text-xs text-red-400 max-w-xs">Error: {horoscope.meta.error}</div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center space-y-2">
                <div className="text-cosmic-starlight-lavender">
                  Chart data processed but no visualization generated
                </div>
                <div className="text-sm text-cosmic-starlight-lavender opacity-70">
                  This may indicate a temporary service issue
                </div>
              </div>
            )}

            {horoscope?.meta?.degraded && (
              <Alert className="cosmic-glass border-cosmic-gold/30">
                <AlertDescription className="text-sm text-cosmic-starlight-lavender">
                  {horoscope?.meta?.local
                    ? '✨ Chart generated with cosmic precision - External service temporarily unavailable'
                    : horoscope?.meta?.fallback
                      ? '🔮 Cosmic fallback active - Service temporarily unavailable'
                      : '⚡ Chart generated in enhanced mode with cosmic algorithms'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {showKinetics && (
        <KineticsChartPane
          birthInfo={birthInfo}
          realTimeMode={!birthInfo}
          className="lg:col-span-1"
        />
      )}
    </div>
  )
}
