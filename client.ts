import {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  type TextChannel,
  type DMChannel,
  type NewsChannel,
  type ThreadChannel,
  type Guild,
  type GuildMember,
} from 'discord.js'
import { resolveGuildId } from './config.js'

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildScheduledEvents,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
})

export async function fetchGuild(guildId?: string): Promise<Guild> {
  return client.guilds.fetch(resolveGuildId(guildId))
}

export type SendableChannel = TextChannel | DMChannel | NewsChannel | ThreadChannel

export async function fetchTextChannel(id: string): Promise<SendableChannel> {
  const ch = await client.channels.fetch(id)
  if (!ch || !ch.isTextBased()) {
    throw new Error(`Channel ${id} not found or not text-based`)
  }
  return ch as SendableChannel
}

export async function fetchMember(guildId: string | undefined, userId: string): Promise<GuildMember> {
  const guild = await fetchGuild(guildId)
  return guild.members.fetch(userId)
}
