import fs from 'fs';
import path from 'path';

// Get all agent files
const agentDir = 'lib/agents/historical';
const files = fs.readdirSync(agentDir).filter(f =>
  f.endsWith('.ts') &&
  f !== 'index.ts' &&
  !['socrates.ts', 'leonardo-da-vinci.ts', 'dante-alighieri.ts', 'thomas-aquinas.ts', 'geoffrey-chaucer.ts', 'albert-einstein.ts', 'rene-descartes.ts'].includes(f)
);

files.forEach(file => {
  const filePath = path.join(agentDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace trailing comma after the agent object
  content = content.replace(/"\s*\n\s*},\s*$/, '"\n}');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
});

console.log('All trailing commas fixed!');
