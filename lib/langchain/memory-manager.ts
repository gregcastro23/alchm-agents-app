/**
 * Memory Manager for Agent Conversations
 * Persistent memory with vector storage
 */

import { BufferMemory, ChatMessageHistory } from '@langchain/classic/memory'
import type { BaseMessage } from '@langchain/core/messages'
import { HumanMessage, AIMessage } from '@langchain/core/messages'

export interface ConversationMemory {
  sessionId: string
  agentId: string
  messages: BaseMessage[]
  summary?: string
  createdAt: Date
  updatedAt: Date
}

export interface MemoryRetrievalOptions {
  limit?: number
  includeContext?: boolean
  semanticSearch?: boolean
}

/**
 * Memory Manager with Vector Storage
 */
export class MemoryManager {
  private memories: Map<string, ConversationMemory>
  private bufferMemories: Map<string, BufferMemory>

  constructor() {
    this.memories = new Map()
    this.bufferMemories = new Map()
  }

  /**
   * Create or get memory for a session
   */
  async getMemory(sessionId: string, agentId: string): Promise<BufferMemory> {
    const key = `${sessionId}_${agentId}`

    // Check if buffer memory exists
    if (this.bufferMemories.has(key)) {
      return this.bufferMemories.get(key)!
    }

    // Load existing conversation memory
    const existingMemory = this.memories.get(key)
    let messages: BaseMessage[] = []

    if (existingMemory) {
      messages = existingMemory.messages
    }

    // Create new buffer memory
    const chatHistory = new ChatMessageHistory(messages)
    const bufferMemory = new BufferMemory({
      chatHistory,
      returnMessages: true,
      memoryKey: 'chat_history',
    })

    this.bufferMemories.set(key, bufferMemory)

    return bufferMemory
  }

  /**
   * Save conversation to memory
   */
  async saveConversation(
    sessionId: string,
    agentId: string,
    userMessage: string,
    agentResponse: string
  ): Promise<void> {
    const key = `${sessionId}_${agentId}`

    // Get or create memory entry
    let memory = this.memories.get(key)
    if (!memory) {
      memory = {
        sessionId,
        agentId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    // Add messages
    memory.messages.push(new HumanMessage(userMessage))
    memory.messages.push(new AIMessage(agentResponse))
    memory.updatedAt = new Date()

    // Save to map
    this.memories.set(key, memory)

    // Update buffer memory
    const bufferMemory = this.bufferMemories.get(key)
    if (bufferMemory) {
      await bufferMemory.chatHistory.addUserMessage(userMessage)
      await bufferMemory.chatHistory.addAIMessage(agentResponse)
    }

    console.log(`[MemoryManager] Saved conversation for ${sessionId}/${agentId}`)
  }

  /**
   * Retrieve conversation history
   */
  async getConversationHistory(
    sessionId: string,
    agentId: string,
    options: MemoryRetrievalOptions = {}
  ): Promise<BaseMessage[]> {
    const { limit = 10 } = options
    const key = `${sessionId}_${agentId}`

    const memory = this.memories.get(key)
    if (!memory) {
      return []
    }

    // Return last N messages
    return memory.messages.slice(-limit)
  }

  /**
   * Search conversation history semantically
   */
  async searchConversations(
    query: string,
    agentId?: string,
    options: { topK?: number } = {}
  ): Promise<
    Array<{
      sessionId: string
      agentId: string
      message: string
      relevance: number
    }>
  > {
    const { topK = 5 } = options
    const results: Array<{
      sessionId: string
      agentId: string
      message: string
      relevance: number
    }> = []

    // Search through all memories
    for (const [key, memory] of this.memories.entries()) {
      if (agentId && memory.agentId !== agentId) continue

      // Simple text matching (in production, use vector search)
      for (const message of memory.messages) {
        const content = message.content.toString()
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            sessionId: memory.sessionId,
            agentId: memory.agentId,
            message: content,
            relevance: 0.8, // Placeholder
          })
        }
      }
    }

    // Sort by relevance and limit
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, topK)
  }

  /**
   * Generate conversation summary
   */
  async generateSummary(sessionId: string, agentId: string): Promise<string> {
    const key = `${sessionId}_${agentId}`
    const memory = this.memories.get(key)

    if (!memory || memory.messages.length === 0) {
      return 'No conversation history'
    }

    // Simple summary (in production, use LLM for summarization)
    const messageCount = memory.messages.length
    const duration = memory.updatedAt.getTime() - memory.createdAt.getTime()
    const durationMinutes = Math.round(duration / 60000)

    return `Conversation with ${agentId}: ${messageCount} messages over ${durationMinutes} minutes`
  }

  /**
   * Clear memory for a session
   */
  async clearMemory(sessionId: string, agentId: string): Promise<void> {
    const key = `${sessionId}_${agentId}`

    this.memories.delete(key)
    this.bufferMemories.delete(key)

    console.log(`[MemoryManager] Cleared memory for ${sessionId}/${agentId}`)
  }

  /**
   * Clear all memories
   */
  async clearAllMemories(): Promise<void> {
    this.memories.clear()
    this.bufferMemories.clear()
    console.log('[MemoryManager] Cleared all memories')
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    totalConversations: number
    totalMessages: number
    activeAgents: Set<string>
  } {
    let totalMessages = 0
    const activeAgents = new Set<string>()

    for (const memory of this.memories.values()) {
      totalMessages += memory.messages.length
      activeAgents.add(memory.agentId)
    }

    return {
      totalConversations: this.memories.size,
      totalMessages,
      activeAgents,
    }
  }

  /**
   * Export memories for persistence
   */
  exportMemories(): ConversationMemory[] {
    return Array.from(this.memories.values())
  }

  /**
   * Import memories from persistence
   */
  importMemories(memories: ConversationMemory[]): void {
    for (const memory of memories) {
      const key = `${memory.sessionId}_${memory.agentId}`
      this.memories.set(key, memory)
    }
    console.log(`[MemoryManager] Imported ${memories.length} conversations`)
  }
}

/**
 * Global memory manager instance
 */
let memoryManagerInstance: MemoryManager | null = null

/**
 * Get or create memory manager
 */
export function getMemoryManager(): MemoryManager {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager()
  }
  return memoryManagerInstance
}

/**
 * Save conversation (convenience function)
 */
export async function saveConversation(
  sessionId: string,
  agentId: string,
  userMessage: string,
  agentResponse: string
): Promise<void> {
  const manager = getMemoryManager()
  await manager.saveConversation(sessionId, agentId, userMessage, agentResponse)
}

/**
 * Get conversation history (convenience function)
 */
export async function getConversationHistory(
  sessionId: string,
  agentId: string,
  limit?: number
): Promise<BaseMessage[]> {
  const manager = getMemoryManager()
  return await manager.getConversationHistory(sessionId, agentId, { limit })
}
