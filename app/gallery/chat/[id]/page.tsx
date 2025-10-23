import HistoricalAgentChatPage from './chat-client'

// Allow dynamic params - this route can handle any agent ID beyond the pre-generated ones
export const dynamicParams = true

// Pre-generate pages for ALL historical agents at build time
export async function generateStaticParams() {
  // All 35+ historical consciousness agents
  return [
    { id: 'leonardo-da-vinci' },
    { id: 'carl-jung' },
    { id: 'marie-curie' },
    { id: 'albert-einstein' },
    { id: 'nikola-tesla' },
    { id: 'william-shakespeare' },
    { id: 'cleopatra' },
    { id: 'socrates' },
    { id: 'rumi' },
    { id: 'marcus-aurelius' },
    { id: 'vincent-van-gogh' },
    { id: 'wolfgang-mozart' },
    { id: 'maya-angelou' },
    { id: 'isaac-newton' },
    { id: 'charles-darwin' },
    { id: 'galileo-galilei' },
    { id: 'benjamin-franklin' },
    { id: 'eleanor-roosevelt' },
    { id: 'mahatma-gandhi' },
    { id: 'frida-kahlo' },
    { id: 'aristotle' },
    { id: 'plato' },
    { id: 'confucius' },
    { id: 'hypatia' },
    { id: 'ramanujan' },
    { id: 'ada-lovelace' },
    { id: 'alan-turing' },
    { id: 'jane-austen' },
    { id: 'emily-dickinson' },
    { id: 'virginia-woolf' },
    { id: 'simone-de-beauvoir' },
    { id: 'martin-luther-king-jr' },
    { id: 'nelson-mandela' },
    { id: 'stephen-hawking' },
    { id: 'richard-feynman' },
  ]
}

export default function Page() {
  return <HistoricalAgentChatPage />
}
