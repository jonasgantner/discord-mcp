import { ChannelType } from 'discord.js'
import { fetchGuild } from '../client.js'
import type { ToolDef } from './_types.js'

export const serverInfoTools: ToolDef[] = [
  {
    name: 'get_server_info',
    description: 'Get detailed Discord server information',
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
      const textCount = channels.filter(c => c !== null && c.type === ChannelType.GuildText).size
      const voiceCount = channels.filter(c => c !== null && c.type === ChannelType.GuildVoice).size
      const catCount = channels.filter(c => c !== null && c.type === ChannelType.GuildCategory).size
      const owner = await guild.fetchOwner()
      return [
        `Name: ${guild.name}`,
        `ID: ${guild.id}`,
        `Owner: ${owner.user.username} (${owner.id})`,
        `Members: ${guild.memberCount}`,
        `Created: ${guild.createdAt.toISOString()}`,
        `Channels: ${textCount} text, ${voiceCount} voice, ${catCount} categories`,
        `Boost Level: ${guild.premiumTier}`,
        `Boosts: ${guild.premiumSubscriptionCount ?? 0}`,
        `Icon: ${guild.iconURL() ?? 'none'}`,
      ].join('\n')
    },
  },
]
