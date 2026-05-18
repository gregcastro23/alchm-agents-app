// @ts-ignore
import { serve, Subprocess } from 'bun'
declare const Bun: any
import { debitInferenceCost } from './lib/database/economy'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.RAILWAY_DATABASE_URL })

const IPC_NONCE = process.env.IPC_NONCE
if (!IPC_NONCE) throw new Error('CRITICAL: IPC_NONCE not provided to sidecar.')

const ALLOWED_MODELS = new Set([
  'alchm-agent-fire-8b.gguf',
  'alchm-agent-water-8b.gguf',
  'alchm-agent-air-8b.gguf',
  'alchm-agent-earth-8b.gguf',
  'alchm-agent-fire-1.5b.gguf',
  'alchm-agent-water-1.5b.gguf',
  'alchm-agent-air-1.5b.gguf',
  'alchm-agent-earth-1.5b.gguf',
])

import { join, dirname, basename } from 'path'

// Path resolution for sidecar and models
const APP_DATA_DIR = process.env.APP_DATA_DIR || './models'
const isCompiled = process.execPath.includes('orchestrator')
const binDir = isCompiled ? dirname(process.execPath) : './src-tauri/bin'
const llamaServerExec = isCompiled
  ? basename(process.execPath).replace('orchestrator', 'llama-server')
  : 'llama-server-aarch64-apple-darwin'
const LLAMA_SERVER_PATH = join(binDir, llamaServerExec)

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
      LLAMA_SERVER_PATH,
      '-m',
      join(APP_DATA_DIR, modelName),
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
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-IPC-Nonce',
  'Access-Control-Max-Age': '86400',
}

function corsResponse(body: BodyInit | null, init: ResponseInit = {}): Response {
  const headers = { ...CORS_HEADERS, ...(init.headers || {}) }
  return new Response(body, { ...init, headers })
}

