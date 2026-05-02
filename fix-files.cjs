const fs = require('fs');

// 1. cosmic-time-laboratory.tsx
let path1 = 'components/misc/cosmic-time-laboratory.tsx';
let code1 = fs.readFileSync(path1, 'utf8');

code1 = code1.replace(/Users,\n  Calendar,\n  TrendingUp,\n/, "");
code1 = code1.replace(/  Moon,\n  Sun,\n/, "  Moon,\n");
code1 = code1.replace(/  Share,\n  Filter,\n  Download,\n  Settings,\n/, "");
code1 = code1.replace(/  ChevronDown,\n  ChevronUp,\n  Play,\n  Pause,\n/, "");
code1 = code1.replace(/, getVisualEmphasis/, "");
code1 = code1.replace(/const \[selectedElements, setSelectedElements\] = useState<string\[\]>\(\[\n    'Fire',\n    'Water',\n    'Air',\n    'Earth',\n  \]\)/, "");

fs.writeFileSync(path1, code1);

// 2. monica-omnipresent.tsx
let path2 = 'components/monica/monica-omnipresent.tsx';
let code2 = fs.readFileSync(path2, 'utf8');

code2 = code2.replace(/  TreePine,\n  Droplets,\n  Flame,\n  Wind,\n/, "");
code2 = code2.replace(/  HelpCircle,\n/, "");
code2 = code2.replace(/  Target,\n/, "");
code2 = code2.replace(/, type ConsciousnessState/, "");

code2 = code2.replace("const [isVisible, setIsVisible] = useState(true)", "const [isVisible] = useState(true)");
code2 = code2.replace("const [isDragging, setIsDragging] = useState(false)", "");
code2 = code2.replace("const [position, setPosition] = useState({ x: 0, y: 0 })", "");
code2 = code2.replace("const [particleAnimation, setParticleAnimation] = useState(true)", "const [particleAnimation] = useState(true)");

code2 = code2.replace("const [contextualHelp, setContextualHelp]", "const [_contextualHelp, setContextualHelp]");
code2 = code2.replace("const [availableTrainings, setAvailableTrainings]", "const [availableTrainings]");
code2 = code2.replace("const openFullChat = () => {", "const _openFullChat = () => {");

code2 = code2.replace(/className="w-8 h-8 rounded-full"\n                  width=\{32\}\n                  height=\{32\}/g, 'className="w-8 h-8 rounded-full"');

fs.writeFileSync(path2, code2);

// 3. consciousness-initializer.ts
let path3 = 'lib/consciousness-survey/consciousness-initializer.ts';
let code3 = fs.readFileSync(path3, 'utf8');

code3 = code3.replace(/  TrainingScores,\n/, "");
code3 = code3.replace(/  generateInitialTrainingScores,\n/, "");
code3 = code3.replace("import { processSurveyResponses } from './survey-processor'\n", "");

code3 = code3.replace(
  "initializeConsciousnessState(\n  surveyAnalysis: SurveyAnalysis,\n  dualChartSystem: DualChartSystem,\n  birthInfo: any\n)",
  "initializeConsciousnessState(\n  surveyAnalysis: SurveyAnalysis,\n  dualChartSystem: DualChartSystem,\n  _birthInfo: any\n)"
);

code3 = code3.replace(
  "const optimalCommunication = synthesizeCommunicationStyles(",
  "const _optimalCommunication = synthesizeCommunicationStyles("
);

code3 = code3.replace(
  "identifyPsychologicalPlanets(\n  profile: ConsciousnessProfile,\n  birthChart: BirthChartData\n)",
  "identifyPsychologicalPlanets(\n  profile: ConsciousnessProfile,\n  _birthChart: BirthChartData\n)"
);

code3 = code3.replace(
  "findConsciousnessActivationPoints(\n  profile: ConsciousnessProfile,\n  birthChart: BirthChartData\n)",
  "findConsciousnessActivationPoints(\n  profile: ConsciousnessProfile,\n  _birthChart: BirthChartData\n)"
);

code3 = code3.replace(
  "createPersonalizedTrainingPlan(\n  surveyAnalysis: SurveyAnalysis,\n  dualChartSystem: DualChartSystem,\n  enhancedPersonality: EnhancedPersonality\n)",
  "createPersonalizedTrainingPlan(\n  surveyAnalysis: SurveyAnalysis,\n  dualChartSystem: DualChartSystem,\n  _enhancedPersonality: EnhancedPersonality\n)"
);

code3 = code3.replace(
  "optimizeLearningApproach(\n  profile: ConsciousnessProfile,\n  enhancedPersonality: EnhancedPersonality\n)",
  "optimizeLearningApproach(\n  profile: ConsciousnessProfile,\n  _enhancedPersonality: EnhancedPersonality\n)"
);

code3 = code3.replace(
  "generateGrowthPhases(\n  profile: ConsciousnessProfile,\n  enhancedPersonality: EnhancedPersonality\n)",
  "generateGrowthPhases(\n  _profile: ConsciousnessProfile,\n  _enhancedPersonality: EnhancedPersonality\n)"
);

code3 = code3.replace(
  "mapGrowthTrajectory(\n  surveyAnalysis: SurveyAnalysis,\n  dualChartSystem: DualChartSystem,\n  enhancedPersonality: EnhancedPersonality\n)",
  "mapGrowthTrajectory(\n  surveyAnalysis: SurveyAnalysis,\n  _dualChartSystem: DualChartSystem,\n  _enhancedPersonality: EnhancedPersonality\n)"
);

code3 = code3.replace(
  "configureBehavioralMatrix(\n  profile: ConsciousnessProfile,\n  insights: PersonalityInsights,\n  influences: any\n)",
  "configureBehavioralMatrix(\n  profile: ConsciousnessProfile,\n  _insights: PersonalityInsights,\n  _influences: any\n)"
);

fs.writeFileSync(path3, code3);
console.log('Fixed remaining files');
