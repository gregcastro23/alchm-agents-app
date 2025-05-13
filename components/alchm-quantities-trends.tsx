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
  ResponsiveContainer,
  Label
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

// Custom tooltip component for token values
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border rounded-md shadow-md">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`token-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium">{entry.name}:</span>
            <span className="text-xs font-mono font-bold">{(entry.value/10).toFixed(3)} tokens</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default function AlchmQuantitiesTrends() {
  const [trendData, setTrendData] = useState<QuantityPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forecastDays, setForecastDays] = useState(7)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    async function generateTrendData() {
      setLoading(true)
      setError(null)
      
      try {
        const data: QuantityPoint[] = []
        const today = new Date()
        
        // Fetch current values to anchor our calculations
        console.log('Fetching current alchemical quantities for trend calculations...')
        
        // Add a small delay to ensure API server is ready
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const response = await fetch('/api/alchm-quantities', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          cache: 'no-store',
        })
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }
        
        const apiData = await response.json()
        console.log('Received API data for trends:', apiData)
        
        if (!apiData || !apiData.quantities) {
          throw new Error('Invalid data format received from API')
        }
        
        const currentValues = {
          Spirit: apiData.quantities.Spirit || 0,
          Essence: apiData.quantities.Essence || 0, 
          Matter: apiData.quantities.Matter || 0,
          Substance: apiData.quantities.Substance || 0
        }
        
        console.log('Current values for trend calculation:', currentValues)
        
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
              Spirit: keepRawTokenValue(currentValues.Spirit),
              Essence: keepRawTokenValue(currentValues.Essence),
              Matter: keepRawTokenValue(currentValues.Matter),
              Substance: keepRawTokenValue(currentValues.Substance)
            })
          } else {
            // For past days, calculate based on planetary cycles
            const dayOffset = i;
            
            data.push({
              time: displayDate,
              Spirit: keepRawTokenValue(calculateQuantityForDay("Spirit", dayOffset, currentValues.Spirit)),
              Essence: keepRawTokenValue(calculateQuantityForDay("Essence", dayOffset, currentValues.Essence)),
              Matter: keepRawTokenValue(calculateQuantityForDay("Matter", dayOffset, currentValues.Matter)),
              Substance: keepRawTokenValue(calculateQuantityForDay("Substance", dayOffset, currentValues.Substance))
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
            Spirit: keepRawTokenValue(calculateQuantityForDay("Spirit", i, currentValues.Spirit)),
            Essence: keepRawTokenValue(calculateQuantityForDay("Essence", i, currentValues.Essence)),
            Matter: keepRawTokenValue(calculateQuantityForDay("Matter", i, currentValues.Matter)),
            Substance: keepRawTokenValue(calculateQuantityForDay("Substance", i, currentValues.Substance))
          })
        }
        
        setTrendData(data)
      } catch (err) {
        console.error("Error generating trend data:", err)
        setError(err instanceof Error ? err.message : "Failed to generate trend data")
        
        // Retry logic - retry up to 3 times with increasing delay
        if (retryCount < 3) {
          const retryDelay = 2000 * (retryCount + 1)
          console.log(`Retrying trend data in ${retryDelay}ms (attempt ${retryCount + 1}/3)`)
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, retryDelay)
        }
      } finally {
        setLoading(false)
      }
    }
    
    generateTrendData()
  }, [forecastDays, retryCount])
  
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
  
  // Function to keep the raw token value but multiply by 10 for chart visibility
  function keepRawTokenValue(value: number): number {
    // For chart scaling, we multiply by 10 but preserve the actual token value
    return value * 10;
  }
  
  const handleRetry = () => {
    setRetryCount(0) // Reset retry count to trigger a new attempt
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-lg border border-red-200">
        <h3 className="font-semibold mb-2">Error Loading Trend Data</h3>
        <p>{error}</p>
        <button 
          onClick={handleRetry}
          className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm font-medium"
        >
          Retry Now
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium text-muted-foreground">
          Token Quantity Forecast
        </div>
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
        <div className="h-72 flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Calculating token forecasts based on planetary movements...</p>
        </div>
      ) : trendData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart 
            data={trendData}
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 100]}>
              <Label 
                value="Token Quantity (÷10)" 
                angle={-90} 
                position="insideLeft" 
                style={{ textAnchor: 'middle', fontSize: '12px' }}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              name="Spirit"
              dataKey="Spirit" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              name="Essence"
              dataKey="Essence" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              name="Matter"
              dataKey="Matter" 
              stroke="#b45309" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              name="Substance"
              dataKey="Substance" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-72 flex justify-center items-center border rounded-lg">
          <div className="text-center text-muted-foreground p-4">
            <p className="font-medium">No forecasting data available</p>
            <p className="mt-2 text-sm">Unable to calculate token quantity trends.</p>
            <button 
              onClick={handleRetry}
              className="mt-3 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <div className="text-sm text-muted-foreground mt-4">
        <p>
          <span className="font-semibold">Planetary Agents Analysis:</span> The chart shows the projected token quantities based on planetary movements.
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