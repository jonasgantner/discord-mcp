import { fetchGuild, fetchMember } from '../client.js'
import type { ToolDef } from './_types.js'

export const moderationTools: ToolDef[] = [
  {
    name: 'kick_member',
    description: 'Kick a member from the server',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
        reason: { type: 'string', description: 'Kick reason' },
      },
      required: ['userId'],
    },
    async handler(args) {
      const member = await fetchMember(args.guildId as string | undefined, args.userId as string)
      await member.kick(args.reason as string | undefined)
      return `${member.user.username} kicked`
    },
  },
  {
    name: 'ban_member',
    description: 'Ban a member from the server',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
        deleteMessageSeconds: { type: 'number', description: 'Delete message history (0-604800 seconds)' },
        reason: { type: 'string', description: 'Ban reason' },
      },
      required: ['userId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      await guild.members.ban(args.userId as string, {
        deleteMessageSeconds: args.deleteMessageSeconds as number | undefined,
        reason: args.reason as string | undefined,
      })
      return `User ${args.userId} banned`
    },
  },
  {
    name: 'unban_member',
    description: 'Unban a user from the server',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
        reason: { type: 'string', description: 'Unban reason' },
      },
      required: ['userId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      await guild.members.unban(args.userId as string, args.reason as string | undefined)
      return `User ${args.userId} unbanned`
    },
  },
  {
    name: 'timeout_member',
    description: 'Timeout (mute) a member',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
        durationSeconds: { type: 'number', description: 'Timeout duration (1-2419200 seconds)' },
        reason: { type: 'string', description: 'Timeout reason' },
      },
      required: ['userId', 'durationSeconds'],
    },
    async handler(args) {
      const member = await fetchMember(args.guildId as string | undefined, args.userId as string)
      const ms = (args.durationSeconds as number) * 1000
      await member.timeout(ms, args.reason as string | undefined)
      return `${member.user.username} timed out for ${args.durationSeconds}s`
    },
  },
  {
    name: 'remove_timeout',
    description: 'Remove a timeout from a member',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
        reason: { type: 'string', description: 'Reason' },
      },
      required: ['userId'],
    },
    async handler(args) {
      const member = await fetchMember(args.guildId as string | undefined, args.userId as string)
      await member.timeout(null, args.reason as string | undefined)
      return `Timeout removed from ${member.user.username}`
    },
  },
  {
    name: 'set_nickname',
    description: 'Set or remove a member nickname',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
        nick: { type: 'string', description: 'New nickname (empty to reset)' },
        reason: { type: 'string', description: 'Reason' },
      },
      required: ['userId'],
    },
    async handler(args) {
      const member = await fetchMember(args.guildId as string | undefined, args.userId as string)
      const nick = (args.nick as string | undefined) || null
      await member.setNickname(nick, args.reason as string | undefined)
      return nick ? `Nickname set to "${nick}" for ${member.user.username}` : `Nickname reset for ${member.user.username}`
    },
  },
  {
    name: 'get_bans',
    description: 'List banned users',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        limit: { type: 'number', description: 'Max results (default 50)' },
      },
      required: [],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const bans = await guild.bans.fetch({ limit: (args.limit as number) || 50 })
      if (bans.size === 0) return 'No bans found'
      return bans
        .map(b => `- ${b.user.username} (ID: ${b.user.id})${b.reason ? ` - ${b.reason}` : ''}`)
        .join('\n')
    },
  },
]
