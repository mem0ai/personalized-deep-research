import MemoryClient from '~/mem0'

// Initialize Mem0 client
const client = new MemoryClient({
  apiKey: 'm0-6EXJuyJxMgF4SfYnoC1C7Pz1cX8EPPS5FdjMFcyl',
})

export async function saveToMem0(text: string) {
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

export async function getAllMemories() {
  try {
    const memories = await client.getAll({ user_id: 'resume' })
    console.log(memories)
    return memories
  } catch (error) {
    console.error('Error fetching memories:', error)
    throw error
  }
}