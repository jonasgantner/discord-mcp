import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { client } from './client.js'
import { registerTools } from './tools/registry.js'

// Global error handlers — log and keep serving, never crash silently.
process.on('unhandledRejection', err => {
  process.stderr.write(`discord-mcp: unhandled rejection: ${err}\n`)
})
process.on('uncaughtException', err => {
  process.stderr.write(`discord-mcp: uncaught exception: ${err}\n`)
})

const TOKEN = process.env.DISCORD_TOKEN
if (!TOKEN) {
  process.stderr.write('discord-mcp: DISCORD_TOKEN not set\n')
  process.exit(1)
}

// MCP server
const server = new Server(
  { name: 'discord-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

registerTools(server)

// Connect MCP via stdio
await server.connect(new StdioServerTransport())

// Graceful shutdown on stdin EOF or signals
let shuttingDown = false
function shutdown(): void {
  if (shuttingDown) return
  shuttingDown = true
  process.stderr.write('discord-mcp: shutting down\n')
  setTimeout(() => process.exit(0), 2000)
  void Promise.resolve(client.destroy()).finally(() => process.exit(0))
}
process.stdin.on('end', shutdown)
process.stdin.on('close', shutdown)
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Discord client events
client.on('error', err => {
  process.stderr.write(`discord-mcp: client error: ${err}\n`)
})

client.once('ready', c => {
  process.stderr.write(`discord-mcp: connected as ${c.user.tag}\n`)
})

await client.login(TOKEN)
