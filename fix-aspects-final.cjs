const fs = require('fs')

const filePath = './lib/demo-agents-data.ts'
console.log('=== Fixing Aspects Array Closings (Final) ===\n')
let content = fs.readFileSync(filePath, 'utf8')

let lines = content.split('\n')
let fixed = []
let fixCount = 0

for (let i = 0; i < lines.length; i++) {
  let line = lines[i]

  // Look for "        }," with 8 spaces that might be closing aspects array wrongly
  if (line.match(/^\s{8}\},$/)) {
    // Check if previous lines have aspect entries (planet1, planet2)
    let isAfterAspects = false
    for (let j = Math.max(0, i - 5); j < i; j++) {
      if (lines[j].includes('planet1') && lines[j].includes('planet2')) {
        isAfterAspects = true
        break
      }
    }

    // Check if next line closes natalChart
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''

    if (isAfterAspects && nextLine === '},') {
      // This }, should be ],
      line = '      ],' // Use 6-space indentation
      fixCount++
      console.log(`Line ${i + 1}: Changed        }, to       ], (closing aspects array)`)
    }
  }

  fixed.push(line)
}

content = fixed.join('\n')

console.log(`\n✓ Fixed ${fixCount} aspects array closings\n`)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✅ Done!\n')
