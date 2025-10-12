const fs = require('fs');
const path = require('path');

function fixHistoricalCommas(filePath) {
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

    // If line ends with a quote and is followed by another property, add comma
    if (line.trim().match(/'.*'$/) || line.trim().match(/".*"$/)) {
      // Look ahead to find the next property
      let nextIndex = i + 1;
      let nextPropertyLine = '';

      while (nextIndex < lines.length) {
        const nextLine = lines[nextIndex].trim();
        if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '') {
          nextPropertyLine = nextLine;
          break;
        }
        nextIndex++;
      }

      // If next line is a property (contains ':'), add comma
      if (nextPropertyLine && nextPropertyLine.includes(':') && !line.endsWith(',')) {
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
    fixHistoricalCommas(path.join(historicalDir, file));
  });

  console.log(`Fixed commas in ${files.length} historical agent files`);
}

fixAllHistoricalFiles();
