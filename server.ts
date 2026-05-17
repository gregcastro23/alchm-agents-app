// @ts-ignore
import { serve, Subprocess } from 'bun'
declare const Bun: any
import { debitInferenceCost } from './lib/database/economy'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.RAILWAY_DATABASE_URL })

const IPC_NONCE = process.env.IPC_NONCE
if (!IPC_NONCE) throw new Error('CRITICAL: IPC_NONCE not provided to sidecar.')

// Strict Model Whitelist (NO BYOM)
const ALLOWED_MODELS = new Set([
  'alchm-agent-fire-8b.gguf',
  'alchm-agent-water-8b.gguf',
  'alchm-agent-air-8b.gguf',
  'alchm-agent-earth-8b.gguf',
])

// --- State & Process Management ---
let llamaServer: Subprocess | null = null
let currentModel: string | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // 5 Minutes

function stopServer() {
  if (llamaServer) {
    console.log('Shutting down llama-server to free unified memory...')
    if (llamaServer.exitCode === null) llamaServer.kill(9)
    llamaServer = null
    currentModel = null
  }
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    console.log(`[RAM Saver] Idle for 5 minutes. Terminating model ${currentModel}.`)
    stopServer()
  }, IDLE_TIMEOUT_MS)
}

async function waitForServerReady(): Promise<boolean> {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:8081/health')
      if (res.ok) return true
    } catch (e) {
      // Expected connection refused until server binds
    }
    await Bun.sleep(500) // Wait 500ms before retrying
  }
  return false
}

async function startServer(modelName: string) {
  stopServer() // Ensure clean slate
  console.log(`Cold booting llama-server with model: ${modelName}`)

  llamaServer = Bun.spawn({
    cmd: [
      './bin/llama-server',
      '-m',
      `./models/${modelName}`,
      '-ngl',
      '99',
      '-c',
      '8192',
      '--port',
      '8081',
    ],
    stdout: 'ignore',
    stderr: 'ignore', // Llama.cpp logs heavily to stderr, ignoring to keep sidecar quiet
  })

  currentModel = modelName

  const isReady = await waitForServerReady()
  if (!isReady) {
    stopServer()
    throw new Error('Failed to start llama-server. Health check timed out.')
  }
  console.log('llama-server is hot and ready.')
}

// Ensure cleanup on sidecar termination
process.on('exit', stopServer)
process.on('SIGINT', () => {
  stopServer()
  process.exit(0)
})

// --- API Auth ---
async function authenticateToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]

  const query = `
    SELECT user_id 
    FROM desktop_api_keys 
    WHERE token = $1 AND is_active = true 
    LIMIT 1;
  `

  const result = await pool.query(query, [token])
  return result.rows.length > 0 ? result.rows[0].user_id : null
}

// --- HTTP Server ---
const server = serve({
  port: 8080,
  async fetch(req: Request) {
    // 1. Validate IPC Handshake
    const incomingNonce = req.headers.get('X-IPC-Nonce')
    if (incomingNonce !== IPC_NONCE) {
      return new Response('Unauthorized IPC', { status: 403 })
    }

    const url = new URL(req.url)

    if (req.method === 'POST' && url.pathname === '/api/models/check') {
      const { modelName } = await req.json()

      if (!ALLOWED_MODELS.has(modelName)) {
        return new Response('Invalid model', { status: 403 })
      }

      const file = Bun.file(`./models/${modelName}`)
      const exists = await file.exists()

      return new Response(JSON.stringify({ exists }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST' && url.pathname === '/api/models/install') {
      const { modelName, downloadUrl, tier } = await req.json()

      const userId = await authenticateToken(req)
      if (!userId) return new Response('Invalid API Key', { status: 401 })

      if (!ALLOWED_MODELS.has(modelName)) {
        return new Response(
          'Invalid or unsupported model selected. Use official Alchm models only.',
          { status: 403 }
        )
      }

      // PostgreSQL Alchemical Quantity Gating (Balanced 125 ESMS Coin Debit)
      if (tier === 'premium') {
        try {
          const deductionQuery = `
            WITH deduct AS (
              UPDATE token_balances
              SET 
                spirit_coins = spirit_coins - 125, 
                essence_coins = essence_coins - 125,
                matter_coins = matter_coins - 125, 
                substance_coins = substance_coins - 125,
                updated_at = NOW()
              WHERE user_id = $1 
                AND spirit_coins >= 125 
                AND essence_coins >= 125 
                AND matter_coins >= 125 
                AND substance_coins >= 125
              RETURNING user_id
            ),
            record_tx AS (
              INSERT INTO token_transactions (user_id, token_type, amount, source, description, created_at)
              SELECT $1, unnest(ARRAY['spirit', 'essence', 'matter', 'substance']), 
                     unnest(ARRAY[-125::numeric, -125::numeric, -125::numeric, -125::numeric]),
                     'local_inference', 'Astral Engine Premium Model Unlock', NOW()
              FROM deduct
            )
            SELECT EXISTS(SELECT 1 FROM deduct) as success;
          `

          const balanceResult = await pool.query(deductionQuery, [userId])
          const hasDeducted = balanceResult.rows[0]?.success

          if (!hasDeducted) {
            return new Response(
              JSON.stringify({
                error:
                  'Insufficient Alchemical Quantities. Complete more culinary and planetary quests to gather the 125 coins required of each ESMS column!',
              }),
              { status: 402, headers: { 'Content-Type': 'application/json' } }
            )
          }

          console.log(
            `✨ User ${userId} successfully transmuted 500 ESMS coins to unlock Premium Model: ${modelName}`
          )
        } catch (err: any) {
          console.error('Database quantity transaction failed:', err)
          return new Response(
            JSON.stringify({ error: 'Failed to connect to the off-chain alchemical vault' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }

      try {
        const response = await fetch(downloadUrl)
        if (!response.ok) throw new Error('Failed to fetch model from R2')
        await Bun.write(`./models/${modelName}`, response)
        return new Response(
          JSON.stringify({
            success: true,
            message: `${tier.toUpperCase()} engine instantiated successfully.`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      const { prompt, modelName, costs } = await req.json()

      // 2. Validate User API Key
      const userId = await authenticateToken(req)
      if (!userId) return new Response('Invalid API Key', { status: 401 })

      // 3. Strict Model Validation (No BYOM)
      if (!ALLOWED_MODELS.has(modelName)) {
        return new Response(
          'Invalid or unsupported model selected. Use official Alchm models only.',
          { status: 403 }
        )
      }

      // 4. Atomic Transaction
      const hasFunds = await debitInferenceCost(userId, costs)
      if (!hasFunds) {
        return new Response(JSON.stringify({ error: 'Insufficient Alchemical Tokens' }), {
          status: 402,
        })
      }

      // 5. Manage Model Process Lifecycle
      try {
        if (!llamaServer || currentModel !== modelName) {
          await startServer(modelName)
        }
        resetIdleTimer()
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to initialize inference engine' }), {
          status: 500,
        })
      }

      // 6. Reverse Proxy to llama-server
      try {
        const proxyRes = await fetch('http://127.0.0.1:8081/completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            stream: true,
            n_predict: 512, // Max tokens constraint
          }),
        })

        if (!proxyRes.ok) throw new Error(`llama-server responded with ${proxyRes.status}`)

        // Stream the SSE response directly to the frontend
        return new Response(proxyRes.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          },
        })
      } catch (error) {
        console.error('Proxy error:', error)
        return new Response('Error connecting to inference engine.', { status: 502 })
      }
    }

    return new Response('Not Found', { status: 404 })
  },
})

console.log(`Alchemical Orchestrator listening on port ${server.port}`)
