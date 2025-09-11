"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, MapPin, Calendar, Clock, User, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ParsedChartData {
  name?: string
  birthDate?: string
  birthTime?: string
  birthPlace?: string
  latitude?: number
  longitude?: number
}

interface QuickChartInputProps {
  onChartParsed: (data: ParsedChartData) => void
  className?: string
}

// Mock geocoding function - in production, use a real geocoding service
const mockGeocode = async (location: string): Promise<{ latitude: number; longitude: number; formattedName: string } | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Mock coordinates for common cities
  const mockCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
    "new york": { lat: 40.7128, lng: -74.0060, name: "New York, NY, USA" },
    "london": { lat: 51.5074, lng: -0.1278, name: "London, England, UK" },
    "paris": { lat: 48.8566, lng: 2.3522, name: "Paris, France" },
    "tokyo": { lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan" },
    "sydney": { lat: -33.8688, lng: 151.2093, name: "Sydney, Australia" },
    "los angeles": { lat: 34.0522, lng: -118.2437, name: "Los Angeles, CA, USA" },
    "chicago": { lat: 41.8781, lng: -87.6298, name: "Chicago, IL, USA" },
    "toronto": { lat: 43.6532, lng: -79.3832, name: "Toronto, Canada" },
    "berlin": { lat: 52.5200, lng: 13.4050, name: "Berlin, Germany" },
    "rome": { lat: 41.9028, lng: 12.4964, name: "Rome, Italy" }
  }
  
  const normalizedLocation = location.toLowerCase().trim()
  const match = Object.entries(mockCoordinates).find(([key]) => 
    normalizedLocation.includes(key) || key.includes(normalizedLocation)
  )
  
  if (match) {
    const [, coords] = match
    return {
      latitude: coords.lat,
      longitude: coords.lng,
      formattedName: coords.name
    }
  }
  
  return null
}

// Smart parsing function to extract birth data from natural language input
const parseChartInput = (input: string): ParsedChartData => {
  const result: ParsedChartData = {}
  
  // Name extraction (look for quotes or capitalize words at start)
  const nameMatch = input.match(/^"([^"]+)"|^([A-Z][a-z]+ ?[A-Z][a-z]*?)[\s,]/)
  if (nameMatch) {
    result.name = nameMatch[1] || nameMatch[2]
  }
  
  // Date extraction (various formats)
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{1,2}),? (\d{4})/i,  // Month DD, YYYY
    /(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})/i     // DD Month YYYY
  ]
  
  for (const pattern of datePatterns) {
    const match = input.match(pattern)
    if (match) {
      if (pattern.source.includes('Jan|Feb')) {
        // Month name format
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        const monthIndex = months.findIndex(m => match[1].toLowerCase().includes(m) || match[2]?.toLowerCase().includes(m))
        if (monthIndex !== -1) {
          const month = (monthIndex + 1).toString().padStart(2, '0')
          const day = (match[2] || match[1]).padStart(2, '0')
          const year = match[3]
          result.birthDate = `${year}-${month}-${day}`
        }
      } else if (match[1].length === 4) {
        // YYYY/MM/DD format
        result.birthDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      } else {
        // MM/DD/YYYY format (assume US format)
        result.birthDate = `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
      }
      break
    }
  }
  
  // Time extraction
  const timeMatch = input.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?/)
  if (timeMatch) {
    let hour = parseInt(timeMatch[1])
    const minute = timeMatch[2]
    const ampm = timeMatch[3]?.toLowerCase()
    
    if (ampm === 'pm' && hour !== 12) hour += 12
    if (ampm === 'am' && hour === 12) hour = 0
    
    result.birthTime = `${hour.toString().padStart(2, '0')}:${minute}`
  }
  
  // Location extraction (after common patterns)
  const cleanInput = input
    .replace(/^"[^"]+"|^[A-Z][a-z]+ ?[A-Z][a-z]*?[\s,]/, '') // Remove name
    .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/, '') // Remove date
    .replace(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/, '') // Remove date
    .replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/i, '') // Remove date
    .replace(/\d{1,2}:\d{2}\s*(am|pm)?/i, '') // Remove time
    .replace(/[,\s]+/g, ' ') // Clean spaces
    .trim()
  
  if (cleanInput.length > 2) {
    result.birthPlace = cleanInput
  }
  
  return result
}

export default function QuickChartInput({ onChartParsed, className = "" }: QuickChartInputProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedChartData | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (value: string) => {
    setInput(value)
    if (value.trim().length > 10) {
      const parsed = parseChartInput(value)
      setParsedData(parsed)
    } else {
      setParsedData(null)
    }
  }

  const handleSubmit = async () => {
    if (!parsedData || !parsedData.birthPlace) return
    
    setLoading(true)
    setGeocoding(true)
    
    try {
      // Geocode the location
      const geoResult = await mockGeocode(parsedData.birthPlace)
      
      const finalData: ParsedChartData = {
        ...parsedData,
        latitude: geoResult?.latitude,
        longitude: geoResult?.longitude,
        birthPlace: geoResult?.formattedName || parsedData.birthPlace
      }
      
      onChartParsed(finalData)
      setInput("")
      setParsedData(null)
    } catch (error) {
      console.error("Error processing chart input:", error)
    } finally {
      setLoading(false)
      setGeocoding(false)
    }
  }

  const exampleInputs = [
    "John Smith, March 15, 1990, 2:30 PM, New York",
    "Sarah, 03/22/1985, 14:45, London, England", 
    "Michael Johnson, Dec 5 1992, 8:15 am, Los Angeles",
    "Maria, 1988-07-20, 16:30, Paris France"
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Quick Chart Input</h3>
              <Badge variant="secondary" className="text-xs">AI Powered</Badge>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Type: Name, Birth Date, Time, Location (e.g., John Smith, March 15 1990, 2:30 PM, New York)"
                className="pl-10 py-6 text-base"
                onKeyDown={(e) => e.key === 'Enter' && parsedData?.birthPlace && handleSubmit()}
              />
            </div>
            
            {parsedData && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Parsed information:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {parsedData.name && (
                    <div className="flex items-center gap-1 text-sm">
                      <User className="w-3 h-3" />
                      <span>{parsedData.name}</span>
                    </div>
                  )}
                  {parsedData.birthDate && (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3" />
                      <span>{parsedData.birthDate}</span>
                    </div>
                  )}
                  {parsedData.birthTime && (
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-3 h-3" />
                      <span>{parsedData.birthTime}</span>
                    </div>
                  )}
                  {parsedData.birthPlace && (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3" />
                      <span>{parsedData.birthPlace}</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={!parsedData.birthPlace || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {geocoding ? 'Finding Location...' : 'Processing Chart...'}
                    </>
                  ) : (
                    'Create Chart'
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Example inputs */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-2">Example inputs:</div>
          <div className="space-y-1">
            {exampleInputs.map((example, index) => (
              <button
                key={index}
                onClick={() => handleInputChange(example)}
                className="text-xs text-left text-muted-foreground hover:text-foreground transition-colors block w-full p-1 rounded hover:bg-muted"
              >
                {example}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}