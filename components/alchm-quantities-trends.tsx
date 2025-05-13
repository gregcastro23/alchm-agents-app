"use client"

import { useState, useEffect } from "react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"

type QuantityPoint = {
  time: string
  Spirit: number
  Essence: number
  Matter: number
  Substance: number
}

// Define planetary cycle frequencies in degrees per day
const planetaryCycles = {
  Sun: 0.986, // ~1 degree per day
  Moon: 13.2, // ~13 degrees per day
  Mercury: 0.985, // ~1 degree per day, but variable
  Venus: 0.625, // ~0.6 degrees per day
  Mars: 0.524, // ~0.5 degrees per day
  Jupiter: 0.083, // ~0.08 degrees per day
  Saturn: 0.034, // ~0.03 degrees per day
  Uranus: 0.012, // ~0.01 degrees per day
  Neptune: 0.006, // ~0.006 degrees per day
  Pluto: 0.004, // ~0.004 degrees per day
};

// Define planetary influence on alchemical quantities
const planetaryInfluence = {
  Spirit: {
    Sun: 0.5,     // Strong influence
    Mars: 0.3,     // Moderate influence
    Jupiter: 0.2,  // Moderate influence
    Mercury: 0.1   // Weak influence
  },
  Essence: {
    Moon: 0.4,     // Strong influence
    Venus: 0.3,    // Moderate influence
    Neptune: 0.2,  // Moderate influence
    Jupiter: 0.1   // Weak influence
  },
  Matter: {
    Saturn: 0.4,   // Strong influence
    Mars: 0.3,     // Moderate influence
    Moon: 0.2,     // Moderate influence
    Pluto: 0.1     // Weak influence
  },
  Substance: {
    Mercury: 0.4,  // Strong influence
    Neptune: 0.3,  // Moderate influence
    Saturn: 0.2,   // Moderate influence
    Uranus: 0.1    // Weak influence
  }
};

