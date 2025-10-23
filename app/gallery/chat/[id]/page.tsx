import HistoricalAgentChatPage from './chat-client'

// Allow dynamic params - this route can handle any agent ID beyond the pre-generated ones
export const dynamicParams = true

// Pre-generate pages for ALL historical agents at build time
export async function generateStaticParams() {
  // All historical consciousness agents from DEMO_AGENTS
  return [
    { id: 'benjamin-franklin' },
    { id: 'carl-jung' },
    { id: 'carl-sagan' },
    { id: 'charles-darwin' },
    { id: 'cleopatra' },
    { id: 'confucius' },
    { id: 'eleanor-roosevelt' },
    { id: 'frida-kahlo' },
    { id: 'galileo-galilei' },
    { id: 'hildegard-of-bingen' },
    { id: 'ibn-sina-avicenna' },
    { id: 'isaac-newton' },
    { id: 'joan-of-arc' },
    { id: 'lao-tzu' },
    { id: 'leonardo-da-vinci' },
    { id: 'mahatma-gandhi' },
    { id: 'marcus-aurelius' },
    { id: 'marie-curie' },
    { id: 'mary-wollstonecraft' },
    { id: 'maya-angelou' },
    { id: 'murasaki-shikibu' },
    { id: 'nikola-tesla' },
    { id: 'paulo-freire' },
    { id: 'rachel-carson' },
    { id: 'rumi' },
    { id: 'siddhartha-gautama-buddha' },
    { id: 'sitting-bull' },
    { id: 'socrates' },
    { id: 'sojourner-truth' },
    { id: 'tecumseh' },
    { id: 'vincent-van-gogh' },
    { id: 'wangari-maathai' },
    { id: 'william-shakespeare' },
    { id: 'wolfgang-mozart' },
  ]
}

export default function Page() {
  return <HistoricalAgentChatPage />
}
