import { fetchGuild, fetchMember } from '../client.js'
import type { ToolDef } from './_types.js'

export const roleTools: ToolDef[] = [
  {
    name: 'list_roles',
    description: 'List all roles in the server',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
      },
      required: [],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const roles = await guild.roles.fetch()
      return [...roles.values()]
        .sort((a, b) => b.position - a.position)
        .map(r => `- ${r.name} (ID: ${r.id}, Color: ${r.hexColor}, Position: ${r.position}, Members: ${r.members.size})`)
        .join('\n')
    },
  },
  {
    name: 'create_role',
    description: 'Create a new role',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        name: { type: 'string', description: 'Role name' },
        color: { type: 'string', description: 'Hex color (e.g. #FF0000)' },
        hoist: { type: 'boolean', description: 'Show separately in member list' },
        mentionable: { type: 'boolean', description: 'Allow anyone to mention' },
        permissions: { type: 'string', description: 'Permission bitfield string' },
      },
      required: ['name'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const role = await guild.roles.create({
        name: args.name as string,
        color: (args.color as string | undefined) ?? undefined,
        hoist: args.hoist as boolean | undefined,
        mentionable: args.mentionable as boolean | undefined,
        permissions: args.permissions ? BigInt(args.permissions as string) : undefined,
      })
      return `Created role "${role.name}" (ID: ${role.id})`
    },
  },
  {
    name: 'edit_role',
    description: 'Edit an existing role',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        roleId: { type: 'string', description: 'Role ID' },
        name: { type: 'string', description: 'New name' },
        color: { type: 'string', description: 'New hex color' },
        hoist: { type: 'boolean', description: 'Show separately' },
        mentionable: { type: 'boolean', description: 'Mentionable' },
        permissions: { type: 'string', description: 'Permission bitfield' },
      },
      required: ['roleId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const role = await guild.roles.fetch(args.roleId as string)
      if (!role) throw new Error('Role not found')
      const opts: Record<string, unknown> = {}
      if (args.name) opts.name = args.name
      if (args.color) opts.color = args.color
      if (args.hoist !== undefined) opts.hoist = args.hoist
      if (args.mentionable !== undefined) opts.mentionable = args.mentionable
      if (args.permissions) opts.permissions = BigInt(args.permissions as string)
      await role.edit(opts)
      return `Role ${args.roleId} updated`
    },
  },
  {
    name: 'delete_role',
    description: 'Delete a role',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        roleId: { type: 'string', description: 'Role ID' },
      },
      required: ['roleId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const role = await guild.roles.fetch(args.roleId as string)
      if (!role) throw new Error('Role not found')
      await role.delete()
      return `Role ${args.roleId} deleted`
    },
  },
  {
    name: 'assign_role',
    description: 'Assign a role to a member',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
        roleId: { type: 'string', description: 'Role ID' },
      },
      required: ['userId', 'roleId'],
    },
    async handler(args) {
      const member = await fetchMember(args.guildId as string | undefined, args.userId as string)
      await member.roles.add(args.roleId as string)
      return `Role ${args.roleId} assigned to ${member.user.username}`
    },
  },
  {
    name: 'remove_role',
    description: 'Remove a role from a member',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        userId: { type: 'string', description: 'User ID' },
        roleId: { type: 'string', description: 'Role ID' },
      },
      required: ['userId', 'roleId'],
    },
    async handler(args) {
      const member = await fetchMember(args.guildId as string | undefined, args.userId as string)
      await member.roles.remove(args.roleId as string)
      return `Role ${args.roleId} removed from ${member.user.username}`
    },
  },
]
