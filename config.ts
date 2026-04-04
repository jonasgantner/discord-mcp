export type Config = {
  token: string
  defaultGuildId?: string
}

let cached: Config | null = null

export function loadConfig(): Config {
  if (cached) return cached
  const token = process.env.DISCORD_TOKEN
  if (!token) {
    process.stderr.write('discord-mcp: DISCORD_TOKEN not set\n')
    process.exit(1)
  }
  cached = {
    token,
    defaultGuildId: process.env.DISCORD_GUILD_ID,
  }
  return cached
}

export function resolveGuildId(guildId?: string): string {
  const id = guildId || loadConfig().defaultGuildId
  if (!id) throw new Error('guildId required (not provided and DISCORD_GUILD_ID not set)')
  return id
}
