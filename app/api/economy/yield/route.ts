import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl = process.env.ALCHM_KITCHEN_SYNC_URL || 'https://alchm.kitchen'

    // Extract cookies to forward to alchm.kitchen
    const cookieHeader = request.headers.get('cookie') || ''

    const response = await fetch(`${baseUrl}/api/economy/claim-daily?site=agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    })

    const data = await response.json()

    if (response.status === 409) {
      return NextResponse.json(
        {
          error: 'Cooldown active',
          message: data.message || 'You have already claimed your yield today.',
        },
        { status: 409 }
      )
    }

    if (!response.ok) {
      throw new Error(data.message || `alchm.kitchen returned status ${response.status}`)
    }

    // Match the expected response structure for planetary_agents frontend
    return NextResponse.json({
      success: true,
      distribution: data.yield.distribution,
      balances: data.yield.newBalances,
      isPremium: data.yield.streakMultiplier > 1, // Optional flag for frontend
    })
  } catch (error: any) {
    console.error('Error claiming yield from alchm.kitchen proxy:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
