const fs = require('fs');

function fixNatalChartStructure() {
  const filePath = 'lib/demo-agents-data.ts';
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match natalChart objects and transform them
  const natalChartRegex = /natalChart:\s*\{\s*(sun:\s*\{[^}]*\},\s*moon:\s*\{[^}]*\},\s*mercury:\s*\{[^}]*\},\s*venus:\s*\{[^}]*\},\s*mars:\s*\{[^}]*\},\s*jupiter:\s*\{[^}]*\},\s*saturn:\s*\{[^}]*\},\s*uranus:\s*\{[^}]*\},\s*neptune:\s*\{[^}]*\},\s*pluto:\s*\{[^}]*\},\s*ascendant:\s*([^,]+),\s*midheaven:\s*([^}]+)\s*\}/g;

  content = content.replace(natalChartRegex, (match, ascendant, midheaven) => {
    // Extract planet data from the match
    const sunMatch = match.match(/sun:\s*(\{[^}]*\})/);
    const moonMatch = match.match(/moon:\s*(\{[^}]*\})/);
    const mercuryMatch = match.match(/mercury:\s*(\{[^}]*\})/);
    const venusMatch = match.match(/venus:\s*(\{[^}]*\})/);
    const marsMatch = match.match(/mars:\s*(\{[^}]*\})/);
    const jupiterMatch = match.match(/jupiter:\s*(\{[^}]*\})/);
    const saturnMatch = match.match(/saturn:\s*(\{[^}]*\})/);
    const uranusMatch = match.match(/uranus:\s*(\{[^}]*\})/);
    const neptuneMatch = match.match(/neptune:\s*(\{[^}]*\})/);
    const plutoMatch = match.match(/pluto:\s*(\{[^}]*\})/);

    return `natalChart: {
      planets: {
        sun: ${sunMatch[1]},
        moon: ${moonMatch[1]},
        mercury: ${mercuryMatch[1]},
        venus: ${venusMatch[1]},
        mars: ${marsMatch[1]},
        jupiter: ${jupiterMatch[1]},
        saturn: ${saturnMatch[1]},
        uranus: ${uranusMatch[1]},
        neptune: ${neptuneMatch[1]},
        pluto: ${plutoMatch[1]}
      },
      houses: {},
      aspects: [],
      ascendant: ${ascendant},
      midheaven: ${midheaven}
    }`;
  });

  fs.writeFileSync(filePath, content);
  console.log('Fixed natal chart structure in demo-agents-data.ts');
}

fixNatalChartStructure();
