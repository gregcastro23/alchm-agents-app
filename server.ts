// @ts-ignore
import { serve, Subprocess } from 'bun'
declare const Bun: any
import { debitInferenceCost } from './lib/database/economy'
import { Pool } from 'pg'
import { cpus, freemem, loadavg, totalmem } from 'os'
import { join, dirname, basename } from 'path'

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
let currentProfileName = 'balanced'
let idleTimer: ReturnType<typeof setTimeout> | null = null
const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // 5 Minutes
const LOGICAL_THREADS = Math.max(1, cpus().length || 1)

type InferenceProfileName =
  | 'balanced'
  | 'fire-meltdown'
  | 'water-freeze'
  | 'earth-tectonic-root'
  | 'air-vacuum'

interface InferenceProfile {
  name: InferenceProfileName
  label: string
  element: 'Fire' | 'Water' | 'Earth' | 'Air' | 'Aether'
  contextPolicy: string
  threads: number
  batchThreads: number
  contextSize: number
  batchSize: number
  ubatchSize: number
  priority: number
  poll: number
  completion: {
    nPredict: number
    temperature: number
    topK: number
    topP: number
    repeatPenalty: number
  }
}

function clampThreads(value: number) {
  return Math.max(1, Math.min(LOGICAL_THREADS, Math.round(value)))
}

const INFERENCE_PROFILES: Record<InferenceProfileName, InferenceProfile> = {
  balanced: {
    name: 'balanced',
    label: 'Balanced Local Inference',
    element: 'Aether',
    contextPolicy: 'Default balanced context and throughput profile.',
    threads: clampThreads(LOGICAL_THREADS * 0.75),
    batchThreads: clampThreads(LOGICAL_THREADS * 0.75),
    contextSize: 8192,
    batchSize: 2048,
    ubatchSize: 512,
    priority: 0,
    poll: 50,
    completion: {
      nPredict: 512,
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      repeatPenalty: 1,
    },
  },
  'fire-meltdown': {
    name: 'fire-meltdown',
    label: 'Fire Meltdown',
    element: 'Fire',
    contextPolicy: 'Maximum throughput: all logical threads, high priority, large batch window.',
    threads: LOGICAL_THREADS,
    batchThreads: LOGICAL_THREADS,
    contextSize: 8192,
    batchSize: 4096,
    ubatchSize: 1024,
    priority: 2,
    poll: 100,
    completion: {
      nPredict: 768,
      temperature: 0.92,
      topK: 64,
      topP: 0.96,
      repeatPenalty: 1,
    },
  },
  'water-freeze': {
    name: 'water-freeze',
    label: 'Water Freeze',
    element: 'Water',
    contextPolicy: 'Deterministic cooling: low temperature and stable medium context.',
    threads: clampThreads(LOGICAL_THREADS * 0.6),
    batchThreads: clampThreads(LOGICAL_THREADS * 0.6),
    contextSize: 4096,
    batchSize: 1024,
    ubatchSize: 384,
    priority: 0,
    poll: 25,
    completion: {
      nPredict: 448,
      temperature: 0.22,
      topK: 16,
      topP: 0.82,
      repeatPenalty: 1.08,
    },
  },
  'earth-tectonic-root': {
    name: 'earth-tectonic-root',
    label: 'Earth Tectonic Root',
    element: 'Earth',
    contextPolicy: 'RAG-locked context: tight window, strict prompt grounding, low drift.',
    threads: clampThreads(LOGICAL_THREADS * 0.5),
    batchThreads: clampThreads(LOGICAL_THREADS * 0.5),
    contextSize: 2048,
    batchSize: 512,
    ubatchSize: 256,
    priority: 0,
    poll: 0,
    completion: {
      nPredict: 384,
      temperature: 0.18,
      topK: 12,
      topP: 0.72,
      repeatPenalty: 1.16,
    },
  },
  'air-vacuum': {
    name: 'air-vacuum',
    label: 'Air Vacuum',
    element: 'Air',
    contextPolicy: 'Lean detached execution: reduced context with crisp sampling.',
    threads: clampThreads(LOGICAL_THREADS * 0.65),
    batchThreads: clampThreads(LOGICAL_THREADS * 0.65),
    contextSize: 4096,
    batchSize: 1024,
    ubatchSize: 384,
    priority: 0,
    poll: 35,
    completion: {
      nPredict: 448,
      temperature: 0.52,
      topK: 28,
      topP: 0.9,
      repeatPenalty: 1.04,
    },
  },
}

function profileFromMove(moveId?: string): InferenceProfileName {
  switch (moveId) {
    case 'meltdown':
      return 'fire-meltdown'
    case 'freeze':
      return 'water-freeze'
    case 'tectonicRoot':
      return 'earth-tectonic-root'
    case 'vacuum':
      return 'air-vacuum'
    default:
      return 'balanced'
  }
}

