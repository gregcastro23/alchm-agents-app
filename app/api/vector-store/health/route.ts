/**
 * Vector Store Health Check Endpoint — gated by USE_RAG_GENERATION feature flag.
 * When RAG is disabled, returns 503 without loading any vector-store modules.
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  if (process.env.USE_RAG_GENERATION !== 'true') {
    return NextResponse.json(
      {
        status: 'disabled',
        message: 'RAG features are disabled. Set USE_RAG_GENERATION=true and run `yarn install --include=optional` to enable.',
      },
      { status: 503 }
    )
  }
  // Dynamic import — chromadb/llamaindex stay out of the cold-start graph
  const { healthCheck, listCollections, getCollectionCount } = await import('@/lib/llamaindex')
  try {
    const health = await healthCheck()
    const collections = await listCollections()
    const counts = await Promise.all(
      collections.map(async (c: string) => ({ name: c, count: await getCollectionCount(c) }))
    )
    return NextResponse.json({ status: 'ok', health, collections: counts })
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err?.message }, { status: 500 })
  }
}
