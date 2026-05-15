/**
 * scripts/backfill-agent-sync.ts
 *
 * One-shot backfill: push every isAgentic=true user through the WhatToEatNext
 * /api/internal/agent-sync endpoint, then write the returned wtenUserId back
 * into users.alchmKitchenUserId.
 *
 * Required env vars:
 *   ALCHM_KITCHEN_SYNC_SECRET  — shared secret for the WTEN sync endpoint
 *   WTEN_API_BASE_URL          — e.g. https://whattoeatnext-production.up.railway.app
 *
 * Run:
 *   ALCHM_KITCHEN_SYNC_SECRET=... WTEN_API_BASE_URL=... bun run scripts/backfill-agent-sync.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const WTEN_SECRET = process.env.ALCHM_KITCHEN_SYNC_SECRET
const WTEN_BASE = (process.env.WTEN_API_BASE_URL ?? '').replace(/\/$/, '')

if (!WTEN_SECRET || !WTEN_BASE) {
  console.error('Missing required env vars: ALCHM_KITCHEN_SYNC_SECRET, WTEN_API_BASE_URL')
  process.exit(1)
}

async function main() {
  const agents = await prisma.users.findMany({
    where: { isAgentic: true },
    select: { id: true, email: true, name: true, alchmKitchenUserId: true },
    orderBy: { email: 'asc' },
  })

  console.log(`Found ${agents.length} agentic users to sync.`)

  let synced = 0
  let skipped = 0
  let failed = 0

  for (const agent of agents) {
    if (agent.alchmKitchenUserId) {
      console.log(`SKIP already linked: ${agent.email} → ${agent.alchmKitchenUserId}`)
      skipped++
      continue
    }

    const t0 = Date.now()
    let resp: Response
    try {
      resp = await fetch(`${WTEN_BASE}/api/internal/agent-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Secret': WTEN_SECRET,
        },
        body: JSON.stringify({
          email: agent.email,
          displayName: agent.name ?? undefined,
        }),
      })
    } catch (fetchErr) {
      console.error(`FAIL network error for ${agent.email}:`, fetchErr)
      failed++
      continue
    }

    const elapsed = Date.now() - t0

    if (!resp.ok) {
      const text = await resp.text().catch(() => '(unreadable)')
      console.error(`FAIL HTTP ${resp.status} for ${agent.email}: ${text}`)
      failed++
      continue
    }

    const data = (await resp.json()) as { ok: boolean; wtenUserId?: string; created?: boolean }

    if (!data.ok || !data.wtenUserId) {
      console.error(`FAIL bad response for ${agent.email}:`, JSON.stringify(data))
      failed++
      continue
    }

    await prisma.users.update({
      where: { id: agent.id },
      data: { alchmKitchenUserId: data.wtenUserId },
    })

    console.log(
      `OK email=${agent.email} wtenUserId=${data.wtenUserId} created=${data.created} elapsed_ms=${elapsed}`
    )
    synced++
  }

  console.log(`\nBackfill complete — synced: ${synced}, skipped: ${skipped}, failed: ${failed}`)
  if (failed > 0) {
    console.error(`${failed} agents still have no alchmKitchenUserId — review errors above.`)
    process.exitCode = 1
  }
}

main()
  .catch(err => {
    console.error('Fatal:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
