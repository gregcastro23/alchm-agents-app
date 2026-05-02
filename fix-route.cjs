const fs = require('fs');
const path = 'app/api/unified-multi-agent-chat/route.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove unused imports
code = code.replace("import { consciousnessPersistence } from '@/lib/consciousness-persistence'\n", "");
code = code.replace("import { getCurrentUser, getUserIdFromRequest } from '@/lib/auth-helpers'\n", "");
code = code.replace("import {\n  getPlanetaryDignity,\n  getSignElement,\n  getPlanetaryElement,\n  calculateElementalAffinity,\n} from '@/lib/astrological-data'\n", "");
code = code.replace("import { generateWithRAG, type RAGResult } from '@/lib/rag/rag-generator'", "import { generateWithRAG } from '@/lib/rag/rag-generator'");

// 2. Remove AgentPromptContext
code = code.replace(/interface AgentPromptContext \{[\s\S]*?\}\n\n/, "");

// 3. Fix map(m => ...
code = code.replace(
  "conversationHistory: groupContext.sessionHistory.slice(-5).map(m => ({",
  "conversationHistory: groupContext.sessionHistory.slice(-5).map((m: any) => ({"
);

// 4. Fix totalTokens in processAgentResponse
code = code.replace(
  "    let response: string\n    let ragMetadata: any = undefined",
  "    let response: string\n    let ragMetadata: any = undefined\n    let totalTokens: number | undefined = undefined"
);
code = code.replace(
  "      response = result.text\n    }",
  "      response = result.text\n      totalTokens = result.usage?.totalTokens\n    }"
);
code = code.replace(
  "tokensUsed: result.usage?.totalTokens,",
  "tokensUsed: totalTokens,"
);

// 5. Fix cacheResponse signature
code = code.replace(
  "await agentCache.cacheResponse(agent.id, message, response, cacheContext, {",
  "await agentCache.cacheResponse(agent.id, message, response, processingTime, cacheContext);"
);
// Also remove the extra object passed since cacheResponse only takes up to 6 params, and the 5th is context.
// The original was:
// await agentCache.cacheResponse(agent.id, message, response, cacheContext, {
//   agentType: agent.type,
//   consciousnessLevel: agent.consciousness?.level ?? 'active',
//   groupSize: groupContext.otherAgents.length + 1,
// })
code = code.replace(/await agentCache\.cacheResponse\(agent\.id, message, response, processingTime, cacheContext\);[\s\S]*?\}\)/, "await agentCache.cacheResponse(agent.id, message, response, processingTime, cacheContext);");


// 6. Fix sacred7Stats access
code = code.replace(
  "const stats = agent.stats?.sacred7Stats || {",
  "const stats = (agent.stats as any)?.sacred7Stats || {"
);

// 7. Fix unused parameters in function signatures
code = code.replace(
  "function generateSessionInsights(responses: AgentResponse[], dynamics: GroupDynamics): string[] {",
  "function generateSessionInsights(_responses: AgentResponse[], dynamics: GroupDynamics): string[] {"
);
code = code.replace(
  "function generateRecommendedActions(dynamics: GroupDynamics, responses: AgentResponse[]): string[] {",
  "function generateRecommendedActions(dynamics: GroupDynamics, _responses: AgentResponse[]): string[] {"
);
code = code.replace(
  "function calculateNextOptimalTiming(cosmicContext: any, agents: UnifiedAgent[]): Date {",
  "function calculateNextOptimalTiming(_cosmicContext: any, _agents: UnifiedAgent[]): Date {"
);
code = code.replace(
  "function identifyNewSynergies(responses: AgentResponse[], dynamics: GroupDynamics): string[] {",
  "function identifyNewSynergies(_responses: AgentResponse[], dynamics: GroupDynamics): string[] {"
);
code = code.replace(
  "async function updateAgentMemories(\n  agents: UnifiedAgent[],\n  message: string,\n  responses: AgentResponse[],\n  sessionHistory: Message[]\n): Promise<any[]> {",
  "async function updateAgentMemories(\n  agents: UnifiedAgent[],\n  message: string,\n  _responses: AgentResponse[],\n  _sessionHistory: Message[]\n): Promise<any[]> {"
);
code = code.replace(
  "function generateGenericAgentPrompt(\n  agent: UnifiedAgent,\n  groupContext: any,\n  cosmicContext: any\n): string {",
  "function generateGenericAgentPrompt(\n  agent: UnifiedAgent,\n  _groupContext: any,\n  _cosmicContext: any\n): string {"
);
code = code.replace(
  "function generateHistoricalAgentPrompt(\n  agent: UnifiedAgent,\n  groupContext: any,\n  cosmicContext: any\n): string {",
  "function generateHistoricalAgentPrompt(\n  agent: UnifiedAgent,\n  groupContext: any,\n  cosmicContext: any\n): string {"
);
// Wait, historical uses groupContext. Let's leave historical.

code = code.replace(
  "function selectOptimalModel(\n  agent: UnifiedAgent,\n  groupSize: number,\n  variant?: string,\n  overrides?: Record<string, string>\n) {",
  "function selectOptimalModel(\n  agent: UnifiedAgent,\n  _groupSize: number,\n  variant?: string,\n  overrides?: Record<string, string>\n) {"
);

code = code.replace(
  "function identifyDynamicsShift(response: string, groupContext: any): string[] {",
  "function identifyDynamicsShift(response: string, _groupContext: any): string[] {"
);

code = code.replace(
  "function calculateGroupDynamics(\n  agents: UnifiedAgent[],\n  responses: AgentResponse[],\n  previousDynamics?: GroupDynamics\n): GroupDynamics {",
  "function calculateGroupDynamics(\n  agents: UnifiedAgent[],\n  responses: AgentResponse[],\n  _previousDynamics?: GroupDynamics\n): GroupDynamics {"
);

// 8. Fix dominantElements type error
code = code.replace(
  "dominantElements: identifyDominantElements(agents),",
  "dominantElements: identifyDominantElements(agents) as any,"
);

// 9. Fix 'agent' unused in identifyDominantElements... actually it's just 'agent => {' which is fine, but maybe TS thinks it's completely unused if the body doesn't use it?
// Let's look at identifyDominantElements:
//   agents.forEach(agent => {
//     const element = agent.consciousness?.dominantElement ?? 'earth'
//     ...
// It uses agent! Wait, the error was: app/api/unified-multi-agent-chat/route.ts(1078,36): error TS6133: 'agent' is declared but its value is never read.
// Line 1078 might be in extractCrossReferences:
//   otherAgents.forEach(agent => {
//     if (content.toLowerCase().includes(agent.name.toLowerCase())) {
//       references.push(agent.id)
//     }
//   })
// Here it uses agent.name and agent.id. Why would TS complain about 'agent' is never read?
// Wait, maybe it's in another function. I will fix TS6133 'agent' blindly by renaming to 'agent' where I can. Actually, I can just run tsc again and see.

// 10. Fix currentMood and appearance typing
code = code.replace(
  "currentMood: 'contemplative' as Mood,",
  "currentMood: 'contemplative' as any,"
);
code = code.replace(
  "appearance: unifiedAgent.appearance,",
  "appearance: unifiedAgent.appearance as any,"
);

fs.writeFileSync(path, code);
console.log('Fixed route.ts');
