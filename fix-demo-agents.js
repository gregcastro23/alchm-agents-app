#!/usr/bin/env node
// Script to fix structural errors in demo-agents-data.ts

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib', 'demo-agents-data.ts');

console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original file size:', content.length);

// Fix 1: Remove duplicate "planets: {" nesting inside natalChart.planets
// Pattern: planets: {\n      planets: {
// Replace with: planets: {

let fixCount = 0;

// This regex finds the duplicate planets structure
// It looks for "planets: {" followed by whitespace and another "planets: {"
const duplicatePlanetsRegex = /(natalChart:\s*\{\s*)(planets:\s*\{\s*)(planets:\s*\{)/g;

content = content.replace(duplicatePlanetsRegex, (match, p1, p2, p3) => {
  fixCount++;
  // Keep only one "planets: {"
  return p1 + p3;
});

console.log('Fixed duplicate "planets" keys:', fixCount);

// Fix 2: Move houses and aspects out of the inner planets object
// After removing duplicate planets, we need to ensure houses and aspects are siblings of planets, not children

// Pattern to find and fix:
// planets: { Sun: ..., Moon: ..., houses: {...}, aspects: [...] }
// Should be:
// planets: { Sun: ..., Moon: ... }, houses: {...}, aspects: [...]

// This is complex because we need to track braces. Let's use a different approach.
// We'll look for the pattern where houses appears after the last planet entry

const lines = content.split('\n');
const fixedLines = [];
let inNatalChart = false;
let inPlanets = false;
let planetsLevel = 0;
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  const trimmed = line.trim();

  // Track when we enter natalChart
  if (trimmed.includes('natalChart: {')) {
    inNatalChart = true;
  }

  // Track when we enter planets within natalChart
  if (inNatalChart && trimmed.includes('planets: {')) {
    inPlanets = true;
    planetsLevel = 0;
  }

  // If we're in planets, track the brace level
  if (inPlanets) {
    // Count opening and closing braces
    const openCount = (line.match(/\{/g) || []).length;
    const closeCount = (line.match(/\}/g) || []).length;
    planetsLevel += openCount - closeCount;
  }

  // Check if this line contains houses or aspects while we're in planets
  if (inPlanets && (trimmed.startsWith('houses:') || trimmed.startsWith('aspects:'))) {
    // Close the planets object before houses/aspects
    const indent = line.match(/^\s*/)[0];
    fixedLines.push(indent + '},');
    fixedLines.push(line);
    inPlanets = false;
    i++;
    continue;
  }

  // Check if planets object is closing
  if (inPlanets && trimmed === '},' && planetsLevel === 0) {
    inPlanets = false;
  }

  // Check if natalChart is closing
  if (inNatalChart && trimmed === '},' && !inPlanets) {
    inNatalChart = false;
  }

  fixedLines.push(line);
  i++;
}

content = fixedLines.join('\n');

console.log('Restructured houses and aspects placement');

// Fix 3: Remove the closing brace that was for the inner planets object
// Look for patterns like:
// },  // End of inner planets
// houses: {...}
// And remove the first },

// This is already handled by the above logic

console.log('Writing fixed file...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed file size:', content.length);
console.log('Done! File fixed successfully.');
