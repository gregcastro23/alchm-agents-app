/**
 * LangChain Agent Router API Endpoint
 *
 * Exposes the sophisticated LangChain ReAct agent system to the frontend.
 * Allows for complex reasoning, tool use, and multi-step agent interactions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiErrorHandling } from '@/lib/error-handling'
import { logger } from '@/lib/structured-logger'

export const runtime = 'nodejs'

/**
 * Agent Query Request Interface
 */
interface AgentQueryRequest {
  query: string
  agentId?: string
  sessionId?: string
  stream?: boolean
  options?: any
}

/**
 * POST /api/langchain-agent
 * Executes a query using the LangChain Agent Router
 */
export async function POST(req: NextRequest) {
  return withApiErrorHandling(
    async () => {
      const body: AgentQueryRequest = await req.json().catch(() => ({}) as AgentQueryRequest)

      if (!body.query || body.query.trim().length === 0) {
        return NextResponse.json({ success: false, error: 'query is required' }, { status: 400 })
      }

      const { executeAgentQuery } = await import('@/lib/langchain/agent-router')

      logger.info('LangChain agent query received', {
        system: 'langchain',
        operation: 'agent_query',
        agentId: body.agentId,
        metadata: { queryLength: body.query.length, stream: body.stream },
      })

      // Execute the query using the agent router
      // Note: Full streaming support can be added if needed by returning a ReadableStream
      const result = await executeAgentQuery(body.query)

      return {
        success: true,
        query: body.query,
        response: result.output,
        intermediateSteps: result.intermediateSteps,
        metadata: result.metadata,
      }
    },
    {
      system: 'langchain',
      operation: 'api_agent_query',
      severity: 'medium',
    }
  )
}

/**
 * GET /api/langchain-agent
 * Retrieves status or configuration of the LangChain Agent system
 */
export async function GET(_req: NextRequest) {
  return withApiErrorHandling(
    async () => {
      const { getAgentRouter } = await import('@/lib/langchain/agent-router')
      const router = await getAgentRouter()

      return {
        success: true,
        status: 'active',
        system: 'langchain-react-agent',
        capabilities: [
          'web_search',
          'astrological_calculations',
          'agent_knowledge_retrieval',
          'reasoning',
        ],
        message: 'LangChain Agent system is operational',
      }
    },
    {
      system: 'langchain',
      operation: 'api_agent_status',
      severity: 'low',
    }
  )
}
