import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix common unused variable patterns
function fixUnusedVariables(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return false;

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Pattern 1: Unused const variables in destructuring
  // const { searchParams } = new URL(request.url) - but searchParams not used
  const unusedDestructureRegex = /const \{ (\w+) \} = new URL\(request\.url\);\s*$/gm;
  content = content.replace(unusedDestructureRegex, 'new URL(request.url); // unused destructuring removed');
  if (unusedDestructureRegex.test(content)) modified = true;

  // Pattern 2: Unused function parameters - prefix with underscore
  const unusedParamRegex = /function \w+\([^)]*\b(\w+)\b[^)]*\) \{/g;
  // This is too risky without more context, skip

  // Pattern 3: Remove unused imports (simple cases)
  // import { Something } from 'module'; where Something is never used
  // This is complex, skip for now

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed unused variables in ${filePath}`);
    return true;
  }
  return false;
}

// Target API files that commonly have unused variables
const apiFiles = [
  'app/api/agent-dashboard/route.ts',
  'app/api/agent-evolution/compatibility/route.ts',
  'app/api/agent-evolution/route.ts',
  'app/api/agent-interaction/route.ts',
  'app/api/agent-recommendations/route.ts'
];

let fixedCount = 0;
for (const file of apiFiles) {
  if (fixUnusedVariables(file)) fixedCount++;
}

console.log(`\n📊 Fixed unused variables in ${fixedCount} files`);
