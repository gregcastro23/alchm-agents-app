/**
 * Document Loader for Agent Knowledge Ingestion
 * Extracts and structures agent data for vector storage
 */

import { Document, MetadataMode } from 'llamaindex'
import type { CraftedAgent } from '../agent-types'
import { HISTORICAL_AGENTS } from '../agents/historical'

export interface AgentDocument {
  id: string
  content: string
  metadata: {
    agentId: string
    agentName: string
    wisdomDomains: string[]
    historicalPeriod: string
    element: string
    modality: string
    consciousnessLevel: number
    monicaConstant: number
    documentType: 'profile' | 'personality' | 'abilities' | 'wisdom' | 'birth_data'
    chunkIndex?: number
  }
}

/**
 * Agent Document Loader
 */
export class AgentDocumentLoader {
  /**
   * Load all historical agents as documents
   */
  async loadAllAgents(): Promise<Document[]> {
    console.log(`[DocumentLoader] Loading ${HISTORICAL_AGENTS.length} historical agents...`)

    const documents: Document[] = []

    for (const agent of HISTORICAL_AGENTS) {
      const agentDocs = await this.loadAgent(agent)
      documents.push(...agentDocs)
    }

    console.log(`[DocumentLoader] Created ${documents.length} documents from ${HISTORICAL_AGENTS.length} agents`)
    return documents
  }

  /**
   * Load a single agent as multiple documents (chunked by type)
   */
  async loadAgent(agent: CraftedAgent): Promise<Document[]> {
    const documents: Document[] = []

    // 1. Profile document
    documents.push(this.createProfileDocument(agent))

    // 2. Personality document
    documents.push(this.createPersonalityDocument(agent))

    // 3. Abilities document
    documents.push(this.createAbilitiesDocument(agent))

    // 4. Wisdom domains document
    documents.push(this.createWisdomDocument(agent))

    // 5. Birth data & consciousness document
    documents.push(this.createConsciousnessDocument(agent))

    return documents
  }

