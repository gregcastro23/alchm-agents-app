import { NextRequest, NextResponse } from 'next/server'
import { BirthInfoSchema, type BirthInfo } from '@/lib/schemas'
import { fetchAlchmize } from '@/lib/astrologize'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RequestBody = {
  birth: BirthInfo
  prompt?: string
  imaginizeOptions?: Record<string, any>
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<RequestBody>
    if (!body || !body.birth) {
      return NextResponse.json({ error: 'Missing body.birth' }, { status: 400 })
    }

    // Validate and normalize birth info (expects zero-based month per codebase rule)
    const birth = BirthInfoSchema.parse(body.birth)

    const result = await fetchAlchmize({
      birth,
      prompt: body.prompt,
      imaginizeOptions: body.imaginizeOptions || {},
    })

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
      status: result.meta.degraded ? 207 : 200, // 207 Multi-Status if partially degraded
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to process alchmize request', details: e?.message || String(e) },
      { status: 500 }
    )
  }
}
