import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, Droplets, Wind, Mountain, AlertTriangle } from 'lucide-react'
import AlchmQuantitiesDisplay from '@/components/misc/alchm-quantities-display'
import AlchmQuantitiesTrends from '@/components/misc/alchm-quantities-trends'
import { Suspense } from 'react'

// Error banner for API connectivity issues
function ApiErrorBanner() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-amber-700">
            <span className="font-medium">API Connection Issues:</span> The planetary agents are
            experiencing temporary disruptions in their connection to astrological data sources.
            Data may be limited or unavailable.
          </p>
          <div className="mt-2">
            <a
              href="https://github.com/yourusername/planetary-agents#troubleshooting"
              className="text-xs text-amber-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View troubleshooting steps
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AlchmQuantitiesPage() {
  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <span>⚗️</span>
          Alchm Quantities
          <span>🔮</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg">
          Real-time alchemical calculations based on current planetary positions. Spirit, Essence,
          Matter, and Substance quantities reflect the cosmic energies available for consciousness
          work and transformation.
        </p>
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <Badge variant="outline" className="px-3 py-1">
            <Flame className="h-3 w-3 mr-1 inline" />
            Spirit = Creative Force
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Droplets className="h-3 w-3 mr-1 inline" />
            Essence = Life Energy
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Mountain className="h-3 w-3 mr-1 inline" />
            Matter = Physical Form
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Wind className="h-3 w-3 mr-1 inline" />
            Substance = Etheric Field
          </Badge>
        </div>
      </div>

      {/* Uncomment this banner when needed for global API issues */}
      {/* <ApiErrorBanner /> */}

      {/* Main Content Grid */}
      <div className="space-y-6">
        {/* Current Quantities Display */}
        <Card>
          <CardHeader>
            <CardTitle>Current Alchm Quantities</CardTitle>
            <CardDescription>
              Real-time values calculated from current planetary positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              }
            >
              <AlchmQuantitiesDisplay />
            </Suspense>
          </CardContent>
        </Card>

        {/* Two Column Layout for Trends and Formulas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Trends & Forecasts</CardTitle>
              <CardDescription>How the quantities are expected to change over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                }
              >
                <AlchmQuantitiesTrends />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alchemical Mathematics</CardTitle>
              <CardDescription>Core formulas driving the tokenized quantities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">🎯</span> A-Number
                </h4>
                <p className="text-sm font-mono mb-2">A# = Spirit + Essence + Matter + Substance</p>
                <p className="text-xs text-muted-foreground">
                  Total alchemical energy available. Each planet contributes specific token values
                  based on its position and dignity.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">⚗️</span> Monica Constant
                </h4>
                <p className="text-sm font-mono mb-2">
                  MC = (Spirit × φ + Essence) / (Matter + Substance + 1)
                </p>
                <p className="text-xs text-muted-foreground">
                  φ = 1.618033988749895 (Golden Ratio)
                  <br />
                  Measures consciousness coherence and spiritual/material balance
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">⚡</span> Thermodynamics
                </h4>
                <div className="space-y-1 text-xs font-mono">
                  <p>Heat = (Spirit² + Fire²) / (All Elements)²</p>
                  <p>Entropy = (Spirit² + Substance² + Fire² + Air²) / (Earth + Water)²</p>
                  <p>Reactivity = (All except Earth)² / (Matter + Earth)²</p>
                  <p className="mt-2 font-bold">Energy = Heat - (Entropy × Reactivity)</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">🪐</span> Planetary Contributions
                </h4>
                <div className="text-xs space-y-1">
                  <p>
                    <strong>Sun:</strong> Spirit: 1
                  </p>
                  <p>
                    <strong>Moon:</strong> Essence: 1, Matter: 1
                  </p>
                  <p>
                    <strong>Mercury:</strong> Spirit: 1, Substance: 1
                  </p>
                  <p>
                    <strong>Venus:</strong> Essence: 1, Matter: 1
                  </p>
                  <p>
                    <strong>Mars:</strong> Essence: 1, Matter: 1
                  </p>
                  <p>
                    <strong>Jupiter:</strong> Spirit: 1, Essence: 1
                  </p>
                  <p>
                    <strong>Saturn:</strong> Spirit: 1, Matter: 1
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
