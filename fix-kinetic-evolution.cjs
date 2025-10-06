const fs = require('fs');

const filePath = './lib/demo-agents-data.ts';
console.log('=== Fixing kineticEvolution Object Closings ===\n');
let content = fs.readFileSync(filePath, 'utf8');

let lines = content.split('\n');
let fixed = [];
let fixCount = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  fixed.push(line);

  // Look for lastKineticUpdate lines
  if (line.includes('lastKineticUpdate:') && line.includes('new Date')) {
    // Check if next non-empty, non-comment line is qualityMetrics
    let nextIdx = i + 1;
    while (nextIdx < lines.length &&
           (lines[nextIdx].trim() === '' || lines[nextIdx].trim().startsWith('//'))) {
      nextIdx++;
    }

    if (nextIdx < lines.length && lines[nextIdx].includes('qualityMetrics:')) {
      // Need to add closing brace for kineticEvolution
      fixed.push('      },');
      fixCount++;
      console.log(`Line ${i + 2}: Adding closing brace for kineticEvolution`);
    }
  }
}

content = fixed.join('\n');

console.log(`\n✓ Added ${fixCount} closing braces for kineticEvolution objects\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Done!\n');
