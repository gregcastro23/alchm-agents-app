const fs = require('fs');
const path = require('path');

function fixMidheavenCommas(filePath) {
  console.log(`Checking ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Find midheaven lines that don't have commas
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

    lines[i] = line;
  }

  if (modified) {
    content = lines.join('\n');
    fs.writeFileSync(filePath, content);
    console.log(`Fixed midheaven comma in ${filePath}`);
  }
}

function fixAllMidheavenFiles() {
  const historicalDir = 'lib/agents/historical';

  if (!fs.existsSync(historicalDir)) {
    console.log('Historical agents directory not found');
    return;
  }

  const files = fs.readdirSync(historicalDir).filter(file =>
    file.endsWith('.ts') &&
    !file.includes('greg-castro') &&
    !file.includes('index') &&
    file !== 'socrates.ts'
  );

  let fixedCount = 0;
  files.forEach(file => {
    try {
      const filePath = path.join(historicalDir, file);
      const beforeErrors = require('child_process').execSync(`npx tsc --noEmit --skipLibCheck "${filePath}" 2>&1 | grep -c "error TS" || echo 0`, { encoding: 'utf8' }).trim();

      fixMidheavenCommas(filePath);

      const afterErrors = require('child_process').execSync(`npx tsc --noEmit --skipLibCheck "${filePath}" 2>&1 | grep -c "error TS" || echo 0`, { encoding: 'utf8' }).trim();

      if (beforeErrors !== afterErrors) {
        fixedCount++;
      }
    } catch (error) {
      // Ignore errors from execSync
    }
  });

  console.log(`Fixed midheaven commas in ${fixedCount} files`);
}

fixAllMidheavenFiles();
