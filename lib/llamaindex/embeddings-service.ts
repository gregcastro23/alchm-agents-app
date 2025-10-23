/**
 * Embeddings Service for Planetary Agents
 * Handles embedding generation with caching and batch processing
 */

import { OpenAIEmbedding } from 'llamaindex'
import { getEmbeddings } from './vector-store'

export interface EmbeddingOptions {
  model?: string
  dimensions?: number
  batchSize?: number
}

export interface EmbeddingResult {
  embedding: number[]
  text: string
  metadata?: Record<string, any>
}

/**
 * Embeddings Service with caching and batch processing
 */
export class EmbeddingsService {
  private embeddings: OpenAIEmbedding
  private cache: Map<string, number[]>
  private readonly defaultBatchSize = 20

  constructor(options: EmbeddingOptions = {}) {
    this.embeddings = new OpenAIEmbedding({
      model: options.model || 'text-embedding-3-small',
      dimensions: options.dimensions || 1536,
    })
    this.cache = new Map()
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(text)
    const cached = this.cache.get(cacheKey)
    if (cached) {
      console.log('[Embeddings] Cache hit for text')
      return cached
    }

    try {
      const embedding = await this.embeddings.getQueryEmbedding(text)

      // Cache the result
      this.cache.set(cacheKey, embedding)

      return embedding
    } catch (error) {
      console.error('[Embeddings] Failed to generate embedding:', error)
      throw new Error(`Embedding generation failed: ${error}`)
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateBatchEmbeddings(
    texts: string[],
    batchSize?: number
  ): Promise<EmbeddingResult[]> {
    const size = batchSize || this.defaultBatchSize
    const results: EmbeddingResult[] = []

    console.log(`[Embeddings] Generating embeddings for ${texts.length} texts in batches of ${size}`)

    for (let i = 0; i < texts.length; i += size) {
      const batch = texts.slice(i, i + size)
      const batchResults = await Promise.all(
        batch.map(async (text) => ({
          embedding: await this.generateEmbedding(text),
          text,
        }))
      )
      results.push(...batchResults)

      // Log progress
      console.log(`[Embeddings] Processed ${Math.min(i + size, texts.length)}/${texts.length} texts`)
    }

    return results
  }

  /**
   * Generate embedding for agent profile
   */
  async generateAgentEmbedding(agentData: {
    name: string
    title: string
    wisdomDomains: string[]
    abilities: string
    personality: string
  }): Promise<number[]> {
    // Combine agent data into a rich text representation
    const text = this.agentToText(agentData)
    return await this.generateEmbedding(text)
  }

  /**
   * Convert agent data to text for embedding
   */
  private agentToText(agentData: {
    name: string
    title: string
    wisdomDomains: string[]
    abilities: string
    personality: string
  }): string {
    return `
Name: ${agentData.name}
Title: ${agentData.title}
Wisdom Domains: ${agentData.wisdomDomains.join(', ')}
Abilities: ${agentData.abilities}
Personality: ${agentData.personality}
    `.trim()
  }

  /**
   * Generate cache key for text
   */
  private getCacheKey(text: string): string {
    // Simple hash for cache key (in production, use a proper hash function)
    return `emb_${text.substring(0, 100)}`
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.cache.clear()
    console.log('[Embeddings] Cache cleared')
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }

  /**
   * Calculate similarity between two embeddings (cosine similarity)
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }
}

/**
 * Global embeddings service instance
 */
let embeddingsServiceInstance: EmbeddingsService | null = null

/**
 * Get or create embeddings service
 */
export function getEmbeddingsService(): EmbeddingsService {
  if (!embeddingsServiceInstance) {
    embeddingsServiceInstance = new EmbeddingsService()
  }
  return embeddingsServiceInstance
}

/**
 * Generate embedding for text (convenience function)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const service = getEmbeddingsService()
  return await service.generateEmbedding(text)
}

/**
 * Generate embeddings in batch (convenience function)
 */
export async function generateBatchEmbeddings(
  texts: string[],
  batchSize?: number
): Promise<EmbeddingResult[]> {
  const service = getEmbeddingsService()
  return await service.generateBatchEmbeddings(texts, batchSize)
}
