const fs = require('fs');
const path = require('path');

function fixArrayCommas(filePath) {
  console.log(`Fixing array commas in ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fixedLines = [];

  let inArray = false;
  let arrayDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip comments and imports
    if (line.trim().startsWith('//') || line.trim().startsWith('import') || line.trim().startsWith('*')) {
      fixedLines.push(line);
      continue;
    }

    // Track array depth
    const openBrackets = (line.match(/\[/g) || []).length;
    const closeBrackets = (line.match(/\]/g) || []).length;
    arrayDepth += openBrackets - closeBrackets;

    inArray = arrayDepth > 0;

    // If we're in an array and this line has a string that doesn't end with comma
    if (inArray && (line.trim().match(/^'.*'$/) || line.trim().match(/^".*"$/))) {
      // Look ahead to see if there's another array element
      let nextIndex = i + 1;
      let nextElement = '';

      while (nextIndex < lines.length) {
        const nextLine = lines[nextIndex].trim();
        if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '' && !nextLine.startsWith(']')) {
          nextElement = nextLine;
          break;
        }
        // If we hit a closing bracket, stop looking
        if (nextLine.startsWith(']')) {
          break;
        }
        nextIndex++;
      }

      // If there's another element (string) after this one, add comma
      if (nextElement && (nextElement.match(/^'.*'$/) || nextElement.match(/^".*"$/)) && !line.endsWith(',')) {
        line += ',';
      }
    }

    fixedLines.push(line);
  }

  content = fixedLines.join('\n');
  fs.writeFileSync(filePath, content);
}

function fixAllHistoricalFiles() {
  const historicalDir = 'lib/agents/historical';

  if (!fs.existsSync(historicalDir)) {
    console.log('Historical agents directory not found');
    return;
  }

  const files = fs.readdirSync(historicalDir).filter(file => file.endsWith('.ts'));

  files.forEach(file => {
    fixArrayCommas(path.join(historicalDir, file));
  });

  console.log(`Fixed array commas in ${files.length} historical agent files`);
}

fixAllHistoricalFiles();
