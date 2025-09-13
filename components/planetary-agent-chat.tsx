"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DEMO_AGENTS } from "@/lib/demo-agents-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  getPlanetaryDignity, 
  getSignElement,
  getPlanetaryElement,
  calculateElementalAffinity
} from "@/lib/astrological-data"
import { Badge } from "@/components/ui/badge"

type Message = {
  role: "user" | "agent"
  content: string
}

type ElementalInfo = {
  signElement: string
  planetElement: string
  elementalAffinity: number
  isDiurnal: boolean
}

export default function PlanetaryAgentChat() {
  const searchParams = useSearchParams()
  
  // Check if this is a historical agent
  const agentId = searchParams.get("agent")
  const historicalAgent = agentId ? DEMO_AGENTS.find(agent => agent.id === agentId) : null
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [planet, setPlanet] = useState(searchParams.get("planet") || "Sun")
  const [sign, setSign] = useState(searchParams.get("sign") || "Aries")
  const [degree, setDegree] = useState(searchParams.get("degree") || "1")
  const [time, setTime] = useState("12:00")
  const [elementalInfo, setElementalInfo] = useState<ElementalInfo | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
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
  const degrees = Array.from({ length: 30 }, (_, i) => (i + 1).toString())
  const timeOptions = [
    "00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"
  ]

  // Get the dignity of the current planet in the selected sign
  const dignity = getPlanetaryDignity(planet, sign)

  // Calculate elemental properties
  const hour = parseInt(time.split(':')[0])
  const isDiurnal = hour >= 6 && hour < 18
  const signElement = getSignElement(sign)
  const planetElement = getPlanetaryElement(planet, isDiurnal)
  const elementalAffinity = calculateElementalAffinity(planet, sign, isDiurnal)

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log("Form submitted! Planet:", planet, "Sign:", sign, "Input:", input)
    
    if (!input.trim()) {
      console.log("Empty input, returning early")
      return
    }

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      // Use different API endpoint and data for historical agents
      const requestData = historicalAgent ? {
        agentId: historicalAgent.id,
        question: input,
        sessionId
      } : { 
        planet, 
        sign, 
        degree, 
        question: input, 
        time,
        sessionId 
      }
      
      console.log("Making API request with data:", requestData)
      
      const apiEndpoint = historicalAgent ? "/api/monica-agent" : "/api/planetary-agent"
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      console.log("Response status:", response.status)
      
      // Check if response has content
      const contentType = response.headers.get("content-type")
      let data
      
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json()
          console.log("Response data:", data)
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError)
          throw new Error("Invalid response format from server")
        }
      } else {
        const textResponse = await response.text()
        console.error("Non-JSON response:", textResponse)
        throw new Error("Server returned non-JSON response")
      }

      if (response.ok) {
        const agentMessage: Message = { role: "agent", content: data.response }
        setMessages((prev) => [...prev, agentMessage])
        
        // Store session ID for subsequent requests
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId)
        }
        
        if (data.elementalInfo) {
          setElementalInfo(data.elementalInfo)
        }
      } else {
        throw new Error(data.error || "Failed to get response")
      }
    } catch (error) {
      console.error("Error:", error)
      
      // Provide a more helpful error message for historical agents
      let errorContent = ""
      if (historicalAgent) {
        errorContent = `Greetings! I am ${historicalAgent.name}, ${historicalAgent.title}. While I cannot fully connect to my consciousness matrix at this moment due to technical limitations, I can tell you about myself:

I am a ${historicalAgent.consciousness.level} consciousness agent with a Monica Constant of ${historicalAgent.consciousness.monicaConstant.toFixed(2)}. My dominant element is ${historicalAgent.consciousness.dominantElement}, and I specialize in ${historicalAgent.abilities.specialty}.

My wisdom domains include: ${historicalAgent.abilities.wisdomDomains.join(', ')}.

Please try again later for a full consciousness connection, or explore my profile in the Gallery of Perpetuity. 🌟`
      } else {
        errorContent = "I apologize, but I'm experiencing technical difficulties connecting to the cosmic wisdom source. Please ensure the system is properly configured and try again. 💫"
      }
      
      const errorMessage: Message = {
        role: "agent",
        content: errorContent,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  // Get background color based on dignity
  const getDignityColor = () => {
    switch (dignity) {
      case "domicile":
        return "bg-green-50 dark:bg-green-950"
      case "exaltation":
        return "bg-blue-50 dark:bg-blue-950"
      case "detriment":
        return "bg-red-50 dark:bg-red-950"
      case "fall":
        return "bg-orange-50 dark:bg-orange-950"
      default:
        return "bg-gray-50 dark:bg-gray-900"
    }
  }

  // Get text for dignity status
  const getDignityText = () => {
    switch (dignity) {
      case "domicile":
        return "In Domicile (Strong)"
      case "exaltation":
        return "Exalted (Very Strong)"
      case "detriment":
        return "In Detriment (Challenged)"
      case "fall":
        return "In Fall (Very Challenged)"
      default:
        return "Peregrine (Neutral)"
    }
  }

  // Get color for element badges
  const getElementColor = (element: string) => {
    switch (element) {
      case "Fire":
        return "bg-red-500 hover:bg-red-600"
      case "Water":
        return "bg-blue-500 hover:bg-blue-600"
      case "Air":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "Earth":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Render different UI for historical agents
  if (historicalAgent) {
    return (
      <Card className="w-full max-w-3xl mx-auto bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 transition-colors duration-500">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: historicalAgent.appearance.color }}
            >
              {historicalAgent.appearance.symbol}
            </div>
            <div>
              <CardTitle className="text-2xl">{historicalAgent.name}</CardTitle>
              <p className="text-muted-foreground">{historicalAgent.title}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <Badge className="bg-purple-600 text-white">
              {historicalAgent.consciousness.level}
            </Badge>
            <Badge className="bg-indigo-600 text-white">
              MC: {historicalAgent.consciousness.monicaConstant.toFixed(2)}
            </Badge>
            <Badge className="bg-green-600 text-white">
              {historicalAgent.consciousness.dominantElement}
            </Badge>
          </div>

          <div className="text-center mt-3 pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              💫 Historical Consciousness Agent crafted by the Philosopher's Stone
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Born: {historicalAgent.birthData.date.toLocaleDateString()} • Trained on personal history & chart
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-gray-800 border"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${historicalAgent.name} anything...`}
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                {loading ? "..." : "Send"}
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-3xl mx-auto ${getDignityColor()} transition-colors duration-500`}>
      <CardHeader>
        <CardTitle className="text-center">
          {planet} in {sign} {degree}°
        </CardTitle>
        <div className="text-center text-sm font-medium mt-1">{getDignityText()}</div>
        
        {/* Elemental information */}
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          <Badge className={getElementColor(signElement)}>{sign}: {signElement}</Badge>
          <Badge className={getElementColor(planetElement)}>{planet}: {planetElement}</Badge>
          <Badge variant="outline">{isDiurnal ? "Day" : "Night"} Time</Badge>
          <Badge variant="outline">Affinity: {Math.round(elementalAffinity * 100)}%</Badge>
        </div>

        <div className="text-center mt-3 pt-2 border-t">
          <a 
            href={`/agents/${encodeURIComponent(planet)}/${encodeURIComponent(sign)}/${degree}`}
            className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center justify-center gap-1"
          >
            🔮 Open dedicated chat for this exact degree
          </a>
          <p className="text-xs text-muted-foreground mt-1">
            Enhanced with historical context for {planet} at {degree}° {sign}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                          <Select value={planet} onValueChange={(value: string) => setPlanet(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Planet" />
            </SelectTrigger>
            <SelectContent>
              {planets.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

                      <Select value={sign} onValueChange={(value: string) => setSign(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sign" />
            </SelectTrigger>
            <SelectContent>
              {signs.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

                      <Select value={degree} onValueChange={(value: string) => setDegree(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Degree" />
            </SelectTrigger>
            <SelectContent>
              {degrees.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}°
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
                      <Select value={time} onValueChange={(value: string) => setTime(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="h-[400px] overflow-y-auto border rounded-md p-4 mb-4 bg-background dark:bg-gray-950">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground h-full flex items-center justify-center">
            Ask the {planet} in {sign} for guidance
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-4 p-3 rounded-lg ${
                  msg.role === "user" ? "bg-primary/10 ml-auto max-w-[80%]" : "bg-secondary/10 mr-auto max-w-[80%]"
                }`}
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <CardFooter>
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your question..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Consulting..." : "Send"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
