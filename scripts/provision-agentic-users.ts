/**
 * Agentic User Provisioning Script
 * =================================
 *
 * Creates agentic user records in the database for each historical agent
 * that doesn't already have a corresponding user row.
 *
 * Each agentic user gets:
 *  - A deterministic email: `{agentId}@agentic.alchm.kitchen`
 *  - `isAgentic: true` flag on the `users` table
 *  - A `user_profiles` row with natal chart data extracted from the
 *    `historical_agents` table (including natalPositions for DailyYieldService)
 *  - A zero-balance `token_balances` row so yield claims work immediately
 *
 * Usage:
 *   npx tsx scripts/provision-agentic-users.ts
 *   # or
 *   yarn tsx scripts/provision-agentic-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProvisionResult {
  created: number
  skipped: number
  errors: string[]
}

async function provisionAgenticUsers(): Promise<ProvisionResult> {
  const result: ProvisionResult = { created: 0, skipped: 0, errors: [] }

  // Fetch all active historical agents
  const historicalAgents = await prisma.historical_agents.findMany({
    where: { isActive: true },
    select: {
      agentId: true,
      name: true,
      natalChart: true,
      dominantElement: true,
      monicaConstant: true,
      birthDate: true,
      birthTime: true,
      birthLocation: true,
      spiritScore: true,
      essenceScore: true,
      matterScore: true,
      substanceScore: true,
    },
  })

  console.log(`Found ${historicalAgents.length} historical agents to provision`)

  for (const agent of historicalAgents) {
    const email = `${agent.agentId}@agentic.alchm.kitchen`

    try {
      // Check if user already exists
      const existing = await prisma.users.findUnique({ where: { email } })
      if (existing) {
        // Ensure isAgentic flag is set
        if (!(existing as any).isAgentic) {
          await prisma.users.update({
            where: { id: existing.id },
            data: { isAgentic: true } as any,
          })
          console.log(`  ↻ Updated ${agent.name} → isAgentic=true`)
        } else {
          console.log(`  ⊘ Skipped ${agent.name} (already provisioned)`)
        }
        result.skipped++
        continue
      }

      // Extract natalPositions array from natalChart JSON
      const natalPositions = extractNatalPositions(agent.natalChart)

      // Create user + profile in a transaction
      await prisma.$transaction(async (tx) => {
        const user = await tx.users.create({
          data: {
            email,
            name: agent.name,
            provider: 'agentic',
            role: 'agent',
            isAgentic: true,
            verified: true,
          } as any,
        })

        await tx.user_profiles.create({
          data: {
            userId: user.id,
            birthDate: agent.birthDate,
            birthTime: agent.birthTime,
            birthLocation: agent.birthLocation as any,
            natalChart: agent.natalChart as any,
            natalPositions: natalPositions as any,
            monicaConstant: agent.monicaConstant,
            dominantElement: agent.dominantElement,
          },
        })

        // Seed zero-balance token row so yield claims don't fail
        await tx.tokenBalance.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            spirit: 0,
            essence: 0,
            matter: 0,
            substance: 0,
            updatedAt: new Date(),
          },
          update: {},
        })

        console.log(`  ✓ Provisioned ${agent.name} → ${email} (${user.id})`)
      })

      result.created++
    } catch (err: any) {
      const msg = `Failed to provision ${agent.name}: ${err?.message ?? err}`
      console.error(`  ✗ ${msg}`)
      result.errors.push(msg)
    }
  }

  return result
}

/**
 * Extract a flat NatalPosition[] array from whatever shape the
 * natalChart JSON might be in.
 */
function extractNatalPositions(natalChart: any): any[] {
  if (!natalChart) return []

  try {
    // Shape: { planets: { Sun: { sign, signDegree, longitude, ... }, ... } }
    if (natalChart.planets && typeof natalChart.planets === 'object') {
      return Object.entries(natalChart.planets).map(([planet, data]: [string, any]) => ({
        planet,
        sign: data.sign ?? '',
        degree: data.signDegree ?? data.degree ?? 0,
        longitude: data.longitude ?? data.degrees ?? 0,
      }))
    }

    // Shape: [ { planet, sign, degree, longitude } ]
    if (Array.isArray(natalChart)) {
      return natalChart.map((p: any) => ({
        planet: p.planet ?? p.label ?? '',
        sign: p.sign ?? '',
        degree: p.signDegree ?? p.degree ?? 0,
        longitude: p.longitude ?? p.degrees ?? 0,
      }))
    }
  } catch {
    console.warn('  ⚠ Could not parse natalChart')
  }

  return []
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  Agentic User Provisioning')
  console.log('═══════════════════════════════════════════════════\n')

  const result = await provisionAgenticUsers()

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`  Created: ${result.created}`)
  console.log(`  Skipped: ${result.skipped}`)
  console.log(`  Errors:  ${result.errors.length}`)
  console.log('═══════════════════════════════════════════════════')

  if (result.errors.length > 0) {
    console.log('\nErrors:')
    result.errors.forEach((e) => console.log(`  - ${e}`))
  }

  await prisma.$disconnect()
  process.exit(result.errors.length > 0 ? 1 : 0)
}

main().catch(async (err) => {
  console.error('Fatal error:', err)
  await prisma.$disconnect()
  process.exit(1)
})
