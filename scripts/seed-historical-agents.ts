import pg from 'pg'
import { config } from 'dotenv'
import { HISTORICAL_AGENTS } from '../lib/agents/historical/index.js'
import { v4 as uuidv4 } from 'uuid'

// Load environment variables
config()

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
})

/**
 * Maps CE/BCE dates to a consistent object
 */
function parseDate(dateInput: Date | string): { date: Date; year: number } {
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) {
    return { date: new Date('0001-01-01'), year: 1 }
  }
  return { date: d, year: d.getFullYear() }
}

/**
 * Simplified Sacred 7 Stat derivation for seeding
 */
function deriveSacredStats(agent: any) {
  const mc = agent.consciousness.monicaConstant || 0
  const spirit = agent.consciousness.alchemicalElements?.spirit || 0.5
  const essence = agent.consciousness.alchemicalElements?.essence || 0.5
  const matter = agent.consciousness.alchemicalElements?.matter || 0.5
  const substance = agent.consciousness.alchemicalElements?.substance || 0.5

  // Simplified formulas based on alchemical influence
  return {
    power: Math.round(Math.min(100, 50 + (mc / 10) * 30 + spirit * 20)),
    resonance: Math.round(Math.min(100, 50 + essence * 40)),
    wisdom: Math.round(Math.min(100, 50 + spirit * 30 + substance * 10)),
    charisma: Math.round(Math.min(100, 50 + essence * 30 + spirit * 10)),
    intuition: Math.round(Math.min(100, 50 + spirit * 25 + essence * 15)),
    adaptability: Math.round(Math.min(100, 50 + substance * 40)),
    vitality: Math.round(Math.min(100, 50 + matter * 40)),
  }
}

