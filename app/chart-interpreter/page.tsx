"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ChartInterpreterPage() {
  const [chartData, setChartData] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    planets: {
      sun: { sign: "Aries", degree: 15, house: 1 },
      moon: { sign: "Taurus", degree: 10, house: 2 },
      mercury: { sign: "Pisces", degree: 25, house: 12 },
      // Add more planets as needed
    },
  })

  const [interpretation, setInterpretation] = useState("")
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setChartData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePlanetChange = (planet: string, field: string, value: string) => {
    setChartData((prev) => ({
      ...prev,
      planets: {
        ...prev.planets,
        [planet]: {
          ...prev.planets[planet as keyof typeof prev.planets],
          [field]: value,
        },
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setInterpretation("")

    try {
      const response = await fetch("/api/chart-interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chartData }),
      })

      const data = await response.json()

      if (response.ok) {
        setInterpretation(data.interpretation)
      } else {
        setInterpretation(`Error: ${data.error || "Failed to interpret chart"}`)
      }
    } catch (error) {
      console.error("Error:", error)
      setInterpretation("Failed to connect to the API")
    } finally {
      setLoading(false)
    }
  }

  const planets = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ]
  const houses = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Chart Interpreter</h1>
      <p className="text-center mb-8 max-w-2xl mx-auto">
        Enter your birth details or planetary positions to receive a comprehensive chart interpretation
      </p>

      <Tabs defaultValue="manual" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="automatic">Birth Details</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Enter Planetary Positions</CardTitle>
              <CardDescription>
                Manually enter the positions of planets in your chart for interpretation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {planets.map((planet) => (
                    <div key={planet} className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`${planet}-sign`} className="capitalize">
                          {planet}
                        </Label>
                        <select
                          id={`${planet}-sign`}
                          value={chartData.planets[planet as keyof typeof chartData.planets]?.sign || "Aries"}
                          onChange={(e) => handlePlanetChange(planet, "sign", e.target.value)}
                          className="w-full p-2 border rounded mt-1"
                        >
                          {signs.map((sign) => (
                            <option key={sign} value={sign}>
                              {sign}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`${planet}-degree`}>Degree</Label>
                        <Input
                          id={`${planet}-degree`}
                          type="number"
                          min="0"
                          max="29"
                          value={chartData.planets[planet as keyof typeof chartData.planets]?.degree || 0}
                          onChange={(e) => handlePlanetChange(planet, "degree", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${planet}-house`}>House</Label>
                        <select
                          id={`${planet}-house`}
                          value={chartData.planets[planet as keyof typeof chartData.planets]?.house || 1}
                          onChange={(e) => handlePlanetChange(planet, "house", e.target.value)}
                          className="w-full p-2 border rounded mt-1"
                        >
                          {houses.map((house) => (
                            <option key={house} value={house}>
                              {house}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Interpreting Chart..." : "Interpret Chart"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automatic">
          <Card>
            <CardHeader>
              <CardTitle>Enter Birth Details</CardTitle>
              <CardDescription>
                Provide your birth information for automatic chart calculation and interpretation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (optional)</Label>
                    <Input
                      id="name"
                      name="name"
                      value={chartData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={chartData.birthDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthTime">Birth Time (if known)</Label>
                    <Input
                      id="birthTime"
                      name="birthTime"
                      type="time"
                      value={chartData.birthTime}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthPlace">Birth Place</Label>
                    <Input
                      id="birthPlace"
                      name="birthPlace"
                      value={chartData.birthPlace}
                      onChange={handleInputChange}
                      placeholder="City, Country"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Calculating & Interpreting..." : "Calculate & Interpret Chart"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {interpretation && (
        <Card className="mt-8 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Chart Interpretation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap">{interpretation}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
