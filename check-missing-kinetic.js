import fs from 'fs'

const fileContent = fs.readFileSync('./lib/demo-agents-data.ts', 'utf8')

const agents = [
  'monica-001',
  'carl-jung',
  'nikola-tesla',
  'cleopatra',
  'frida-kahlo',
  'leonardo-da-vinci',
  'marie-curie',
  'socrates',
  'rumi',
  'marcus-aurelius',
  'vincent-van-gogh',
  'wolfgang-mozart',
  'william-shakespeare',
  'maya-angelou',
  'isaac-newton',
  'charles-darwin',
  'galileo-galilei',
  'benjamin-franklin',
  'eleanor-roosevelt',
  'mahatma-gandhi',
  'confucius',
  'lao-tzu',
  'siddhartha-gautama-buddha',
  'murasaki-shikibu',
  'ibn-sina-avicenna',
  'tecumseh',
  'wangari-maathai',
  'sitting-bull',
  'joan-of-arc',
  'hildegard-of-bingen',
  'mary-wollstonecraft',
  'sojourner-truth',
  'carl-sagan',
  'rachel-carson',
  'paulo-freire',
]

console.log('Checking kinetic evolution implementation...\n')

const missing = []
const implemented = []

agents.forEach(agent => {
  const agentPattern = new RegExp(`id: '${agent}'[\\s\\S]*?(?=\\n  \\{|\\n\\]|$)`)
  const agentMatch = fileContent.match(agentPattern)

  if (agentMatch) {
    const hasKinetic = agentMatch[0].includes('kineticEvolution:')
    if (hasKinetic) {
      implemented.push(agent)
    } else {
      missing.push(agent)
    }
  }
})

console.log(`✅ Implemented (${implemented.length}):`)
implemented.forEach(a => console.log(`   - ${a}`))

console.log(`\n❌ Missing (${missing.length}):`)
missing.forEach(a => console.log(`   - ${a}`))

console.log(
  `\n📊 Coverage: ${implemented.length}/${agents.length} (${Math.round((implemented.length / agents.length) * 100)}%)`
)
