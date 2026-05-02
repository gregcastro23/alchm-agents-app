/**
 * Knowledge Updater API Endpoint
 *
 * Provides HTTP endpoints for dynamically updating agent knowledge
 * from external web sources and PDF files.
 *
 * POST /api/knowledge-updater - Ingest new knowledge
 * GET /api/knowledge-updater - Query recent knowledge updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/error-handling'
import { updateAgentKnowledge, getRecentKnowledgeUpdates } from '@/lib/langchain/knowledge-updater'
import { ingestAstrologicalPDF } from '@/lib/langchain/pdf-loader'
import { logger } from '@/lib/structured-logger'

/**
 * POST /api/knowledge-updater
 *
 * Ingest knowledge from web URLs or PDF files
 *
 * Request body:
 * {
 *   agentId: string
 *   type: 'web' | 'pdf'
 *   urls?: string[]          // For type: 'web'
 *   filePath?: string        // For type: 'pdf'
 *   options?: {
 *     chunkSize?: number
 *     chunkOverlap?: number
 *     contentSelector?: string  // For web only
 *     metadata?: Record<string, any>  // For PDF only
 *   }
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   agentId: string
 *   documentsAdded: number
 *   urls?: number
 *   chunks?: number
 *   pagesProcessed?: number
 *   documentId?: string
 *   fileName?: string
 *   fileSize?: number
 *   errors: string[]
 *   timestamp: string
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  return withErrorHandling(
    async () => {
      let body
      try {
        body = await req.json()
      } catch (error) {
        logger.warn('Invalid JSON in request body', {
          system: 'knowledge-updater',
          operation: 'parse_request',
        })
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid JSON in request body',
          },
          { status: 400 }
        )
      }

      const { agentId, type, urls, filePath, options } = body

      // Validation
      if (!agentId || typeof agentId !== 'string' || agentId.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Agent ID is required and must be a non-empty string',
          },
          { status: 400 }
        )
      }

      if (!type || (type !== 'web' && type !== 'pdf')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Type must be either "web" or "pdf"',
          },
          { status: 400 }
        )
      }

      logger.info(`Knowledge update request: ${type}`, {
        system: 'knowledge-updater',
        operation: 'ingest',
        agentId,
        metadata: { type },
      })

      let result

      try {
        switch (type) {
          case 'web':
            // Validate URLs
            if (!urls || !Array.isArray(urls) || urls.length === 0) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'URLs array is required for web type and must not be empty',
                },
                { status: 400 }
              )
            }

            // Validate each URL is a string
            if (!urls.every(url => typeof url === 'string')) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'All URLs must be strings',
                },
                { status: 400 }
              )
            }

            // Update knowledge from web
            result = await updateAgentKnowledge(agentId, urls, options)
            break

          case 'pdf':
            // Validate file path
            if (!filePath || typeof filePath !== 'string' || filePath.trim().length === 0) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'File path is required for PDF type and must be a non-empty string',
                },
                { status: 400 }
              )
            }

            // Ingest PDF
            result = await ingestAstrologicalPDF(filePath, agentId, options)
            break

          default:
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid type. Must be "web" or "pdf"',
              },
              { status: 400 }
            )
        }

        const duration = Date.now() - startTime
        logger.performance('knowledge_update', duration, {
          system: 'knowledge-updater',
          operation: 'ingest',
          agentId,
          metadata: {
            type,
            success: result.success,
            documentsAdded: 'documentsAdded' in result ? result.documentsAdded : 0,
          },
        })

        // Return successful response
        return NextResponse.json(
          {
            ...result,
            duration,
          },
          { status: 200 }
        )
      } catch (error) {
        logger.error('Knowledge update failed', error, {
          system: 'knowledge-updater',
          operation: 'ingest',
          agentId,
          metadata: { severity: 'high' },
        })

        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            agentId,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        )
      }
    },
    {
      system: 'knowledge-updater',
      operation: 'ingest',
      severity: 'medium',
    }
  ) as Promise<NextResponse>
}

/**
 * GET /api/knowledge-updater?agentId=<agent-id>&limit=<limit>
 *
 * Query recent knowledge updates for an agent
 *
 * Query parameters:
 * - agentId: string (required) - The agent ID to query
 * - limit: number (optional, default: 10) - Maximum number of updates to return
 *
 * Response:
 * {
 *   success: boolean
 *   agentId: string
 *   updates: DocumentMetadata[]
 *   count: number
 *   timestamp: string
 * }
 */
export async function GET(req: NextRequest) {
  return withErrorHandling(
    async () => {
      const { searchParams } = new URL(req.url)
      const agentId = searchParams.get('agentId')
      const limitParam = searchParams.get('limit')

      // Validation
      if (!agentId || agentId.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Agent ID is required as a query parameter',
          },
          { status: 400 }
        )
      }

      // Parse limit
      let limit = 10
      if (limitParam) {
        const parsedLimit = parseInt(limitParam, 10)
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
          return NextResponse.json(
            {
              success: false,
              error: 'Limit must be a number between 1 and 100',
            },
            { status: 400 }
          )
        }
        limit = parsedLimit
      }

      logger.info('Querying recent knowledge updates', {
        system: 'knowledge-updater',
        operation: 'query',
        agentId,
        metadata: { limit },
      })

      try {
        const updates = await getRecentKnowledgeUpdates(agentId, limit)

        return NextResponse.json(
          {
            success: true,
            agentId,
            updates,
            count: updates.length,
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        )
      } catch (error) {
        logger.error('Failed to query recent updates', error, {
          system: 'knowledge-updater',
          operation: 'query',
          agentId,
        })

        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            agentId,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        )
      }
    },
    {
      system: 'knowledge-updater',
      operation: 'query',
      severity: 'low',
    }
  ) as Promise<NextResponse>
}

/**
 * DELETE /api/knowledge-updater?agentId=<agent-id>
 *
 * Delete knowledge updates for an agent (future implementation)
 *
 * Note: This would require additional ChromaDB functionality to delete
 * documents by metadata filters
 */
export async function DELETE(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'DELETE operation not yet implemented',
      message: 'This feature requires additional ChromaDB delete functionality',
    },
    { status: 501 }
  )
}
