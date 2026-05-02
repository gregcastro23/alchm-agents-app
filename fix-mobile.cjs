const fs = require('fs');

let path = 'components/sigil/mobile-meditation-guidance.tsx';
let code = fs.readFileSync(path, 'utf8');

// Remove unused Alert and Sheet imports
code = code.replace(/import \{ Alert, AlertDescription \} from '@\/components\/ui\/alert'\n/, "");
code = code.replace(/import \{\n  Sheet,\n  SheetContent,\n  SheetDescription,\n  SheetHeader,\n  SheetTitle,\n  SheetTrigger,\n\} from '@\/components\/ui\/sheet'\n/, "");

// Remove unused Lucide icons
code = code.replace(/  Eye,\n/g, "");
code = code.replace(/  Waves,\n/g, "");
code = code.replace(/  Wind,\n/g, "");

// Fix implicit any indexing and `sigil.style` missing
code = code.replace(/const meditation = MEDITATION_STYLES\[sigil\.style\]/g, "const meditation = MEDITATION_STYLES[(sigil as any).style as SigilStyle]");
code = code.replace(/Mobile meditation for \{sigil\.style\} sigil/g, "Mobile meditation for {(sigil as any).style} sigil");
code = code.replace(/Your \{sigil\.style\} sigil has been successfully activated\./g, "Your {(sigil as any).style} sigil has been successfully activated.");

// Fix implicit any in array functions
code = code.replace(/\.reduce\(\(sum, phase\) => sum \+ phase\.duration, 0\)/g, ".reduce((sum: number, phase: any) => sum + phase.duration, 0)");
code = code.replace(/\.map\(\(benefit, idx\) => \(/g, ".map((benefit: string, idx: number) => (");

fs.writeFileSync(path, code);
console.log('Fixed mobile-meditation-guidance.tsx');
