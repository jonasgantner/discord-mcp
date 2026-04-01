import { ChannelType } from 'discord.js'
import { fetchGuild, fetchTextChannel } from '../client.js'
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
  {
    name: 'create_thread',
    description: 'Create a new thread on a message or as a standalone thread in a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Parent channel ID' },
        name: { type: 'string', description: 'Thread name' },
        messageId: { type: 'string', description: 'Message ID to start thread from (optional, omit for standalone thread)' },
        autoArchiveDuration: { type: 'number', description: 'Auto-archive after minutes of inactivity: 60, 1440, 4320, or 10080' },
      },
      required: ['channelId', 'name'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)

      if (args.messageId) {
        // Thread on a specific message
        const msg = await ch.messages.fetch(args.messageId as string)
        const thread = await msg.startThread({
          name: args.name as string,
          autoArchiveDuration: (args.autoArchiveDuration as number | undefined) ?? 1440,
        })
        return `Created thread "${thread.name}" (ID: ${thread.id}) on message ${args.messageId}`
      }

      // Standalone thread in channel
      if (!('threads' in ch)) throw new Error('Channel does not support threads')
      const thread = await (ch as any).threads.create({
        name: args.name as string,
        autoArchiveDuration: (args.autoArchiveDuration as number | undefined) ?? 1440,
        type: ChannelType.PublicThread,
      })
      return `Created thread "${thread.name}" (ID: ${thread.id}) in #${ch.name ?? args.channelId}`
    },
  },
  {
    name: 'archive_thread',
    description: 'Archive (close) a thread. Archived threads can be unarchived later.',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID' },
        locked: { type: 'boolean', description: 'Lock the thread (prevents unarchiving by non-moderators)' },
      },
      required: ['threadId'],
    },
    async handler(args) {
      const thread = await fetchTextChannel(args.threadId as string)
      if (!thread.isThread()) throw new Error('Not a thread')
      if (args.locked) await thread.setLocked(true)
      await thread.setArchived(true)
      return `Thread ${args.threadId} archived${args.locked ? ' and locked' : ''}`
    },
  },
  {
    name: 'unarchive_thread',
    description: 'Unarchive (reopen) a thread',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID' },
      },
      required: ['threadId'],
    },
    async handler(args) {
      const thread = await fetchTextChannel(args.threadId as string)
      if (!thread.isThread()) throw new Error('Not a thread')
      if (thread.locked) await thread.setLocked(false)
      await thread.setArchived(false)
      return `Thread ${args.threadId} unarchived`
    },
  },
  {
    name: 'join_thread',
    description: 'Make the bot join a thread',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID' },
      },
      required: ['threadId'],
    },
    async handler(args) {
      const thread = await fetchTextChannel(args.threadId as string)
      if (!thread.isThread()) throw new Error('Not a thread')
      await thread.join()
      return `Joined thread ${args.threadId}`
    },
  },
  {
    name: 'leave_thread',
    description: 'Make the bot leave a thread',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID' },
      },
      required: ['threadId'],
    },
    async handler(args) {
      const thread = await fetchTextChannel(args.threadId as string)
      if (!thread.isThread()) throw new Error('Not a thread')
      await thread.leave()
      return `Left thread ${args.threadId}`
    },
  },
  {
    name: 'add_thread_member',
    description: 'Add a user to a thread',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID' },
        userId: { type: 'string', description: 'User ID to add' },
      },
      required: ['threadId', 'userId'],
    },
    async handler(args) {
      const thread = await fetchTextChannel(args.threadId as string)
      if (!thread.isThread()) throw new Error('Not a thread')
      await thread.members.add(args.userId as string)
      return `Added user ${args.userId} to thread ${args.threadId}`
    },
  },
  {
    name: 'remove_thread_member',
    description: 'Remove a user from a thread',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID' },
        userId: { type: 'string', description: 'User ID to remove' },
      },
      required: ['threadId', 'userId'],
    },
    async handler(args) {
      const thread = await fetchTextChannel(args.threadId as string)
      if (!thread.isThread()) throw new Error('Not a thread')
      await thread.members.remove(args.userId as string)
      return `Removed user ${args.userId} from thread ${args.threadId}`
    },
  },
  {
    name: 'get_thread_info',
    description: 'Get detailed thread information',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Thread ID' },
      },
      required: ['threadId'],
    },
    async handler(args) {
      const thread = await fetchTextChannel(args.threadId as string)
      if (!thread.isThread()) throw new Error('Not a thread')
      const members = await thread.members.fetch()
      return [
        `Name: ${thread.name}`,
        `ID: ${thread.id}`,
        `Parent: #${thread.parent?.name ?? 'unknown'} (${thread.parentId})`,
        `Created: ${thread.createdAt?.toISOString() ?? 'unknown'}`,
        `Archived: ${thread.archived}`,
        `Locked: ${thread.locked}`,
        `Auto-archive: ${thread.autoArchiveDuration} minutes`,
        `Members: ${members.size}`,
        `Message count: ${thread.messageCount ?? 'unknown'}`,
      ].join('\n')
    },
  },
]