export default function AlchmQuantitiesTrends() {
  const [trendData, setTrendData] = useState<QuantityPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forecastDays, setForecastDays] = useState(7)

  useEffect(() => {
    async function generateTrendData() {
      setLoading(true)
      setError(null)
      try {
        const data: QuantityPoint[] = []
        const today = new Date()
        
        // Fetch current values to anchor our calculations
        let currentValues = {
          Spirit: 5.0,
          Essence: 5.0,
          Matter: 5.0,
          Substance: 5.0
        };
        
        try {
          const response = await fetch('/api/alchm-quantities')
          if (response.ok) {
            const apiData = await response.json()
            currentValues = {
              Spirit: apiData.quantities.Spirit || 5.0,
              Essence: apiData.quantities.Essence || 5.0,
              Matter: apiData.quantities.Matter || 5.0,
              Substance: apiData.quantities.Substance || 5.0
            }
          }
        } catch (err) {
          console.error("Could not fetch current values, using defaults:", err)
        }
        
        // Collect data for past days first
        for (let i = -3; i <= 0; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() + i)
          
          // Format as we need for display
          const displayDate = date.toLocaleDateString('en-US', { 
            month: 'short',
            day: 'numeric'
          })
          
          // For the current day (i=0), use the actual API data
          if (i === 0) {
            data.push({
              time: displayDate,
              Spirit: normalizeValue(currentValues.Spirit),
              Essence: normalizeValue(currentValues.Essence),
              Matter: normalizeValue(currentValues.Matter),
              Substance: normalizeValue(currentValues.Substance)
            })
          } else {
            // For past days, calculate based on planetary cycles
            const dayOffset = i;
            
            data.push({
              time: displayDate,
              Spirit: normalizeValue(calculateQuantityForDay("Spirit", dayOffset, currentValues.Spirit)),
              Essence: normalizeValue(calculateQuantityForDay("Essence", dayOffset, currentValues.Essence)),
              Matter: normalizeValue(calculateQuantityForDay("Matter", dayOffset, currentValues.Matter)),
              Substance: normalizeValue(calculateQuantityForDay("Substance", dayOffset, currentValues.Substance))
            })
          }
        }
        
        // Now add forecast days
        for (let i = 1; i <= forecastDays; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() + i)
          
          const displayDate = date.toLocaleDateString('en-US', { 
            month: 'short',
            day: 'numeric'
          })
          
          data.push({
            time: displayDate,
            Spirit: normalizeValue(calculateQuantityForDay("Spirit", i, currentValues.Spirit)),
            Essence: normalizeValue(calculateQuantityForDay("Essence", i, currentValues.Essence)),
            Matter: normalizeValue(calculateQuantityForDay("Matter", i, currentValues.Matter)),
            Substance: normalizeValue(calculateQuantityForDay("Substance", i, currentValues.Substance))
          })
        }
        
        setTrendData(data)
      } catch (err) {
        console.error("Error generating trend data:", err)
        setError(err instanceof Error ? err.message : "Failed to generate trend data")
      } finally {
        setLoading(false)
      }
    }
    
    generateTrendData()
  }, [forecastDays])
  
  // Function to calculate a quantity value for a specific day offset from today
  function calculateQuantityForDay(type: string, dayOffset: number, currentValue: number): number {
    // Get the planetary influences for this quantity type
    const influences = planetaryInfluence[type as keyof typeof planetaryInfluence];
    
    let value = currentValue;
    
    // Apply each planetary influence
    for (const [planet, weight] of Object.entries(influences)) {
      const planetarySpeed = planetaryCycles[planet as keyof typeof planetaryCycles];
      
      // Calculate the change based on the planet's position
      // We want a sine wave based on planetary movement
      const phase = (planetarySpeed * dayOffset) % 360;
      const radians = (phase * Math.PI) / 180;
      
      // Calculate the influence of this planet on the quantity
      // The influence follows a sine wave pattern
      const planetaryEffect = Math.sin(radians) * weight;
      
      // Apply the effect to the value
      value += planetaryEffect;
    }
    
    // Add a very small random factor for natural variation
    const randomFactor = (Math.random() - 0.5) * 0.1;
    value += randomFactor;
    
    // Ensure the value stays within reasonable bounds (0-10)
    return Math.max(0, Math.min(10, value));
  }
  
  // Function to normalize alchemical values to 0-100 range
  function normalizeValue(value: number): number {
    // Usually alchemical values are between 0-10, so multiply by 10
    const normalized = value * 10;
    return Math.min(Math.max(normalized, 0), 100);
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-lg border border-red-200">
        <h3 className="font-semibold mb-2">Error Loading Trend Data</h3>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <select 
          className="p-1 border rounded text-sm"
          value={forecastDays}
          onChange={(e) => setForecastDays(Number(e.target.value))}
        >
          <option value={3}>3 Day Forecast</option>
          <option value={7}>7 Day Forecast</option>
          <option value={14}>14 Day Forecast</option>
          <option value={30}>30 Day Forecast</option>
        </select>
      </div>
      
      {loading ? (
        <div className="h-72 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart 
            data={trendData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(1)}%`, '']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Spirit" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Essence" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Matter" 
              stroke="#b45309" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Substance" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      
      <div className="text-sm text-muted-foreground mt-4">
        <p>
          <span className="font-semibold">Planetary Agents Analysis:</span> The chart shows the projected trends in alchemical quantities based on planetary movements.
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><span className="text-red-500 font-medium">Spirit</span> follows Mars and Sun cycles, peaking during conjunctions.</li>
          <li><span className="text-blue-500 font-medium">Essence</span> follows lunar and Venus cycles, with lunar phase sensitivity.</li>
          <li><span className="text-amber-700 font-medium">Matter</span> follows Saturn and Mars cycles, stabilizing during planetary stations.</li>
          <li><span className="text-purple-500 font-medium">Substance</span> follows Mercury and Neptune cycles, varying with retrogrades.</li>
        </ul>
      </div>
    </div>
  )
} 