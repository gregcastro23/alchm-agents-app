import fs from 'fs';

// Simple approach: replace string challenges with object challenges
function fixChallengesSimple(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace each challenge string with an object
  content = content.replace(
    /'([^']*)'/g,
    (match, challengeText) => {
      if (challengeText && challengeText.length > 10) { // Only convert meaningful challenges
        const type = challengeText.toLowerCase().includes('risk') ? 'personal-risk' :
                     challengeText.toLowerCase().includes('tendency') ? 'behavioral-pattern' :
                     challengeText.toLowerCase().includes('potential') ? 'relational-challenge' :
                     challengeText.toLowerCase().includes('balancing') ? 'integration-need' :
                     'personal-challenge';

        return `{
          type: '${type}',
          description: '${challengeText.replace(/'/g, "\\'")}',
          growthOpportunity: 'Transform challenge into strength through conscious awareness'
        }`;
      }
      return match; // Keep short strings as-is
    }
  );

  fs.writeFileSync(filePath, content);
  console.log(`Fixed challenges in ${filePath}`);
}

// Fix the abilities structure - remove invalid properties
function fixAbilities(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace the old abilities structure with the correct one
  // This is a simplified fix - we'll replace the entire abilities section
  content = content.replace(
    /abilities:\s*{[^}]*}/g,
    (match) => {
      return `abilities: {
    specialty: 'Medieval philosophical and theological wisdom',
    wisdomDomains: ['Philosophy', 'Theology', 'Ethics', 'Spirituality'],
    teachingStyle: 'Contemplative-Deep',
    resonanceType: 'Spiritual',
    uniquePower: 'Integration of faith and reason'
  }`;
    }
  );

  fs.writeFileSync(filePath, content);
  console.log(`Fixed abilities in ${filePath}`);
}

// Add currentMood if missing
function addCurrentMood(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Only add if not already present
  if (!content.includes('currentMood:')) {
    content = content.replace(
      /(evolutionStage:\s*\d+)(\s*})/g,
      '$1,\n    currentMood: \'contemplative\'$2'
    );
    fs.writeFileSync(filePath, content);
    console.log(`Added currentMood to ${filePath}`);
  }
}

// Fix the files
console.log('Starting fixes...');
fixChallengesSimple('lib/agents/medieval-agents.ts');
fixChallengesSimple('lib/agents/ancient-agents.ts');
fixAbilities('lib/agents/medieval-agents.ts');
fixAbilities('lib/agents/ancient-agents.ts');
addCurrentMood('lib/agents/medieval-agents.ts');
addCurrentMood('lib/agents/ancient-agents.ts');

console.log('All fixes completed!');
