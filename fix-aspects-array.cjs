const fs = require('fs');

const filePath = './lib/demo-agents-data.ts';
console.log('=== Fixing Aspects Array Closings ===\n');
console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

console.log(`Original file: ${content.length} bytes\n`);

let lines = content.split('\n');
let fixed = [];
let fixCount = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Look for "      }," with 6 spaces that should close an aspects array
  if (line.match(/^\s{6}\},$/)) {
    // Check if this is closing an aspects array
    let isAspectsArrayClosing = false;
    for (let j = Math.max(0, i - 5); j < i; j++) {
      if (lines[j].includes('planet1') && lines[j].includes('planet2')) {
        isAspectsArrayClosing = true;
        break;
      }
    }

    // Check if next line closes natalChart with },
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

    if (isAspectsArrayClosing && nextLine === '},') {
      // This }, should be ],
      line = '      ],';
      fixCount++;
      console.log(`Line ${i + 1}: Changed }, to ], (closing aspects array)`);
    }
  }

  fixed.push(line);
}

content = fixed.join('\n');

console.log(`\n✓ Fixed ${fixCount} aspects array closings\n`);

console.log('Writing fixed file...');
fs.writeFileSync(filePath, content, 'utf8');

console.log(`Fixed file: ${content.length} bytes`);
console.log('\n✅ Aspects array closings fixed!\n');
