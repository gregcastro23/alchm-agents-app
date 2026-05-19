export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/feed/stream
 *
 * Server-Sent Events stream of FeedEvent objects.
 *
 * Currently emits keep-alive comments so the client's EventSource stays open
 * without retry-spamming. Real events will be pushed once the producer side
 * (feed-pusher, FeedActivationEngine, /api/feed/cast resolution events,
 * planetary-degree scheduled jobs) writes to a shared channel — see HANDOFF.md §3.
 *
 * Wiring suggestion: a Redis pub/sub channel (or in-memory EventEmitter for
 * single-process dev) keyed by user, with producers writing FeedEvent payloads
 * and this handler subscribing.
 */
export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Open the stream with an immediate comment so proxies don't buffer
      controller.enqueue(encoder.encode(': feed-stream open\n\n'))

      // Keep-alive every 25s — below the typical 30s proxy idle timeout
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ka\n\n'))
        } catch {
          clearInterval(keepAlive)
        }
      }, 25_000)

      // Close on client disconnect — caller's AbortController fires this
      ;(
        controller as ReadableStreamDefaultController & { signal?: AbortSignal }
      ).signal?.addEventListener?.('abort', () => {
        clearInterval(keepAlive)
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
