const fs = require('fs');
const path = require('path');

function fixHistoricalAgentFile(filePath) {
  console.log(`Fixing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove commas after opening braces
  content = content.replace(/{\s*,/g, '{');

  // Add commas after property assignments (but not after opening braces or other constructs)
  // This is tricky with regex, so let's do it line by line
  const lines = content.split('\n');
  const fixedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip import lines, comments, and lines that already end with commas or braces
    if (line.trim().startsWith('import') ||
        line.trim().startsWith('//') ||
        line.trim().startsWith('*') ||
        line.trim().endsWith(',') ||
        line.trim().endsWith('{') ||
        line.trim().endsWith('}') ||
        line.trim() === '') {
      fixedLines.push(line);
      continue;
    }

    // Add comma if line contains a property assignment
    if (line.includes(': ') && !line.includes('{') && !line.includes('}')) {
      // Check if this is the last property in an object by looking at the next line
      const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
      if (nextLine !== '' && !nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '}' && nextLine !== '},') {
        line += ',';
      }
    }

    fixedLines.push(line);
  }

  content = fixedLines.join('\n');
  fs.writeFileSync(filePath, content);
}

function fixAllHistoricalAgents() {
  const historicalDir = 'lib/agents/historical';

  if (!fs.existsSync(historicalDir)) {
    console.log('Historical agents directory not found');
    return;
  }

  const files = fs.readdirSync(historicalDir).filter(file => file.endsWith('.ts'));

  files.forEach(file => {
    fixHistoricalAgentFile(path.join(historicalDir, file));
  });

  console.log(`Fixed ${files.length} historical agent files`);
}

fixAllHistoricalAgents();
