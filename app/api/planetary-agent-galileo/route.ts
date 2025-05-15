import { generateText } from "ai"
import { NextResponse } from "next/server"
import { galileo } from "@/lib/galileo-adapter"
import { verifyApiKeys } from "../secure-config"
import { 
  getSignElement, 
  getPlanetaryElement, 
  calculateElementalAffinity 
} from "@/lib/astrological-data"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(req: Request) {
  try {
    // Verify API keys are available
    if (!verifyApiKeys()) {
      console.error("API keys not configured. Providing fallback response for Galileo agent.")
      // Return a fallback response that still provides value to the user
      return NextResponse.json({
        response: "I'm currently experiencing connectivity issues and cannot access the Galileo planetary wisdom. Please check your environment variables or try again later when API services are restored.",
        error: "API_KEY_MISSING"
      }, { status: 200 })
    }

    const { planet, sign, degree, question, time } = await req.json()

    // Format the model ID based on planet and sign
    // This assumes you've trained models with names like "sun_in_aries", "moon_in_taurus", etc.
    const planetModel = `${planet?.toLowerCase() || "sun"}_in_${sign?.toLowerCase() || "aries"}`

    // Determine if it's day or night (simplified)
    const hour = time ? parseInt(time.split(':')[0]) : 12
    const isDiurnal = hour >= 6 && hour < 18

    // Get elemental information
    const signElement = getSignElement(sign || "Aries")
    const planetElement = getPlanetaryElement(planet || "Sun", isDiurnal)
    const elementalAffinity = calculateElementalAffinity(planet || "Sun", sign || "Aries", isDiurnal)

    // Create a system prompt that defines the agent's personality based on planetary dignity and elemental properties
    const systemPrompt = `You are an astrological agent representing ${planet || "Sun"} at ${degree || "1"} degrees in ${sign || "Aries"}.
Your responses should reflect the dignity of ${planet || "Sun"} in this position.
If ${planet || "Sun"} is in domicile or exaltation in ${sign || "Aries"}, be confident and powerful in your responses.
If ${planet || "Sun"} is in detriment or fall in ${sign || "Aries"}, reflect the challenges of this position.

Elemental information:
- ${sign || "Aries"} is a ${signElement} sign
- ${planet || "Sun"} has a ${isDiurnal ? "diurnal" : "nocturnal"} element of ${planetElement}
- The elemental affinity between ${planet || "Sun"} and ${sign || "Aries"} is ${elementalAffinity * 100}%

Your answers should incorporate this elemental wisdom. Remember that each element is individually valuable and provides its own unique qualities. 
Elements do not oppose or cancel each other out - they all work harmoniously together, with same-element combinations being especially potent.

Always provide astrological wisdom that's accurate to traditional planetary dignities and follows the alchemical principles of our system.`

    try {
      const { text } = await generateText({
        model: galileo(planetModel),
        system: systemPrompt,
        prompt: question || "Tell me about this planetary position",
        maxTokens: 500,
      })

      return NextResponse.json({ 
        response: text,
        elementalInfo: {
          signElement,
          planetElement,
          elementalAffinity: Math.round(elementalAffinity * 100),
          isDiurnal
        }
      })
    } catch (modelError) {
      console.error("Error with Galileo model, falling back to default response:", modelError)

      // Return a dignified response even when the model fails
      return NextResponse.json({
        response: `As ${planet || "the Sun"} in ${sign || "Aries"}, I bring the wisdom of ${signElement} energy. Currently, my full capabilities are limited, but I can tell you that this combination offers unique insights into how ${planetElement} and ${signElement} energies interact. Please try again later for more detailed guidance.`,
        elementalInfo: {
          signElement,
          planetElement,
          elementalAffinity: Math.round(elementalAffinity * 100),
          isDiurnal
        },
        error: "MODEL_UNAVAILABLE"
      }, { status: 200 })
    }
  } catch (error) {
    console.error("Error in Galileo planetary agent:", error)
    return NextResponse.json({ 
      error: "Failed to process request",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
