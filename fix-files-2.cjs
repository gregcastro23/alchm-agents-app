const fs = require('fs');

// 1. cosmic-time-laboratory.tsx
let path1 = 'components/misc/cosmic-time-laboratory.tsx';
let code1 = fs.readFileSync(path1, 'utf8');

// If getElementalColorScheme is the only one, maybe it's still used. Let's see:
// The error is TS6192: All imports in import declaration are unused.
// Let's remove the import from line 23 entirely if it's unused. Wait, getElementalColorScheme IS used in line 351 and 420. Why would it be unused?
// Wait, the error is at line 23. Let's check what import is at line 23.
// I removed all the lucide-react imports that were unused, leaving some empty space?
// Ah! I removed `ChevronDown`, `Play`, etc. Maybe line 23 was a different import. Let me just remove any empty import { } from 'lucide-react' or similar.
// Actually, `import { getElementalColorScheme } from '@/lib/elemental-reinforcement'` is on line 35!
// Oh, the error says line 23. Let's check what is at line 23.
//   Play,
//   Pause,
//   BarChart3,
//   Plus,
// } from 'lucide-react'
// Let's ignore it for a moment or just replace empty imports if any exist.
// Let's just fix the rest first.

// 2. monica-omnipresent.tsx
let path2 = 'components/monica/monica-omnipresent.tsx';
let code2 = fs.readFileSync(path2, 'utf8');
code2 = code2.replace(/,\n\s*type ConsciousnessState,/, ",");
code2 = code2.replace(/,\s*type ConsciousnessState/, "");
// Remove _openFullChat
code2 = code2.replace(/const _openFullChat = \(\) => \{\n\s*setMonicaState\('full-chat'\)\n\s*setWidgetSize\(\{ width: 600, height: 700 \}\)\n\s*\}/, "");
fs.writeFileSync(path2, code2);

// 3. consciousness-initializer.ts
let path3 = 'lib/consciousness-survey/consciousness-initializer.ts';
let code3 = fs.readFileSync(path3, 'utf8');

// Restore enhancedPersonality where it was used
code3 = code3.replace(
  "determinePriorityCategories(\n  surveyAnalysis: SurveyAnalysis,\n  dualChartSystem: DualChartSystem,\n  _enhancedPersonality: EnhancedPersonality",
  "determinePriorityCategories(\n  surveyAnalysis: SurveyAnalysis,\n  dualChartSystem: DualChartSystem,\n  enhancedPersonality: EnhancedPersonality"
);

code3 = code3.replace(
  "createPersonalizedTrainingPlan(\n  surveyAnalysis: SurveyAnalysis,\n  dualChartSystem: DualChartSystem,\n  _enhancedPersonality: EnhancedPersonality",
  "createPersonalizedTrainingPlan(\n  surveyAnalysis: SurveyAnalysis,\n  dualChartSystem: DualChartSystem,\n  enhancedPersonality: EnhancedPersonality"
);

code3 = code3.replace(
  "optimizeLearningApproach(\n  profile: ConsciousnessProfile,\n  _enhancedPersonality: EnhancedPersonality",
  "optimizeLearningApproach(\n  profile: ConsciousnessProfile,\n  enhancedPersonality: EnhancedPersonality"
);

code3 = code3.replace(
  "generateGrowthPhases(\n  _profile: ConsciousnessProfile,\n  _enhancedPersonality: EnhancedPersonality",
  "generateGrowthPhases(\n  _profile: ConsciousnessProfile,\n  enhancedPersonality: EnhancedPersonality"
);

code3 = code3.replace(
  "mapGrowthTrajectory(\n  surveyAnalysis: SurveyAnalysis,\n  _dualChartSystem: DualChartSystem,\n  _enhancedPersonality: EnhancedPersonality",
  "mapGrowthTrajectory(\n  surveyAnalysis: SurveyAnalysis,\n  _dualChartSystem: DualChartSystem,\n  enhancedPersonality: EnhancedPersonality"
);

// Also we need to fix generateConsciousnessExercises where it really IS unused
code3 = code3.replace(
  "generateConsciousnessExercises(\n  profile: ConsciousnessProfile,\n  enhancedPersonality: EnhancedPersonality\n)",
  "generateConsciousnessExercises(\n  profile: ConsciousnessProfile,\n  _enhancedPersonality: EnhancedPersonality\n)"
);

fs.writeFileSync(path3, code3);
console.log('Fixed files 2');
