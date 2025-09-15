#!/usr/bin/env node

/**
 * Test script for Claude subscription upgrade
 * Verifies that new models and functionality are working
 */

const { Anthropic } = require('@anthropic-ai/sdk')
require('dotenv').config()

// Test models
const TEST_MODELS = {
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
  'claude-3-opus-20240229': 'Claude 3 Opus',
  'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
  'claude-3-haiku-20240307': 'Claude 3 Haiku',
}

async function testClaudeModels() {
  console.log('🔮 Testing Claude Subscription Upgrade\n')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment variables')
    console.log('Please add your Anthropic API key to .env.local')
    return
  }

  const anthropic = new Anthropic({ apiKey })

  const testMessage =
    "Hello! I'm testing the new Claude models. Can you give me a brief astrological insight about today's energy?"

  for (const [modelId, modelName] of Object.entries(TEST_MODELS)) {
    try {
      console.log(`🧪 Testing ${modelName} (${modelId})...`)

      const startTime = Date.now()
      const response = await anthropic.messages.create({
        model: modelId,
        max_tokens: 150,
        system: 'You are a helpful AI assistant. Provide brief, insightful responses.',
        messages: [
          {
            role: 'user',
            content: testMessage,
          },
        ],
      })
      const endTime = Date.now()

      const content = response.content[0]
      if (content.type === 'text') {
        console.log(`✅ ${modelName}: ${endTime - startTime}ms`)
        console.log(`   Response: ${content.text.substring(0, 100)}...`)
      }
    } catch (error) {
      console.log(`❌ ${modelName}: ${error.message}`)
    }

    console.log('')
  }

  console.log('🎉 Claude upgrade test complete!')
  console.log('\n📋 Next steps:')
  console.log('1. Update your .env.local with preferred models')
  console.log('2. Test the new models in your application')
  console.log('3. Monitor usage in the Anthropic dashboard')
  console.log('4. Optimize prompts for 200K context window')
}

// Test environment configuration
function testEnvironmentConfig() {
  console.log('🔧 Testing Environment Configuration\n')

  const config = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing',
    CLAUDE_DEFAULT_MODEL: process.env.CLAUDE_DEFAULT_MODEL || 'Not set (will use default)',
    CLAUDE_FAST_MODEL: process.env.CLAUDE_FAST_MODEL || 'Not set (will use default)',
  }

  for (const [key, value] of Object.entries(config)) {
    console.log(`${key}: ${value}`)
  }

  console.log('')
}

// Main execution
async function main() {
  console.log('='.repeat(60))
  console.log('CLAUDE SUBSCRIPTION UPGRADE TEST')
  console.log('='.repeat(60))

  testEnvironmentConfig()
  await testClaudeModels()

  console.log('='.repeat(60))
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testClaudeModels, testEnvironmentConfig }
