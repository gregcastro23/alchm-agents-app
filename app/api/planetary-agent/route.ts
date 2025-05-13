import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"
import { verifyApiKeys } from "../secure-config"

export async function POST(req: Request) {
  // Verify API keys are available
  if (!verifyApiKeys()) {
    return NextResponse.json(
      { error: "API keys not configured. Please set up environment variables." },
      { status: 500 },
    )
  }

  try {
    const { planet, sign, degree, question } = await req.json()

    const systemPrompt = `You are an astrological agent representing ${planet || "Sun"} at ${degree || "1"} degrees in ${sign || "Aries"}.
Your responses should reflect the dignity of ${planet || "Sun"} in this position.
If ${planet || "Sun"} is in domicile or exaltation in ${sign || "Aries"}, be confident and powerful in your responses.
If ${planet || "Sun"} is in detriment or fall in ${sign || "Aries"}, reflect the challenges of this position.
Always provide astrological wisdom that's accurate to traditional planetary dignities.`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: question || "Tell me about this planetary position",
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in planetary agent:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
