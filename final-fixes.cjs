const fs = require('fs');

// 1. alchemical-metrics-chart.tsx
let path1 = 'components/charts/alchemical-metrics-chart.tsx';
let code1 = fs.readFileSync(path1, 'utf8');

// Interface props
code1 = code1.replace("  onTimeSelect?: (timestamp: Date) => void\n  onAgentActivation?: (activations: any[]) => void\n  height?: number\n  enableComparison?: boolean\n  comparisonData?: CelestialMoment[]", "  height?: number");

// Function params
code1 = code1.replace("  _onTimeSelect,\n  _onAgentActivation,\n  height = 500,\n  _enableComparison = false,\n  _comparisonData,", "  height = 500,");

// Tooltip params
code1 = code1.replace("const CustomTooltip = ({ active, payload, _label }: any) => {", "const CustomTooltip = ({ active, payload }: any) => {");

fs.writeFileSync(path1, code1);

// 2. consciousness-initializer.ts
let path2 = 'lib/consciousness-survey/consciousness-initializer.ts';
let code2 = fs.readFileSync(path2, 'utf8');

// The replace for _optimalCommunication might not have worked fully, let's just make sure it's gone
code2 = code2.replace(/const _optimalCommunication = synthesizeCommunicationStyles\(/g, "synthesizeCommunicationStyles(");

// Check if enhancedPersonality is still declared somewhere without _
// "lib/consciousness-survey/consciousness-initializer.ts(552,3): error TS6133: 'enhancedPersonality' is declared but its value is never read."
// Let's replace any `enhancedPersonality: EnhancedPersonality` with `_enhancedPersonality: EnhancedPersonality` in the function declarations we missed
code2 = code2.replace(/function optimizeLearningApproach\(\n  profile: ConsciousnessProfile,\n  enhancedPersonality: EnhancedPersonality\n\)/g, "function optimizeLearningApproach(\n  profile: ConsciousnessProfile,\n  _enhancedPersonality: EnhancedPersonality\n)");
// Let's also catch the one in generateConsciousnessExercises if it reverted
code2 = code2.replace(/function generateConsciousnessExercises\(\n  profile: ConsciousnessProfile,\n  enhancedPersonality: EnhancedPersonality\n\)/g, "function generateConsciousnessExercises(\n  profile: ConsciousnessProfile,\n  _enhancedPersonality: EnhancedPersonality\n)");

fs.writeFileSync(path2, code2);
console.log('Final fixes applied');
