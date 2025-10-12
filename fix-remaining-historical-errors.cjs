const fs = require('fs');
const path = require('path');

function fixHistoricalFile(filePath) {
  console.log(`Fixing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Split into lines for processing
  const lines = content.split('\n');
  const fixedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Skip comments and imports
    if (line.startsWith('//') || line.startsWith('import') || line.startsWith('*') || line === '') {
      fixedLines.push(lines[i]);
      continue;
    }

    // Handle array/object openings - remove any trailing commas
    if (line.includes('[') && line.endsWith(',')) {
      line = line.replace(/,$/, '');
    }
    if (line.includes('{') && !line.includes(':') && line.endsWith(',')) {
      line = line.replace(/,$/, '');
    }

    // Handle closing brackets - add commas if followed by properties
    if ((line === '}' || line === ']') && !line.endsWith(',')) {
      // Look ahead to see if there's a property after this
      let nextIndex = i + 1;
      let hasFollowingProperty = false;

      while (nextIndex < lines.length) {
        const nextLine = lines[nextIndex].trim();
        if (nextLine === '' || nextLine.startsWith('//') || nextLine.startsWith('*')) {
          nextIndex++;
          continue;
        }
        if (nextLine.includes(':') && !nextLine.includes('ascendant:') && !nextLine.includes('midheaven:')) {
          hasFollowingProperty = true;
        }
        break;
      }

      if (hasFollowingProperty) {
        line += ',';
      }
    }

    // Handle property assignments
    if (line.includes(': ') && !line.includes('{') && !line.includes('[')) {
      // Look ahead to see if there's another property after this
      let nextIndex = i + 1;
      let hasFollowingProperty = false;

      while (nextIndex < lines.length) {
        const nextLine = lines[nextIndex].trim();
        if (nextLine === '' || nextLine.startsWith('//') || nextLine.startsWith('*')) {
          nextIndex++;
          continue;
        }
        if ((nextLine.includes(':') || nextLine === '}' || nextLine === '},') &&
            !nextLine.includes('ascendant:') && !nextLine.includes('midheaven:')) {
          hasFollowingProperty = true;
        }
        break;
      }

      // Special handling for ascendant/midheaven in natalChart
      if (line.includes('ascendant:') || line.includes('midheaven:')) {
        // These should have commas if followed by each other or closing brace
        let nextIndex = i + 1;
        let nextSignificant = '';

        while (nextIndex < lines.length) {
          const nextLine = lines[nextIndex].trim();
          if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '') {
            nextSignificant = nextLine;
            break;
          }
          nextIndex++;
        }

        if (nextSignificant === '}' || nextSignificant === '},') {
          // Last property, remove comma if present
          line = line.replace(/,$/, '');
        } else if (nextSignificant.includes('ascendant:') || nextSignificant.includes('midheaven:')) {
          // Followed by another ascendant/midheaven, add comma
          if (!line.endsWith(',')) {
            line += ',';
          }
        }
      } else if (hasFollowingProperty && !line.endsWith(',')) {
        line += ',';
      }
    }

    // Restore the original indentation
    const originalLine = lines[i];
    const indent = originalLine.match(/^(\s*)/)[1];
    fixedLines.push(indent + line);
  }

  content = fixedLines.join('\n');
  fs.writeFileSync(filePath, content);
}

function fixAllRemainingFiles() {
  const historicalDir = 'lib/agents/historical';

  if (!fs.existsSync(historicalDir)) {
    console.log('Historical agents directory not found');
    return;
  }

  const files = fs.readdirSync(historicalDir).filter(file =>
    file.endsWith('.ts') &&
    !file.includes('greg-castro') &&
    !file.includes('index') &&
    file !== 'socrates.ts' // Keep socrates.ts as reference since it works
  );

  files.forEach(file => {
    try {
      fixHistoricalFile(path.join(historicalDir, file));
    } catch (error) {
      console.log(`Error fixing ${file}: ${error.message}`);
    }
  });

  console.log(`Fixed ${files.length} historical agent files`);
}

fixAllRemainingFiles();
