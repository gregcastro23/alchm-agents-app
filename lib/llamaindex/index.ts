/**
 * LlamaIndex Integration for Planetary Agents
 * Vector store, embeddings, and semantic search
 */

export {
  vectorStoreManager,
  initializeVectorStore,
  getVectorStore,
  getEmbeddings,
  type VectorStoreConfig,
  type AgentDocumentMetadata,
} from './vector-store'

export {
  EmbeddingsService,
  getEmbeddingsService,
  generateEmbedding,
  generateBatchEmbeddings,
  type EmbeddingOptions,
  type EmbeddingResult,
} from './embeddings-service'

export {
  AgentDocumentLoader,
  getAgentDocumentLoader,
  loadAllAgentDocuments,
  type AgentDocument,
} from './document-loader'

export {
  SemanticSearchService,
  getSemanticSearchService,
  searchAgentsByConcept,
  getRelevantKnowledgeForRAG,
  type SearchOptions,
  type SearchResult,
  type AgentSearchResult,
} from './semantic-search'
