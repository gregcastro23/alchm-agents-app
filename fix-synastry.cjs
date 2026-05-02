const fs = require('fs');
const path = 'lib/synastry-compatibility-engine.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "private static identifyCollectiveStrengths(synastryChart: SynastryChart): string[]",
  "private static identifyCollectiveStrengths(_synastryChart: SynastryChart): string[]"
);

code = code.replace(
  "private static identifySharedChallenges(synastryChart: SynastryChart): string[]",
  "private static identifySharedChallenges(_synastryChart: SynastryChart): string[]"
);

code = code.replace(
  "private static identifyGrowthOpportunities(synastryChart: SynastryChart): string[]",
  "private static identifyGrowthOpportunities(_synastryChart: SynastryChart): string[]"
);

code = code.replace(
  "private static determineEvolutionTheme(synastryChart: SynastryChart): string",
  "private static determineEvolutionTheme(_synastryChart: SynastryChart): string"
);

code = code.replace(
  "private static calculateModalCompatibility(synastryChart: SynastryChart): number",
  "private static calculateModalCompatibility(_synastryChart: SynastryChart): number"
);

code = code.replace(
  "private static identifyRelationshipStrengths(\n    synastryChart: SynastryChart,\n    aspects: SynastryAspect[]\n  )",
  "private static identifyRelationshipStrengths(\n    _synastryChart: SynastryChart,\n    _aspects: SynastryAspect[]\n  )"
);

code = code.replace(
  "private static identifyRelationshipChallenges(\n    synastryChart: SynastryChart,\n    aspects: SynastryAspect[]\n  )",
  "private static identifyRelationshipChallenges(\n    _synastryChart: SynastryChart,\n    _aspects: SynastryAspect[]\n  )"
);

code = code.replace(
  "private static generateRecommendations(\n    synastryChart: SynastryChart,\n    aspects: SynastryAspect[]\n  )",
  "private static generateRecommendations(\n    _synastryChart: SynastryChart,\n    _aspects: SynastryAspect[]\n  )"
);

code = code.replace(
  "static generateRelationshipTimeline(synastryChart: SynastryChart): RelationshipPhase[]",
  "static generateRelationshipTimeline(_synastryChart: SynastryChart): RelationshipPhase[]"
);

code = code.replace(
  "static createConsciousnessEvolutionMap(\n    synastryChart: SynastryChart,\n    compatibility: CompatibilityAnalysis\n  )",
  "static createConsciousnessEvolutionMap(\n    _synastryChart: SynastryChart,\n    _compatibility: CompatibilityAnalysis\n  )"
);

code = code.replace(
  "static generatePracticalGuidance(\n    synastryChart: SynastryChart,\n    compatibility: CompatibilityAnalysis\n  )",
  "static generatePracticalGuidance(\n    _synastryChart: SynastryChart,\n    _compatibility: CompatibilityAnalysis\n  )"
);

code = code.replace(
  "for (const [key, interpretation] of Object.entries(COMPATIBILITY_INTERPRETATIONS)) {",
  "for (const [_key, interpretation] of Object.entries(COMPATIBILITY_INTERPRETATIONS)) {"
);

fs.writeFileSync(path, code);
console.log('Fixed synastry-compatibility-engine.ts');
