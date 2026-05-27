/**
 * Single source of truth for the unified Alchm sign-in redirect.
 *
 * Both `agents.alchm.kitchen` (this app) and `alchm.kitchen` share a Google
 * provider. Signing in through `alchm.kitchen`'s NextAuth handler sets a
 * cookie on `.alchm.kitchen` (see `lib/auth-options.ts`), which makes the
 * session visible to every subdomain — including the Tauri desktop's deep
 * link handshake that reads it on the server side.
 *
 * The desktop, web landing page, and `/auth/signin` page must all go through
 * the same redirect or the cookie domain / callbackUrl edge cases drift.
 */

export const ALCHM_KITCHEN_URL =
  process.env.NEXT_PUBLIC_ALCHM_KITCHEN_URL || 'https://alchm.kitchen'

/**
 * Build the kitchen Google sign-in URL.
 *
 * @param callbackPath  Path on `agents.alchm.kitchen` to land on after auth
 *                      (e.g. `/yield?link=true`). May be a relative path or
 *                      an absolute URL — relative paths are resolved against
 *                      `window.location.origin` when called in the browser.
 */
export function buildKitchenSignInUrl(callbackPath: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://agents.alchm.kitchen'

  const absoluteCallback =
    callbackPath.startsWith('http://') || callbackPath.startsWith('https://')
      ? callbackPath
      : origin + (callbackPath.startsWith('/') ? callbackPath : `/${callbackPath}`)

  return `${ALCHM_KITCHEN_URL}/api/auth/signin/google?callbackUrl=${encodeURIComponent(
    absoluteCallback
  )}`
}

/**
 * Build the local `/auth/signin` href with a properly encoded callback path,
 * for use inside `<a href>` and `Link` elements. The signin page itself
 * forwards to `buildKitchenSignInUrl` so this stays consistent.
 */
export function buildLocalSignInHref(callbackPath: string): string {
  return `/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`
}
