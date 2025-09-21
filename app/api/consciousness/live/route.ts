import { NextResponse } from 'next/server'

/**
 * Frontend-to-Backend proxy for live consciousness calculations
 * This route forwards requests to the backend service if available
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Check if backend is enabled
    const backendEnabled = process.env.NEXT_PUBLIC_KINETICS_BACKEND === 'true'
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    
    if (!backendEnabled) {
      return NextResponse.json(
        {
          error: 'Backend consciousness calculations not available',
          code: 'BACKEND_DISABLED',
          details: 'Set NEXT_PUBLIC_KINETICS_BACKEND=true to enable'
        },
        { status: 503 }
      )
    }
    
    // Forward request to backend
    const backendResponse = await fetch(`${backendUrl}/api/consciousness/live`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-From': 'nextjs-frontend'
      },
      body: JSON.stringify(body)
    })
    
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: 'Backend calculation failed',
          code: 'BACKEND_ERROR',
          status: backendResponse.status,
          details: errorData.error || backendResponse.statusText
        },
        { status: backendResponse.status }
      )
    }
    
    const result = await backendResponse.json()
    
    // Add frontend metadata
    return NextResponse.json({
      ...result,
      meta: {
        calculatedBy: 'backend',
        proxiedBy: 'frontend',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Frontend consciousness proxy error:', error)
    
    return NextResponse.json(
      {
        error: 'Consciousness calculation proxy failed',
        code: 'PROXY_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
