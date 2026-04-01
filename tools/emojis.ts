import { fetchGuild } from '../client.js'
import type { ToolDef } from './_types.js'

export const emojiTools: ToolDef[] = [
  {
    name: 'list_emojis',
    description: 'List all custom emojis on the server',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
      },
      required: [],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const emojis = await guild.emojis.fetch()
      if (emojis.size === 0) return 'No custom emojis'
      return [...emojis.values()]
        .map(e => `- ${e.name} (ID: ${e.id}, Animated: ${e.animated})`)
        .join('\n')
    },
  },
  {
    name: 'get_emoji_details',
    description: 'Get detailed emoji information',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        emojiId: { type: 'string', description: 'Emoji ID' },
      },
      required: ['emojiId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const emoji = await guild.emojis.fetch(args.emojiId as string)
      return [
        `Name: ${emoji.name}`,
        `ID: ${emoji.id}`,
        `Animated: ${emoji.animated}`,
        `Managed: ${emoji.managed}`,
        `URL: ${emoji.url}`,
        `Created: ${emoji.createdAt?.toISOString()}`,
        `Roles: ${emoji.roles.cache.size > 0 ? emoji.roles.cache.map(r => r.name).join(', ') : 'all'}`,
      ].join('\n')
    },
  },
  {
    name: 'create_emoji',
    description: 'Upload a custom emoji',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        name: { type: 'string', description: 'Emoji name (2-32 chars, alphanumeric + underscores)' },
        image: { type: 'string', description: 'Base64 data URI or raw base64' },
        imageUrl: { type: 'string', description: 'Direct image URL' },
        roles: { type: 'string', description: 'Comma-separated role IDs to restrict to' },
      },
      required: ['name'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      let attachment: string
      if (args.image) {
        attachment = args.image as string
      } else if (args.imageUrl) {
        attachment = args.imageUrl as string
      } else {
        throw new Error('Either image (base64) or imageUrl is required')
      }
      const opts: any = { name: args.name as string, attachment }
      if (args.roles) opts.roles = (args.roles as string).split(',').map(s => s.trim())
      const emoji = await guild.emojis.create(opts)
      return `Created emoji :${emoji.name}: (ID: ${emoji.id})`
    },
  },
  {
    name: 'edit_emoji',
    description: 'Edit a custom emoji',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        emojiId: { type: 'string', description: 'Emoji ID' },
        name: { type: 'string', description: 'New name' },
        roles: { type: 'string', description: 'Comma-separated role IDs (empty = unrestrict)' },
      },
      required: ['emojiId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const emoji = await guild.emojis.fetch(args.emojiId as string)
      const opts: any = {}
      if (args.name) opts.name = args.name
      if (args.roles !== undefined) {
        opts.roles = (args.roles as string) ? (args.roles as string).split(',').map(s => s.trim()) : []
      }
      await emoji.edit(opts)
      return `Emoji ${args.emojiId} updated`
    },
  },
  {
    name: 'delete_emoji',
    description: 'Delete a custom emoji',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        emojiId: { type: 'string', description: 'Emoji ID' },
      },
      required: ['emojiId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const emoji = await guild.emojis.fetch(args.emojiId as string)
      await emoji.delete()
      return `Emoji ${args.emojiId} deleted`
    },
  },
]
