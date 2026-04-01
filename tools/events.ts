import { GuildScheduledEventEntityType, GuildScheduledEventStatus } from 'discord.js'
import { fetchGuild } from '../client.js'
import type { ToolDef } from './_types.js'

const ENTITY_TYPES: Record<string, GuildScheduledEventEntityType> = {
  '1': GuildScheduledEventEntityType.StageInstance,
  '2': GuildScheduledEventEntityType.Voice,
  '3': GuildScheduledEventEntityType.External,
}

export const eventTools: ToolDef[] = [
  {
    name: 'create_guild_scheduled_event',
    description: 'Create a scheduled event',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        name: { type: 'string', description: 'Event name' },
        description: { type: 'string', description: 'Event description' },
        scheduledStartTime: { type: 'string', description: 'ISO8601 start time' },
        scheduledEndTime: { type: 'string', description: 'ISO8601 end time' },
        entityType: { type: 'string', description: '1=Stage, 2=Voice, 3=External' },
        channelId: { type: 'string', description: 'Channel ID (for types 1-2)' },
        location: { type: 'string', description: 'Location (for type 3)' },
      },
      required: ['name', 'scheduledStartTime', 'entityType'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const entityType = ENTITY_TYPES[args.entityType as string]
      if (!entityType) throw new Error('Invalid entityType: use 1 (Stage), 2 (Voice), or 3 (External)')
      const opts: any = {
        name: args.name as string,
        scheduledStartTime: args.scheduledStartTime as string,
        entityType,
        privacyLevel: 2, // GuildOnly
      }
      if (args.description) opts.description = args.description
      if (args.scheduledEndTime) opts.scheduledEndTime = args.scheduledEndTime
      if (args.channelId) opts.channel = args.channelId
      if (args.location) opts.entityMetadata = { location: args.location }
      const event = await guild.scheduledEvents.create(opts)
      return `Created event "${event.name}" (ID: ${event.id})`
    },
  },
  {
    name: 'edit_guild_scheduled_event',
    description: 'Edit a scheduled event',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        eventId: { type: 'string', description: 'Event ID' },
        status: { type: 'string', description: '1=Scheduled, 2=Active, 3=Completed, 4=Canceled' },
        name: { type: 'string', description: 'New name' },
        description: { type: 'string', description: 'New description' },
        scheduledStartTime: { type: 'string', description: 'New start time' },
        location: { type: 'string', description: 'New location' },
      },
      required: ['eventId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const event = await guild.scheduledEvents.fetch(args.eventId as string)
      const opts: any = {}
      if (args.name) opts.name = args.name
      if (args.description) opts.description = args.description
      if (args.scheduledStartTime) opts.scheduledStartTime = args.scheduledStartTime
      if (args.location) opts.entityMetadata = { location: args.location }
      if (args.status) {
        const statusMap: Record<string, GuildScheduledEventStatus> = {
          '1': GuildScheduledEventStatus.Scheduled,
          '2': GuildScheduledEventStatus.Active,
          '3': GuildScheduledEventStatus.Completed,
          '4': GuildScheduledEventStatus.Canceled,
        }
        opts.status = statusMap[args.status as string]
      }
      await event.edit(opts)
      return `Event ${args.eventId} updated`
    },
  },
  {
    name: 'delete_guild_scheduled_event',
    description: 'Delete a scheduled event',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        eventId: { type: 'string', description: 'Event ID' },
      },
      required: ['eventId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const event = await guild.scheduledEvents.fetch(args.eventId as string)
      await event.delete()
      return `Event ${args.eventId} deleted`
    },
  },
  {
    name: 'list_guild_scheduled_events',
    description: 'List scheduled events',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        withUserCount: { type: 'boolean', description: 'Include interested user count' },
      },
      required: [],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const events = await guild.scheduledEvents.fetch({ withUserCount: args.withUserCount as boolean | undefined })
      if (events.size === 0) return 'No scheduled events'
      return [...events.values()]
        .map(e => {
          const users = e.userCount !== undefined ? `, ${e.userCount} interested` : ''
          return `- ${e.name} (ID: ${e.id}, Status: ${GuildScheduledEventStatus[e.status]}${users})\n  Start: ${e.scheduledStartAt?.toISOString()}`
        })
        .join('\n')
    },
  },
  {
    name: 'get_guild_scheduled_event_users',
    description: 'Get users interested in a scheduled event',
    inputSchema: {
      type: 'object',
      properties: {
        guildId: { type: 'string', description: 'Discord server ID' },
        eventId: { type: 'string', description: 'Event ID' },
        limit: { type: 'number', description: 'Max results (default 100)' },
        withMember: { type: 'boolean', description: 'Include member data' },
      },
      required: ['eventId'],
    },
    async handler(args) {
      const guild = await fetchGuild(args.guildId as string | undefined)
      const event = await guild.scheduledEvents.fetch(args.eventId as string)
      const users = await event.fetchSubscribers({ limit: (args.limit as number) || 100, withMember: args.withMember as boolean | undefined })
      if (users.size === 0) return 'No interested users'
      return [...users.values()]
        .map(u => `- ${u.user.username} (ID: ${u.user.id})`)
        .join('\n')
    },
  },
]