function resolveProfile(profileName?: string, moveId?: string): InferenceProfile {
  const resolvedName = (profileName || profileFromMove(moveId)) as InferenceProfileName
  return INFERENCE_PROFILES[resolvedName] || INFERENCE_PROFILES.balanced
}

function applyProfilePrompt(prompt: string, profile: InferenceProfile) {
  if (profile.name !== 'earth-tectonic-root') return prompt

  return `[Earth Tectonic Root constraints]
Use only the context explicitly present in this prompt. If the supplied context is insufficient, say precisely what is missing. Prefer grounded, compact claims over speculation.

${prompt}`
}

function stopServer() {
  if (llamaServer) {
    console.log('Shutting down llama-server to free unified memory...')
    if (llamaServer.exitCode === null) llamaServer.kill(9)
    llamaServer = null
    currentModel = null
    currentProfileName = 'balanced'
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

async function startServer(modelName: string, profile: InferenceProfile) {
  stopServer() // Ensure clean slate
  console.log(
    `Cold booting llama-server with model: ${modelName} (${profile.label}, ${profile.threads} threads)`
  )

  llamaServer = Bun.spawn({
    cmd: [
      LLAMA_SERVER_PATH,
      '-m',
      join(APP_DATA_DIR, modelName),
      '-t',
      String(profile.threads),
      '-tb',
      String(profile.batchThreads),
      '-ngl',
      '99',
      '-c',
      String(profile.contextSize),
      '-b',
      String(profile.batchSize),
      '-ub',
      String(profile.ubatchSize),
      '--prio',
      String(profile.priority),
      '--poll',
      String(profile.poll),
      '--port',
      '8081',
    ],
    stdout: 'ignore',
    stderr: 'ignore', // Llama.cpp logs heavily to stderr, ignoring to keep sidecar quiet
  })

  currentModel = modelName
  currentProfileName = profile.name

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

async function commandText(cmd: string[], timeoutMs = 1500): Promise<string> {
  const proc = Bun.spawn({
    cmd,
    stdout: 'pipe',
    stderr: 'ignore',
  })

  const timeout = Bun.sleep(timeoutMs).then(() => {
    if (proc.exitCode === null) proc.kill(9)
    return ''
  })

  try {
    return await Promise.race([new Response(proc.stdout).text(), timeout])
  } catch {
    return ''
  }
}

async function sampleCpuPercent() {
  const output = await commandText(['top', '-l', '1', '-n', '0', '-s', '0'])
  const match = output.match(/CPU usage:\s*([\d.]+)% user,\s*([\d.]+)% sys,\s*([\d.]+)% idle/)
  if (!match) return null

  return Number((100 - Number(match[3])).toFixed(1))
}

async function sampleGpuTelemetry() {
  const output = await commandText(['ioreg', '-r', '-c', 'IOAccelerator', '-d', '1'], 1200)
  if (!output) return null

  const readNumber = (label: string) => {
    const match = output.match(new RegExp(`"${label}"=(\\d+)`))
    return match ? Number(match[1]) : null
  }

  return {
    utilizationPercent: readNumber('Device Utilization %'),
    rendererPercent: readNumber('Renderer Utilization %'),
    vramUsedBytes: readNumber('In use system memory'),
    vramAllocatedBytes: readNumber('Alloc system memory'),
  }
}

async function buildHardwareTelemetry() {
  const totalMemoryBytes = totalmem()
  const freeMemoryBytes = freemem()
  const gpu = await sampleGpuTelemetry()

  return {
    online: true,
    activeModel: currentModel,
    activeProfile: INFERENCE_PROFILES[currentProfileName as InferenceProfileName],
    llamaHot: Boolean(llamaServer && llamaServer.exitCode === null),
    cpu: {
      percent: await sampleCpuPercent(),
      logicalThreads: LOGICAL_THREADS,
      loadAverage: loadavg().map(value => Number(value.toFixed(2))),
    },
    memory: {
      totalBytes: totalMemoryBytes,
      usedBytes: totalMemoryBytes - freeMemoryBytes,
      freeBytes: freeMemoryBytes,
      usedPercent: Number(
        (((totalMemoryBytes - freeMemoryBytes) / totalMemoryBytes) * 100).toFixed(1)
      ),
    },
    gpu,
    timestamp: new Date().toISOString(),
  }
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

    if (req.method === 'GET' && url.pathname === '/api/hardware/telemetry') {
      return corsResponse(JSON.stringify(await buildHardwareTelemetry()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

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
      const { prompt, modelName, costs, inferenceProfile, jingMoveId } = await req.json()
      const profile = resolveProfile(inferenceProfile, jingMoveId)

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
        if (!llamaServer || currentModel !== modelName || currentProfileName !== profile.name) {
          await startServer(modelName, profile)
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
            prompt: applyProfilePrompt(prompt, profile),
            stream: true,
            n_predict: profile.completion.nPredict,
            temperature: profile.completion.temperature,
            top_k: profile.completion.topK,
            top_p: profile.completion.topP,
            repeat_penalty: profile.completion.repeatPenalty,
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
