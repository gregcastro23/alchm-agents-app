import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { id, name, expiresAt, tier = 'base' } = await req.json()

    if (!id || !name || !expiresAt) {
      return NextResponse.json(
        { error: 'Missing required parameters: id, name, expiresAt' },
        { status: 400 }
      )
    }

    const normalizedTier = tier === 'premium' ? 'premium' : 'base'
    const secret =
      process.env.DEEP_LINK_SHARED_SECRET ||
      (process.env.NODE_ENV === 'production' ? undefined : 'DEV_SECRET_DO_NOT_USE_IN_PROD')
    if (!secret) {
      console.error('DEEP_LINK_SHARED_SECRET is not set in environment variables.')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Define the exact payload structure to mirror in the Rust verifier.
    // This unlocks an agent inside Alchm Desktop; the desktop app itself is the downloaded chat interface.
    // Format: id:name:tier:expiresAt
    const payload = `${id}:${name}:${normalizedTier}:${expiresAt}`

    // Generate HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const sig = hmac.digest('hex')

    // Construct the signed deep link. The desktop verifier intentionally signs the payload fields,
    // not the path, so this remains compatible with older install-agent links.
    const deepLink = `alchm://unlock-agent?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}&tier=${encodeURIComponent(normalizedTier)}&expiresAt=${encodeURIComponent(expiresAt)}&sig=${encodeURIComponent(sig)}`

    return NextResponse.json({ deepLink, sig, payload, tier: normalizedTier })
  } catch (error) {
    console.error('Error signing deep link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
