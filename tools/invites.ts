import { client, fetchGuild, fetchTextChannel } from '../client.js'
import type { ToolDef } from './_types.js'

export const inviteTools: ToolDef[] = [
  {
    name: 'create_invite',
    description: 'Create an invite link for a channel',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        channelId: { type: 'string', description: 'Channel ID' },
        maxAge: { type: 'number', description: 'Seconds until expiry (default 86400, 0 = never)' },
        maxUses: { type: 'number', description: 'Max uses (default 0 = unlimited)' },
        temporary: { type: 'boolean', description: 'Temporary membership' },
        unique: { type: 'boolean', description: 'Force unique invite' },
      },
      required: ['channelId'],
    },
    async handler(args) {
      const ch = await fetchTextChannel(args.channelId as string)
      if (!('createInvite' in ch)) throw new Error('Channel does not support invites')
      const inv = await (ch as any).createInvite({
        maxAge: args.maxAge as number ?? 86400,
        maxUses: args.maxUses as number ?? 0,
        temporary: args.temporary as boolean | undefined,
        unique: args.unique as boolean | undefined,
      })
      return `Created invite: https://discord.gg/${inv.code} (expires: ${inv.maxAge === 0 ? 'never' : `${inv.maxAge}s`}, max uses: ${inv.maxUses || 'unlimited'})`
    },
  },
  {
    name: 'list_invites',
    description: 'List all active invites',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
      },
      required: [],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const invites = await guild.invites.fetch()
      if (invites.size === 0) return 'No active invites'
      return [...invites.values()]
        .map(i => `- https://discord.gg/${i.code} (Channel: #${i.channel?.name ?? 'unknown'}, Uses: ${i.uses}/${i.maxUses || '∞'}, By: ${i.inviter?.username ?? 'unknown'})`)
        .join('\n')
    },
  },
  {
    name: 'delete_invite',
    description: 'Delete an invite',
    inputSchema: {
      type: 'object',
      properties: {
        inviteCode: { type: 'string', description: 'Invite code or full URL' },
      },
      required: ['inviteCode'],
    },
    async handler(args) {
      let code = args.inviteCode as string
      // Handle full URL format
      code = code.replace(/^https?:\/\/discord\.gg\//, '')
      const invite = await client.fetchInvite(code)
      await invite.delete()
      return `Invite ${code} deleted`
    },
  },
  {
    name: 'get_invite_details',
    description: 'Get detailed invite information',
    inputSchema: {
      type: 'object',
      properties: {
        inviteCode: { type: 'string', description: 'Invite code or full URL' },
        withCounts: { type: 'boolean', description: 'Include member counts (default true)' },
      },
      required: ['inviteCode'],
    },
    async handler(args) {
      let code = args.inviteCode as string
      code = code.replace(/^https?:\/\/discord\.gg\//, '')
      const inv = await client.fetchInvite(code, { withCounts: args.withCounts !== false })
      const lines = [
        `Code: ${inv.code}`,
        `URL: https://discord.gg/${inv.code}`,
        `Channel: #${inv.channel?.name ?? 'unknown'} (${inv.channelId})`,
        `Server: ${inv.guild?.name ?? 'unknown'}`,
        `Creator: ${inv.inviter?.username ?? 'unknown'}`,
        `Uses: ${inv.uses ?? 'unknown'}`,
        `Max Uses: ${inv.maxUses || 'unlimited'}`,
        `Max Age: ${inv.maxAge === 0 ? 'never' : `${inv.maxAge}s`}`,
        `Temporary: ${inv.temporary}`,
      ]
      if (inv.memberCount !== undefined) lines.push(`Members: ${inv.memberCount}`)
      if (inv.presenceCount !== undefined) lines.push(`Online: ${inv.presenceCount}`)
      return lines.join('\n')
    },
  },
]
