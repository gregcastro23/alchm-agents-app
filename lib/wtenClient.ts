/**
 * WhatToEatNext (WTEN) sync client — single entrypoint for the
 * /api/internal/agent-sync push.
 *
 * Owns the WTEN base URL + shared-secret validation so callers
 * (scripts/provision-agentic-users.ts, scripts/backfill-agent-sync.ts,
 * future server routes) cannot drift on header name, endpoint path,
 * or env-var convention.
 *
 * The endpoint is idempotent: it returns 200 with the wtenUserId
 * whether the row was just created or already existed. Do NOT branch
 * on a `reason: "already_applied"` field — it does not exist for this
 * endpoint (that's the /api/economy/sync-debit contract).
 */

const DEFAULT_WTEN_BASE = 'https://whattoeatnext-production.up.railway.app'

export interface SyncAgentToWtenResult {
  wtenUserId: string
  created: boolean
}

let cachedConfig: { baseUrl: string; secret: string } | null = null

function loadConfig(): { baseUrl: string; secret: string } {
  if (cachedConfig) return cachedConfig
  const secret = process.env.ALCHM_KITCHEN_SYNC_SECRET
  if (!secret) {
    throw new Error(
      'ALCHM_KITCHEN_SYNC_SECRET is required. Set it in the environment before calling syncAgentToWten().'
    )
  }
  const baseUrl = (process.env.WTEN_API_BASE_URL ?? DEFAULT_WTEN_BASE).replace(/\/$/, '')
  cachedConfig = { baseUrl, secret }
  return cachedConfig
}

/**
 * Push an agentic user to WTEN's user table and return the WTEN-side UUID.
 * Throws on any non-2xx response — callers decide whether to retry, log,
 * or surface the failure. Header name is exact: `X-Sync-Secret`
 * (case-sensitive on WTEN's side).
 */
export async function syncAgentToWten(
  email: string,
  displayName?: string | null
): Promise<SyncAgentToWtenResult> {
  if (!email.endsWith('@agentic.alchm.kitchen')) {
    throw new Error(
      `syncAgentToWten: email must end with @agentic.alchm.kitchen (got ${email}). WTEN returns 422 otherwise.`
    )
  }
  const { baseUrl, secret } = loadConfig()
  const res = await fetch(`${baseUrl}/api/internal/agent-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sync-Secret': secret,
    },
    body: JSON.stringify({ email, displayName: displayName ?? undefined }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '(unreadable)')
    throw new Error(`agent-sync ${res.status} for ${email}: ${body}`)
  }
  const data = (await res.json()) as { ok?: boolean; wtenUserId?: string; created?: boolean }
  if (!data.ok || !data.wtenUserId) {
    throw new Error(`agent-sync returned malformed payload for ${email}: ${JSON.stringify(data)}`)
  }
  return { wtenUserId: data.wtenUserId, created: data.created ?? false }
}
