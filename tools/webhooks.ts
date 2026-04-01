import { fetchTextChannel } from '../client.js'
import { type ToolDef, chunk } from './_types.js'

export const webhookTools: ToolDef[] = [
  {
    name: 'create_webhook',
    description: 'Create a webhook on a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Channel ID' },
        name: { type: 'string', description: 'Webhook name' },
      },
      required: ['channelId', 'name'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)
      if (!('createWebhook' in ch)) throw new Error('Channel does not support webhooks')
      const wh = await (ch as any).createWebhook({ name: args.name as string })
      return `Created webhook "${wh.name}" (ID: ${wh.id})\nURL: ${wh.url}`
    },
  },
  {
    name: 'delete_webhook',
    description: 'Delete a webhook',
    inputSchema: {
      type: 'object',
      properties: {
        webhookId: { type: 'string', description: 'Webhook ID' },
      },
      required: ['webhookId'],
    },
    async handler(args) {
      const { client } = await import('../client.js')
      const wh = await client.fetchWebhook(args.webhookId as string)
      await wh.delete()
      return `Webhook ${args.webhookId} deleted`
    },
  },
  {
    name: 'list_webhooks',
    description: 'List webhooks on a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Channel ID' },
      },
      required: ['channelId'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)
      if (!('fetchWebhooks' in ch)) throw new Error('Channel does not support webhooks')
      const hooks = await (ch as any).fetchWebhooks()
      if (hooks.size === 0) return 'No webhooks found'
      return [...hooks.values()]
        .map((wh: any) => `- ${wh.name} (ID: ${wh.id})\n  URL: ${wh.url}`)
        .join('\n')
    },
  },
  {
    name: 'send_webhook_message',
    description: 'Send a message via webhook',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', description: 'Webhook URL' },
        message: { type: 'string', description: 'Message content' },
      },
      required: ['webhookUrl', 'message'],
    },
    async handler(args) {
      const { WebhookClient } = await import('discord.js')
      const wh = new WebhookClient({ url: args.webhookUrl as string })
      try {
        const chunks = chunk(args.message as string)
        for (const c of chunks) {
          await wh.send(c)
        }
        return `Webhook message sent (${chunks.length} part${chunks.length > 1 ? 's' : ''})`
      } finally {
        wh.destroy()
      }
    },
  },
]
