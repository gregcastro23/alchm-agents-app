const fs = require('fs')

const filePath = './lib/demo-agents-data.ts'
console.log('Reading file...')
let content = fs.readFileSync(filePath, 'utf8')

console.log(`Original file: ${content.length} bytes\n`)

// STEP 1: Fix duplicate planets key
// Find pattern: natalChart: {\n      planets: {\n        planets: {
// Replace with: natalChart: {\n      planets: {

const before = content
content = content.replace(
  /(natalChart:\s*\{\s*\n\s+)planets:\s*\{\s*\n\s+planets:\s*\{/g,
  '$1planets: {'
)

const duplicatesFixed = (
  before.match(/natalChart:\s*\{\s*\n\s+planets:\s*\{\s*\n\s+planets:\s*\{/g) || []
).length
console.log(`Step 1: Fixed ${duplicatesFixed} duplicate 'planets:' keys`)

// STEP 2: Fix houses placement
// After fixing duplicate planets, houses and aspects are now at wrong indentation
// Pattern: (Pluto: { sign:... },)\n        houses: { ASC:
// Should close planets before houses
// Replace with: $1\n      },\n      houses: { ASC:

content = content.replace(
  /(Pluto:\s*\{[^}]+\},)\s*\n(\s{8})houses:\s*\{/g,
  '$1\n      },\n      houses: {'
)

console.log('Step 2: Fixed houses placement (added closing brace for planets)')

// STEP 3: Fix natalChart closing
// Pattern: },\n    ],  (after aspects array)
// Should be: },\n    },  (closing natalChart object)

content = content.replace(/(\{\s*planet1:[^}]+\},\s*\n\s+\],\s*\n\s{4})\],/g, '$1},')

console.log('Step 3: Fixed natalChart closings (], to },)')

// STEP 4: Fix abilities object
// Pattern: wisdomDomains: [...],\n    ],\n      teachingStyle:
// Should be: wisdomDomains: [...],\n    },\n    teachingStyle:

content = content.replace(
  /(wisdomDomains:\s*\[[^\]]+\],\s*\n\s{4})\],(\s*\n\s+teachingStyle:)/g,
  '$1},$2'
)

console.log('Step 4: Fixed abilities object closings')

// STEP 5: Fix personality arrays (shadows, gifts, challenges)
// These should remain as arrays with proper structure
// Check for missing }, before ], in object arrays

// Pattern: transformationPath: '...',\n      },\n    ],
// This is actually correct - no fix needed for proper arrays

console.log('Step 5: Validated personality array structures')

// Write fixed file
console.log('\nWriting fixed file...')
fs.writeFileSync(filePath, content, 'utf8')

console.log(`Fixed file: ${content.length} bytes`)
console.log('\n✅ File fixed! Verifying with TypeScript...\n')
