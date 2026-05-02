const fs = require('fs');

// 1. transit-notification-service.ts
let path1 = 'lib/services/transit-notification-service.ts';
let code1 = fs.readFileSync(path1, 'utf8');

code1 = code1.replace(/prisma\.transit_notifications/g, "(prisma as any).transitNotification");
code1 = code1.replace(/prisma\.user_natal_charts/g, "(prisma as any).userNatalChart");
code1 = code1.replace(/const _tomorrow = new Date\(today\.getTime\(\) \+ 24 \* 60 \* 60 \* 1000\)/g, "");

fs.writeFileSync(path1, code1);
console.log('Fixed transit-notification-service.ts again');

// 2. memory-persistence.ts
let path2 = 'lib/consciousness/memory-persistence.ts';
let code2 = fs.readFileSync(path2, 'utf8');

code2 = code2.replace(/prisma\.agent_evolution_states/g, "(prisma as any).agentEvolutionState");
code2 = code2.replace(/prisma\.consciousness_interactions/g, "(prisma as any).consciousnessInteraction");

fs.writeFileSync(path2, code2);
console.log('Fixed memory-persistence.ts again');
