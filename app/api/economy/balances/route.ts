import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EconomyService } from '@/lib/services/economyService'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const balances = await EconomyService.getBalances(userId)
    const hasClaimed = await EconomyService.hasClaimedAgentsYieldToday(userId)
    return NextResponse.json({ ...balances, canClaimAgentsYield: !hasClaimed })
  } catch (error) {
    console.error('Error fetching balances:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
