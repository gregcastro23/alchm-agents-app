import HistoricalAgentChatPage from './chat-client'

// Allow dynamic params - this route can handle any agent ID beyond the pre-generated ones
export const dynamicParams = true

// Pre-generate pages for common agent IDs at build time
export async function generateStaticParams() {
  // Return common agents to pre-render as static pages
  return [
    { id: 'leonardo-da-vinci' },
    { id: 'carl-jung' },
    { id: 'marie-curie' },
    { id: 'albert-einstein' },
    { id: 'nikola-tesla' },
    { id: 'william-shakespeare' },
    { id: 'cleopatra' },
    { id: 'aristotle' },
  ]
}

export default function Page() {
  return <HistoricalAgentChatPage />
}
