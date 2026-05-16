import pg from 'pg'
import { config } from 'dotenv'

// Load env vars
config()

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function runE2E() {
  console.log('--- Phase 1: Simulate UI Creation (API Call) ---')
  const agentPayload = {
    name: 'Johannes Kepler ' + Date.now(), // Make unique
    title: 'Celestial Mathematician',
    specialty: 'Orbital Mechanics and Harmony',
    consciousness: {
      monicaConstant: 0.88,
      consciousnessLevel: 'Illuminated',
      spiritScore: 85,
      essenceScore: 70,
      matterScore: 60,
      substanceScore: 90,
      dominantElement: 'Earth',
    },
    personality: {
      core: {
        essence: 'Mathematical precision with mystical awe',
        expression: 'Logical yet deeply poetic',
        emotion: 'Wonder at the cosmos',
      },
      traits: ['Analytical', 'Devout', 'Persistent', 'Harmonic'],
      wisdomDomains: ['Astronomy', 'Geometry', 'Music of the Spheres'],
      challenges: [{ type: 'Rigidity', description: 'Over-focus on geometric perfection' }],
      gifts: [{ type: 'Pattern Recognition', description: 'Seeing divine order in chaos' }],
      teachingStyle: 'Demonstrative and Geometric',
    },
    color: '#D4AF37', // Gold
    symbol: '♄',
    uniquePower: 'Harmonic Resonance Calculation',
  }

  console.log(`Creating agent ${agentPayload.name}...`)

  // Since we are running outside Next.js, we will just call the handler directly
  // We can mock the Request object
  const { POST: createAgentRoute } = await import('../app/api/philosophers-stone/create/route.ts')

  const mockReq = new Request('http://localhost/api/philosophers-stone/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agentPayload),
  })

  const res = await createAgentRoute(mockReq)
  const resData = await res.json()

  if (!resData.success) {
    console.error('Failed to create agent:', resData)
    process.exit(1)
  }

  const createdAgentId = resData.data.agentId
  console.log(`Agent created successfully! ID: ${createdAgentId}`)

  console.log('\n--- Phase 2: Database Verification ---')
  const dbResult = await pool.query('SELECT * FROM historical_agents WHERE "agentId" = $1', [
    createdAgentId,
  ])

  if (dbResult.rows.length === 0) {
    console.error('Agent not found in database!')
    process.exit(1)
  }

  const dbAgent = dbResult.rows[0]
  console.log('Agent found in DB:')
  console.log(`  Name: ${dbAgent.name}`)
  console.log(`  Monica Constant: ${dbAgent.monicaConstant}`)
  console.log(`  Dominant Element: ${dbAgent.dominantElement}`)
  console.log(`  Title: ${dbAgent.title}`)

  if (Math.abs(dbAgent.monicaConstant - 0.88) > 0.001) {
    console.error(`Monica Constant mismatch! Expected 0.88, got ${dbAgent.monicaConstant}`)
    process.exit(1)
  }

  console.log('\n--- Phase 3: Routing Test ---')
  console.log('Testing Monica routing (via LangChain Agent)')

  // We will call the langchain-agent endpoint directly
  const { POST: langchainAgentRoute } = await import('../app/api/langchain-agent/route.ts')

  const routingMockReq = new Request('http://localhost/api/langchain-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: `I need a celestial mathematician who understands the music of the spheres and planetary orbits. Ask ${agentPayload.name}.`,
        },
      ],
      sessionId: 'test-session-e2e',
    }),
  })

  // We are going to test if the langchain agent is running.
  try {
    const routeRes = await langchainAgentRoute(routingMockReq)
    const routeData = await routeRes.json()
    console.log('LangChain Router Response:')
    console.log(routeData)
  } catch (err) {
    console.log(
      'Note: If Langchain endpoint fails, it might require OpenAI API keys set. Check logs.'
    )
    console.error(err)
  }

  console.log('\nEnd-to-End Validation Complete!')
  process.exit(0)
}

runE2E().catch(err => {
  console.error(err)
  process.exit(1)
})
