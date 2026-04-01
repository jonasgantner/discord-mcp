import { ChannelType } from 'discord.js'
import { fetchGuild } from '../client.js'
import type { ToolDef } from './_types.js'

export const categoryTools: ToolDef[] = [
  {
    name: 'create_category',
    description: 'Create a new channel category',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        name: { type: 'string', description: 'Category name' },
      },
      required: ['name'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const cat = await guild.channels.create({
        name: args.name as string,
        type: ChannelType.GuildCategory,
      })
      return `Created category "${cat.name}" (ID: ${cat.id})`
    },
  },
  {
    name: 'delete_category',
    description: 'Delete a channel category',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        categoryId: { type: 'string', description: 'Category ID' },
      },
      required: ['categoryId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.fetch(args.categoryId as string)
      if (!ch || ch.type !== ChannelType.GuildCategory) throw new Error('Category not found')
      await ch.delete()
      return `Category ${args.categoryId} deleted`
    },
  },
  {
    name: 'find_category',
    description: 'Find a category by name',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        categoryName: { type: 'string', description: 'Category name to search for' },
      },
      required: ['categoryName'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const channels = await guild.channels.fetch()
      const name = (args.categoryName as string).toLowerCase()
      const cats = channels.filter(c => c !== null && c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes(name))
      if (cats.size === 0) return `No categories found matching "${args.categoryName}"`
      return cats.map(c => `- ${c!.name} (ID: ${c!.id})`).join('\n')
    },
  },
  {
    name: 'list_channels_in_category',
    description: 'List all channels in a category',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        categoryId: { type: 'string', description: 'Category ID' },
      },
      required: ['categoryId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const channels = await guild.channels.fetch()
      const children = channels.filter(c => c !== null && c.parentId === (args.categoryId as string))
      if (children.size === 0) return 'No channels in this category'
      return children
        .map(c => `- #${c!.name} (ID: ${c!.id}, Type: ${ChannelType[c!.type]})`)
        .join('\n')
    },
  },
]
