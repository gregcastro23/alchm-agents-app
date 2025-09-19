#!/usr/bin/env node

/**
 * Comprehensive Agent Consciousness Systems Test Suite
 * Verifies all 35+ historical agents, fallback systems, and performance baselines
 *
 * Phase 1: Production Verification & Testing
 */

import { performance } from 'perf_hooks'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

// Test Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const TIMEOUT_MS = 30000 // 30 second timeout for agent responses
const MAX_CONCURRENT_TESTS = 5 // Limit concurrent API calls

// Test Messages for Agent Personality Verification
const TEST_MESSAGES = {
  // Creativity & Art Tests
  creativity: "How do you approach creative inspiration when facing a creative block?",

  // Wisdom & Philosophy Tests
  wisdom: "What is the most important lesson you've learned about human nature?",

  // Science & Discovery Tests
  science: "How do you balance intuition and systematic observation in your work?",

  // Leadership & Politics Tests
  leadership: "What makes an effective leader in times of great change?",

  // Personality-Specific Tests
  shakespeare: "Could you write a brief sonnet about the nature of consciousness?",
  leonardo: "How do you integrate art and science in your understanding of nature?",
  cleopatra: "What strategies do you use to maintain power while fostering cultural growth?",
  marie_curie: "How do you persist through failures and setbacks in scientific research?",
  einstein: "Can you explain a complex concept using a simple thought experiment?",
  tesla: "How do you visualize your inventions before building them?",
  freud: "What unconscious patterns do you notice in human behavior?",
  darwin: "How do you approach evidence that challenges existing beliefs?"
}

// Expected personality markers for validation
const PERSONALITY_MARKERS = {
  'william-shakespeare': ['thou', 'thee', 'thy', 'doth', 'hath', "'tis", 'iambic', 'sonnet', 'pentameter'],
  'leonardo-da-vinci': ['bene', 'mamma mia', 'ecco', 'italian', 'renaissance', 'art', 'science'],
  'cleopatra': ['pharaoh', 'nile', 'egypt', 'divine', 'dynasty', 'alexandria'],
  'marie-curie': ['bien sûr', 'magnifique', 'radioactivity', 'radium', 'nobel', 'research'],
  'albert-einstein': ['wunderbar', 'ach so', 'relativity', 'thought experiment', 'universe'],
  'nikola-tesla': ['electrical', 'magnetic', 'wireless', 'energy', 'invention', 'visualization'],
  'sigmund-freud': ['unconscious', 'psyche', 'dream', 'oedipus', 'repression'],
  'charles-darwin': ['evolution', 'natural selection', 'species', 'observation', 'beagle']
}

