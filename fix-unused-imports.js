import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Common unused imports to remove
const unusedImports = [
  'getTransitsByPlanet',
  'HistoricalTransitCard',
  'ApiErrorBanner',
  'ConsciousnessMemorySystem',
  'KineticProfile',
  'calculateMomentumSynergy',
  'calculateElementCompatibility',
  'calculateAstrologyCompatibility',
  'birthData',
  'agentProfile',
  'updateData',
  'generateAlchmForBirthInfo',
]

function removeUnusedImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Remove unused imports
  for (const importName of unusedImports) {
    const regex = new RegExp(
      `import \\{[^}]*\\b${importName}\\b[^}]*\\} from ['"'][^'"']+['"'];?\\s*\\n`,
      'g'
    )
    if (regex.test(content)) {
      content = content.replace(regex, '')
      modified = true
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`Fixed unused imports in ${filePath}`)
  }
}

// Find and fix files with unused import errors
const filesWithErrors = [
  'app/agents/[planet]/[sign]/[degree]/page.tsx',
  'app/alchm-quantities/page.tsx',
  'app/api/admin/system-stats/route.ts',
  'app/api/advanced-agent/route.ts',
  'app/api/agent-cache-metrics/route.ts',
  'app/api/agent-dashboard/route.ts',
  'app/api/agent-evolution/compatibility/route.ts',
  'app/api/agent-evolution/route.ts',
  'app/api/agent-interaction/route.ts',
  'app/api/agent-recommendations/route.ts',
]

for (const file of filesWithErrors) {
  const fullPath = path.join(__dirname, file)
  if (fs.existsSync(fullPath)) {
    removeUnusedImports(fullPath)
  }
}

console.log('Finished fixing unused imports')