async function seedDatabase() {
  console.log('--- Starting Historical Agents Seeding (Raw PG) ---')
  console.log(`Found ${HISTORICAL_AGENTS.length} total historical agents to seed.`)

  let createdCount = 0

  try {
    for (const agent of HISTORICAL_AGENTS) {
      console.log(`Seeding: ${agent.name}...`)

      const { date, year } = parseDate(agent.birthData.date)
      const searchableText =
        `${agent.name} ${agent.title} ${agent.specialization} ${agent.coreBeliefs?.join(' ')}`.toLowerCase()
      const stats = deriveSacredStats(agent)

      const query = `
        INSERT INTO historical_agents (
          "id", "agentId", "name", "title", "historicalEra", "birthYear", "birthDate", "birthTime", "birthLocation",
          "culture", "geography", "consciousnessLevel", "monicaConstant", "dominantElement", "dominantModality",
          "signature", "spiritScore", "essenceScore", "matterScore", "substanceScore",
          "personalityCore", "personalityShadows", "personalityGifts", "personalityChallenges",
          "specialty", "wisdomDomains", "skills", "teachingStyle", "resonanceType", "uniquePower",
          "color", "symbol", "natalChart", "background", "currentMood", "evolutionStage", "traits",
          "popularityScore", "conversations", "wisdomShared", "resonanceScore", "evolutionPoints",
          "isActive", "version", "craftedBy", "updatedAt", "kalchmConstant", "searchableText",
          "powerScore", "resonanceScore7", "wisdomScore", "charismaScore", "intuitionScore", "adaptabilityScore", "vitalityScore"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37,
          $38, $39, $40, $41, $42,
          true, '1.0.0', 'philosopher-stone', NOW(), 0, $43,
          $44, $45, $46, $47, $48, $49, $50
        )
        ON CONFLICT ("agentId") DO UPDATE SET
          "name" = EXCLUDED."name",
          "title" = EXCLUDED."title",
          "historicalEra" = EXCLUDED."historicalEra",
          "birthYear" = EXCLUDED."birthYear",
          "birthDate" = EXCLUDED."birthDate",
          "birthTime" = EXCLUDED."birthTime",
          "birthLocation" = EXCLUDED."birthLocation",
          "culture" = EXCLUDED."culture",
          "geography" = EXCLUDED."geography",
          "consciousnessLevel" = EXCLUDED."consciousnessLevel",
          "monicaConstant" = EXCLUDED."monicaConstant",
          "dominantElement" = EXCLUDED."dominantElement",
          "dominantModality" = EXCLUDED."dominantModality",
          "signature" = EXCLUDED."signature",
          "spiritScore" = EXCLUDED."spiritScore",
          "essenceScore" = EXCLUDED."essenceScore",
          "matterScore" = EXCLUDED."matterScore",
          "substanceScore" = EXCLUDED."substanceScore",
          "personalityCore" = EXCLUDED."personalityCore",
          "personalityShadows" = EXCLUDED."personalityShadows",
          "personalityGifts" = EXCLUDED."personalityGifts",
          "personalityChallenges" = EXCLUDED."personalityChallenges",
          "specialty" = EXCLUDED."specialty",
          "wisdomDomains" = EXCLUDED."wisdomDomains",
          "skills" = EXCLUDED."skills",
          "teachingStyle" = EXCLUDED."teachingStyle",
          "resonanceType" = EXCLUDED."resonanceType",
          "uniquePower" = EXCLUDED."uniquePower",
          "color" = EXCLUDED."color",
          "symbol" = EXCLUDED."symbol",
          "natalChart" = EXCLUDED."natalChart",
          "background" = EXCLUDED."background",
          "currentMood" = EXCLUDED."currentMood",
          "evolutionStage" = EXCLUDED."evolutionStage",
          "traits" = EXCLUDED."traits",
          "searchableText" = EXCLUDED."searchableText",
          "powerScore" = EXCLUDED."powerScore",
          "resonanceScore7" = EXCLUDED."resonanceScore7",
          "wisdomScore" = EXCLUDED."wisdomScore",
          "charismaScore" = EXCLUDED."charismaScore",
          "intuitionScore" = EXCLUDED."intuitionScore",
          "adaptabilityScore" = EXCLUDED."adaptabilityScore",
          "vitalityScore" = EXCLUDED."vitalityScore",
          "updatedAt" = NOW()
      `

      const values = [
        uuidv4(), // $1
        agent.id, // $2
        agent.name, // $3
        agent.title, // $4
        agent.era || 'Unknown', // $5
        year, // $6
        date, // $7
        agent.birthData.time, // $8
        JSON.stringify(agent.birthData.location), // $9
        agent.birthData.location.name.split(',').pop()?.trim() || 'Unknown', // $10 culture
        agent.birthData.location.name, // $11 geography
        agent.consciousness.level, // $12
        agent.consciousness.monicaConstant, // $13
        agent.consciousness.dominantElement, // $14
        agent.consciousness.dominantModality || 'Unknown', // $15
        agent.consciousness.signature, // $16
        agent.consciousness.alchemicalElements?.spirit || 0, // $17
        agent.consciousness.alchemicalElements?.essence || 0, // $18
        agent.consciousness.alchemicalElements?.matter || 0, // $19
        agent.consciousness.alchemicalElements?.substance || 0, // $20
        JSON.stringify(agent.personality?.core || {}), // $21
        JSON.stringify(agent.personality?.shadows || []), // $22
        JSON.stringify(agent.personality?.gifts || []), // $23
        JSON.stringify(agent.personality?.challenges || []), // $24
        agent.abilities?.specialty || agent.specialization || 'General', // $25
        JSON.stringify(agent.abilities?.wisdomDomains || []), // $26
        JSON.stringify(agent.abilities?.skills || agent.personality?.traits || []), // $27
        agent.abilities?.teachingStyle || 'General', // $28
        agent.abilities?.resonanceType || 'Intellectual', // $29
        agent.abilities?.uniquePower || 'Unique historical insight', // $30
        agent.appearance?.color || '#000000', // $31
        agent.appearance?.symbol || '📜', // $32
        JSON.stringify(agent.consciousness.natalChart || {}), // $33
        JSON.stringify({ quotes: agent.quotes || [], beliefs: agent.coreBeliefs || [] }), // $34
        agent.personality?.currentMood || 'contemplative', // $35
        agent.personality?.evolutionStage || 50, // $36
        JSON.stringify({ traits: agent.personality?.traits || [] }), // $37
        0.5, // $38 popularityScore
        agent.stats?.conversations || 0, // $39
        agent.stats?.wisdomShared || 0, // $40
        agent.stats?.resonanceScore || 0.5, // $41
        agent.stats?.evolutionPoints || 0, // $42
        searchableText, // $43
        stats.power, // $44
        stats.resonance, // $45
        stats.wisdom, // $46
        stats.charisma, // $47
        stats.intuition, // $48
        stats.adaptability, // $49
        stats.vitality, // $50
      ]

      await pool.query(query, values)
      createdCount++
    }

    console.log(
      `✅ All ${createdCount} historical agents successfully seeded/updated with 7 Sacred Stats!`
    )
  } catch (error) {
    console.error('❌ Error during seeding:', error)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

seedDatabase()
