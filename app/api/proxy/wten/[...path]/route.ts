import { NextRequest, NextResponse } from 'next/server'

// Proxies requests to the WTEN backend to avoid client-side CORS issues
async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const query = searchParams ? `?${searchParams}` : ''

  // WTEN (culinary) backend only. Do NOT fall back to BACKEND_URL/NEXT_PUBLIC_BACKEND_URL —
  // those point at the PA agents backend, which 404s every culinary path. Mirror the
  // canonical WTEN var used by lib/backend.ts (KITCHEN_BACKEND_URL).
  const backendUrl =
    process.env.WTEN_API_BASE_URL ||
    process.env.NEXT_PUBLIC_WTEN_BACKEND_URL ||
    'https://whattoeatnext-production.up.railway.app'

  const targetUrl = `${backendUrl.replace(/\/$/, '')}/${path}${query}`

  try {
    const headers = new Headers(request.headers)
    // Remove host header to avoid SSL mismatch
    headers.delete('host')
    // Add internal secret if present in environment
    if (process.env.INTERNAL_API_SECRET) {
      headers.set('INTERNAL_API_SECRET', process.env.INTERNAL_API_SECRET)
    }

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: 'manual',
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const bodyText = await request.text()
      if (bodyText) {
        init.body = bodyText
      }
    }

    const response = await fetch(targetUrl, init)

    const responseHeaders = new Headers(response.headers)
    // Set CORS headers for our own frontend
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')

    // Handle JSON explicitly or fallback to buffer
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await response.json()
      return NextResponse.json(data, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    } else {
      const arrayBuffer = await response.arrayBuffer()
      return new NextResponse(arrayBuffer, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    }
  } catch (error) {
    console.error(`[WTEN Proxy] Error proxying to ${targetUrl}:`, error)
    return NextResponse.json({ error: 'Failed to proxy request to backend' }, { status: 502 })
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest
export const PATCH = proxyRequest
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-sync-secret',
    },
  })
}
