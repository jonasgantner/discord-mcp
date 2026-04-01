import { ChannelType } from 'discord.js'
import { fetchGuild } from '../client.js'
import type { ToolDef } from './_types.js'

export const channelTools: ToolDef[] = [
  {
    name: 'create_text_channel',
    description: 'Create a new text channel',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        name: { type: 'string', description: 'Channel name' },
        categoryId: { type: 'string', description: 'Parent category ID' },
        topic: { type: 'string', description: 'Channel topic' },
        nsfw: { type: 'boolean', description: 'NSFW flag' },
        slowmode: { type: 'number', description: 'Slowmode in seconds' },
        position: { type: 'number', description: 'Channel position' },
      },
      required: ['name'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.create({
        name: args.name as string,
        type: ChannelType.GuildText,
        parent: args.categoryId as string | undefined,
        topic: args.topic as string | undefined,
        nsfw: args.nsfw as boolean | undefined,
        rateLimitPerUser: args.slowmode as number | undefined,
        position: args.position as number | undefined,
      })
      return `Created text channel #${ch.name} (ID: ${ch.id})`
    },
  },
  {
    name: 'edit_text_channel',
    description: 'Edit a text channel',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        channelId: { type: 'string', description: 'Channel ID' },
        name: { type: 'string', description: 'New name' },
        topic: { type: 'string', description: 'New topic' },
        nsfw: { type: 'boolean', description: 'NSFW flag' },
        slowmode: { type: 'number', description: 'Slowmode in seconds' },
        categoryId: { type: 'string', description: 'New parent category ID' },
        position: { type: 'number', description: 'New position' },
        reason: { type: 'string', description: 'Audit log reason' },
      },
      required: ['channelId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.fetch(args.channelId as string)
      if (!ch || !ch.isTextBased()) throw new Error('Channel not found or not text-based')
      const opts: Record<string, unknown> = {}
      if (args.name) opts.name = args.name
      if (args.topic !== undefined) opts.topic = args.topic
      if (args.nsfw !== undefined) opts.nsfw = args.nsfw
      if (args.slowmode !== undefined) opts.rateLimitPerUser = args.slowmode
      if (args.categoryId !== undefined) opts.parent = args.categoryId
      if (args.position !== undefined) opts.position = args.position
      if (args.reason) opts.reason = args.reason
      await ch.edit(opts)
      return `Channel ${args.channelId} updated`
    },
  },
  {
    name: 'delete_channel',
    description: 'Delete a channel',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        channelId: { type: 'string', description: 'Channel ID' },
        reason: { type: 'string', description: 'Audit log reason' },
      },
      required: ['channelId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.fetch(args.channelId as string)
      if (!ch) throw new Error('Channel not found')
      await ch.delete(args.reason as string | undefined)
      return `Channel ${args.channelId} deleted`
    },
  },
  {
    name: 'find_channel',
    description: 'Find a channel by name',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        channelName: { type: 'string', description: 'Channel name to search for' },
      },
      required: ['channelName'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const channels = await guild.channels.fetch()
      const name = (args.channelName as string).toLowerCase()
      const matches = channels.filter(c => c !== null && c.name.toLowerCase().includes(name))
      if (matches.size === 0) return `No channels found matching "${args.channelName}"`
      return matches
        .map(c => `- #${c!.name} (ID: ${c!.id}, Type: ${ChannelType[c!.type]})`)
        .join('\n')
    },
  },
  {
    name: 'list_channels',
    description: 'List all channels in the server',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
      },
      required: [],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const channels = await guild.channels.fetch()
      const sorted = [...channels.values()].filter(Boolean).sort((a, b) => (a!.rawPosition ?? 0) - (b!.rawPosition ?? 0))
      return sorted
        .map(c => {
          const parent = c!.parentId ? ` (in category ${c!.parentId})` : ''
          return `- #${c!.name} (ID: ${c!.id}, Type: ${ChannelType[c!.type]}${parent})`
        })
        .join('\n')
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get detailed channel information',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        channelId: { type: 'string', description: 'Channel ID' },
      },
      required: ['channelId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.fetch(args.channelId as string)
      if (!ch) throw new Error('Channel not found')
      const lines = [
        `Name: #${ch.name}`,
        `ID: ${ch.id}`,
        `Type: ${ChannelType[ch.type]}`,
        `Position: ${ch.rawPosition}`,
        `Category: ${ch.parentId ?? 'none'}`,
        `Created: ${ch.createdAt?.toISOString() ?? 'unknown'}`,
      ]
      if ('topic' in ch && ch.topic) lines.push(`Topic: ${ch.topic}`)
      if ('nsfw' in ch) lines.push(`NSFW: ${ch.nsfw}`)
      if ('rateLimitPerUser' in ch) lines.push(`Slowmode: ${ch.rateLimitPerUser}s`)
      return lines.join('\n')
    },
  },
  {
    name: 'move_channel',
    description: 'Move a channel to a different category or position',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        channelId: { type: 'string', description: 'Channel ID' },
        categoryId: { type: 'string', description: 'New parent category ID' },
        position: { type: 'number', description: 'New position' },
        reason: { type: 'string', description: 'Audit log reason' },
      },
      required: ['channelId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.fetch(args.channelId as string)
      if (!ch) throw new Error('Channel not found')
      const opts: Record<string, unknown> = {}
      if (args.categoryId !== undefined) opts.parent = args.categoryId
      if (args.position !== undefined) opts.position = args.position
      if (args.reason) opts.reason = args.reason
      await ch.edit(opts)
      return `Channel ${args.channelId} moved`
    },
  },
]
