import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl = process.env.ALCHM_KITCHEN_SYNC_URL || 'https://alchm.kitchen'

    // Extract cookies to forward to alchm.kitchen
    const cookieHeader = request.headers.get('cookie') || ''

    const response = await fetch(`${baseUrl}/api/economy/balance?site=agents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    })

    if (!response.ok) {
      throw new Error(`alchm.kitchen returned status ${response.status}`)
    }

    const data = await response.json()

    // Match the expected response structure for planetary_agents frontend
    return NextResponse.json({
      ...data.balances,
      canClaimAgentsYield: data.canClaimDaily,
      streak: data.streak,
    })
  } catch (error) {
    console.error('Error fetching balances from alchm.kitchen proxy:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
