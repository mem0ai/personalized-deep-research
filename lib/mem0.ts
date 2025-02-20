import MemoryClient from './mem0/index'
import { useRuntimeConfig } from '#app'

// Create a composable to handle Mem0 client initialization
export function useMem0Client() {
  const config = useRuntimeConfig()
  
  // Initialize Mem0 client
  const client = new MemoryClient({
    apiKey: config.MEM0_API_KEY || config.public.MEM0_API_KEY,
  })

  const saveToMem0 = async (text: string) => {
    const messages = [
      { role: 'user', content: text },
    ]

    try {
      const result = await client.add(messages, { user_id: 'resume' })
      return result
    } catch (error) {
      console.error('Error saving to Mem0:', error)
      throw error
    }
  }

  const getAllMemories = async () => {
    try {
      const memories = await client.getAll({ user_id: 'resume' })
      console.log(memories)
      return memories
    } catch (error) {
      console.error('Error getting memories:', error)
      throw error
    }
  }

  return {
    saveToMem0,
    getAllMemories
  }
}