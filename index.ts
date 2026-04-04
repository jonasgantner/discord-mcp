import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { client } from './client.js'
import { registerTools } from './tools/registry.js'
import { loadConfig } from './config.js'

// Global error handlers — log and keep serving, never crash silently.
process.on('unhandledRejection', err => {
  process.stderr.write(`discord-mcp: unhandled rejection: ${err}\n`)
})
process.on('uncaughtException', err => {
  process.stderr.write(`discord-mcp: uncaught exception: ${err}\n`)
})

const config = loadConfig()

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
  void Promise.all([server.close(), client.destroy()]).finally(() => process.exit(0))
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

// PPID watchdog: independent process that kills us if parent dies.
import { spawn } from 'child_process'
const wd = spawn('bash', ['-c', `
  while true; do
    sleep 5
    PPID_NOW=$(ps -o ppid= -p $PPID 2>/dev/null | tr -d ' ')
    if [ -z "$PPID_NOW" ] || [ "$PPID_NOW" = "1" ]; then
      kill -9 $PPID 2>/dev/null
      exit 0
    fi
  done
`], { detached: true, stdio: 'ignore' })
wd.unref()

await client.login(config.token)
