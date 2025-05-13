import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Droplets, Wind, Mountain } from "lucide-react"
import AlchmQuantitiesDisplay from "@/components/alchm-quantities-display"
import AlchmQuantitiesTrends from "@/components/alchm-quantities-trends"
import { Suspense } from "react"

export default function AlchmQuantitiesPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-center mb-4">Alchm Quantities</h1>
      <p className="text-center mb-8 max-w-2xl mx-auto">
        This page displays the current state of Spirit, Essence, Matter, and Substance quantities 
        based on astrological calculations from the current moment. These quantities operate on 
        predictable cycles influenced by planetary positions.
      </p>

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