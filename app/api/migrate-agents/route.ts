// API endpoint to migrate static agents to database
import { NextResponse } from 'next/server'
import { HistoricalAgentsService } from '@/lib/historical-agents-db'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🚀 Starting Historical Agents Migration via API...')

    const result = await HistoricalAgentsService.migrateStaticAgents()

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Successfully migrated ${result.migrated} historical agents!`
        : `Migration completed with ${result.errors.length} errors`,
      migrated: result.migrated,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Migration API error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Migration failed due to server error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Get migration status / agent count
  try {
    const agents = await HistoricalAgentsService.getAllAgents()

    return NextResponse.json({
      totalAgents: agents.length,
      agents: agents.map(agent => ({
        id: agent.agentId,
        name: agent.name,
        title: agent.title,
        consciousnessLevel: agent.consciousnessLevel,
        monicaConstant: agent.monicaConstant,
        conversations: agent.conversations,
        lastActive: agent.lastActive,
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Migration status error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get migration status',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
