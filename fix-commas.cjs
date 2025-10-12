const fs = require('fs');
const path = require('path');

function fixCommas(filePath) {
  console.log(`Fixing commas in ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fixedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Skip comments, imports, empty lines, and lines that already have commas or braces
    if (line.startsWith('//') ||
        line.startsWith('import') ||
        line.startsWith('*') ||
        line === '' ||
        line.endsWith(',') ||
        line.endsWith('{') ||
        line.endsWith('}') ||
        line.includes('}')) {
      fixedLines.push(lines[i]);
      continue;
    }

    // If this line contains a property assignment and the next non-comment line is not a closing brace
    if (line.includes(': ')) {
      let nextLineIndex = i + 1;
      let nextLine = '';

      // Find the next non-comment, non-empty line
      while (nextLineIndex < lines.length) {
        nextLine = lines[nextLineIndex].trim();
        if (!nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '') {
          break;
        }
        nextLineIndex++;
      }

      // Add comma if the next line is not a closing brace
      if (nextLine && !nextLine.includes('}') && nextLine !== '}') {
        line += ',';
      }
    }

    fixedLines.push(lines[i].replace(lines[i].trim(), line));
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
    fixCommas(path.join(historicalDir, file));
  });

  console.log(`Fixed commas in ${files.length} files`);
}

fixAllFiles();
