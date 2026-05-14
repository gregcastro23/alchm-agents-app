/**
 * Alchm.kitchen token debit sync.
 *
 * When an agentic user performs an action (feed post, transmutation),
 * this module fires a server-to-server POST to alchm.kitchen's
 * `/api/economy/sync-debit` endpoint so the master platform atomically
 * deducts the tokens. Alchm.kitchen is the **source of truth** for all
 * token balances.
 *
 * Required env vars:
 *   ALCHM_KITCHEN_SYNC_URL      – base URL, e.g. https://alchm.kitchen
 *                                  (or ALCHM_KITCHEN_API_BASE_URL)
 *   ALCHM_KITCHEN_SYNC_SECRET   – shared secret for X-Sync-Secret header
 *
 * Contract (from alchm.kitchen):
 *   POST /api/economy/sync-debit
 *   Auth:  X-Sync-Secret header
 *   200  → { ok: true,  transactionGroupId, balances }
 *   402  → { ok: false, reason: "insufficient_funds", balances }
 *   409  → { ok: false, reason: "already_applied" }
 *   404  → { ok: false, reason: "user_not_found" }
 *   400  → { ok: false, reason: "invalid_request", message }
 *   401  → { error: "Unauthorized" }
 *
 * Agentic users (*@agentic.alchm.kitchen) are auto-provisioned on
 * first call — no pre-seeding required on the alchm.kitchen side.
 */

const SYNC_URL =
  process.env.ALCHM_KITCHEN_SYNC_URL ||
  process.env.ALCHM_KITCHEN_API_BASE_URL
const SYNC_SECRET = process.env.ALCHM_KITCHEN_SYNC_SECRET

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncDebitPayload {
  userEmail: string
  amounts: {
    spirit: number
    essence: number
    matter: number
    substance: number
  }
  operationType: string // 'agent_feed_post' | 'agent_transmutation'
  source: string // 'planetary_agents_action_engine'
  idempotencyKey: string // 'agent_action:{userId}:{hourKey}'
  metadata: {
    agentName: string
    actionType: string
    activationScore: number
    triggers: string[]
  }
}

export interface SyncDebitResult {
  ok: boolean
  transactionGroupId?: string
  balances?: {
    spirit: number
    essence: number
    matter: number
    substance: number
  }
  reason?: 'insufficient_funds' | 'already_applied' | 'user_not_found' | 'invalid_request' | 'internal_error'
  message?: string
  error?: string
  /** True when env vars are missing and the call was skipped */
  skipped?: boolean
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/**
 * Sync a token debit to alchm.kitchen (source of truth).
 *
 * - On success (200): returns `{ ok: true, transactionGroupId, balances }`
 * - On insufficient funds (402): returns `{ ok: false, reason: 'insufficient_funds', balances }`
 * - On idempotency hit (409): returns `{ ok: true, reason: 'already_applied' }`
 *   (treated as success — the debit was already applied)
 * - On missing env vars: returns `{ ok: false, skipped: true }`
 * - On network/timeout error: returns `{ ok: false, error: '...' }`
 *
 * This function NEVER throws. All failures are returned in the result.
 */
export async function syncDebitToAlchm(
  payload: SyncDebitPayload
): Promise<SyncDebitResult> {
  if (!SYNC_URL || !SYNC_SECRET) {
    console.warn(
      '[alchm-debit-sync] ALCHM_KITCHEN_SYNC_URL or SYNC_SECRET not set — skipping debit sync'
    )
    return {
      ok: false,
      skipped: true,
      error: 'ALCHM_KITCHEN_SYNC_URL or SYNC_SECRET not set',
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000) // 10s timeout

  try {
    const res = await fetch(`${SYNC_URL}/api/economy/sync-debit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': SYNC_SECRET,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    // 409 — idempotency hit: the debit was already applied, treat as success
    if (res.status === 409) {
      console.info(
        `[alchm-debit-sync] Idempotency hit for ${payload.userEmail} (key: ${payload.idempotencyKey})`
      )
      return { ok: true, reason: 'already_applied' }
    }

    const data = await res.json().catch(() => null)

    // 200 — success
    if (res.ok && data?.ok) {
      console.info(
        `[alchm-debit-sync] Debit applied for ${payload.userEmail}: ` +
          `${payload.operationType} (txn: ${data.transactionGroupId})`
      )
      return {
        ok: true,
        transactionGroupId: data.transactionGroupId,
        balances: data.balances,
      }
    }

    // 402 — insufficient funds
    if (res.status === 402) {
      console.warn(
        `[alchm-debit-sync] Insufficient funds for ${payload.userEmail}: ` +
          `needed ${JSON.stringify(payload.amounts)}, has ${JSON.stringify(data?.balances)}`
      )
      return {
        ok: false,
        reason: 'insufficient_funds',
        balances: data?.balances,
      }
    }

    // 404 — user not found (non-agentic emails only; agentic are auto-provisioned)
    if (res.status === 404) {
      console.warn(
        `[alchm-debit-sync] User not found on alchm.kitchen: ${payload.userEmail}`
      )
      return { ok: false, reason: 'user_not_found' }
    }

    // 401 — bad auth
    if (res.status === 401) {
      console.error('[alchm-debit-sync] Unauthorized — check ALCHM_KITCHEN_SYNC_SECRET')
      return { ok: false, error: 'Unauthorized — check ALCHM_KITCHEN_SYNC_SECRET' }
    }

    // 400 — invalid request
    if (res.status === 400) {
      console.error(
        `[alchm-debit-sync] Invalid request: ${data?.message || res.statusText}`
      )
      return {
        ok: false,
        reason: 'invalid_request',
        message: data?.message,
      }
    }

    // Any other error
    const errorText = data?.message || data?.error || res.statusText
    console.error(
      `[alchm-debit-sync] Unexpected response ${res.status}: ${errorText}`
    )
    return { ok: false, error: `${res.status}: ${errorText}` }
  } catch (err: any) {
    clearTimeout(timeout)
    const msg =
      err?.name === 'AbortError'
        ? 'timeout (10s)'
        : (err?.message ?? String(err))
    console.error(`[alchm-debit-sync] Network error: ${msg}`)
    return { ok: false, error: msg }
  }
}
