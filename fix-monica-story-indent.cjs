const fs = require('fs')

const filePath = './lib/demo-agents-data.ts'
console.log('=== Fixing monicaCreationStory Indentation ===\n')
let content = fs.readFileSync(filePath, 'utf8')

let lines = content.split('\n')
let fixed = []
let fixCount = 0

for (let i = 0; i < lines.length; i++) {
  let line = lines[i]

  // Look for "    monicaCreationStory:" with 4 spaces (should be 2)
  if (line.match(/^\s{4}monicaCreationStory:/)) {
    line = line.replace(/^\s{4}/, '  ')
    fixCount++
    console.log(`Line ${i + 1}: Fixed monicaCreationStory indentation (4 -> 2 spaces)`)
  }

  fixed.push(line)
}

content = fixed.join('\n')

console.log(`\n✓ Fixed ${fixCount} monicaCreationStory indentation issues\n`)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Done!\n')
