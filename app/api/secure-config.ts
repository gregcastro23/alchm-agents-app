// This file demonstrates how to securely handle API keys
// IMPORTANT: Never hardcode actual API keys here

// Use environment variables instead
export const config = {
  galileoApiKey: process.env.GALILEO_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
}

// Verify keys are available (without logging them)
export function verifyApiKeys() {
  const missingKeys = []

  if (!config.galileoApiKey) missingKeys.push('GALILEO_API_KEY')
  if (!config.openaiApiKey) missingKeys.push('OPENAI_API_KEY')

  if (missingKeys.length > 0) {
    console.error(`Missing required environment variables: ${missingKeys.join(', ')}`)
    return false
  }

  return true
}
