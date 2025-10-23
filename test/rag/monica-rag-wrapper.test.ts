/**
 * Monica RAG Wrapper Unit Tests
 * Tests for the RAG wrapper integration
 */

import { describe, it, expect } from 'vitest'
import { shouldUseRAG, getRAGStatus } from '@/lib/rag/monica-rag-wrapper'

describe('Monica RAG Wrapper', () => {
  describe('shouldUseRAG', () => {
    it('should return boolean', () => {
      const result = shouldUseRAG()
      expect(typeof result).toBe('boolean')
    })

    it('should check environment variables', () => {
      const useRAG = process.env.USE_RAG_GENERATION
      const vectorSearch = process.env.USE_VECTOR_SEARCH

      // These should be defined in .env.local
      expect(useRAG).toBeDefined()
      expect(vectorSearch).toBeDefined()
    })
  })

  describe('getRAGStatus', () => {
    it('should return complete status object', () => {
      const status = getRAGStatus()

      expect(status).toBeDefined()
      expect(status).toHaveProperty('enabled')
      expect(status).toHaveProperty('vectorSearchEnabled')
      expect(status).toHaveProperty('maxKnowledgeChunks')
      expect(status).toHaveProperty('minSimilarity')

      expect(typeof status.enabled).toBe('boolean')
      expect(typeof status.vectorSearchEnabled).toBe('boolean')
      expect(typeof status.maxKnowledgeChunks).toBe('number')
      expect(typeof status.minSimilarity).toBe('number')
    })

    it('should have reasonable default values', () => {
      const status = getRAGStatus()

      // Max chunks should be reasonable (1-10)
      expect(status.maxKnowledgeChunks).toBeGreaterThan(0)
      expect(status.maxKnowledgeChunks).toBeLessThanOrEqual(10)

      // Min similarity should be between 0 and 1
      expect(status.minSimilarity).toBeGreaterThanOrEqual(0)
      expect(status.minSimilarity).toBeLessThanOrEqual(1)
    })

    it('should match environment variable settings', () => {
      const status = getRAGStatus()
      const expectedMaxChunks = parseInt(process.env.RAG_MAX_KNOWLEDGE_CHUNKS || '3')
      const expectedMinSimilarity = parseFloat(process.env.RAG_MIN_SIMILARITY || '0.6')

      expect(status.maxKnowledgeChunks).toBe(expectedMaxChunks)
      expect(status.minSimilarity).toBe(expectedMinSimilarity)
    })
  })

  describe('Feature Flag Configuration', () => {
    it('should have RAG_MAX_KNOWLEDGE_CHUNKS configured', () => {
      const maxChunks = process.env.RAG_MAX_KNOWLEDGE_CHUNKS
      expect(maxChunks).toBeDefined()

      if (maxChunks) {
        const parsed = parseInt(maxChunks)
        expect(parsed).toBeGreaterThan(0)
      }
    })

    it('should have RAG_MIN_SIMILARITY configured', () => {
      const minSim = process.env.RAG_MIN_SIMILARITY
      expect(minSim).toBeDefined()

      if (minSim) {
        const parsed = parseFloat(minSim)
        expect(parsed).toBeGreaterThanOrEqual(0)
        expect(parsed).toBeLessThanOrEqual(1)
      }
    })
  })
})

describe('RAG Configuration Validation', () => {
  it('should have ChromaDB URL configured', () => {
    const chromaUrl = process.env.CHROMADB_URL
    expect(chromaUrl).toBeDefined()

    if (chromaUrl) {
      expect(chromaUrl).toContain('http')
    }
  })

  it('should have OpenAI API key for embeddings', () => {
    const apiKey = process.env.OPENAI_API_KEY
    expect(apiKey).toBeDefined()
    expect(typeof apiKey).toBe('string')
  })
})
