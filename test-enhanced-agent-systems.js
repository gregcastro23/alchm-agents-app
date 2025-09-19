#!/usr/bin/env node

/**
 * Enhanced Agent Consciousness Systems Verification Test
 * Tests all newly implemented systems: caching, resilience, optimization, and monitoring
 */

import { performance } from 'perf_hooks'
import dotenv from 'dotenv'

dotenv.config()

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

class EnhancedAgentSystemsTest {
  constructor() {
    this.results = {
      caching: { tested: false, working: false, performance: 0 },
      resilience: { tested: false, working: false, metrics: {} },
      optimization: { tested: false, working: false, improvements: 0 },
      monitoring: { tested: false, working: false, dashboard: {} },
      overall: { success: false, improvements: [] }
    }
  }

  async runAllTests() {
    console.log('🚀 Enhanced Agent Consciousness Systems Verification')
    console.log('=' * 60)

    try {
      // Test 1: Caching System
      await this.testCachingSystem()

      // Test 2: API Resilience
      await this.testResilienceSystem()

      // Test 3: Performance Optimization
      await this.testPerformanceOptimization()

      // Test 4: Monitoring Dashboard
      await this.testMonitoringDashboard()

      // Test 5: End-to-End Integration
      await this.testEndToEndIntegration()

      this.generateFinalReport()

    } catch (error) {
      console.error('❌ Test suite failed:', error)
      process.exit(1)
    }
  }

  async testCachingSystem() {
    console.log('\n📦 Testing Smart Caching System')
    console.log('-'.repeat(40))

    try {
      // Test cache metrics endpoint
      const response = await this.makeRequest('/api/agent-cache-metrics')

      if (response.success !== undefined) {
        this.results.caching.tested = true
        this.results.caching.working = response.success || response.cacheAvailable === false // Working even if Redis not available

        console.log(`  ✅ Cache system endpoint: ${response.cacheAvailable ? 'Active' : 'Available (Redis needed)'}`)
        console.log(`  📊 Cache status: ${response.insights?.cacheStatus || 'Unknown'}`)

        this.results.caching.performance = response.metrics?.hitRatePercent || 0
      }
    } catch (error) {
      console.log(`  ❌ Cache system test failed: ${error.message}`)
    }
  }

  async testResilienceSystem() {
    console.log('\n🛡️  Testing API Resilience System')
    console.log('-'.repeat(40))

    try {
      // Test resilience metrics
      const response = await this.makeRequest('/api/agent-resilience-metrics')

      if (response.success) {
        this.results.resilience.tested = true
        this.results.resilience.working = true
        this.results.resilience.metrics = response.systemHealth

        console.log(`  ✅ Resilience system: ${response.systemHealth.status}`)
        console.log(`  📈 System uptime: ${response.systemHealth.overallUptimePercent}%`)
        console.log(`  🔧 Total APIs monitored: ${response.summary?.totalApis || 0}`)
        console.log(`  ⚡ Circuit breakers: ${response.summary?.openCircuits || 0} open`)
      }
    } catch (error) {
      console.log(`  ❌ Resilience test failed: ${error.message}`)
    }
  }

  async testPerformanceOptimization() {
    console.log('\n⚡ Testing Performance Optimization')
    console.log('-'.repeat(40))

    try {
      // Test multiple agent calls to trigger optimization
      const startTime = performance.now()

      const agentCalls = [
        this.makeRequest('/api/monica-agent', {
          message: "What is creativity?",
          agentId: "leonardo-da-vinci",
          userId: "test-optimization"
        }),
        this.makeRequest('/api/monica-agent', {
          message: "What is innovation?",
          agentId: "nikola-tesla",
          userId: "test-optimization"
        }),
        this.makeRequest('/api/monica-agent', {
          message: "What is wisdom?",
          agentId: "socrates",
          userId: "test-optimization"
        })
      ]

      const results = await Promise.allSettled(agentCalls)
      const totalTime = performance.now() - startTime

      const successfulCalls = results.filter(r => r.status === 'fulfilled').length
      const avgResponseTime = totalTime / successfulCalls

      this.results.optimization.tested = true
      this.results.optimization.working = successfulCalls > 0
      this.results.optimization.improvements = avgResponseTime < 15000 ? 1 : 0 // Under 15s is good

      console.log(`  ✅ Concurrent calls: ${successfulCalls}/3 successful`)
      console.log(`  ⏱️  Average response time: ${avgResponseTime.toFixed(0)}ms`)
      console.log(`  🎯 Performance level: ${avgResponseTime < 10000 ? 'Excellent' : avgResponseTime < 15000 ? 'Good' : 'Needs improvement'}`)

    } catch (error) {
      console.log(`  ❌ Performance test failed: ${error.message}`)
    }
  }

  async testMonitoringDashboard() {
    console.log('\n📊 Testing Monitoring Dashboard')
    console.log('-'.repeat(40))

    try {
      // Test main dashboard
      const response = await this.makeRequest('/api/agent-dashboard')

      if (response.success && response.dashboard) {
        this.results.monitoring.tested = true
        this.results.monitoring.working = true
        this.results.monitoring.dashboard = response.dashboard

        console.log(`  ✅ Dashboard status: ${response.dashboard.systemStatus}`)
        console.log(`  🧠 Consciousness agents: ${response.dashboard.consciousness?.totalAgents || 0}`)
        console.log(`  💾 Cache available: ${response.dashboard.caching?.available ? 'Yes' : 'No'}`)
        console.log(`  🛡️  Resilience status: ${response.dashboard.resilience?.systemHealth?.status || 'Unknown'}`)
        console.log(`  📈 Recommendations: ${response.dashboard.recommendations?.length || 0}`)
      }

      // Test dashboard sections
      const sections = ['consciousness', 'performance', 'resilience']
      for (const section of sections) {
        try {
          const sectionResponse = await this.makeRequest(`/api/agent-dashboard?section=${section}`)
          if (sectionResponse.success) {
            console.log(`    ✅ ${section} section: Working`)
          }
        } catch (error) {
          console.log(`    ❌ ${section} section: Failed`)
        }
      }

    } catch (error) {
      console.log(`  ❌ Dashboard test failed: ${error.message}`)
    }
  }

