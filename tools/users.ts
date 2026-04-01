import { client, fetchGuild } from '../client.js'
import { type ToolDef, chunk, fmtMsg } from './_types.js'

export const userTools: ToolDef[] = [
  {
    name: 'get_user_id_by_name',
    description: 'Get a user ID by their username',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Discord username' },
        guildId: { type: 'string', description: 'Discord server ID' },
      },
      required: ['username'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const members = await guild.members.fetch({ query: args.username as string, limit: 5 })
      if (members.size === 0) return `No user found with username "${args.username}"`
      return members
        .map(m => `- ${m.user.username} (ID: ${m.user.id}, Display: ${m.displayName})`)
        .join('\n')
    },
  },
  {
    name: 'send_private_message',
    description: 'Send a direct message to a user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Discord user ID' },
        message: { type: 'string', description: 'Message content' },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Absolute file paths to attach (images, PDFs, etc). Max 10 files, 25MB each.',
        },
      },
      required: ['userId', 'message'],
    },
    async handler(args) {
      const user = await client.users.fetch(args.userId as string)
      const files = (args.files as string[] | undefined) ?? []
      const chunks = chunk(args.message as string)
      const ids: string[] = []
      for (let i = 0; i < chunks.length; i++) {
        const sent = await user.send({
          content: chunks[i],
          ...(i === 0 && files.length > 0 ? { files } : {}),
        })
        ids.push(sent.id)
      }
      return ids.length === 1
        ? `DM sent to ${user.username} (ID: ${ids[0]})`
        : `DM sent in ${ids.length} parts to ${user.username}`
    },
  },
  {
    name: 'edit_private_message',
    description: 'Edit a direct message',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Discord user ID' },
        messageId: { type: 'string', description: 'Message ID to edit' },
        newMessage: { type: 'string', description: 'New message content' },
      },
      required: ['userId', 'messageId', 'newMessage'],
    },
    async handler(args) {
      const user = await client.users.fetch(args.userId as string)
      const dm = await user.createDM()
      const msg = await dm.messages.fetch(args.messageId as string)
      await msg.edit(args.newMessage as string)
      return `DM ${args.messageId} edited`
    },
  },
  {
    name: 'delete_private_message',
    description: 'Delete a direct message',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Discord user ID' },
        messageId: { type: 'string', description: 'Message ID to delete' },
      },
      required: ['userId', 'messageId'],
    },
    async handler(args) {
      const user = await client.users.fetch(args.userId as string)
      const dm = await user.createDM()
      const msg = await dm.messages.fetch(args.messageId as string)
      await msg.delete()
      return `DM ${args.messageId} deleted`
    },
  },
  {
    name: 'read_private_messages',
    description: 'Read recent message history from a specific user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Discord user ID' },
        count: { type: 'string', description: 'Number of messages to retrieve' },
      },
      required: ['userId'],
    },
    async handler(args) {
      const user = await client.users.fetch(args.userId as string)
      const dm = await user.createDM()
      const limit = Math.min(parseInt(String(args.count || '50'), 10) || 50, 100)
      const msgs = await dm.messages.fetch({ limit })
      const arr = [...msgs.values()].reverse()
      if (arr.length === 0) return '**Retrieved 0 messages:** \n'
      const lines = arr.map(m => fmtMsg(m))
      return `**Retrieved ${arr.length} messages:** \n${lines.join('\n')}`
    },
  },
]
