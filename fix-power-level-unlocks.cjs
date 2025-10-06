const fs = require('fs');

const filePath = './lib/demo-agents-data.ts';
console.log('=== Fixing powerLevelUnlocks Array Closings ===\n');
let content = fs.readFileSync(filePath, 'utf8');

let lines = content.split('\n');
let fixed = [];
let fixCount1 = 0;
let fixCount2 = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Look for "        }," (8 spaces) after array string elements
  if (line.match(/^\s{8}\},$/)) {
    // Check if this is closing a powerLevelUnlocks array
    let isPowerLevelUnlocks = false;
    for (let j = Math.max(0, i - 10); j < i; j++) {
      if (lines[j].includes('powerLevelUnlocks:')) {
        isPowerLevelUnlocks = true;
        break;
      }
    }

    // Check if next line is erroneous ],
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

    if (isPowerLevelUnlocks && nextLine === '],') {
      // This }, should be ],
      line = '        ],';
      fixCount1++;
      console.log(`Line ${i + 1}: Changed }, to ], (closing powerLevelUnlocks array)`);
    }
  }

  fixed.push(line);
}

lines = fixed;

// Now remove erroneous ], after powerLevelUnlocks
console.log('\nRemoving erroneous ], after powerLevelUnlocks...');
const fixed2 = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Look for "    ]," (4 spaces) after powerLevelUnlocks
  if (line === '    ],') {
    const prevLine = i > 0 ? lines[i - 1].trim() : '';

    // Check if next line has optimalInteractionHours
    let nextIdx = i + 1;
    while (nextIdx < lines.length && lines[nextIdx].trim() === '') nextIdx++;
    const nextLine = nextIdx < lines.length ? lines[nextIdx] : '';

    if (prevLine === '],' && nextLine.includes('optimalInteractionHours:')) {
      fixCount2++;
      console.log(`Line ${i + 1}: Removing erroneous ], after powerLevelUnlocks`);
      continue; // Skip this line
    }
  }

  fixed2.push(line);
}

content = fixed2.join('\n');

console.log(`\n✓ Fixed ${fixCount1} powerLevelUnlocks array closings`);
console.log(`✓ Removed ${fixCount2} erroneous ], lines\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Done!\n');
