import MemoryClient from 'mem0ai'
import { useRuntimeConfig } from '#app'

// Create a composable to handle Mem0 client initialization
export function useMem0Client() {
  const { config, aiApiBase } = useConfigStore()

  const apiKey = (config.ai.mem0ApiKey as string) || ''
  if (!apiKey) {
    console.error('Mem0 API key not set')
    return null
  }

  // Initialize Mem0 client
  const client = new MemoryClient({
    apiKey: apiKey,
  })

  const saveToMem0 = async (text: string) => {
    const messages = [
      { role: 'user', content: text },
    ]

    try {
      const result = await client.add(messages, { user_id: 'deep-research-agent-mem0' })
      return result
    } catch (error) {
      console.error('Error saving to Mem0:', error)
      throw error
    }
  }

  const getAllMemories = async () => {
    try {
      const memories = await client.getAll({ user_id: 'deep-research-agent-mem0' })
      console.log(memories)
      return memories
    } catch (error) {
      console.error('Error getting memories:', error)
      throw error
    }
  }

  const updateMemory = async (memoryId: string, text: string) => {
    try {
      console.log('Updating memory:', memoryId, text)
      const result = await client.update(memoryId, text)
      console.log(result)
      return result
    } catch (error) {
      console.error('Error updating memory:', error)
      throw error
    }
  }

  const deleteMemory = async (memoryId: string) => {
    try {
      const result = await client.delete(memoryId)
      return result
    } catch (error) {
      console.error('Error deleting memory:', error)
      throw error
    }
  }

  const deleteAllMemories = async () => {
    try {
      const memories = await client.getAll({ user_id: 'deep-research-agent-mem0' })
      memories.forEach(async (memory) => {
        await client.delete(memory.id)
      })
    } catch (error) {
      console.error('Error deleting memories:', error)
      throw error
    }
  }

  return {
    saveToMem0,
    getAllMemories,
    updateMemory,
    deleteMemory,
    deleteAllMemories,
  }
}