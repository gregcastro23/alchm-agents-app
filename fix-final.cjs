const fs = require('fs')

const filePath = './lib/demo-agents-data.ts'
console.log('Reading file...')
let content = fs.readFileSync(filePath, 'utf8')

console.log(`Original file: ${content.length} bytes\n`)

// The current fixed file has:
// - Removed duplicate planets: {} ✅
// - Added closing } before houses ✅
// - But still has wrong closing for natalChart

// FIX: Change the closing of natalChart from ], to },
// Pattern to find: aspects array closing followed by ],
// This ], on line with 4-space indent should be }, to close natalChart

const lines = content.split('\n')
const fixed = []

let fixCount = 0

for (let i = 0; i < lines.length; i++) {
  let line = lines[i]

  // Check if this is a 4-space indented ], that closes natalChart
  if (line === '    ],') {
    // Look back to see if we're after an aspects array
    let j = i - 1
    // Skip back over the closing of aspects array
    while (j >= 0 && (lines[j].trim() === '' || lines[j].trim() === '},')) {
      j--
    }

    // If we find a line with planet1 or planet2, we're after aspects
    let isAfterAspects = false
    for (let k = Math.max(0, i - 10); k < i; k++) {
      if (
        lines[k].includes('aspects:') ||
        (lines[k].includes('planet1') && lines[k].includes('planet2'))
      ) {
        isAfterAspects = true
        break
      }
    }

    // Look ahead to see if monicaConstant or level follows
    let j2 = i + 1
    while (j2 < lines.length && lines[j2].trim() === '') {
      j2++
    }

    const isBeforeConsciousnessProps =
      j2 < lines.length &&
      (lines[j2].includes('monicaConstant') ||
        lines[j2].includes('level:') ||
        lines[j2].includes('dominantElement'))

    if (isAfterAspects && isBeforeConsciousnessProps) {
      // This ], should be },
      line = '    },'
      fixCount++
      console.log(`Line ${i + 1}: Changed ], to }, (closing natalChart)`)
    }
  }

  fixed.push(line)
}

content = fixed.join('\n')
console.log(`\nFixed ${fixCount} natalChart closings\n`)

// Now add ascendant and midheaven fields
// These should be added after aspects array, before the closing }
// Based on houses data: ASC value should be ascendant, MC value should be midheaven

const lines2 = content.split('\n')
const fixed2 = []

let addCount = 0

for (let i = 0; i < lines2.length; i++) {
  const line = lines2[i]

  fixed2.push(line)

  // Look for pattern: aspects: [...],\n    },
  // We want to add ascendant and midheaven before the },
  if (line.trim() === '],') {
    // Check if previous content includes aspects
    let isAfterAspects = false
    for (let k = Math.max(0, i - 3); k < i; k++) {
      if (lines2[k].includes('aspects:')) {
        isAfterAspects = true
        break
      }
    }

    // Look for houses data nearby to extract ASC and MC
    let ascValue = 0
    let mcValue = 0
    for (let k = Math.max(0, i - 20); k < i; k++) {
      const match = lines2[k].match(/houses:\s*\{\s*ASC:\s*(\d+),\s*MC:\s*(\d+)\s*\}/)
      if (match) {
        ascValue = parseInt(match[1])
        mcValue = parseInt(match[2])
        break
      }
    }

    // Check if next line is the closing }, of natalChart
    if (isAfterAspects && i + 1 < lines2.length && lines2[i + 1].trim() === '},') {
      // Add ascendant and midheaven
      fixed2.push(`      ascendant: ${ascValue},`)
      fixed2.push(`      midheaven: ${mcValue},`)
      addCount++
      console.log(`Line ${i + 2}: Added ascendant and midheaven fields`)
    }
  }
}

content = fixed2.join('\n')
console.log(`\nAdded ascendant/midheaven to ${addCount} agents\n`)

// Write fixed file
console.log('Writing fixed file...')
fs.writeFileSync(filePath, content, 'utf8')

console.log(`Fixed file: ${content.length} bytes`)
console.log('\n✅ All structural fixes applied!\n')
