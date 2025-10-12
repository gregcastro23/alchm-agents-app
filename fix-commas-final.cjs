const fs = require('fs');
const path = require('path');

function fixCommasFinal(filePath) {
  console.log(`Fixing commas in ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fixedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip comments and imports
    if (line.trim().startsWith('//') || line.trim().startsWith('import') || line.trim().startsWith('*')) {
      fixedLines.push(line);
      continue;
    }

    // Remove any existing commas after opening braces
    line = line.replace(/{\s*,/, '{');

    // Check if this line is a closing brace
    if (line.trim() === '}') {
      // Look ahead to see if there's another property after this closing brace
      let nextLineIndex = i + 1;
      let nextSignificantLine = '';

      // Find the next non-comment, non-empty line
      while (nextLineIndex < lines.length) {
        const nextLine = lines[nextLineIndex].trim();
        if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '') {
          nextSignificantLine = nextLine;
          break;
        }
        nextLineIndex++;
      }

      // If the next significant line is a property (contains ':'), add comma
      if (nextSignificantLine && nextSignificantLine.includes(':')) {
        line = line.replace('}', '},');
      }
    }
    // Check if this line contains a property assignment
    else if (line.includes(': ') && !line.includes('{') && !line.includes('}')) {
      // Look ahead to see if there's another property after this one
      let nextLineIndex = i + 1;
      let nextSignificantLine = '';

      // Find the next non-comment, non-empty line
      while (nextLineIndex < lines.length) {
        const nextLine = lines[nextLineIndex].trim();
        if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '') {
          nextSignificantLine = nextLine;
          break;
        }
        nextLineIndex++;
      }

      // If the next significant line is a property or opening brace, add comma
      if (nextSignificantLine && (nextSignificantLine.includes(':') || nextSignificantLine.includes('{'))) {
        if (!line.endsWith(',')) {
          line += ',';
        }
      }
    }

    fixedLines.push(line);
  }

  content = fixedLines.join('\n');
  fs.writeFileSync(filePath, content);
}

function fixAllFiles() {
  const historicalDir = 'lib/agents/historical';

  if (!fs.existsSync(historicalDir)) {
    console.log('Historical agents directory not found');
    return;
  }

  const files = fs.readdirSync(historicalDir).filter(file => file.endsWith('.ts'));

  files.forEach(file => {
    fixCommasFinal(path.join(historicalDir, file));
  });

  console.log(`Fixed commas in ${files.length} files`);
}

fixAllFiles();
