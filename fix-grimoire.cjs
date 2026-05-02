const fs = require('fs');

// 1. temporal-grimoire-export.ts
let path1 = 'lib/temporal-grimoire-export.ts';
let code1 = fs.readFileSync(path1, 'utf8');

// Fix imports
code1 = code1.replace(/,\n\s*TemporalPattern,/, ',');
code1 = code1.replace(/import \{ getAgentKineticProfile \} from '\.\/agents\/kinetic-profiles'\n/, '');

// Fix unused variables in generateSection
code1 = code1.replace("private static async generateSection(\n    sectionId: string,\n    query: TemporalQuery,\n    results: TemporalAnalysisResult,\n    template: GrimoireTemplate\n  ): Promise<GrimoireSection>", "private static async generateSection(\n    sectionId: string,\n    query: TemporalQuery,\n    results: TemporalAnalysisResult,\n    _template: GrimoireTemplate\n  ): Promise<GrimoireSection>");

// Fix missing section methods
code1 = code1.replace(/      case 'methodology':\n        return this\.createMethodologySection\(query, results\)\n\n/g, "");
code1 = code1.replace(/      case 'statistical_summary':\n        return this\.createStatisticalSummarySection\(results\)\n\n/g, "");
code1 = code1.replace(/      case 'conclusions':\n        return this\.createConclusionsSection\(results\)\n\n/g, "");
code1 = code1.replace(/      case 'personal_invocation':\n        return this\.createPersonalInvocationSection\(query\)\n\n/g, "");
code1 = code1.replace(/      case 'query_reflection':\n        return this\.createQueryReflectionSection\(query, results\)\n\n/g, "");
code1 = code1.replace(/      case 'agent_insights':\n        return this\.createAgentInsightsSection\(results\)\n\n/g, "");
code1 = code1.replace(/      case 'elemental_wisdom':\n        return this\.createElementalWisdomSection\(results\)\n\n/g, "");
code1 = code1.replace(/      case 'personal_guidance':\n        return this\.createPersonalGuidanceSection\(results\)\n\n/g, "");
code1 = code1.replace(/      case 'technical_summary':\n        return this\.createTechnicalSummarySection\(results\)\n\n/g, "");
code1 = code1.replace(/      case 'degree_analysis':\n        return this\.createDegreeAnalysisSection\(results\)\n\n/g, "");
code1 = code1.replace(/      case 'pattern_algorithms':\n        return this\.createPatternAlgorithmsSection\(results\)\n\n/g, "");
code1 = code1.replace(/      case 'reinforcement_mathematics':\n        return this\.createReinforcementMathematicsSection\(results\)\n\n/g, "");
code1 = code1.replace(/      case 'predictive_models':\n        return this\.createPredictiveModelsSection\(results\)\n\n/g, "");

// Prefix unused variables
code1 = code1.replace(/private static createAbstractSection\(\n    query: TemporalQuery,\n    results: TemporalAnalysisResult\n  \): GrimoireSection \{/g, "private static createAbstractSection(\n    _query: TemporalQuery,\n    results: TemporalAnalysisResult\n  ): GrimoireSection {");
code1 = code1.replace(/private static async generatePDF\(\n    sections: GrimoireSection\[\],\n    template: GrimoireTemplate,\n    options: ExportOptions\n  \): Promise<Buffer> \{/g, "private static async generatePDF(\n    sections: GrimoireSection[],\n    template: GrimoireTemplate,\n    _options: ExportOptions\n  ): Promise<Buffer> {");
code1 = code1.replace(/private static async generateEPUB\(\n    sections: GrimoireSection\[\],\n    template: GrimoireTemplate,\n    options: ExportOptions\n  \): Promise<Buffer> \{/g, "private static async generateEPUB(\n    sections: GrimoireSection[],\n    template: GrimoireTemplate,\n    _options: ExportOptions\n  ): Promise<Buffer> {");
code1 = code1.replace(/private static async generateHTML\(\n    sections: GrimoireSection\[\],\n    template: GrimoireTemplate,\n    options: ExportOptions\n  \): Promise<Buffer> \{/g, "private static async generateHTML(\n    sections: GrimoireSection[],\n    _template: GrimoireTemplate,\n    options: ExportOptions\n  ): Promise<Buffer> {");
code1 = code1.replace(/private static async generateMarkdown\(\n    sections: GrimoireSection\[\],\n    template: GrimoireTemplate,\n    options: ExportOptions\n  \): Promise<Buffer> \{/g, "private static async generateMarkdown(\n    sections: GrimoireSection[],\n    _template: GrimoireTemplate,\n    _options: ExportOptions\n  ): Promise<Buffer> {");
code1 = code1.replace(/private static generateElementalNarrative\(\n    analysis: any,\n    results: TemporalAnalysisResult\n  \): string \{/g, "private static generateElementalNarrative(\n    analysis: any,\n    _results: TemporalAnalysisResult\n  ): string {");
code1 = code1.replace(/private static createDefaultSection\(\n    sectionId: string,\n    query: TemporalQuery,\n    results: TemporalAnalysisResult\n  \): GrimoireSection \{/g, "private static createDefaultSection(\n    sectionId: string,\n    _query: TemporalQuery,\n    _results: TemporalAnalysisResult\n  ): GrimoireSection {");

// Fix `template.title` to `template.name`
code1 = code1.replace(/template\.title/g, "template.name");

// Fix export conflicts
code1 = code1.replace(/export type \{ GrimoireSection, GrimoireTemplate, ExportOptions \}/g, "");

fs.writeFileSync(path1, code1);

console.log('Fixed temporal-grimoire-export.ts');
