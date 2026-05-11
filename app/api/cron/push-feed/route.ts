import { NextResponse } from 'next/server'
import { feedPusherService } from '@/lib/agents/feed-pusher'

/**
 * POST /api/cron/push-feed
 * 
 * Cron endpoint to trigger the evaluation of agentic feed actions and 
 * push them to the WTEN ingestion endpoint.
 */
export async function POST(request: Request) {
  try {
    // Optional: Add simple secret check to protect the cron route
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, we might not have CRON_SECRET set, so we can warn but allow it
      // or we can strictly enforce it in production.
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Unauthorized', { status: 401 })
      }
    }

    const result = await feedPusherService.evaluateAndPush()
    
    return NextResponse.json({
      success: result.success,
      pushedCount: result.pushedCount,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error executing cron push-feed:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
