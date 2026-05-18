import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { id, name, expiresAt, tier = 'Standard' } = await req.json()

    if (!id || !name || !expiresAt) {
      return NextResponse.json(
        { error: 'Missing required parameters: id, name, expiresAt' },
        { status: 400 }
      )
    }

    const secret = process.env.DEEP_LINK_SHARED_SECRET
    if (!secret) {
      console.error('DEEP_LINK_SHARED_SECRET is not set in environment variables.')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Define the exact payload structure to mirror in the Rust verifier
    // Format: id:name:tier:expiresAt
    const payload = `${id}:${name}:${tier}:${expiresAt}`

    // Generate HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const sig = hmac.digest('hex')

    // Construct the signed deep link
    const deepLink = `alchm://install-agent?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}&tier=${encodeURIComponent(tier)}&expiresAt=${encodeURIComponent(expiresAt)}&sig=${encodeURIComponent(sig)}`

    return NextResponse.json({ deepLink, sig, payload })
  } catch (error) {
    console.error('Error signing deep link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
