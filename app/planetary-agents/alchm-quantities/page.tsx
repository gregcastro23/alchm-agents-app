import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Droplets, Wind, Mountain, AlertTriangle } from "lucide-react"
import AlchmQuantitiesDisplay from "@/components/alchm-quantities-display"
import AlchmQuantitiesTrends from "@/components/alchm-quantities-trends"
import { Suspense } from "react"

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
            <span className="font-medium">API Connection Issues:</span> The planetary agents are experiencing temporary disruptions
            in their connection to astrological data sources. Data may be limited or unavailable.
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
      <h1 className="text-3xl font-bold text-center mb-4">Alchm Quantities</h1>
      <p className="text-center mb-8 max-w-2xl mx-auto">
        This page displays the current state of Spirit, Essence, Matter, and Substance quantities 
        based on astrological calculations from the current moment. These quantities operate on 
        predictable cycles influenced by planetary positions.
      </p>

      {/* Uncomment this banner when needed for global API issues */}
      {/* <ApiErrorBanner /> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Alchm Quantities</CardTitle>
            <CardDescription>
              Values are calculated based on the current planetary positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>}>
            <AlchmQuantitiesDisplay />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trends & Forecasts</CardTitle>
            <CardDescription>
              How the quantities are expected to change over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>}>
            <AlchmQuantitiesTrends />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 