const fs = require('fs');
const path = require('path');

function fixHistoricalAgentFile(filePath) {
  console.log(`Fixing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fixedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Remove commas after opening brackets (arrays and objects)
    line = line.replace(/{\s*,/g, '{');
    line = line.replace(/\[\s*,/g, '[');

    // Handle property assignments and commas
    if (line.includes(': ')) {
      // Look ahead to see what follows this line
      let nextIndex = i + 1;
      let nextSignificantLine = '';

      // Find the next non-comment, non-empty line
      while (nextIndex < lines.length) {
        const nextLine = lines[nextIndex].trim();
        if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('*') && nextLine !== '') {
          nextSignificantLine = nextLine;
          break;
        }
        nextIndex++;
      }

      // If this line ends with a value and is followed by a property or closing brace, add comma
      if (!line.endsWith(',') && !line.endsWith('{') && !line.endsWith('[') && !line.endsWith('}')) {
        if (nextSignificantLine && (nextSignificantLine.includes(':') || nextSignificantLine.trim() === '}' || nextSignificantLine.trim() === '},')) {
          // Special handling for ascendant/midheaven - they should not have commas in natalChart
          if (!line.includes('ascendant:') && !line.includes('midheaven:')) {
            line += ',';
          }
        }
      }
    }

    // Handle closing brackets - add commas if followed by properties
    if (line.trim() === '}' || line.trim() === ']') {
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

      // If followed by a property (not ascendant/midheaven in natalChart), add comma
      if (nextSignificantLine && nextSignificantLine.includes(':') && !nextSignificantLine.includes('ascendant:') && !nextSignificantLine.includes('midheaven:')) {
        if (line === '}') {
          line = '},';
        } else if (line === ']') {
          line = '],';
        }
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

  const files = fs.readdirSync(historicalDir).filter(file =>
    file.endsWith('.ts') && !file.includes('greg-castro') && !file.includes('index')
  );

  files.forEach(file => {
    fixHistoricalAgentFile(path.join(historicalDir, file));
  });

  console.log(`Fixed ${files.length} historical agent files`);
}

fixAllHistoricalAgents();
