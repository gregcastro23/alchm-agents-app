const fs = require('fs');
const path = require('path');

function fixMultilineCommas(filePath) {
  console.log(`Fixing multiline commas in ${filePath}`);
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

    // Handle multi-line property assignments
    if (line.trim().match(/^[a-zA-Z_][a-zA-Z0-9_]*:\s*$/) && !line.includes('{') && !line.includes('}')) {
      // This is a property name followed by colon, value on next line(s)
      // Look ahead to find where the property value ends
      let valueEndIndex = i + 1;
      let braceCount = 0;
      let inString = false;
      let stringChar = '';

      // Find the end of this property value
      while (valueEndIndex < lines.length) {
        const checkLine = lines[valueEndIndex];

        // Check for string literals
        for (let char of checkLine) {
          if ((char === '"' || char === "'") && (stringChar === '' || stringChar === char)) {
            if (stringChar === '') {
              stringChar = char;
              inString = true;
            } else {
              stringChar = '';
              inString = false;
            }
          }
        }

        if (!inString) {
          braceCount += (checkLine.match(/\{/g) || []).length;
          braceCount -= (checkLine.match(/\}/g) || []).length;
        }

        // If we have balanced braces and are not in a string, this might be the end
        if (braceCount <= 0 && !inString && !checkLine.trim().endsWith(',')) {
          break;
        }
        valueEndIndex++;
      }

      // Look at the next significant line after this property
      let nextPropIndex = valueEndIndex + 1;
      let nextSignificantLine = '';

      while (nextPropIndex < lines.length) {
        const nextLine = lines[nextPropIndex].trim();
        if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '') {
          nextSignificantLine = nextLine;
          break;
        }
        nextPropIndex++;
      }

      // If there's another property after this one, add comma to the last line of this property
      if (nextSignificantLine && (nextSignificantLine.includes(':') || nextSignificantLine.includes('}'))) {
        // Add comma to the last line of the current property value
        const lastValueLine = lines[valueEndIndex];
        if (!lastValueLine.trim().endsWith(',')) {
          lines[valueEndIndex] = lastValueLine.replace(/([^,])\s*$/, '$1,');
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
    fixMultilineCommas(path.join(historicalDir, file));
  });

  console.log(`Fixed multiline commas in ${files.length} files`);
}

fixAllFiles();