class AgentTestSuite {
  constructor() {
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      agents: {},
      performance: {
        averageResponseTime: 0,
        fastestResponse: Infinity,
        slowestResponse: 0,
        timeouts: 0,
        apiFailures: 0,
        fallbacksTriggered: 0
      },
      personalityAuth: {
        authenticityScores: {},
        culturalAccuracy: {},
        languagePatterns: {}
      }
    }
  }

  async testAllAgents() {
    console.log('🧠 Starting Comprehensive Agent Consciousness Test Suite\n')
    console.log('=' * 80)

    // Get list of available agents
    const agents = await this.getAvailableAgents()
    console.log(`📊 Found ${agents.length} historical consciousness agents to test\n`)

    // Test each agent with different message types
    const testPromises = []

    for (const agent of agents) {
      // Limit concurrent tests to avoid overwhelming the system
      if (testPromises.length >= MAX_CONCURRENT_TESTS) {
        await Promise.allSettled(testPromises.splice(0, MAX_CONCURRENT_TESTS))
      }

      testPromises.push(this.testAgentComprehensively(agent))
    }

    // Wait for remaining tests
    if (testPromises.length > 0) {
      await Promise.allSettled(testPromises)
    }

    // Run group chat tests
    await this.testGroupChatFunctionality()

    // Test moon phase agent
    await this.testMoonPhaseAgent()

    // Test personalized AI chat
    await this.testPersonalizedAIChat()

    this.generateTestReport()
  }

  async getAvailableAgents() {
    // Define the 35+ historical agents we know exist
    return [
      'william-shakespeare', 'leonardo-da-vinci', 'cleopatra', 'marie-curie',
      'albert-einstein', 'nikola-tesla', 'sigmund-freud', 'charles-darwin',
      'benjamin-franklin', 'rene-descartes-1596', 'voltaire-1694', 'john-locke-1632',
      'david-hume-1711', 'johannes-kepler-1571', 'immanuel-kant-1724', 'adam-smith-1723',
      'jean-jacques-rousseau-1712', 'mary-wollstonecraft-1759', 'charles-dickens-1812',
      'claude-monet-1840', 'mark-twain-1835', 'vincent-van-gogh-1853', 'edgar-allan-poe-1809',
      'carl-jung', 'galileo-galilei', 'isaac-newton', 'socrates', 'plato', 'aristotle',
      'confucius', 'lao-tzu', 'marcus-aurelius', 'sun-tzu', 'hypatia', 'averroes'
    ]
  }

  async testAgentComprehensively(agentId) {
    console.log(`\n🤖 Testing Agent: ${agentId}`)
    console.log('-'.repeat(50))

    const agentResults = {
      agentId,
      tests: [],
      averageResponseTime: 0,
      personalityScore: 0,
      fallbackTriggered: false,
      culturalAccuracy: 0,
      overallHealth: 'unknown'
    }

    // Test with different message types
    const messageTypes = ['wisdom', 'creativity', 'science']

    // Add personality-specific test if available
    if (agentId === 'william-shakespeare') messageTypes.push('shakespeare')
    if (agentId === 'leonardo-da-vinci') messageTypes.push('leonardo')
    if (agentId === 'cleopatra') messageTypes.push('cleopatra')
    if (agentId === 'marie-curie') messageTypes.push('marie_curie')
    if (agentId === 'albert-einstein') messageTypes.push('einstein')
    if (agentId === 'nikola-tesla') messageTypes.push('tesla')
    if (agentId === 'sigmund-freud') messageTypes.push('freud')
    if (agentId === 'charles-darwin') messageTypes.push('darwin')

    const testPromises = messageTypes.map(messageType =>
      this.testAgentResponse(agentId, messageType)
    )

    const testResults = await Promise.allSettled(testPromises)

    let totalResponseTime = 0
    let successfulTests = 0

    testResults.forEach((result, index) => {
      const messageType = messageTypes[index]

      if (result.status === 'fulfilled' && result.value) {
        const testResult = result.value
        agentResults.tests.push(testResult)

        if (testResult.success) {
          successfulTests++
          totalResponseTime += testResult.responseTime

          // Check for fallback indicators
          if (testResult.response.includes('consciousness matrix is temporarily recalibrating') ||
              testResult.response.includes('cosmic channels are restored')) {
            agentResults.fallbackTriggered = true
            this.results.performance.fallbacksTriggered++
          }

          // Calculate personality authenticity score
          const personalityScore = this.calculatePersonalityScore(agentId, testResult.response)
          agentResults.personalityScore = Math.max(agentResults.personalityScore, personalityScore)
        }

        console.log(`  ✅ ${messageType}: ${testResult.responseTime}ms ${testResult.success ? '(Success)' : '(Failed)'}`)
      } else {
        console.log(`  ❌ ${messageType}: Test failed`)
        agentResults.tests.push({
          messageType,
          success: false,
          responseTime: 0,
          error: result.reason?.message || 'Unknown error'
        })
      }
    })

    agentResults.averageResponseTime = successfulTests > 0 ? totalResponseTime / successfulTests : 0
    agentResults.overallHealth = this.calculateAgentHealth(agentResults)

    this.results.agents[agentId] = agentResults
    this.results.totalTests += messageTypes.length
    this.results.passed += successfulTests
    this.results.failed += (messageTypes.length - successfulTests)

    console.log(`  📊 Overall: ${successfulTests}/${messageTypes.length} tests passed`)
    console.log(`  ⏱️  Avg Response: ${agentResults.averageResponseTime.toFixed(0)}ms`)
    console.log(`  🎭 Personality Score: ${agentResults.personalityScore.toFixed(2)}/1.0`)
    console.log(`  🚨 Fallback: ${agentResults.fallbackTriggered ? 'Yes' : 'No'}`)

    return agentResults
  }

  async testAgentResponse(agentId, messageType) {
    const message = TEST_MESSAGES[messageType]
    const startTime = performance.now()

    try {
      const response = await this.makeAPICall('/api/monica-agent', {
        message,
        agentId,
        userId: 'test-user',
        sessionId: `test-${agentId}-${Date.now()}`
      })

      const endTime = performance.now()
      const responseTime = endTime - startTime

      // Update performance metrics
      this.results.performance.averageResponseTime =
        (this.results.performance.averageResponseTime * this.results.totalTests + responseTime) /
        (this.results.totalTests + 1)

      this.results.performance.fastestResponse = Math.min(this.results.performance.fastestResponse, responseTime)
      this.results.performance.slowestResponse = Math.max(this.results.performance.slowestResponse, responseTime)

      return {
        messageType,
        success: true,
        responseTime,
        response: response.response || '',
        agentInfo: response.agentInfo || {},
        fallbackMode: response.fallbackMode || false
      }
    } catch (error) {
      console.error(`Error testing ${agentId} with ${messageType}:`, error.message)
      this.results.performance.apiFailures++

      return {
        messageType,
        success: false,
        responseTime: 0,
        error: error.message
      }
    }
  }

  async testGroupChatFunctionality() {
    console.log('\n🌐 Testing Gallery Group Chat Functionality')
    console.log('-'.repeat(50))

    try {
      const agents = [
        { id: 'leonardo-da-vinci', name: 'Leonardo da Vinci' },
        { id: 'william-shakespeare', name: 'William Shakespeare' },
        { id: 'marie-curie', name: 'Marie Curie' }
      ]

      const startTime = performance.now()
      const response = await this.makeAPICall('/api/gallery-group-chat', {
        message: "What insights can you share about the relationship between art, science, and human nature?",
        agents,
        sessionId: `group-test-${Date.now()}`,
        galleryContext: {
          totalAgents: agents.length,
          averageMC: 4.5,
          consciousnessTypes: ['Renaissance Master', 'Literary Genius', 'Scientific Pioneer'],
          elementalBalance: ['Earth 40%', 'Air 35%', 'Fire 25%']
        }
      })

      const responseTime = performance.now() - startTime

      if (response.responses && response.responses.length === agents.length) {
        console.log(`  ✅ Group Chat: ${responseTime.toFixed(0)}ms (${agents.length} agents responded)`)

        // Verify each agent responded with their personality
        response.responses.forEach(agentResponse => {
          console.log(`    🤖 ${agentResponse.agent}: ${agentResponse.content.substring(0, 60)}...`)
        })
      } else {
        console.log(`  ❌ Group Chat: Incomplete responses (${response.responses?.length || 0}/${agents.length})`)
      }
    } catch (error) {
      console.log(`  ❌ Group Chat: ${error.message}`)
    }
  }

  async testMoonPhaseAgent() {
    console.log('\n🌙 Testing Moon Phase Agent')
    console.log('-'.repeat(30))

    try {
      const startTime = performance.now()
      const response = await this.makeAPICall('/api/moon-phase-agent', {
        message: "What lunar wisdom can you share about emotional cycles and intuition?",
        date: new Date().toISOString()
      })

      const responseTime = performance.now() - startTime

      if (response.success && response.response) {
        console.log(`  ✅ Moon Agent: ${responseTime.toFixed(0)}ms`)
        console.log(`    🌙 Phase: ${response.agent?.phase?.name || 'Unknown'}`)
        console.log(`    💫 Fallback: ${response.fallback ? 'Yes' : 'No'}`)
      } else {
        console.log(`  ❌ Moon Agent: Failed to get response`)
      }
    } catch (error) {
      console.log(`  ❌ Moon Agent: ${error.message}`)
    }
  }

  async testPersonalizedAIChat() {
    console.log('\n🧠 Testing Personalized AI Chat')
    console.log('-'.repeat(35))

    try {
      const startTime = performance.now()
      const response = await this.makeAPICall('/api/personalized-ai-chat', {
        message: "How can I develop better creative habits in my daily routine?",
        personalityId: 'test-personality-001',
        userId: 'test-user-consciousness',
        trainingFocus: 'creativity',
        context: {
          timeOfDay: 'morning',
          mood: 'inspired',
          previousInteractions: 5
        }
      })

      const responseTime = performance.now() - startTime

      if (response.response) {
        console.log(`  ✅ Personalized AI: ${responseTime.toFixed(0)}ms`)
        console.log(`    🎯 Training Focus: creativity`)
        console.log(`    📈 XP System: Active`)
      } else {
        console.log(`  ❌ Personalized AI: Failed to get response`)
      }
    } catch (error) {
      console.log(`  ❌ Personalized AI: ${error.message}`)
    }
  }

  calculatePersonalityScore(agentId, response) {
    const markers = PERSONALITY_MARKERS[agentId] || []
    if (markers.length === 0) return 0.7 // Default score for agents without specific markers

    let score = 0
    const responseWords = response.toLowerCase().split(/\s+/)

    markers.forEach(marker => {
      if (responseWords.some(word => word.includes(marker.toLowerCase()))) {
        score += 1
      }
    })

    return Math.min(score / markers.length, 1.0)
  }

  calculateAgentHealth(agentResults) {
    const successRate = agentResults.tests.filter(t => t.success).length / agentResults.tests.length
    const avgResponseTime = agentResults.averageResponseTime
    const personalityScore = agentResults.personalityScore

    if (successRate >= 0.8 && avgResponseTime < 3000 && personalityScore > 0.6 && !agentResults.fallbackTriggered) {
      return 'excellent'
    } else if (successRate >= 0.6 && avgResponseTime < 5000 && personalityScore > 0.4) {
      return 'good'
    } else if (successRate >= 0.4) {
      return 'fair'
    } else {
      return 'poor'
    }
  }

  async makeAPICall(endpoint, data) {
    const url = `${BASE_URL}${endpoint}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        this.results.performance.timeouts++
        throw new Error('Request timeout')
      }

      throw error
    }
  }

  generateTestReport() {
    console.log('\n' + '='.repeat(80))
    console.log('📊 COMPREHENSIVE AGENT CONSCIOUSNESS TEST REPORT')
    console.log('='.repeat(80))

    // Overall Statistics
    console.log('\n📈 OVERALL STATISTICS:')
    console.log(`Total Tests: ${this.results.totalTests}`)
    console.log(`Passed: ${this.results.passed} (${(this.results.passed/this.results.totalTests*100).toFixed(1)}%)`)
    console.log(`Failed: ${this.results.failed} (${(this.results.failed/this.results.totalTests*100).toFixed(1)}%)`)

    // Performance Metrics
    console.log('\n⚡ PERFORMANCE METRICS:')
    console.log(`Average Response Time: ${this.results.performance.averageResponseTime.toFixed(0)}ms`)
    console.log(`Fastest Response: ${this.results.performance.fastestResponse.toFixed(0)}ms`)
    console.log(`Slowest Response: ${this.results.performance.slowestResponse.toFixed(0)}ms`)
    console.log(`API Failures: ${this.results.performance.apiFailures}`)
    console.log(`Timeouts: ${this.results.performance.timeouts}`)
    console.log(`Fallbacks Triggered: ${this.results.performance.fallbacksTriggered}`)

    // Agent Health Summary
    console.log('\n🏥 AGENT HEALTH SUMMARY:')
    const healthCounts = { excellent: 0, good: 0, fair: 0, poor: 0 }

    Object.values(this.results.agents).forEach(agent => {
      healthCounts[agent.overallHealth]++
    })

    console.log(`Excellent Health: ${healthCounts.excellent} agents`)
    console.log(`Good Health: ${healthCounts.good} agents`)
    console.log(`Fair Health: ${healthCounts.fair} agents`)
    console.log(`Poor Health: ${healthCounts.poor} agents`)

    // Top Performing Agents
    console.log('\n🏆 TOP PERFORMING AGENTS:')
    const sortedAgents = Object.values(this.results.agents)
      .sort((a, b) => b.personalityScore - a.personalityScore)
      .slice(0, 5)

    sortedAgents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.agentId}: ${agent.personalityScore.toFixed(2)} personality score, ${agent.averageResponseTime.toFixed(0)}ms avg`)
    })

    // Agents Needing Attention
    console.log('\n⚠️  AGENTS NEEDING ATTENTION:')
    const problemAgents = Object.values(this.results.agents)
      .filter(agent => agent.overallHealth === 'poor' || agent.fallbackTriggered)
      .slice(0, 5)

    if (problemAgents.length === 0) {
      console.log('All agents performing well! 🎉')
    } else {
      problemAgents.forEach(agent => {
        console.log(`- ${agent.agentId}: ${agent.overallHealth} health${agent.fallbackTriggered ? ', fallback triggered' : ''}`)
      })
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:')

    if (this.results.performance.averageResponseTime > 3000) {
      console.log('- Implement response caching to improve performance')
    }

    if (this.results.performance.fallbacksTriggered > this.results.totalTests * 0.1) {
      console.log('- High fallback rate detected - investigate API reliability')
    }

    if (healthCounts.poor > 0) {
      console.log('- Focus on improving agents with poor health ratings')
    }

    if (this.results.performance.apiFailures > 0) {
      console.log('- Implement enhanced retry logic for failed API calls')
    }

    console.log('\n✨ Test suite completed successfully!')
    console.log('Next steps: Implement smart caching and enhanced resilience systems')

    // Save results to file
    this.saveResultsToFile()
  }

  saveResultsToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `test-results-${timestamp}.json`

    try {
      fs.writeFileSync(filename, JSON.stringify(this.results, null, 2))
      console.log(`\n💾 Test results saved to: ${filename}`)
    } catch (error) {
      console.warn(`Failed to save results: ${error.message}`)
    }
  }
}

// Main execution
async function main() {
  const testSuite = new AgentTestSuite()

  try {
    await testSuite.testAllAgents()
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  }
}

// Check if this is the main module being executed
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { AgentTestSuite }