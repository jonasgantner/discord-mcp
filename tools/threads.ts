import { fetchGuild } from '../client.js'
import type { ToolDef } from './_types.js'

export const threadTools: ToolDef[] = [
  {
    name: 'list_active_threads',
    description: 'List all active threads in the server',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
      },
      required: [],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const result = await guild.channels.fetchActiveThreads()
      const threads = [...result.threads.values()]
      if (threads.length === 0) return 'No active threads found.'
      const lines = threads.map(t => {
        const parent = t.parent ? `#${t.parent.name}` : 'unknown'
        return `- ${t.name} (ID: ${t.id}) in ${parent}`
      })
      return `Retrieved ${threads.length} active threads:\n${lines.join('\n')}`
    },
  },
]
