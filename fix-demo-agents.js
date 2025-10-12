import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const filePath = path.join(__dirname, 'lib/demo-agents-data.ts')

let content = fs.readFileSync(filePath, 'utf8')

// Fix ascendant and midheaven objects to be numbers
content = content.replace(
  /ascendant: \{ sign: '([^']+)', degree: (\d+) \},?\s*\n\s*midheaven: \{ sign: '([^']+)', degree: (\d+) \},?/g,
  'ascendant: $2,\n        midheaven: $4,'
)

// Fix name to type in gifts, shadows, challenges
content = content.replace(/name: '([^']+)'/g, "type: '$1'")

// Fix location type to name
content = content.replace(/type: '([^']+)' \},$/gm, "name: '$1' },")

// Remove type property from agents (conflicts with interface)
content = content.replace(/\s+type: '[^']+',\s+/g, '\n  ')

// Add resonanceType to abilities - this needs more specific handling
// Let's add it after teachingStyle
content = content.replace(/(teachingStyle: '[^']+',)/g, "$1\n      resonanceType: 'Intellectual',")

fs.writeFileSync(filePath, content)
console.log('Fixed demo agents data file')