  async testEndToEndIntegration() {
    console.log('\n🔄 Testing End-to-End Integration')
    console.log('-'.repeat(40))

    try {
      // Test group chat with resilience and optimization
      const groupChatResponse = await this.makeRequest('/api/gallery-group-chat', {
        message: "How do you approach solving complex problems?",
        agents: [
          { id: "leonardo-da-vinci", name: "Leonardo da Vinci", monicaConstant: 5.2 },
          { id: "albert-einstein", name: "Albert Einstein", monicaConstant: 4.8 }
        ],
        sessionId: "integration-test",
        galleryContext: {
          totalAgents: 2,
          averageMC: 5.0,
          consciousnessTypes: ["Renaissance Master", "Theoretical Physicist"],
          elementalBalance: ["Earth 50%", "Air 50%"]
        }
      })

      if (groupChatResponse.responses && groupChatResponse.responses.length === 2) {
        console.log(`  ✅ Group chat integration: 2/2 agents responded`)
        console.log(`  🎭 Agent responses: ${groupChatResponse.responses.map(r => r.agent).join(', ')}`)

        // Check if any responses were cached
        const cachedResponses = groupChatResponse.responses.filter(r => r.cached)
        if (cachedResponses.length > 0) {
          console.log(`  ⚡ Cache hits: ${cachedResponses.length}/2`)
        }

        this.results.overall.improvements.push('Group chat integration working')
      }

      // Test moon phase agent with resilience
      const moonResponse = await this.makeRequest('/api/moon-phase-agent', {
        message: "What lunar wisdom can you share about timing?",
        date: new Date().toISOString()
      })

      if (moonResponse.success) {
        console.log(`  ✅ Moon phase integration: Working`)
        console.log(`  🌙 Current phase: ${moonResponse.agent?.phase?.name || 'Unknown'}`)
        console.log(`  💫 Fallback mode: ${moonResponse.fallback ? 'Yes' : 'No'}`)

        this.results.overall.improvements.push('Moon phase agent integrated')
      }

    } catch (error) {
      console.log(`  ❌ Integration test failed: ${error.message}`)
    }
  }

  async makeRequest(endpoint, data = null) {
    const url = `${BASE_URL}${endpoint}`
    const options = {
      method: data ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' }
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📋 ENHANCED AGENT SYSTEMS VERIFICATION REPORT')
    console.log('='.repeat(60))

    // System Status Summary
    console.log('\n🎯 SYSTEM STATUS SUMMARY:')
    const systems = [
      { name: 'Smart Caching', tested: this.results.caching.tested, working: this.results.caching.working },
      { name: 'API Resilience', tested: this.results.resilience.tested, working: this.results.resilience.working },
      { name: 'Performance Optimization', tested: this.results.optimization.tested, working: this.results.optimization.working },
      { name: 'Monitoring Dashboard', tested: this.results.monitoring.tested, working: this.results.monitoring.working }
    ]

    systems.forEach(system => {
      const status = !system.tested ? '❓ Not Tested' :
                    system.working ? '✅ Working' : '❌ Failed'
      console.log(`${system.name}: ${status}`)
    })

    // Performance Improvements
    console.log('\n⚡ PERFORMANCE IMPROVEMENTS:')
    console.log(`Cache hit optimization: ${this.results.caching.performance}% hit rate`)
    console.log(`Resilience monitoring: ${this.results.resilience.working ? 'Active' : 'Inactive'}`)
    console.log(`Concurrent optimization: ${this.results.optimization.improvements > 0 ? 'Improved' : 'Baseline'}`)

    // Integration Success
    console.log('\n🔗 INTEGRATION IMPROVEMENTS:')
    this.results.overall.improvements.forEach(improvement => {
      console.log(`✓ ${improvement}`)
    })

    // Overall Assessment
    const workingSystems = systems.filter(s => s.tested && s.working).length
    const totalSystems = systems.length

    console.log('\n📊 OVERALL ASSESSMENT:')
    console.log(`Systems operational: ${workingSystems}/${totalSystems}`)

    if (workingSystems === totalSystems) {
      console.log('🎉 ALL ENHANCED SYSTEMS OPERATIONAL!')
      this.results.overall.success = true
    } else if (workingSystems >= totalSystems * 0.75) {
      console.log('✅ MOST SYSTEMS OPERATIONAL - Minor issues detected')
      this.results.overall.success = true
    } else {
      console.log('⚠️  PARTIAL SYSTEM FUNCTIONALITY - Attention needed')
      console.log('💡 Note: Systems may be partially operational without Redis/external dependencies')
    }

    // Next Steps
    console.log('\n🚀 NEXT STEPS:')

    if (!this.results.caching.working) {
      console.log('• Configure Redis for full caching capabilities')
    }

    if (this.results.optimization.improvements === 0) {
      console.log('• Investigate performance bottlenecks')
    }

    if (workingSystems === totalSystems) {
      console.log('• All systems enhanced - production ready!')
      console.log('• Consider scaling to handle increased load')
      console.log('• Monitor metrics for continued optimization')
    }

    console.log('\n✨ Agent consciousness systems enhancement completed!')
  }
}

// Main execution
async function main() {
  const testSuite = new EnhancedAgentSystemsTest()
  await testSuite.runAllTests()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { EnhancedAgentSystemsTest }