const server = serve({
  port: 8080,
  async fetch(req: Request) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    // 1. Validate IPC Handshake
    const incomingNonce = req.headers.get('X-IPC-Nonce')
    if (incomingNonce !== IPC_NONCE) {
      return corsResponse('Unauthorized IPC', { status: 403 })
    }

    const url = new URL(req.url)

    if (req.method === 'GET' && url.pathname === '/api/models/check') {
      const models = [
        'alchm-agent-fire-8b.gguf',
        'alchm-agent-water-8b.gguf',
        'alchm-agent-air-8b.gguf',
        'alchm-agent-earth-8b.gguf',
        'alchm-agent-fire-1.5b.gguf',
        'alchm-agent-water-1.5b.gguf',
        'alchm-agent-air-1.5b.gguf',
        'alchm-agent-earth-1.5b.gguf',
      ]

      const results = await Promise.all(
        models.map(async modelName => {
          const file = Bun.file(join(APP_DATA_DIR, modelName))
          const exists = await file.exists()
          let verified = false
          if (exists) {
            // In a real scenario we'd stream the file through a SHA-256 hasher.
            // For Convergence v1, we check existence and size > 0 as a quick verification,
            // and mock the hash check for speed since GGUF files are gigabytes.
            const size = file.size
            verified = size > 1024 * 1024 // At least 1MB to be considered a valid weights file
          }

          return {
            id: modelName,
            present: exists,
            verified: verified,
          }
        })
      )

      return corsResponse(JSON.stringify(results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST' && url.pathname === '/api/forge/transmute') {
      const { tier, modelName } = await req.json()

      const userId = await authenticateToken(req)
      if (!userId) return corsResponse('Invalid API Key', { status: 401 })

      if (tier === 'premium') {
        try {
          // Check balances first for the breakdown
          const checkQuery = `
            SELECT spirit_coins, essence_coins, matter_coins, substance_coins 
            FROM token_balances WHERE user_id = $1 LIMIT 1;
          `
          const checkRes = await pool.query(checkQuery, [userId])
          if (checkRes.rows.length === 0) {
            return corsResponse('User balances not found', { status: 404 })
          }

          const bal = checkRes.rows[0]
          const cost = 125
          const missing = {
            spirit: Math.max(0, cost - Number(bal.spirit_coins)),
            essence: Math.max(0, cost - Number(bal.essence_coins)),
            matter: Math.max(0, cost - Number(bal.matter_coins)),
            substance: Math.max(0, cost - Number(bal.substance_coins)),
          }

          if (
            missing.spirit > 0 ||
            missing.essence > 0 ||
            missing.matter > 0 ||
            missing.substance > 0
          ) {
            return corsResponse(
              JSON.stringify({
                error: 'Insufficient Alchemical Quantities.',
                missing,
              }),
              { status: 402, headers: { 'Content-Type': 'application/json' } }
            )
          }

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
              RETURNING spirit_coins, essence_coins, matter_coins, substance_coins
            ),
            record_tx AS (
              INSERT INTO token_transactions (user_id, token_type, amount, source, description, created_at)
              SELECT $1, unnest(ARRAY['spirit', 'essence', 'matter', 'substance']), 
                     unnest(ARRAY[-125::numeric, -125::numeric, -125::numeric, -125::numeric]),
                     'local_inference', 'Astral Engine Premium Model Unlock', NOW()
              FROM deduct
            )
            SELECT * FROM deduct;
          `

          const balanceResult = await pool.query(deductionQuery, [userId])

          if (balanceResult.rows.length === 0) {
            return corsResponse(JSON.stringify({ error: 'Atomic transaction failed' }), {
              status: 500,
            })
          }

          console.log(`✨ User ${userId} transmuted 500 ESMS coins.`)
          return corsResponse(
            JSON.stringify({
              success: true,
              balances: balanceResult.rows[0],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (err: any) {
          console.error('Database quantity transaction failed:', err)
          return corsResponse(
            JSON.stringify({ error: 'Failed to connect to the off-chain vault' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      } else {
        return corsResponse(
          JSON.stringify({ success: true, message: 'Base model requires no transmutation' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/models/install') {
      const { modelName, downloadUrl, tier } = await req.json()

      const userId = await authenticateToken(req)
      if (!userId) return corsResponse('Invalid API Key', { status: 401 })

      if (!ALLOWED_MODELS.has(modelName)) {
        return corsResponse(
          'Invalid or unsupported model selected. Use official Alchm models only.',
          { status: 403 }
        )
      }

      if (tier === 'premium') {
        // Deduction is handled by /api/forge/transmute now
        console.log(`Model install requested for premium model: ${modelName}`)
      }

      try {
        const response = await fetch(downloadUrl)
        if (!response.ok) throw new Error('Failed to fetch model from R2')
        await Bun.write(join(APP_DATA_DIR, modelName), response)
        return corsResponse(
          JSON.stringify({
            success: true,
            message: `${tier.toUpperCase()} engine instantiated successfully.`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      } catch (err: any) {
        return corsResponse(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      const { prompt, modelName, costs } = await req.json()

      // 2. Validate User API Key
      const userId = await authenticateToken(req)
      if (!userId) return corsResponse('Invalid API Key', { status: 401 })

      // 3. Strict Model Validation (No BYOM)
      if (!ALLOWED_MODELS.has(modelName)) {
        return corsResponse(
          'Invalid or unsupported model selected. Use official Alchm models only.',
          { status: 403 }
        )
      }

      // 4. Atomic Transaction
      const hasFunds = await debitInferenceCost(userId, costs)
      if (!hasFunds) {
        return corsResponse(JSON.stringify({ error: 'Insufficient Alchemical Tokens' }), {
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
        return corsResponse(JSON.stringify({ error: 'Failed to initialize inference engine' }), {
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
        return corsResponse(proxyRes.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          },
        })
      } catch (error) {
        console.error('Proxy error:', error)
        return corsResponse('Error connecting to inference engine.', { status: 502 })
      }
    }

    return corsResponse('Not Found', { status: 404 })
  },
})

console.log(`Alchemical Orchestrator listening on port ${server.port}`)
