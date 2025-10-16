#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENT_DIR = path.join(__dirname, 'lib/agents/historical');

const createMetricsFunction = `
/**
 * Helper to create objective consciousness metrics
 */
function createMetrics(interactionCount: number, monicaConstant: number) {
  return {
    interactionCount,
    chatQuality: Math.min(1, monicaConstant / 7),
    momentResonance: Math.min(1, (monicaConstant * 0.15) + 0.3),
    alchemicalCoherence: Math.min(1, (monicaConstant / 6) * 0.9),
  }
}
`;

// Add createMetrics function to files that don't have it
const files = fs.readdirSync(AGENT_DIR)
  .filter(f => f.endsWith('.ts') && !f.includes('.backup') && f !== 'index.ts')
  .map(f => path.join(AGENT_DIR, f));

let updatedCount = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip if already has createMetrics
  if (content.includes('function createMetrics')) {
    return;
  }
  
  // Skip if doesn't use createMetrics
  if (!content.includes('createMetrics(')) {
    return;
  }
  
  // Find the export statement and add createMetrics before it
  const exportMatch = content.match(/export const \w+/);
  if (exportMatch) {
    const exportIndex = content.indexOf(exportMatch[0]);
    content = content.slice(0, exportIndex) + createMetricsFunction + '\n' + content.slice(exportIndex);
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Added createMetrics to ${path.basename(filePath)}`);
    updatedCount++;
  }
});

console.log(`\n✨ Added createMetrics function to ${updatedCount} files.`);
