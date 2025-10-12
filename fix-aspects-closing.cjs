const fs = require('fs')

const filePath = './lib/demo-agents-data.ts'
console.log('Reading file...')
let content = fs.readFileSync(filePath, 'utf8')

console.log(`Original file: ${content.length} bytes\n`)

// The aspects array is currently closing with }, instead of ],
// Pattern:
//   aspects: [
//     { planet1: ..., planet2: ..., type: ..., orb: ..., exact: ... },
//     { planet1: ..., planet2: ..., type: ..., orb: ..., exact: ... },
//   },  <-- WRONG, should be ],

const lines = content.split('\n')
const fixed = []

let fixCount = 0

for (let i = 0; i < lines.length; i++) {
  let line = lines[i]

  // Check if this is an 8-space indented }, that should close an aspects array
  if (line === '        },') {
    // Look back a few lines to see if we're in an aspects array
    let inAspectsArray = false
    for (let j = Math.max(0, i - 5); j < i; j++) {
      if (
        lines[j].includes('aspects:') ||
        (lines[j].includes('planet1') && lines[j].includes('exact:'))
      ) {
        inAspectsArray = true
        break
      }
    }

    // Look ahead to see if next line closes natalChart
    const nextLine = i + 1 < lines.length ? lines[i + 1] : ''

    if (inAspectsArray && nextLine === '    },') {
      // This }, should be ],
      line = '        ],'
      fixCount++
      console.log(`Line ${i + 1}: Changed }, to ], (closing aspects array)`)
    }
  }

  fixed.push(line)
}

content = fixed.join('\n')
console.log(`\nFixed ${fixCount} aspects array closings\n`)

// Write fixed file
console.log('Writing fixed file...')
fs.writeFileSync(filePath, content, 'utf8')

console.log(`Fixed file: ${content.length} bytes`)
console.log('\n✅ Aspects arrays fixed!\n')
