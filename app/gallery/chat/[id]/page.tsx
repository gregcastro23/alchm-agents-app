import HistoricalAgentChatPage from './chat-client'

// Allow dynamic params - this route can handle any agent ID
export const dynamicParams = true
export const dynamic = 'force-dynamic'

// Optional: Pre-generate pages for common agent IDs at build time
export async function generateStaticParams() {
  // Return a subset of common agents to pre-render
  return [
    { id: 'leonardo-da-vinci' },
    { id: 'carl-jung' },
    { id: 'marie-curie' },
    { id: 'albert-einstein' },
    { id: 'nikola-tesla' },
  ]
}

export default function Page() {
  return <HistoricalAgentChatPage />
}
