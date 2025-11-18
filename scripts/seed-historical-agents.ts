/**
 * Seed Historical Agents to Neon Database
 *
 * This script populates the historical_agents table in Neon PostgreSQL
 * with all agent data from lib/agents/historical/*.ts files
 *
 * Features:
 * - Handles BCE dates properly (negative years)
 * - Validates all data before insertion
 * - Provides detailed error reporting
 * - Supports dry-run mode
 *
 * Usage:
 *   npx tsx scripts/seed-historical-agents.ts              # Actual run
 *   DRY_RUN=true npx tsx scripts/seed-historical-agents.ts # Dry run (no writes)
 */

import { PrismaClient } from '@prisma/client';
import { HISTORICAL_AGENTS } from '../lib/agents/historical/index';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Dry run flag - set to false to actually write to database
const DRY_RUN = process.env.DRY_RUN === 'true';

/**
 * BCE Agent Birth Data
 * Since JavaScript Date doesn't support BCE dates, we maintain a mapping
 * Format: { year: -469 means 469 BCE, month: 6 (June), day: 20 }
 */
const BCE_AGENTS: Record<string, { year: number; month: number; day: number; time?: string }> = {
  'socrates': { year: -469, month: 6, day: 20, time: '12:00' }, // 469 BCE
  // Add more BCE agents as discovered
};

/**
 * Parse date handling BCE years
 * JavaScript Date doesn't support BCE dates (negative years)
 * So we parse the string manually and extract the year
 */
