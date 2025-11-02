// This file demonstrates how to securely handle API keys
// IMPORTANT: Never hardcode actual API keys here

// Use environment variables instead
export const config = {
  galileoApiKey: process.env.GALILEO_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
}

// Verify keys are available (without logging them)
export function verifyApiKeys() {
  // Check for at least ONE AI provider key (OpenAI OR Anthropic)
  const hasOpenAI = !!config.openaiApiKey
  const hasAnthropic = !!config.anthropicApiKey
  
  if (!hasOpenAI && !hasAnthropic) {
    console.error('Missing AI API keys: Need either OPENAI_API_KEY or ANTHROPIC_API_KEY')
    return false
  }

  // Galileo is optional
  if (!config.galileoApiKey) {
    console.warn('GALILEO_API_KEY not set (optional for observability)')
  }

  console.log(`API Keys available - OpenAI: ${hasOpenAI}, Anthropic: ${hasAnthropic}`)
  return true
}

