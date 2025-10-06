const fs = require('fs');

const filePath = './lib/demo-agents-data.ts';
console.log('=== ULTIMATE Demo Agents Data Structure Fix ===\n');
console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

const originalLength = content.length;
console.log(`Original file: ${originalLength} bytes\n`);

// Strategy:
// 1. Remove duplicate "planets: {" lines
// 2. Add "      }," before ANY "houses: {" line that follows planet entries
// 3. Fix indentation of houses and aspects to 6 spaces
// 4. Change aspects array closing from }, to ],
// 5. Change natalChart closing from ], to },
// 6. Fix wisdomDomains array closing from }, to ],
// 7. Remove erroneous ], after wisdomDomains

let lines = content.split('\n');

// Step 1: Remove duplicate planets
console.log('Step 1: Removing duplicate "planets:" declarations...');
let fixed = [];
let count1 = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/^\s{6}planets:\s*\{$/) && i + 1 < lines.length && lines[i + 1].match(/^\s{8}planets:\s*\{$/)) {
    count1++;
    continue;
  }
  fixed.push(line);
}

lines = fixed;
console.log(`  ✓ Removed ${count1} duplicate planets declarations\n`);

// Step 2: Add closing brace before houses + fix indentation
console.log('Step 2: Adding closing braces before houses + fixing indentation...');
fixed = [];
let count2a = 0;
let count2b = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Check for "      houses: {" or "        houses: {" (6 or 8 spaces)
  const housesMatch = line.match(/^(\s{6,8})houses:\s*\{/);
  if (housesMatch) {
    // Add closing brace with 6-space indent before houses
    fixed.push('      },');
    count2a++;
    // Fix indentation to 6 spaces
    if (housesMatch[1].length === 8) {
      line = line.replace(/^\s{8}/, '      ');
      count2b++;
    }
  }

  // Check for "      aspects: [" or "        aspects: [" (6 or 8 spaces)
  const aspectsMatch = line.match(/^(\s{6,8})aspects:\s*\[/);
  if (aspectsMatch && aspectsMatch[1].length === 8) {
    line = line.replace(/^\s{8}/, '      ');
    count2b++;
  }

  // Fix indentation of aspect array items (10 spaces -> 8 spaces)
  if (line.match(/^\s{10}\{\s*planet1:/)) {
    line = line.replace(/^\s{10}/, '        ');
    count2b++;
  }

  fixed.push(line);
}

lines = fixed;
console.log(`  ✓ Added ${count2a} closing braces before houses`);
console.log(`  ✓ Fixed ${count2b} indentation issues\n`);

// Step 3: Change aspects array closing from }, to ],
console.log('Step 3: Fixing aspects array closings...');
fixed = [];
let count3 = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Look for "      }," or "        }," that should close aspects array
  if (line.match(/^\s{6,8}\},$/)) {
    // Check if previous lines have aspect entries
    let isAspectsClosing = false;
    for (let j = Math.max(0, i - 5); j < i; j++) {
      if (lines[j].includes('planet1') && lines[j].includes('planet2')) {
        isAspectsClosing = true;
        break;
      }
    }

    // Check if next line closes natalChart
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    if (isAspectsClosing && nextLine === '},') {
      line = '      ],';
      count3++;
    }
  }

  fixed.push(line);
}

lines = fixed;
console.log(`  ✓ Fixed ${count3} aspects array closings\n`);

// Step 4: Change natalChart closing from ], to },
console.log('Step 4: Fixing natalChart closings...');
fixed = [];
let count4 = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  if (line === '    ],') {
    // Check if after aspects
    let isAfterAspects = false;
    for (let j = Math.max(0, i - 10); j < i; j++) {
      if (lines[j].includes('aspects:') || lines[j].includes('planet1')) {
        isAfterAspects = true;
        break;
      }
    }

    // Check if before consciousness props
    let nextIdx = i + 1;
    while (nextIdx < lines.length && lines[nextIdx].trim() === '') nextIdx++;
    const isBeforeConsciousness = nextIdx < lines.length &&
      (lines[nextIdx].includes('monicaConstant') || lines[nextIdx].includes('level:'));

    if (isAfterAspects && isBeforeConsciousness) {
      line = '    },';
      count4++;
    }
  }

  fixed.push(line);
}

lines = fixed;
console.log(`  ✓ Fixed ${count4} natalChart closings\n`);

// Step 5: Fix wisdomDomains array closing from }, to ],
console.log('Step 5: Fixing wisdomDomains array closings...');
fixed = [];
let count5 = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  if (line.match(/^\s{6}\},$/)) {
    // Check if closing wisdomDomains
    let isWisdomDomains = false;
    for (let j = Math.max(0, i - 10); j < i; j++) {
      if (lines[j].includes('wisdomDomains:')) {
        isWisdomDomains = true;
        break;
      }
    }

    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    if (isWisdomDomains && nextLine === '],') {
      line = '      ],';
      count5++;
    }
  }

  fixed.push(line);
}

lines = fixed;
console.log(`  ✓ Fixed ${count5} wisdomDomains array closings\n`);

// Step 6: Remove erroneous ], after wisdomDomains
console.log('Step 6: Removing erroneous ], lines...');
fixed = [];
let count6 = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line === '    ],') {
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    let nextIdx = i + 1;
    while (nextIdx < lines.length && lines[nextIdx].trim() === '') nextIdx++;
    const nextLine = nextIdx < lines.length ? lines[nextIdx] : '';

    if (prevLine === '],' && nextLine.includes('teachingStyle:')) {
      count6++;
      continue; // Skip this line
    }
  }

  fixed.push(line);
}

lines = fixed;
console.log(`  ✓ Removed ${count6} erroneous ], lines\n`);

// Write the fixed content
content = lines.join('\n');

console.log('Writing fixed file...');
fs.writeFileSync(filePath, content, 'utf8');

const finalLength = content.length;
console.log(`\nFinal file: ${finalLength} bytes`);
console.log(`Size change: ${finalLength - originalLength} bytes`);
console.log('\n=== ✅ ALL STRUCTURAL FIXES COMPLETE ===\n');

console.log('Summary:');
console.log(`  • ${count1} duplicate "planets:" removed`);
console.log(`  • ${count2a} closing braces added before houses`);
console.log(`  • ${count2b} indentation fixes`);
console.log(`  • ${count3} aspects arrays fixed`);
console.log(`  • ${count4} natalChart closings fixed`);
console.log(`  • ${count5} wisdomDomains arrays fixed`);
console.log(`  • ${count6} erroneous ], removed\n`);
