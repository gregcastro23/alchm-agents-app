const fs = require('fs')

const filePath = './lib/demo-agents-data.ts'
console.log('=== CORRECT Comprehensive Demo Agents Data Structure Fix ===\n')
console.log('Reading file...')
let content = fs.readFileSync(filePath, 'utf8')

const originalLength = content.length
console.log(`Original file: ${originalLength} bytes\n`)

let lines = content.split('\n')

// ==================================================================
// FIX 1: Remove duplicate "planets: {" lines
// ==================================================================
console.log('Step 1: Removing duplicate "planets:" declarations...')
let fixed = []
let duplicatesRemoved = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  // Skip lines that are "      planets: {" if the next line is "        planets: {"
  if (
    line.match(/^\s{6}planets:\s*\{$/) &&
    i + 1 < lines.length &&
    lines[i + 1].match(/^\s{8}planets:\s*\{$/)
  ) {
    console.log(`  Line ${i + 1}: Skipping duplicate "planets: {"`)
    duplicatesRemoved++
    continue
  }

  fixed.push(line)
}

lines = fixed
console.log(`  ✓ Removed ${duplicatesRemoved} duplicate planets declarations\n`)

// ==================================================================
// FIX 2: Add closing brace for planets object before houses
// ==================================================================
console.log('Step 2: Adding closing braces for planets objects...')
fixed = []
let closingBracesAdded = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  // Look for "        houses: {" pattern (8 spaces)
  if (line.match(/^\s{8}houses:\s*\{/)) {
    // Add closing brace for planets object with 6-space indent
    fixed.push('      },')
    closingBracesAdded++
    console.log(`  Line ${i + 1}: Added closing brace before houses`)
  }

  fixed.push(line)
}

lines = fixed
console.log(`  ✓ Added ${closingBracesAdded} closing braces for planets\n`)

// ==================================================================
// FIX 3: Fix natal Chart closing - change ], to },
// ==================================================================
console.log('Step 3: Fixing natalChart closing braces...')
fixed = []
let natalChartFixed = 0

for (let i = 0; i < lines.length; i++) {
  let line = lines[i]

  // Look for "    ]," with exactly 4 spaces
  if (line === '    ],') {
    // Check if this is after aspects array (should close natalChart)
    let isAfterAspects = false
    for (let j = Math.max(0, i - 10); j < i; j++) {
      if (lines[j].includes('planet1') || lines[j].includes('aspects:')) {
        isAfterAspects = true
        break
      }
    }

    // Check if next non-empty line has monicaConstant or level
    let nextContentIdx = i + 1
    while (nextContentIdx < lines.length && lines[nextContentIdx].trim() === '') {
      nextContentIdx++
    }

    const isBeforeConsciousness =
      nextContentIdx < lines.length &&
      (lines[nextContentIdx].includes('monicaConstant') ||
        lines[nextContentIdx].includes('level:') ||
        lines[nextContentIdx].includes('dominantElement'))

    if (isAfterAspects && isBeforeConsciousness) {
      line = '    },'
      natalChartFixed++
      console.log(`  Line ${i + 1}: Changed ], to }, (closing natalChart)`)
    }
  }

  fixed.push(line)
}

lines = fixed
console.log(`  ✓ Fixed ${natalChartFixed} natalChart closings\n`)

// ==================================================================
// FIX 4: Fix wisdomDomains array closing in abilities
// ==================================================================
console.log('Step 4: Fixing wisdomDomains array closings...')
fixed = []
let wisdomDomainsFixed = 0

for (let i = 0; i < lines.length; i++) {
  let line = lines[i]

  // Look for "      }," (6 spaces) after array elements (items starting with ')
  if (line.match(/^\s{6}\},$/)) {
    // Check if this is closing a wisdomDomains array (look back for array items)
    let isWisdomDomainsClosing = false
    for (let j = Math.max(0, i - 10); j < i; j++) {
      if (lines[j].includes('wisdomDomains:')) {
        isWisdomDomainsClosing = true
        break
      }
    }

    // Check if next line is another erroneous ],
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''

    if (isWisdomDomainsClosing && nextLine === '],') {
      // This }, should be ],
      line = '      ],'
      wisdomDomainsFixed++
      console.log(`  Line ${i + 1}: Changed }, to ], (closing wisdomDomains array)`)
    }
  }

  fixed.push(line)
}

lines = fixed
console.log(`  ✓ Fixed ${wisdomDomainsFixed} wisdomDomains array closings\n`)

// ==================================================================
// FIX 5: Remove erroneous ], after wisdomDomains
// ==================================================================
console.log('Step 5: Removing erroneous ], after abilities...')
fixed = []
let erroneousRemoved = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  // Look for "    ]," (4 spaces) that appears after wisdomDomains array
  if (line === '    ],') {
    // Check if this is the erroneous closing after wisdomDomains
    // It should appear right after the wisdomDomains array closing
    const prevLine = i > 0 ? lines[i - 1].trim() : ''

    // Check if next line has teachingStyle
    let nextContentIdx = i + 1
    while (nextContentIdx < lines.length && lines[nextContentIdx].trim() === '') {
      nextContentIdx++
    }

    const isBeforeTeachingStyle =
      nextContentIdx < lines.length && lines[nextContentIdx].includes('teachingStyle:')

    // If previous line closed an array and next line is teaching style, this is erroneous
    if (prevLine === '],' && isBeforeTeachingStyle) {
      console.log(`  Line ${i + 1}: Removing erroneous ], after wisdomDomains`)
      erroneousRemoved++
      continue // Skip this line
    }
  }

  fixed.push(line)
}

lines = fixed
console.log(`  ✓ Removed ${erroneousRemoved} erroneous ], lines\n`)

// Write the fixed content
content = lines.join('\n')

console.log('Writing fixed file...')
fs.writeFileSync(filePath, content, 'utf8')

const finalLength = content.length
console.log(`\nFinal file: ${finalLength} bytes`)
console.log(`Size change: ${finalLength - originalLength} bytes`)
console.log('\n=== ✅ ALL STRUCTURAL FIXES COMPLETE ===\n')

// Summary
console.log('Summary of fixes:')
console.log(`  • ${duplicatesRemoved} duplicate "planets:" declarations removed`)
console.log(`  • ${closingBracesAdded} closing braces added for planets objects`)
console.log(`  • ${natalChartFixed} natalChart closings fixed (], -> },)`)
console.log(`  • ${wisdomDomainsFixed} wisdomDomains array closings fixed (}, -> ],)`)
console.log(`  • ${erroneousRemoved} erroneous ], lines removed`)
console.log('\nRun "yarn tsc --noEmit lib/demo-agents-data.ts" to verify.\n')
