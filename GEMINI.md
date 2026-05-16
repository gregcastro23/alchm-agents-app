# Planetary Agents - Agentic Workflows & LangChain Integration

This document outlines the specialized agentic workflows and LangChain integrations activated in this repository.

## 🚀 Activated Features

### 1. Knowledge Updater API (`/api/knowledge-updater`)

- **Purpose:** Dynamic ingestion of web content and PDF documents into the agent knowledge base (ChromaDB).
- **Endpoint:** `POST /api/knowledge-updater`
- **Capabilities:**
  - Scrape and ingest web URLs using `CheerioWebBaseLoader`.
  - Extract and ingest text from PDF documents using `PDFLoader`.
- **Requirements:** `USE_RAG_GENERATION=true` in environment.

### 2. LangChain Agent Router (`/api/langchain-agent`)

- **Purpose:** Advanced ReAct agent orchestrator for complex multi-step reasoning.
- **Endpoint:** `POST /api/langchain-agent`
- **Tools Available:**
  - `semantic_agent_search`: Find agents by concept/topic.
  - `knowledge_retrieval`: Fetch RAG context.
  - `consciousness_analysis`: Calculate synergy and compatibility.
  - `multi_agent_coordinator`: Assemble a council of agents for a query.
  - `memory_retrieval`: Retrieve interaction history.

### 3. Enhanced Semantic Search (`/api/agents/semantic-search`)

- **Purpose:** High-performance vector search with health monitoring.
- **Endpoints:**
  - `POST /api/agents/semantic-search`: Query agent knowledge.
  - `GET /api/agents/semantic-search`: Check RAG health and collection status.

## 🛠️ Configuration

To fully enable these features, ensure the following environment variables are set:

- `USE_RAG_GENERATION=true`
- `CHROMADB_URL=http://localhost:8001` (or your production ChromaDB endpoint)
- `OPENAI_API_KEY` (required for embeddings and LangChain agents)

## 📁 Key Files

- `lib/langchain/`: Core LangChain integration logic.
- `lib/llamaindex/`: Vector store and embedding services.
- `app/api/`: Corresponding API routes.
