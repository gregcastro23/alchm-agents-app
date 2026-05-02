/**
 * LangChain Agent Router
 * ReAct pattern implementation for agent orchestration
 */

import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { planetaryAgentTools } from './agent-tools'
import { BufferMemory } from '@langchain/classic/memory'
import type { BaseMessage } from '@langchain/core/messages'
import { CLAUDE, OPENAI } from '../models/registry'

export interface AgentRouterConfig {
  model?: 'openai' | 'anthropic'
  temperature?: number
  maxIterations?: number
  enableMemory?: boolean
}

export interface AgentRouterResponse {
  output: string
  intermediateSteps?: any[]
  toolCalls?: string[]
  error?: string
}

/**
 * Agent Router using ReAct pattern
 */
export class AgentRouter {
  private executor: AgentExecutor | null = null
  private config: AgentRouterConfig
  private memory: BufferMemory | null = null

  constructor(config: AgentRouterConfig = {}) {
    this.config = {
      model: config.model || 'openai',
      temperature: config.temperature || 0.7,
      maxIterations: config.maxIterations || 5,
      enableMemory: config.enableMemory !== false,
    }
  }

  /**
   * Initialize the agent executor
   */
  async initialize(): Promise<void> {
    try {
      console.log('[AgentRouter] Initializing...')

      // Initialize LLM based on model choice
      const aiGatewayEnabled = String(process.env.AI_GATEWAY_ENABLED).toLowerCase() === 'true'
      const llm =
        this.config.model === 'anthropic'
          ? new ChatAnthropic({
              modelName: CLAUDE.SONNET,
              temperature: this.config.temperature,
              anthropicApiKey: aiGatewayEnabled
                ? process.env.AI_GATEWAY_API_KEY
                : process.env.ANTHROPIC_API_KEY,
              // LangChain Anthropic supports baseURL
              baseURL: aiGatewayEnabled ? process.env.AI_GATEWAY_URL : undefined,
            })
          : new ChatOpenAI({
              modelName: OPENAI.GPT_5_4_MINI,
              temperature: this.config.temperature,
              openAIApiKey: aiGatewayEnabled
                ? process.env.AI_GATEWAY_API_KEY
                : process.env.OPENAI_API_KEY,
              baseURL: aiGatewayEnabled ? process.env.AI_GATEWAY_URL : undefined,
            })

      // Initialize memory if enabled
      if (this.config.enableMemory) {
        this.memory = new BufferMemory({
          returnMessages: true,
          memoryKey: 'chat_history',
        })
      }

      // Create agent prompt
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are an intelligent orchestrator for the Planetary Agents system.
You have access to tools for semantic search, knowledge retrieval, consciousness analysis, and multi-agent coordination.

Your role is to:
1. Understand user queries about agents, wisdom, and consciousness
2. Use available tools to find relevant information
3. Coordinate multiple agents when needed for complex questions
4. Provide insightful, context-aware responses

Available tools:
- semantic_agent_search: Find agents by concept/topic
- knowledge_retrieval: Get relevant knowledge from agent wisdom
- consciousness_analysis: Analyze agent consciousness and synergy
- multi_agent_coordinator: Assemble agent councils for complex queries
- memory_retrieval: Access conversation history and context

Be thoughtful, precise, and leverage the tools effectively.`,
        ],
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}'],
      ])

      // Create agent
      const agent = await createOpenAIFunctionsAgent({
        llm,
        tools: planetaryAgentTools,
        prompt,
      })

      // Create executor
      this.executor = new AgentExecutor({
        agent,
        tools: planetaryAgentTools,
        maxIterations: this.config.maxIterations,
        memory: this.memory || undefined,
        verbose: true,
      })

      console.log('[AgentRouter] Initialized successfully')
    } catch (error) {
      console.error('[AgentRouter] Initialization failed:', error)
      throw new Error(`Agent router initialization failed: ${error}`)
    }
  }

  /**
   * Execute agent with query
   */
  async execute(query: string): Promise<AgentRouterResponse> {
    if (!this.executor) {
      throw new Error('Agent router not initialized. Call initialize() first.')
    }

    try {
      console.log(`[AgentRouter] Executing query: "${query}"`)

      const result = await this.executor.invoke({
        input: query,
      })

      return {
        output: result.output,
        intermediateSteps: result.intermediateSteps,
        toolCalls: this.extractToolCalls(result.intermediateSteps),
      }
    } catch (error) {
      console.error('[AgentRouter] Execution failed:', error)
      return {
        output: '',
        error: `Execution failed: ${error}`,
      }
    }
  }

  /**
   * Execute with streaming
   */
  async executeStream(
    query: string,
    onToken: (token: string) => void
  ): Promise<AgentRouterResponse> {
    if (!this.executor) {
      throw new Error('Agent router not initialized. Call initialize() first.')
    }

    try {
      console.log(`[AgentRouter] Streaming query: "${query}"`)

      const result = await this.executor.invoke(
        {
          input: query,
        },
        {
          callbacks: [
            {
              handleLLMNewToken(token: string) {
                onToken(token)
              },
            },
          ],
        }
      )

      return {
        output: result.output,
        intermediateSteps: result.intermediateSteps,
        toolCalls: this.extractToolCalls(result.intermediateSteps),
      }
    } catch (error) {
      console.error('[AgentRouter] Streaming execution failed:', error)
      return {
        output: '',
        error: `Streaming execution failed: ${error}`,
      }
    }
  }

  /**
   * Extract tool calls from intermediate steps
   */
  private extractToolCalls(intermediateSteps?: any[]): string[] {
    if (!intermediateSteps) return []

    return intermediateSteps
      .map((step) => {
        if (step.action && step.action.tool) {
          return step.action.tool
        }
        return null
      })
      .filter((tool): tool is string => tool !== null)
  }

  /**
   * Clear conversation memory
   */
  async clearMemory(): Promise<void> {
    if (this.memory) {
      await this.memory.clear()
      console.log('[AgentRouter] Memory cleared')
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(): Promise<BaseMessage[]> {
    if (!this.memory) return []

    const history = await this.memory.loadMemoryVariables({})
    return history.chat_history || []
  }
}

/**
 * Global agent router instance
 */
let agentRouterInstance: AgentRouter | null = null

/**
 * Get or create agent router
 */
export async function getAgentRouter(config?: AgentRouterConfig): Promise<AgentRouter> {
  if (!agentRouterInstance) {
    agentRouterInstance = new AgentRouter(config)
    await agentRouterInstance.initialize()
  }
  return agentRouterInstance
}

/**
 * Execute query with agent router (convenience function)
 */
export async function executeAgentQuery(query: string): Promise<AgentRouterResponse> {
  const router = await getAgentRouter()
  return await router.execute(query)
}
