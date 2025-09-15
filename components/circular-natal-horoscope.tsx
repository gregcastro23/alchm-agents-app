'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Star, Calendar } from 'lucide-react'
import { fetchAstrologizeWheel, type AstrologizeWheelResponse } from '@/lib/astrologize'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CircularNatalHoroscopeProps {
  className?: string
}

export default function CircularNatalHoroscope({ className }: CircularNatalHoroscopeProps) {
  const [horoscope, setHoroscope] = useState<AstrologizeWheelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrentMomentChart = async () => {
      try {
        const now = new Date()
        // Use zero-based month internally per schema; adapter in API converts to 1-based
        const currentMomentBirth = {
          name: 'Current Moment',
          year: now.getFullYear(),
          month: now.getMonth(),
          day: now.getDate(),
          hour: now.getHours(),
          minute: now.getMinutes(),
          latitude: 40.7128, // New York as default
          longitude: -74.006,
        }

        const result = await fetchAstrologizeWheel(currentMomentBirth)
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
  }, [])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Current Moment Natal Chart
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading celestial chart...</span>
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          Current Moment Natal Chart
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Live planetary positions updated regularly</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {horoscope?.svg ? (
            <div className="flex justify-center">
              <div
                className="w-full max-w-md aspect-square"
                dangerouslySetInnerHTML={{ __html: horoscope.svg }}
              />
            </div>
          ) : horoscope?.imageUrl ? (
            <div className="flex justify-center">
              <Image
                src={horoscope.imageUrl}
                alt="Current moment natal chart"
                width={400}
                height={400}
                className="w-full max-w-md aspect-square rounded-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Chart data received but no visual representation available
            </div>
          )}

          {horoscope?.meta?.degraded && (
            <Alert>
              <AlertDescription className="text-sm">
                {horoscope?.meta?.fallback
                  ? 'Chart service temporarily unavailable - displaying placeholder'
                  : 'Chart generated in degraded mode due to temporary service limitations'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
