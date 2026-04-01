import { fetchTextChannel } from '../client.js'
import { type ToolDef, chunk, fmtMsg } from './_types.js'

export const messageTools: ToolDef[] = [
  {
    name: 'read_messages',
    description: 'Read recent message history from a specific channel',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Discord channel ID' },
        count: { type: 'string', description: 'Number of messages to retrieve' },
        after: { type: 'string', description: 'Only return messages after this message ID (for incremental reads)' },
        before: { type: 'string', description: 'Only return messages before this message ID' },
      },
      required: ['channelId'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)
      const limit = Math.min(parseInt(String(args.count || '100'), 10) || 100, 100)
      const fetchOpts: Record<string, unknown> = { limit }
      if (args.after) fetchOpts.after = args.after as string
      if (args.before) fetchOpts.before = args.before as string
      const msgs = await ch.messages.fetch(fetchOpts)
      const arr = [...msgs.values()].reverse()
      if (arr.length === 0) return '**Retrieved 0 messages:** \n'
      const lines = arr.map(m => fmtMsg(m))
      return `**Retrieved ${arr.length} messages:** \n${lines.join('\n')}`
    },
  },
  {
    name: 'send_message',
    description: 'Send a message to a Discord channel. Auto-splits messages over 2000 characters. Supports file attachments (absolute paths).',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Discord channel ID' },
        message: { type: 'string', description: 'Message content' },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Absolute file paths to attach (images, PDFs, etc). Max 10 files, 25MB each.',
        },
      },
      required: ['channelId', 'message'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)
      if (!('send' in ch)) throw new Error('Channel is not sendable')
      const files = (args.files as string[] | undefined) ?? []
      const chunks = chunk(args.message as string)
      const ids: string[] = []
      for (let i = 0; i < chunks.length; i++) {
        const sent = await ch.send({
          content: chunks[i],
          ...(i === 0 && files.length > 0 ? { files } : {}),
        })
        ids.push(sent.id)
      }
      return ids.length === 1
        ? `Message sent (ID: ${ids[0]})`
        : `Message sent in ${ids.length} parts (IDs: ${ids.join(', ')})`
    },
  },
  {
    name: 'edit_message',
    description: 'Edit an existing message in a Discord channel',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Discord channel ID' },
        messageId: { type: 'string', description: 'Message ID to edit' },
        newMessage: { type: 'string', description: 'New message content' },
      },
      required: ['channelId', 'messageId', 'newMessage'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)
      const msg = await ch.messages.fetch(args.messageId as string)
      await msg.edit(args.newMessage as string)
      return `Message ${args.messageId} edited`
    },
  },
  {
    name: 'delete_message',
    description: 'Delete a message from a Discord channel',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Discord channel ID' },
        messageId: { type: 'string', description: 'Message ID to delete' },
      },
      required: ['channelId', 'messageId'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)
      const msg = await ch.messages.fetch(args.messageId as string)
      await msg.delete()
      return `Message ${args.messageId} deleted`
    },
  },
  {
    name: 'add_reaction',
    description: 'Add an emoji reaction to a message',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Discord channel ID' },
        messageId: { type: 'string', description: 'Message ID' },
        emoji: { type: 'string', description: 'Emoji to react with (Unicode or custom <:name:id>)' },
      },
      required: ['channelId', 'messageId', 'emoji'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)
      const msg = await ch.messages.fetch(args.messageId as string)
      await msg.react(args.emoji as string)
      return `Reaction ${args.emoji} added to message ${args.messageId}`
    },
  },
  {
    name: 'remove_reaction',
    description: 'Remove an emoji reaction from a message',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Discord channel ID' },
        messageId: { type: 'string', description: 'Message ID' },
        emoji: { type: 'string', description: 'Emoji to remove' },
      },
      required: ['channelId', 'messageId', 'emoji'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)
      const msg = await ch.messages.fetch(args.messageId as string)
      const reaction = msg.reactions.cache.find(r => r.emoji.name === args.emoji || r.emoji.toString() === args.emoji)
      if (reaction) await reaction.users.remove()
      return `Reaction removed from message ${args.messageId}`
    },
  },
  {
    name: 'get_attachment',
    description: 'Get attachment metadata from a Discord message',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Discord channel ID' },
        messageId: { type: 'string', description: 'Message ID' },
        attachmentId: { type: 'string', description: 'Specific attachment ID (optional)' },
      },
      required: ['channelId', 'messageId'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)
      const msg = await ch.messages.fetch(args.messageId as string)
      if (msg.attachments.size === 0) return 'No attachments on this message'
      const atts = args.attachmentId
        ? [msg.attachments.get(args.attachmentId as string)].filter(Boolean)
        : [...msg.attachments.values()]
      return atts
        .map(a => `- ${a!.name} (${a!.contentType ?? 'unknown'}, ${(a!.size / 1024).toFixed(0)}KB)\n  URL: ${a!.url}`)
        .join('\n')
    },
  },
]
