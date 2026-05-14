/**
 * Syncs a quest event to the alchm.kitchen platform.
 * Used for agents performing "demo" actions like meal planning or pantry updates.
 */
export async function syncEventToAlchm(params: {
  userEmail: string
  event: string
}): Promise<{ ok: boolean; error?: string; completed?: any[] }> {
  const syncUrl = process.env.ALCHM_KITCHEN_SYNC_URL
  const syncSecret = process.env.ALCHM_KITCHEN_SYNC_SECRET

  if (!syncUrl || !syncSecret) {
    console.error('[alchm-event-sync] Missing ALCHM_KITCHEN_SYNC_URL or ALCHM_KITCHEN_SYNC_SECRET')
    return { ok: false, error: 'Internal configuration error' }
  }

  try {
    const response = await fetch(`${syncUrl}/api/economy/sync-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': syncSecret,
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMsg = data.message || data.error || `HTTP ${response.status}`
      console.error(`[alchm-event-sync] Failed to sync event: ${errorMsg}`)
      return { ok: false, error: errorMsg }
    }

    console.log(`[alchm-event-sync] Event reported for ${params.userEmail}: ${params.event}`)
    return { ok: true, completed: data.completed }
  } catch (err: any) {
    console.error(`[alchm-event-sync] Network or fetch error: ${err.message}`)
    return { ok: false, error: err.message }
  }
}
