import { PermissionsBitField } from 'discord.js'
import { fetchGuild } from '../client.js'
import type { ToolDef } from './_types.js'

function parsePerms(raw?: string, named?: string): bigint | undefined {
  if (raw) return BigInt(raw)
  if (named) {
    const flags = named.split(',').map(s => s.trim())
    let bits = 0n
    for (const f of flags) {
      const val = (PermissionsBitField.Flags as any)[f]
      if (val) bits |= val
    }
    return bits
  }
  return undefined
}

export const permissionTools: ToolDef[] = [
  {
    name: 'list_channel_permission_overwrites',
    description: 'List permission overwrites for a channel',
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
      const overwrites = ch.permissionOverwrites?.cache
      if (!overwrites || overwrites.size === 0) return 'No permission overwrites'
      return [...overwrites.values()]
        .map(o => `- ${o.type === 0 ? 'Role' : 'Member'} ${o.id}\n  Allow: ${o.allow.toArray().join(', ') || 'none'}\n  Deny: ${o.deny.toArray().join(', ') || 'none'}`)
        .join('\n')
    },
  },
  {
    name: 'upsert_role_channel_permissions',
    description: 'Create or update role permission overwrite on a channel',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        channelId: { type: 'string', description: 'Channel ID' },
        roleId: { type: 'string', description: 'Role ID' },
        allowRaw: { type: 'string', description: 'Allow permission bitfield' },
        denyRaw: { type: 'string', description: 'Deny permission bitfield' },
        allowPermissions: { type: 'string', description: 'Comma-separated permission names to allow' },
        denyPermissions: { type: 'string', description: 'Comma-separated permission names to deny' },
        reason: { type: 'string', description: 'Audit log reason' },
      },
      required: ['channelId', 'roleId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.fetch(args.channelId as string)
      if (!ch) throw new Error('Channel not found')
      const allow = parsePerms(args.allowRaw as string, args.allowPermissions as string)
      const deny = parsePerms(args.denyRaw as string, args.denyPermissions as string)
      await ch.permissionOverwrites.edit(args.roleId as string, {
        ...(allow !== undefined ? Object.fromEntries(new PermissionsBitField(allow).toArray().map(p => [p, true])) : {}),
        ...(deny !== undefined ? Object.fromEntries(new PermissionsBitField(deny).toArray().map(p => [p, false])) : {}),
      }, { reason: args.reason as string | undefined, type: 0 })
      return `Role permissions updated for channel ${args.channelId}`
    },
  },
  {
    name: 'upsert_member_channel_permissions',
    description: 'Create or update member permission overwrite on a channel',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        channelId: { type: 'string', description: 'Channel ID' },
        userId: { type: 'string', description: 'User ID' },
        allowRaw: { type: 'string', description: 'Allow permission bitfield' },
        denyRaw: { type: 'string', description: 'Deny permission bitfield' },
        allowPermissions: { type: 'string', description: 'Comma-separated permission names to allow' },
        denyPermissions: { type: 'string', description: 'Comma-separated permission names to deny' },
        reason: { type: 'string', description: 'Audit log reason' },
      },
      required: ['channelId', 'userId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.fetch(args.channelId as string)
      if (!ch) throw new Error('Channel not found')
      const allow = parsePerms(args.allowRaw as string, args.allowPermissions as string)
      const deny = parsePerms(args.denyRaw as string, args.denyPermissions as string)
      await ch.permissionOverwrites.edit(args.userId as string, {
        ...(allow !== undefined ? Object.fromEntries(new PermissionsBitField(allow).toArray().map(p => [p, true])) : {}),
        ...(deny !== undefined ? Object.fromEntries(new PermissionsBitField(deny).toArray().map(p => [p, false])) : {}),
      }, { reason: args.reason as string | undefined, type: 1 })
      return `Member permissions updated for channel ${args.channelId}`
    },
  },
  {
    name: 'delete_channel_permission_overwrite',
    description: 'Delete a permission overwrite from a channel',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        channelId: { type: 'string', description: 'Channel ID' },
        targetType: { type: 'string', description: '"role" or "member"' },
        targetId: { type: 'string', description: 'Role or User ID' },
        reason: { type: 'string', description: 'Audit log reason' },
      },
      required: ['channelId', 'targetType', 'targetId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const ch = await guild.channels.fetch(args.channelId as string)
      if (!ch) throw new Error('Channel not found')
      await ch.permissionOverwrites.delete(args.targetId as string, args.reason as string | undefined)
      return `Permission overwrite deleted for ${args.targetType} ${args.targetId}`
    },
  },
]
