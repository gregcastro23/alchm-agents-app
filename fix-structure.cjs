const fs = require('fs');

const filePath = './lib/demo-agents-data.ts';
console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

const originalLength = content.length;
console.log(`Original file: ${originalLength} bytes`);

// Count issues before fixing
const duplicatePlanetsCount = (content.match(/natalChart:\s*\{\s*\n\s*planets:\s*\{\s*\n\s*planets:\s*\{/g) || []).length;
console.log(`\nFound ${duplicatePlanetsCount} agents with duplicate 'planets' key`);

// FIX 1: Remove duplicate "planets: {" line after natalChart
// Pattern: natalChart: {\n      planets: {\n        planets: {
// Keep: natalChart: {\n      planets: {

let lines = content.split('\n');
let fixed = [];
let i = 0;

while (i < lines.length) {
  const line = lines[i];

  // Check if this line is "      planets: {" and next line is "        planets: {"
  if (line.match(/^\s+planets:\s*\{/) && i + 1 < lines.length) {
    const nextLine = lines[i + 1];
    if (nextLine.match(/^\s+planets:\s*\{/)) {
      // Skip this line, keep the next one (it has the actual planet data)
      console.log(`Line ${i + 1}: Removing duplicate "planets: {"`);
      i++;
      continue;
    }
  }

  fixed.push(line);
  i++;
}

content = fixed.join('\n');
console.log('\nStep 1: Removed duplicate "planets: {" declarations');

// FIX 2: Add closing brace before houses
// After planet entries like "Pluto: {...}", we need to close the planets object before houses

lines = content.split('\n');
fixed = [];
let closingBracesAdded = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Check if this line is "houses: {" (with specific indentation showing it's wrongly placed)
  if (line.match(/^\s{8}houses:\s*\{/)) {
    // Check previous line - should be a planet entry
    let prevIdx = i - 1;
    while (prevIdx >= 0 && lines[prevIdx].trim() === '') {
      prevIdx--;
    }

    if (prevIdx >= 0 && lines[prevIdx].match(/(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto):/)) {
      // Add closing brace for planets object before houses
      fixed.push('      },');
      closingBracesAdded++;
      console.log(`Line ${i + 1}: Added closing brace before houses`);
    }
  }

  fixed.push(line);
}

content = fixed.join('\n');
console.log(`\nStep 2: Added ${closingBracesAdded} closing braces before houses`);

// FIX 3: Fix the closing of natalChart - change "], to },
// Pattern:     ],  (after aspects array)
// Should check context

lines = content.split('\n');
fixed = [];
let natalChartClosingsFixed = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Check if line is "], with 4-space indentation (wrong closing for natalChart)
  if (line.match(/^\s{4}\],\s*$/)) {
    // Check if previous content includes aspects (meaning this should close natalChart properly)
    let prevIdx = i - 1;
    while (prevIdx >= 0 && (lines[prevIdx].trim() === '' || lines[prevIdx].trim() === '},')) {
      prevIdx--;
    }

    if (prevIdx >= 0 && lines[prevIdx].includes('planet')) {
      // This ], should be },
      line = line.replace('],', '},');
      natalChartClosingsFixed++;
      console.log(`Line ${i + 1}: Changed '], to },`);
    }
  }

  fixed.push(line);
}

content = fixed.join('\n');
console.log(`\nStep 3: Fixed ${natalChartClosingsFixed} natalChart closings`);

// FIX 4: Fix missing closing braces in arrays (shadows, gifts, challenges)
// Pattern:   transformationPath: '...',
//        },  <-- should be }
//      ],    <-- this is correct

lines = content.split('\n');
fixed = [];
let arrayObjectsFixed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Check for pattern where we have a property ending with comma, followed by },
  if (line.match(/^\s+(transformationPath|expression|growthOpportunity):/)) {
    // Check next line
    if (i + 1 < lines.length && lines[i + 1].match(/^\s+\},/)) {
      // Check line after that
      if (i + 2 < lines.length && lines[i + 2].match(/^\s+\],/)) {
        // This is correct - object in array is closing
      }
    }
  }

  fixed.push(line);
}

content = fixed.join('\n');
console.log(`\nStep 4: Validated ${arrayObjectsFixed} array object closings`);

// FIX 5: Fix abilities object - it has wisdomDomains array inside, then properties outside
// Pattern:
//      wisdomDomains: [...],
//    ],  <-- WRONG, should be },
//      teachingStyle: ...

lines = content.split('\n');
fixed = [];
let abilitiesFixed = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Look for "], pattern after wisdomDomains array
  if (line.match(/^\s{4}\],\s*$/) && i + 1 < lines.length) {
    const nextLine = lines[i + 1];
    // If next line is teachingStyle, resonanceType, or uniquePower, this ], is wrong
    if (nextLine.match(/^\s+(teachingStyle|resonanceType|uniquePower):/)) {
      line = line.replace('],', '},');
      abilitiesFixed++;
      console.log(`Line ${i + 1}: Fixed abilities object closing (], -> },)`);
    }
  }

  fixed.push(line);
}

content = fixed.join('\n');
console.log(`\nStep 5: Fixed ${abilitiesFixed} abilities object closings`);

// FIX 6: Fix kineticEvolution powerLevelUnlocks array closing
// Pattern: ], should be closed with ], but parent object needs },

lines = content.split('\n');
fixed = [];
let kineticFixed = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Look for "], after powerLevelUnlocks array
  if (line.match(/^\s{4}\],\s*$/) && i - 1 >= 0) {
    const prevLine = lines[i - 1];
    // If previous line looks like a power level unlock comment
    if (prevLine.match(/\/\/ Level \d+/)) {
      // Check next line
      if (i + 1 < lines.length && lines[i + 1].match(/^\s+optimalInteractionHours:/)) {
        // This ], should be ],\n      },
        // Actually, no - the array closes fine, but we need to check parent object
        // This is actually correct
      }
    }
  }

  fixed.push(line);
}

content = fixed.join('\n');
console.log(`\nStep 6: Validated ${kineticFixed} kineticEvolution object structures`);

// FIX 7: Fix personality subobjects (shadows, gifts, challenges) - missing closing braces
// These are arrays of objects that should have } before ],

lines = content.split('\n');
fixed = [];
let personalityFixed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Look for lines ending with },\n      ], pattern
  if (line.match(/^\s+(transformationPath|expression|growthOpportunity):.+,\s*$/) && i + 1 < lines.length) {
    const nextLine = lines[i + 1];
    // If next line is just }, then line after should be ],
    if (nextLine.match(/^\s+\},/)) {
      // Check what comes after },
      if (i + 2 < lines.length) {
        const afterNext = lines[i + 2];
        if (afterNext.match(/^\s+(shadows|gifts|challenges|currentMood):/)) {
          // Missing ], after },
          // Need to add it
          const indent = nextLine.match(/^(\s+)/)[1];
          const parentIndent = indent.substring(0, indent.length - 2);
          fixed.push(line);
          fixed.push(nextLine);
          fixed.push(parentIndent + '],');
          i += 2;
          personalityFixed++;
          console.log(`Line ${i + 1}: Added missing ], after ${nextLine.trim()}`);
          continue;
        }
      }
    }
  }

  fixed.push(line);
}

content = fixed.join('\n');
console.log(`\nStep 7: Fixed ${personalityFixed} personality array closings`);

// Write the fixed file
console.log('\nWriting fixed file...');
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\nFixed file: ${content.length} bytes`);
console.log(`Size change: ${content.length - originalLength} bytes`);
console.log('\n✅ File structure fixed! Run TypeScript compiler to verify.');
