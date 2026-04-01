import { ChannelType } from 'discord.js'
import { fetchGuild, fetchMember } from '../client.js'
import type { ToolDef } from './_types.js'

export const voiceTools: ToolDef[] = [
  {
    name: 'create_voice_channel',
    description: 'Create a new voice channel',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        name: { type: 'string', description: 'Channel name' },
        categoryId: { type: 'string', description: 'Parent category ID' },
        userLimit: { type: 'number', description: 'Max users (0 = unlimited)' },
        bitrate: { type: 'number', description: 'Bitrate in bps' },
      },
      required: ['name'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.create({
        name: args.name as string,
        type: ChannelType.GuildVoice,
        parent: args.categoryId as string | undefined,
        userLimit: args.userLimit as number | undefined,
        bitrate: args.bitrate as number | undefined,
      })
      return `Created voice channel "${ch.name}" (ID: ${ch.id})`
    },
  },
  {
    name: 'create_stage_channel',
    description: 'Create a new stage channel',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        name: { type: 'string', description: 'Channel name' },
        categoryId: { type: 'string', description: 'Parent category ID' },
        bitrate: { type: 'number', description: 'Bitrate in bps' },
      },
      required: ['name'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.create({
        name: args.name as string,
        type: ChannelType.GuildStageVoice,
        parent: args.categoryId as string | undefined,
        bitrate: args.bitrate as number | undefined,
      })
      return `Created stage channel "${ch.name}" (ID: ${ch.id})`
    },
  },
  {
    name: 'edit_voice_channel',
    description: 'Edit a voice or stage channel',
    inputSchema: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Channel ID' },
        name: { type: 'string', description: 'New name' },
        bitrate: { type: 'number', description: 'New bitrate' },
        userLimit: { type: 'number', description: 'New user limit' },
        rtcRegion: { type: 'string', description: 'Voice region' },
      },
      required: ['channelId'],
    },
    async handler(args) {
      const guild = await fetchGuild()
      const ch = await guild.channels.fetch(args.channelId as string)
      if (!ch || !ch.isVoiceBased()) throw new Error('Voice channel not found')
      const opts: Record<string, unknown> = {}
      if (args.name) opts.name = args.name
      if (args.bitrate !== undefined) opts.bitrate = args.bitrate
      if (args.userLimit !== undefined) opts.userLimit = args.userLimit
      if (args.rtcRegion !== undefined) opts.rtcRegion = args.rtcRegion || null
      await ch.edit(opts)
      return `Voice channel ${args.channelId} updated`
    },
  },
  {
    name: 'move_member',
    description: 'Move a member to a different voice channel',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
        channelId: { type: 'string', description: 'Target voice channel ID' },
      },
      required: ['userId', 'channelId'],
    },
    async handler(args) {
      const member = await fetchMember(args.guildId as string | undefined, args.userId as string)
      await member.voice.setChannel(args.channelId as string)
      return `Moved ${member.user.username} to channel ${args.channelId}`
    },
  },
  {
    name: 'disconnect_member',
    description: 'Disconnect a member from voice',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
      },
      required: ['userId'],
    },
    async handler(args) {
      const member = await fetchMember(args.guildId as string | undefined, args.userId as string)
      await member.voice.disconnect()
      return `Disconnected ${member.user.username} from voice`
    },
  },
  {
    name: 'modify_voice_state',
    description: 'Server mute or deafen a member',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
        mute: { type: 'boolean', description: 'Server mute' },
        deafen: { type: 'boolean', description: 'Server deafen' },
      },
      required: ['userId'],
    },
    async handler(args) {
      const member = await fetchMember(args.guildId as string | undefined, args.userId as string)
      if (args.mute !== undefined) await member.voice.setMute(args.mute as boolean)
      if (args.deafen !== undefined) await member.voice.setDeaf(args.deafen as boolean)
      return `Voice state updated for ${member.user.username}`
    },
  },
]
