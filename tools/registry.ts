import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import type { ToolDef } from './_types.js'

import { messageTools } from './messages.js'
import { threadTools } from './threads.js'
import { userTools } from './users.js'
import { channelTools } from './channels.js'
import { categoryTools } from './categories.js'
import { roleTools } from './roles.js'
import { moderationTools } from './moderation.js'
import { voiceTools } from './voice.js'
import { webhookTools } from './webhooks.js'
import { eventTools } from './events.js'
import { permissionTools } from './permissions.js'
import { inviteTools } from './invites.js'
import { emojiTools } from './emojis.js'
import { serverInfoTools } from './server-info.js'

const allTools: ToolDef[] = [
  ...messageTools,
  ...threadTools,
  ...userTools,
  ...channelTools,
  ...categoryTools,
  ...roleTools,
  ...moderationTools,
  ...voiceTools,
  ...webhookTools,
  ...eventTools,
  ...permissionTools,
  ...inviteTools,
  ...emojiTools,
  ...serverInfoTools,
]

const toolMap = new Map<string, ToolDef>()
for (const t of allTools) toolMap.set(t.name, t)

export function registerTools(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }))

  server.setRequestHandler(CallToolRequestSchema, async req => {
    const tool = toolMap.get(req.params.name)
    if (!tool) {
      return { content: [{ type: 'text', text: `Unknown tool: ${req.params.name}` }], isError: true }
    }
    try {
      const args = (req.params.arguments ?? {}) as Record<string, unknown>
      const text = await tool.handler(args)
      return { content: [{ type: 'text', text }] }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true }
    }
  })
}

export { allTools }
