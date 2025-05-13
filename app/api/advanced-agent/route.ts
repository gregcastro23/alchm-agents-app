import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"
import { calculatePlanetaryPosition, getHistoricalInterpretation } from "@/lib/astrological-tools"

export async function POST(req: Request) {
  try {
    const { query, birthData } = await req.json()

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system:
        "You are an advanced astrological agent with access to precise astronomical calculations and historical texts.",
      prompt: query || "Tell me about my chart",
      tools: [calculatePlanetaryPosition, getHistoricalInterpretation],
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in advanced agent:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
