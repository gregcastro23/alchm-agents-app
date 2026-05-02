const fs = require('fs');

// 1. transit-notification-service.ts
let path1 = 'lib/services/transit-notification-service.ts';
let code1 = fs.readFileSync(path1, 'utf8');

code1 = code1.replace(/import \{ calculatePlanetaryTransitSignificance \} from '\.\/planetary-transit-significance-scorer'\n/, "");
code1 = code1.replace(/prisma\.transitNotification\./g, "prisma.transit_notifications.");
code1 = code1.replace(/prisma\.userNatalChart\./g, "prisma.user_natal_charts.");
code1 = code1.replace(/const tomorrow = new Date/g, "const _tomorrow = new Date");
code1 = code1.replace(/const mockTransits = \[\]/g, "const mockTransits: any[] = []");

// Fix acc, item implicitly any
code1 = code1.replace(/\(acc, item\) =>/g, "(acc: any, item: any) =>");

// Update dismissNotification unused userId
// Wait, the error was: "lib/services/transit-notification-service.ts(183,3): error TS6133: 'userId' is declared but its value is never read."
// Let's check `getUserNotificationPreferences` parameter `userId: string`
code1 = code1.replace(/export async function getUserNotificationPreferences\(\n  userId: string\n\): Promise<NotificationPreferences> \{/g, "export async function getUserNotificationPreferences(\n  _userId: string\n): Promise<NotificationPreferences> {");

fs.writeFileSync(path1, code1);
console.log('Fixed transit-notification-service.ts');

// 2. memory-persistence.ts
let path2 = 'lib/consciousness/memory-persistence.ts';
let code2 = fs.readFileSync(path2, 'utf8');

code2 = code2.replace(/prisma\.agentEvolutionState\./g, "prisma.agent_evolution_states.");
code2 = code2.replace(/prisma\.consciousnessInteraction\./g, "prisma.consciousness_interactions.");

// Fix implicit anys
code2 = code2.replace(/=> \{/g, "=> {"); // Just to ensure I match correctly later if needed
code2 = code2.replace(/interactions\.map\(interaction => \(\{/g, "interactions.map((interaction: any) => ({");
code2 = code2.replace(/interactions\.reduce\(\n        \(sum, interaction\) => sum \+ interaction\.powerGained,/g, "interactions.reduce(\n        (sum: any, interaction: any) => sum + interaction.powerGained,");
code2 = code2.replace(/evolutionStates\.filter\(state => state\.currentLevel !== 'bronze'\)/g, "evolutionStates.filter((state: any) => state.currentLevel !== 'bronze')");
code2 = code2.replace(/interactions\.reduce\(\n        \(counts, interaction\) => \{/g, "interactions.reduce(\n        (counts: Record<string, number>, interaction: any) => {");

// `Object.entries(agentCounts).reduce(...)`
code2 = code2.replace(/Object\.entries\(agentCounts\)\.reduce\(\n        \(favorite, \[agentId, count\]\) =>/g, "Object.entries(agentCounts).reduce(\n        (favorite: any, [agentId, count]: any) =>");

// `const milestones = []` -> `const milestones: any[] = []`
code2 = code2.replace(/const milestones = \[\]/g, "const milestones: any[] = []");

// `evolutionStates.forEach(state => {`
code2 = code2.replace(/evolutionStates\.forEach\(state => \{/g, "evolutionStates.forEach((state: any) => {");

// Unused agentId
code2 = code2.replace(/private static getUnlockedAbilities\(level: string, agentId: string\): string\[\] \{/g, "private static getUnlockedAbilities(level: string, _agentId: string): string[] {");

fs.writeFileSync(path2, code2);
console.log('Fixed memory-persistence.ts');