function parseBirthDate(dateInput: Date | string): { date: Date; year: number } {
  let dateStr: string;

  // If it's a Date object, try to convert to ISO string safely
  if (dateInput instanceof Date) {
    // Check if date is valid
    if (isNaN(dateInput.getTime())) {
      // Invalid date - try to extract from constructor argument
      // This handles dates created with strings like new Date('-0469-06-20')
      const originalStr = dateInput.toString();
      if (originalStr === 'Invalid Date') {
        // Parse from Date constructor - BCE dates throw here
        // Use a workaround: convert the date to a string first
        throw new Error('Invalid date object provided');
      }
      dateStr = originalStr;
    } else {
      dateStr = dateInput.toISOString();
    }
  } else {
    dateStr = String(dateInput);
  }

  // Check if this is a BCE date (starts with negative year like -0469 or -469)
  const bceMatch = dateStr.match(/^-0*(\d+)-(\d{2})-(\d{2})/);
  if (bceMatch) {
    const bceYear = -parseInt(bceMatch[1], 10);
    const month = parseInt(bceMatch[2], 10);
    const day = parseInt(bceMatch[3], 10);

    // For database storage, use a placeholder date but store actual BCE year
    // Use the actual month and day if available
    const placeholderDate = new Date(Date.UTC(1, month - 1, day, 12, 0, 0));

    return {
      date: placeholderDate,
      year: bceYear
    };
  }

  // Check for CE years with leading zeros like 0069, 0121
  const ceMatch = dateStr.match(/^0*(\d+)-/);
  if (ceMatch) {
    const year = parseInt(ceMatch[1], 10);

    // Try to parse the full date
    try {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        return {
          date: parsedDate,
          year: year
        };
      }
    } catch {
      // Fall through to create a basic date
    }

    // Create a basic date for the year
    return {
      date: new Date(Date.UTC(year, 0, 1, 12, 0, 0)),
      year: year
    };
  }

  // Regular date parsing
  const parsedDate = new Date(dateStr);
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Unable to parse date: ${dateStr}`);
  }

  return {
    date: parsedDate,
    year: parsedDate.getFullYear()
  };
}

/**
 * Extract culture from agent data
 * Falls back to geography if culture not specified
 */
function extractCulture(agent: any): string {
  if ((agent as any).culture) {
    return (agent as any).culture;
  }

  // Extract country from location name (e.g., "Athens, Greece" -> "Greece")
  const locationParts = agent.birthData.location.name.split(',');
  if (locationParts.length > 1) {
    return locationParts[locationParts.length - 1].trim();
  }

  return 'Unknown';
}

/**
 * Extract death year if available
 */
function extractDeathYear(agent: any): number | null {
  if ((agent as any).deathYear) {
    return (agent as any).deathYear;
  }

  // Most historical agents have passed - we could add this to agent definitions
  // For now, return null if not specified
  return null;
}

async function seedHistoricalAgents() {
  console.log('\n🌱 Seeding Historical Agents to Neon Database\n');
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No data will be written\n');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let created = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  for (const agent of HISTORICAL_AGENTS) {
    try {
      // Parse birth date handling BCE years
      let birthDate: Date;
      let birthYear: number;

      // Check if this is a BCE agent (Invalid Date)
      if (agent.birthData.date instanceof Date && isNaN(agent.birthData.date.getTime())) {
        // Look up in our BCE mapping
        const bceData = BCE_AGENTS[agent.id];

        if (!bceData) {
          throw new Error(`BCE agent ${agent.id} not found in BCE_AGENTS mapping. Please add it.`);
        }

        console.warn(`   ⚠️ Using BCE mapping for ${agent.name}: ${Math.abs(bceData.year)} BCE`);

        // Create a placeholder date (year 1 CE) but store the actual BCE year
        birthDate = new Date(Date.UTC(1, bceData.month - 1, bceData.day, 12, 0, 0));
        birthYear = bceData.year;
      } else {
        // Regular date parsing
        const parsed = parseBirthDate(agent.birthData.date);
        birthDate = parsed.date;
        birthYear = parsed.year;
      }

      // Extract additional fields
      const culture = extractCulture(agent);
      const deathYear = extractDeathYear(agent);
      const geography = agent.birthData.location.name.split(',').pop()?.trim() || 'Unknown';

      // Log the parsed data for debugging
      if (DRY_RUN) {
        console.log(`📋 ${agent.name}:`);
        console.log(`   Birth Year: ${birthYear} ${birthYear < 0 ? 'BCE' : 'CE'}`);
        console.log(`   Birth Date: ${birthDate.toISOString()}`);
        console.log(`   Culture: ${culture}`);
        console.log(`   Geography: ${geography}`);
      }

      // Prepare agent data for database
      const agentData = {
        id: uuidv4(),
        agentId: agent.id,
        name: agent.name,
        title: agent.title || agent.name,
        birthDate: birthDate,
        birthTime: agent.birthData.time || '12:00',
        birthLocation: {
          latitude: agent.birthData.location.lat,
          longitude: agent.birthData.location.lon,
          name: agent.birthData.location.name,
        },
        historicalEra: agent.era,
        birthYear: birthYear,
        deathYear: deathYear,
        culture: culture,
        geography: geography,
        consciousnessLevel: agent.consciousness.level,
        kalchmConstant: 0, // Calculate if needed
        monicaConstant: agent.consciousness.monicaConstant,
        dominantElement: agent.consciousness.dominantElement,
        dominantModality: agent.consciousness.dominantModality || null,
        signature: agent.consciousness.signature || '',
        spiritScore: agent.consciousness.alchemicalElements.spirit,
        essenceScore: agent.consciousness.alchemicalElements.essence,
        matterScore: agent.consciousness.alchemicalElements.matter,
        substanceScore: agent.consciousness.alchemicalElements.substance,
        personalityCore: agent.personality.core,
        personalityShadows: agent.personality.shadows || [],
        personalityGifts: agent.personality.gifts || [],
        personalityChallenges: agent.personality.challenges || [],
        currentMood: agent.personality.currentMood || 'contemplative',
        evolutionStage: agent.personality.evolutionStage || 1,
        background: (agent as any).background || {},
        specialty: agent.specialization,
        wisdomDomains: (agent as any).wisdomDomains || (agent.abilities?.wisdomDomains) || [agent.specialization],
        skills: agent.personality.traits || [],
        teachingStyle: (agent as any).teachingStyle || (agent.abilities?.teachingStyle) || 'Adaptive',
        resonanceType: (agent as any).resonanceType || (agent.abilities?.resonanceType) || 'Universal',
        uniquePower: (agent as any).uniquePower || (agent.abilities?.uniquePower) || agent.personality.core.essence,
        avatar: agent.appearance?.avatar || null,
        color: agent.appearance?.color || '#888888',
        symbol: agent.appearance?.symbol || '✨',
        aura: agent.appearance?.aura || null,
        natalChart: agent.consciousness.natalChart,
        traits: { traits: agent.personality.traits },
        monicaCreationStory: (agent as any).monicaCreationStory || null,
        searchableText: `${agent.name} ${agent.title} ${agent.specialization} ${agent.coreBeliefs.join(' ')}`,
        popularityScore: 0.5,
        conversations: agent.stats?.conversations || 0,
        wisdomShared: agent.stats?.wisdomShared || 0,
        resonanceScore: agent.stats?.resonanceScore || 0.5,
        evolutionPoints: agent.stats?.evolutionPoints || 0,
        lastActive: agent.stats?.lastActive || new Date(),
        isActive: true,
        version: '1.0.0',
        craftedBy: 'seed-script',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (DRY_RUN) {
        console.log(`✓ Validated: ${agent.name.padEnd(30)} (${agent.id})\n`);
        created++;
        continue;
      }

      // Upsert (create or update)
      const result = await prisma.historical_agents.upsert({
        where: { agentId: agent.id },
        update: agentData,
        create: agentData,
      });

      // Check if this was a create or update based on timestamps
      const isNew = Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;

      if (isNew) {
        created++;
        console.log(`✅ Created: ${agent.name.padEnd(30)} (${agent.id})`);
      } else {
        updated++;
        console.log(`🔄 Updated: ${agent.name.padEnd(30)} (${agent.id})`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Error with ${agent.name}:`);
      if (error instanceof Error) {
        console.error(`   ${error.message}`);
        if (error.stack) {
          console.error(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
        }
      } else {
        console.error(`   ${String(error)}`);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 Summary:`);
  console.log(`   Total Agents: ${HISTORICAL_AGENTS.length}`);

  if (DRY_RUN) {
    console.log(`   Validated: ${created}`);
    console.log(`   Errors: ${errors}`);
  } else {
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors: ${errors}`);
  }

  if (errors === 0) {
    if (DRY_RUN) {
      console.log(`\n✅ All agents validated successfully!`);
      console.log(`\n💡 Run without DRY_RUN=true to actually seed the database`);
    } else {
      console.log(`\n✅ All agents successfully seeded!`);
    }
  } else {
    console.log(`\n⚠️  Completed with ${errors} error(s)`);
  }

  await prisma.$disconnect();
}

seedHistoricalAgents()
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
