import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { EconomyService } from '@/lib/services/economyService'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.split(' ')[1]
  if (!token || token === 'dev-desktop-token') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let site: 'agents' | 'kitchen' = 'agents'

  try {
    const apiKeyRecord = await prisma.desktopApiKey.findFirst({
      where: {
        token,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })

    if (!apiKeyRecord) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 })
    }

    const userId = apiKeyRecord.userId
    const body = await req.json().catch(() => ({}))
    site = body.site === 'kitchen' ? 'kitchen' : 'agents'

    prisma.desktopApiKey
      .update({ where: { id: apiKeyRecord.id }, data: { lastUsedAt: new Date() } })
      .catch(err => console.error('Failed to update desktop key lastUsedAt:', err))

    // Premium derivation mirrors the backend rule in
    // mcp_invocation_log.resolve_api_key_sync so the two surfaces stay
    // in agreement: a user is premium if they hold an admin/alchemist
    // role OR an active paid-equivalent subscription tier. Both lookups
    // run in parallel and fail-open to non-premium so a transient DB
    // hiccup can't block a legitimate yield claim.
    const isPremium = await deriveIsPremium(userId)

    const result =
      site === 'kitchen'
        ? await EconomyService.claimKitchenYield(userId, isPremium)
        : await EconomyService.claimAgentsYield(userId, isPremium)

    return NextResponse.json({
      success: true,
      distribution: {
        spirit: result.distribution.spirit,
        essence: result.distribution.essence,
        matter: result.distribution.matter,
        substance: result.distribution.substance,
      },
      balances: {
        spirit: Number(result.balances.spirit),
        essence: Number(result.balances.essence),
        matter: Number(result.balances.matter),
        substance: Number(result.balances.substance),
      },
    })
  } catch (error: any) {
    if (error?.message === 'Already claimed today') {
      const label = site === 'kitchen' ? 'Alchm Kitchen' : 'Alchm Agents'
      return NextResponse.json(
        {
          error: 'Cooldown active',
          message: `Your daily yield from ${label} has already been claimed today.`,
        },
        { status: 409 }
      )
    }
    console.error('Failed to claim daily yield in desktop web endpoint:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Tiers/roles that count as premium for yield purposes. The tier list
// matches backend/mcp_invocation_log.py:resolve_api_key_sync. NOTE:
// this route is intentionally STRICTER than that backend rule — it
// additionally requires the subscription to be active/trialing, so an
// expired "pro" row doesn't grant premium yield. The backend should
// adopt the same status gate; until it does, expect MCP tier-gating
// to be marginally more permissive than desktop yield.
const PREMIUM_TIERS = new Set(['alchemist', 'premium', 'pro', 'unlimited', 'paid'])
const PREMIUM_ROLES = new Set(['admin', 'alchemist'])

async function deriveIsPremium(userId: string): Promise<boolean> {
  try {
    const [user, subscription] = await Promise.all([
      prisma.users.findUnique({ where: { id: userId }, select: { role: true } }),
      prisma.userSubscription.findUnique({
        where: { userId },
        select: { tier: true, status: true },
      }),
    ])

    const roleIsPremium = user?.role ? PREMIUM_ROLES.has(user.role.toLowerCase()) : false

    // Only honor a subscription tier when the subscription is active —
    // an expired/canceled "pro" row shouldn't grant premium yield.
    const subActive = subscription?.status
      ? ['active', 'trialing'].includes(subscription.status.toLowerCase())
      : false
    const tierIsPremium =
      subActive && subscription?.tier ? PREMIUM_TIERS.has(subscription.tier.toLowerCase()) : false

    return roleIsPremium || tierIsPremium
  } catch (err) {
    // Fail open to non-premium: a DB error must not block a claim.
    console.error('deriveIsPremium failed; defaulting to non-premium:', err)
    return false
  }
}