  /**
   * Create profile document from agent
   */
  private createProfileDocument(agent: CraftedAgent): Document {
    const content = `
Agent: ${agent.name}
Title: ${agent.title}
Historical Era: ${agent.historicalEra || 'Unknown'}

${agent.monicaCreationStory || `${agent.name} is a historical consciousness crafted through Monica's alchemical wisdom.`}

Element: ${agent.consciousness.dominantElement}
Modality: ${agent.consciousness.dominantModality}
Monica Constant: ${agent.consciousness.monicaConstant.toFixed(2)}
    `.trim()

    return new Document({
      text: content,
      metadata: {
        agentId: agent.id,
        agentName: agent.name,
        wisdomDomains: agent.abilities.wisdomDomains,
        historicalPeriod: agent.historicalEra || 'Unknown',
        element: agent.consciousness.dominantElement,
        modality: agent.consciousness.dominantModality,
        consciousnessLevel: agent.consciousness.monicaConstant,
        monicaConstant: agent.consciousness.monicaConstant,
        documentType: 'profile',
      },
      id_: `${agent.id}_profile`,
    })
  }

  /**
   * Create personality document from agent
   */
  private createPersonalityDocument(agent: CraftedAgent): Document {
    const gifts = (agent.personality.gifts || [])
      .map((g) => `- ${g.type}: ${g.description} (${g.expression})`)
      .join('\n')

    const shadows = (agent.personality.shadows || [])
      .map((s) => `- ${s.type}: ${s.description} (Path: ${s.transformationPath})`)
      .join('\n')

    const challenges = (agent.personality.challenges || [])
      .map((c) => `- ${c.type}: ${c.description} (Growth: ${c.growthOpportunity})`)
      .join('\n')

    const content = `
${agent.name}'s Personality

Core Essence: ${agent.personality.core.essence}
Expression: ${agent.personality.core.expression}
Emotion: ${agent.personality.core.emotion}
Current Mood: ${agent.personality.currentMood}
Evolution Stage: ${agent.personality.evolutionStage}/100

Gifts:
${gifts}

Shadows:
${shadows}

Challenges:
${challenges}
    `.trim()

    return new Document({
      text: content,
      metadata: {
        agentId: agent.id,
        agentName: agent.name,
        wisdomDomains: agent.abilities.wisdomDomains,
        historicalPeriod: agent.historicalEra || 'Unknown',
        element: agent.consciousness.dominantElement,
        modality: agent.consciousness.dominantModality,
        consciousnessLevel: agent.consciousness.monicaConstant,
        monicaConstant: agent.consciousness.monicaConstant,
        documentType: 'personality',
      },
      id_: `${agent.id}_personality`,
    })
  }

  /**
   * Create abilities document from agent
   */
  private createAbilitiesDocument(agent: CraftedAgent): Document {
    const content = `
${agent.name}'s Abilities

Specialty: ${agent.abilities.specialty}
Wisdom Domains: ${agent.abilities.wisdomDomains.join(', ')}
Teaching Style: ${agent.abilities.teachingStyle}
Resonance Type: ${agent.abilities.resonanceType}
Unique Power: ${agent.abilities.uniquePower}

Aura: ${agent.appearance.aura.type} (${agent.appearance.aura.color}, intensity: ${agent.appearance.aura.intensity})
    `.trim()

    return new Document({
      text: content,
      metadata: {
        agentId: agent.id,
        agentName: agent.name,
        wisdomDomains: agent.abilities.wisdomDomains,
        historicalPeriod: agent.historicalEra || 'Unknown',
        element: agent.consciousness.dominantElement,
        modality: agent.consciousness.dominantModality,
        consciousnessLevel: agent.consciousness.monicaConstant,
        monicaConstant: agent.consciousness.monicaConstant,
        documentType: 'abilities',
      },
      id_: `${agent.id}_abilities`,
    })
  }

  /**
   * Create wisdom document from agent
   */
  private createWisdomDocument(agent: CraftedAgent): Document {
    const content = `
${agent.name}'s Wisdom

Primary Domains: ${agent.abilities.wisdomDomains.join(', ')}

Consciousness Signature: ${agent.consciousness.signature || 'UNIQUE-CONSCIOUSNESS'}

Kinetic Evolution:
- Consciousness Velocity: ${agent.stats.kineticEvolution.consciousnessVelocity.toFixed(2)}
- Interaction Momentum: ${agent.stats.kineticEvolution.interactionMomentum.toFixed(2)}
- Evolution Trajectory: ${agent.stats.kineticEvolution.evolutionTrajectory}
- Aspect Sensitivity: ${agent.stats.kineticEvolution.aspectSensitivityGrowth.toFixed(2)}

Quality Metrics:
- Response Depth: ${agent.stats.qualityMetrics.averageResponseDepth.toFixed(2)}
- Aspect Influence: ${agent.stats.qualityMetrics.aspectInfluenceStrength.toFixed(2)}
- Temporal Alignment: ${agent.stats.qualityMetrics.temporalAlignment.toFixed(2)}
    `.trim()

    return new Document({
      text: content,
      metadata: {
        agentId: agent.id,
        agentName: agent.name,
        wisdomDomains: agent.abilities.wisdomDomains,
        historicalPeriod: agent.historicalEra || 'Unknown',
        element: agent.consciousness.dominantElement,
        modality: agent.consciousness.dominantModality,
        consciousnessLevel: agent.consciousness.monicaConstant,
        monicaConstant: agent.consciousness.monicaConstant,
        documentType: 'wisdom',
      },
      id_: `${agent.id}_wisdom`,
    })
  }

  /**
   * Create consciousness document from agent
   */
  private createConsciousnessDocument(agent: CraftedAgent): Document {
    // Handle birth date safely
    const birthDate =
      agent.birthData.date instanceof Date && !isNaN(agent.birthData.date.getTime())
        ? agent.birthData.date.toISOString()
        : 'Unknown'

    const content = `
${agent.name}'s Consciousness Profile

Born: ${birthDate}
Location: ${agent.birthData.location.name} (${agent.birthData.location.lat}, ${agent.birthData.location.lon})

Natal Chart:
- Sun: ${agent.consciousness.natalChart.planets.Sun.sign} ${agent.consciousness.natalChart.planets.Sun.degree}°
- Moon: ${agent.consciousness.natalChart.planets.Moon.sign} ${agent.consciousness.natalChart.planets.Moon.degree}°
- Ascendant: ${agent.consciousness.natalChart.ascendant}°
- Midheaven: ${agent.consciousness.natalChart.midheaven}°

Consciousness Configuration:
- Monica Constant: ${agent.consciousness.monicaConstant.toFixed(2)}
- Dominant Element: ${agent.consciousness.dominantElement}
- Dominant Modality: ${agent.consciousness.dominantModality}
- Signature: ${agent.consciousness.signature || 'UNIQUE-CONSCIOUSNESS'}
    `.trim()

    return new Document({
      text: content,
      metadata: {
        agentId: agent.id,
        agentName: agent.name,
        wisdomDomains: agent.abilities.wisdomDomains,
        historicalPeriod: agent.historicalEra || 'Unknown',
        element: agent.consciousness.dominantElement,
        modality: agent.consciousness.dominantModality,
        consciousnessLevel: agent.consciousness.monicaConstant,
        monicaConstant: agent.consciousness.monicaConstant,
        documentType: 'birth_data',
      },
      id_: `${agent.id}_consciousness`,
    })
  }

  /**
   * Get agent by ID
   */
  getAgentById(agentId: string): CraftedAgent | undefined {
    return HISTORICAL_AGENTS.find((agent) => agent.id === agentId)
  }

  /**
   * Get agents by wisdom domain
   */
  getAgentsByWisdomDomain(domain: string): CraftedAgent[] {
    return HISTORICAL_AGENTS.filter((agent) =>
      agent.abilities.wisdomDomains.some((d) => d.toLowerCase().includes(domain.toLowerCase()))
    )
  }

  /**
   * Get agents by element
   */
  getAgentsByElement(element: string): CraftedAgent[] {
    return HISTORICAL_AGENTS.filter(
      (agent) => agent.consciousness.dominantElement.toLowerCase() === element.toLowerCase()
    )
  }
}

/**
 * Global document loader instance
 */
let documentLoaderInstance: AgentDocumentLoader | null = null

/**
 * Get or create document loader
 */
export function getAgentDocumentLoader(): AgentDocumentLoader {
  if (!documentLoaderInstance) {
    documentLoaderInstance = new AgentDocumentLoader()
  }
  return documentLoaderInstance
}

/**
 * Load all agents as documents (convenience function)
 */
export async function loadAllAgentDocuments(): Promise<Document[]> {
  const loader = getAgentDocumentLoader()
  return await loader.loadAllAgents()
}
