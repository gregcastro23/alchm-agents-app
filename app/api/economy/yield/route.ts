import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { EconomyService } from '@/lib/services/economyService'
import { SubscriptionService } from '@/lib/services/subscriptionService'

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (await EconomyService.hasClaimedAgentsYieldToday(userId)) {
      return NextResponse.json(
        { error: 'Cooldown active', message: 'You have already claimed your yield today.' },
        { status: 409 }
      )
    }

    const premium = await SubscriptionService.isPremium(userId)
    const result = await EconomyService.claimAgentsYield(userId, premium)

    return NextResponse.json({
      success: true,
      distribution: result.distribution,
      balances: result.balances,
      isPremium: premium,
    })
  } catch (error: any) {
    if (error.message === 'Already claimed today') {
      return NextResponse.json(
        { error: 'Cooldown active', message: 'You have already claimed your yield today.' },
        { status: 409 }
      )
    }
    console.error('Error claiming yield:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
