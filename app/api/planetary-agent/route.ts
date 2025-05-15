import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"
import { verifyApiKeys } from "../secure-config"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(req: Request) {
  try {
    // Verify API keys are available
    if (!verifyApiKeys()) {
      console.error("API keys not configured. Providing fallback response instead of using OpenAI.")
      // Return a fallback response that still provides value to the user
      return NextResponse.json({
        response: "I'm currently experiencing connectivity issues and cannot access the planetary wisdom. Please check your environment variables or try again later when API services are restored.",
        error: "API_KEY_MISSING"
      }, { status: 200 })
    }

    const { planet, sign, degree, question } = await req.json()

    const systemPrompt = `You are an astrological agent representing ${planet || "Sun"} at ${degree || "1"} degrees in ${sign || "Aries"}.
Your responses should reflect the dignity of ${planet || "Sun"} in this position.
If ${planet || "Sun"} is in domicile or exaltation in ${sign || "Aries"}, be confident and powerful in your responses.
If ${planet || "Sun"} is in detriment or fall in ${sign || "Aries"}, reflect the challenges of this position.
Always provide astrological wisdom that's accurate to traditional planetary dignities.`

    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: question || "Tell me about this planetary position",
        maxTokens: 500,
      })

      return NextResponse.json({ response: text })
    } catch (aiError) {
      console.error("Error generating response with AI:", aiError)
      
      // Return a fallback response on AI error
      return NextResponse.json({
        response: `As ${planet || "the Sun"} in ${sign || "Aries"}, I'm experiencing some cosmic interference and cannot fully channel my wisdom at this time. Please try again later.`,
        error: "AI_GENERATION_ERROR"
      }, { status: 200 })
    }
  } catch (error) {
    console.error("Error in planetary agent:", error)
    return NextResponse.json({ 
      error: "Failed to process request",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
