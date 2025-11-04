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
  
  // Log key prefixes (first 10 chars) for debugging without exposing full keys
  console.log('[API Keys] OpenAI present:', hasOpenAI, hasOpenAI ? `(starts with ${config.openaiApiKey?.substring(0, 10)}...)` : '')
  console.log('[API Keys] Anthropic present:', hasAnthropic, hasAnthropic ? `(starts with ${config.anthropicApiKey?.substring(0, 10)}...)` : '')
  console.log('[API Keys] Galileo present:', !!config.galileoApiKey)
  
  if (!hasOpenAI && !hasAnthropic) {
    console.error('[API Keys] CRITICAL: Missing AI API keys! Need either OPENAI_API_KEY or ANTHROPIC_API_KEY')
    console.error('[API Keys] Environment variables loaded:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')))
    return false
  }

  // Galileo is optional
  if (!config.galileoApiKey) {
    console.warn('[API Keys] GALILEO_API_KEY not set (optional for observability)')
  }

  console.log(`[API Keys] Verification passed - OpenAI: ${hasOpenAI}, Anthropic: ${hasAnthropic}`)
  return true
}

