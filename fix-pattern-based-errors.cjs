const fs = require('fs');
const path = require('path');

function fixPatternBasedErrors(filePath) {
  console.log(`Fixing pattern-based errors in ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Fix 1: Add comma to midheaven if it's missing and followed by closing brace
    if (line.includes('midheaven:') && !line.endsWith(',')) {
      let nextIndex = i + 1;
      let nextSignificantLine = '';

      while (nextIndex < lines.length) {
        const nextLine = lines[nextIndex].trim();
        if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '') {
          nextSignificantLine = nextLine;
          break;
        }
        nextIndex++;
      }

      if (nextSignificantLine === '}' || nextSignificantLine === '},') {
        line += ',';
        modified = true;
      }
    }

    // Fix 2: Add comma after array closing brackets when followed by properties
    if (line.trim() === ']' || line.trim().endsWith(']')) {
      let nextIndex = i + 1;
      let nextSignificantLine = '';

      while (nextIndex < lines.length) {
        const nextLine = lines[nextIndex].trim();
        if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '') {
          nextSignificantLine = nextLine;
          break;
        }
        nextIndex++;
      }

      if (nextSignificantLine && nextSignificantLine.includes(':') && !nextSignificantLine.includes('ascendant:') && !nextSignificantLine.includes('midheaven:')) {
        if (!line.endsWith(',')) {
          line += ',';
          modified = true;
        }
      }
    }

    lines[i] = line;
  }

  if (modified) {
    content = lines.join('\n');
    fs.writeFileSync(filePath, content);
  }
}

function fixAllPatternFiles() {
  const historicalDir = 'lib/agents/historical';

  if (!fs.existsSync(historicalDir)) {
    console.log('Historical agents directory not found');
    return;
  }

  const files = fs.readdirSync(historicalDir).filter(file =>
    file.endsWith('.ts') &&
    !file.includes('greg-castro') &&
    !file.includes('index') &&
    file !== 'socrates.ts' // Keep socrates.ts as reference
  );

  files.forEach(file => {
    try {
      fixPatternBasedErrors(path.join(historicalDir, file));
    } catch (error) {
      console.log(`Error fixing ${file}: ${error.message}`);
    }
  });

  console.log(`Applied pattern-based fixes to ${files.length} historical agent files`);
}

fixAllPatternFiles();
