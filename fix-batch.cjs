const fs = require('fs');

// 1. app/api/admin/system-stats/route.ts
let path1 = 'app/api/admin/system-stats/route.ts';
let code1 = fs.readFileSync(path1, 'utf8');

// Prisma client casting
code1 = code1.replace(/prisma\.user\./g, "(prisma as any).user.");
code1 = code1.replace(/prisma\.consciousnessInteraction\./g, "(prisma as any).consciousnessInteraction.");
code1 = code1.replace(/prisma\.agentEvolutionState\./g, "(prisma as any).agentEvolutionState.");
code1 = code1.replace(/prisma\.monicaInteraction\./g, "(prisma as any).monicaInteraction.");
code1 = code1.replace(/prisma\.subscription\./g, "(prisma as any).subscription.");

// Fix unused 'session'
code1 = code1.replace(/const session = await auth\(\)\n    const user = await getCurrentUser\(req\)/, "const user = await getCurrentUser(req)");

// Fix implicit anys in maps
code1 = code1.replace(/\.then\(users => users\.length\),/, ".then((users: any[]) => users.length),");
code1 = code1.replace(/tierDistribution\.map\(t => \(\{/g, "tierDistribution.map((t: any) => ({");
code1 = code1.replace(/popularAgents\.map\(a => \(\{/g, "popularAgents.map((a: any) => ({");
code1 = code1.replace(/evolutionLevels\.map\(l => \(\{/g, "evolutionLevels.map((l: any) => ({");
code1 = code1.replace(/errorLogs\.map\(error => \(\{/g, "errorLogs.map((error: any) => ({");

fs.writeFileSync(path1, code1);
console.log('Fixed route.ts');

// 2. components/sigil/meditation-guidance.tsx
let path2 = 'components/sigil/meditation-guidance.tsx';
let code2 = fs.readFileSync(path2, 'utf8');

// Unused imports
code2 = code2.replace(/import \{ Separator \} from '@\/components\/ui\/separator'\n/, "");
code2 = code2.replace(/import \{ Alert, AlertDescription \} from '@\/components\/ui\/alert'\n/, "");
code2 = code2.replace(/  Waves,\n  Wind,\n/, "");

// Fix sigil indexing
code2 = code2.replace(/const meditation = MEDITATION_STYLES\[sigil\.style\]/g, "const meditation = MEDITATION_STYLES[(sigil as any).style as SigilStyle]");
code2 = code2.replace(/Your \{sigil\.style\} sigil/g, "Your {(sigil as any).style} sigil");
code2 = code2.replace(/your \{sigil\.style\} sigil/g, "your {(sigil as any).style} sigil");
code2 = code2.replace(/Style: \{sigil\.style\}/g, "Style: {(sigil as any).style}");

// Implicit anys
code2 = code2.replace(/\.reduce\(\(sum, phase\) => sum \+ phase\.duration, 0\)/g, ".reduce((sum: number, phase: any) => sum + phase.duration, 0)");
code2 = code2.replace(/meditation\.benefits\.map\(\(benefit, idx\) => \(/g, "meditation.benefits.map((benefit: string, idx: number) => (");

fs.writeFileSync(path2, code2);
console.log('Fixed meditation-guidance.tsx');

// 3. components/zodiac-wheel.tsx
let path3 = 'components/zodiac-wheel.tsx';
let code3 = fs.readFileSync(path3, 'utf8');

// Unused imports
code3 = code3.replace(/import React, \{ useState, useEffect, useRef, useCallback \} from 'react'/, "import React, { useState, useRef } from 'react'");
code3 = code3.replace(/  DialogTrigger,\n/, "");
code3 = code3.replace(/import \{ Tooltip, TooltipContent, TooltipProvider, TooltipTrigger \} from '@\/components\/ui\/tooltip'\n/, "");
code3 = code3.replace(/import \{\n  Select,\n  SelectContent,\n  SelectItem,\n  SelectTrigger,\n  SelectValue,\n\} from '@\/components\/ui\/select'\n/, "");
code3 = code3.replace(/  RefreshCw,\n/, "");
code3 = code3.replace(/  Eye,\n  EyeOff,\n  Settings,\n  Target,\n  Zap,\n  Sun,\n  Moon,\n  Star,\n  Circle,\n/g, "  Target,\n");

// Fix symbolPos syntax error in renderZodiacSigns
code3 = code3.replace(
  `          {/* Sign symbol */}
          const midAngle = (startAngle + endAngle) / 2; const symbolPos = getPosition(midAngle,
          (outerRadius + innerRadius) / 2); signs.push(
          <text`,
  `          {/* Sign symbol */}
          <text`
);
// We need to properly inject midAngle and symbolPos. Let's rewrite the loop body:
const signLoopRegex = /const sign = ZODIAC_SIGNS\[i\][\s\S]*?(?=\{\/\* Degree markers \*\/)/;
const replacement = `const sign = ZODIAC_SIGNS[i]
      const element = getElementForSign(sign)
      const elementColor = ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS]
      const midAngle = (startAngle + endAngle) / 2
      const symbolPos = getPosition(midAngle, (outerRadius + innerRadius) / 2)

      signs.push(
        <g key={\`sign-\${i}\`}>
          <path
            d={pathData}
            fill={elementColor}
            fillOpacity={0.1}
            stroke={elementColor}
            strokeWidth={1}
            className="cursor-pointer hover:fill-opacity-30 transition-all"
            onMouseEnter={() => setHoveredElement(sign)}
            onMouseLeave={() => setHoveredElement(null)}
            onClick={() => onDegreeClick?.(i * 30, sign)}
          />
          {/* Sign symbol */}
          <text
            key={\`symbol-\${i}\`}
            x={symbolPos.x}
            y={symbolPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
            fill={elementColor}
            className="font-bold pointer-events-none select-none"
          >
            {SIGN_SYMBOLS[sign]}
          </text>
`;
code3 = code3.replace(signLoopRegex, replacement);

// The original string had an extra `)` and `{/* Degree markers */}`
// Let's check what happened: `){/* Degree markers */}`
// We need to fix the syntax there.
code3 = code3.replace(/          \)\{\/\* Degree markers \*\//g, "          {/* Degree markers */}");

// Fix planets and aspects array implicit any
code3 = code3.replace(/const planets = \[\]/g, "const planets: any[] = []");
code3 = code3.replace(/const aspects = \[\]/g, "const aspects: any[] = []");

fs.writeFileSync(path3, code3);
console.log('Fixed zodiac-wheel.tsx');
