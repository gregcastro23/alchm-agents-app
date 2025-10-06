const fs = require('fs');

const filePath = './lib/demo-agents-data.ts';
console.log('=== Fixing stats Object Closings ===\n');
let content = fs.readFileSync(filePath, 'utf8');

let lines = content.split('\n');
let fixed = [];
let fixCount = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  fixed.push(line);

  // Look for closing of qualityMetrics: "    },"
  if (line === '    },') {
    // Check if previous content included qualityMetrics
    let hasQualityMetrics = false;
    for (let j = Math.max(0, i - 10); j < i; j++) {
      if (lines[j].includes('qualityMetrics:')) {
        hasQualityMetrics = true;
        break;
      }
    }

    // Check if next non-empty line is monicaCreationStory
    let nextIdx = i + 1;
    while (nextIdx < lines.length && lines[nextIdx].trim() === '') {
      nextIdx++;
    }

    if (hasQualityMetrics && nextIdx < lines.length &&
        lines[nextIdx].includes('monicaCreationStory:')) {
      // Need to add closing brace for stats
      fixed.push('  },');
      fixCount++;
      console.log(`Line ${i + 2}: Adding closing brace for stats object`);
    }
  }
}

content = fixed.join('\n');

console.log(`\n✓ Added ${fixCount} closing braces for stats objects\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Done!\n');
