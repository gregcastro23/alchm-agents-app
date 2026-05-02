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

// 3. Fix map(m =>
code = code.replace("conversationHistory: groupContext.sessionHistory.slice(-5).map(m => ({", "conversationHistory: groupContext.sessionHistory.slice(-5).map((m: any) => ({");

// 4. Fix cacheResponse signature issue
// TS2345: Argument of type 'CacheContext' is not assignable to parameter of type 'number'.
// Let's check cacheResponse in agent-cache-system.ts
