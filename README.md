# discord-mcp

A comprehensive Discord MCP server with 66 tools. Built with TypeScript, Bun, and discord.js.

The only Discord MCP server that shows **emoji reactions**, **thread indicators**, and **attachment metadata** inline in message output, so your AI assistant can see the full context of every message without extra API calls.

## Features

- **Reactions in message output** — see `[👍×2 ✅×1]` on every message
- **Thread indicators** — `[🧵 thread]` shows which messages have active threads
- **Attachment metadata** — `[+1att]` with `get_attachment` for URLs and file info
- **File uploads** — send images, PDFs, and other files via the `files` parameter
- **Auto-chunking** — messages over 2000 characters are split at paragraph boundaries
- **Incremental reads** — `after` and `before` params for fetching only new messages
- **66 tools** — messages, channels, threads, roles, moderation, voice, webhooks, events, permissions, invites, emojis, DMs
- **Automatic rate limiting** — discord.js handles 429 responses transparently
- **Native runtime** — Bun/TypeScript, no Docker required

## Quick start

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- A Discord bot token ([create one here](https://discord.com/developers/applications))

### Install

```bash
git clone https://github.com/jonasgantner/discord-mcp.git
cd discord-mcp
bun install
```

### Configure

Set environment variables:

```bash
export DISCORD_TOKEN="your-bot-token"
export DISCORD_GUILD_ID="your-server-id"  # optional, used as default for guild-scoped tools
```

### Run

```bash
bun run index.ts
```

The server communicates over stdio (MCP standard).

### Use with Claude Code

Add to `~/.claude/mcp-wrappers/discord.sh`:

```bash
#!/bin/bash
exec bun run /path/to/discord-mcp/index.ts
```

Or configure directly in your MCP settings.

### Use with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "discord": {
      "command": "bun",
      "args": ["run", "/path/to/discord-mcp/index.ts"],
      "env": {
        "DISCORD_TOKEN": "your-bot-token",
        "DISCORD_GUILD_ID": "your-server-id"
      }
    }
  }
}
```

## Message output format

`read_messages` returns rich metadata on every message:

```
- (ID: 123456) **[username]** `2026-04-01T12:00:00Z`: ```message content``` [🧵 thread] [👍×2 ✅×1] [+1att]
```

| Indicator | Meaning |
|---|---|
| `[🧵 thread]` | Message has an active thread |
| `[👍×2 ✅×1]` | Emoji reactions with counts |
| `[+1att]` | Has file attachments |

## Tools (66)

### Messages (7)
`read_messages` · `send_message` · `edit_message` · `delete_message` · `add_reaction` · `remove_reaction` · `get_attachment`

### Users & DMs (5)
`get_user_id_by_name` · `send_private_message` · `edit_private_message` · `delete_private_message` · `read_private_messages`

### Threads (1)
`list_active_threads`

### Channels (7)
`create_text_channel` · `edit_text_channel` · `delete_channel` · `find_channel` · `list_channels` · `get_channel_info` · `move_channel`

### Categories (4)
`create_category` · `delete_category` · `find_category` · `list_channels_in_category`

### Roles (6)
`list_roles` · `create_role` · `edit_role` · `delete_role` · `assign_role` · `remove_role`

### Moderation (7)
`kick_member` · `ban_member` · `unban_member` · `timeout_member` · `remove_timeout` · `set_nickname` · `get_bans`

### Voice & Stage (6)
`create_voice_channel` · `create_stage_channel` · `edit_voice_channel` · `move_member` · `disconnect_member` · `modify_voice_state`

### Webhooks (4)
`create_webhook` · `delete_webhook` · `list_webhooks` · `send_webhook_message`

### Scheduled Events (5)
`create_guild_scheduled_event` · `edit_guild_scheduled_event` · `delete_guild_scheduled_event` · `list_guild_scheduled_events` · `get_guild_scheduled_event_users`

### Permissions (4)
`list_channel_permission_overwrites` · `upsert_role_channel_permissions` · `upsert_member_channel_permissions` · `delete_channel_permission_overwrite`

### Invites (4)
`create_invite` · `list_invites` · `delete_invite` · `get_invite_details`

### Emojis (5)
`list_emojis` · `get_emoji_details` · `create_emoji` · `edit_emoji` · `delete_emoji`

### Server (1)
`get_server_info`

## Comparison

This server was built to replace [SaseQ/discord-mcp](https://github.com/SaseQ/discord-mcp) (the most-starred Discord MCP server). Here's how it compares to existing options:

| Feature | discord-mcp (this) | [SaseQ](https://github.com/SaseQ/discord-mcp) | [barryyip0625](https://github.com/barryyip0625/mcp-discord) | [HardHeadHackerHead](https://github.com/HardHeadHackerHead/discord-mcp) | [PaSympa](https://github.com/PaSympa/discord-mcp) |
|---|---|---|---|---|---|
| Language | TypeScript/Bun | Java/Spring Boot | TypeScript | TypeScript | TypeScript |
| Tools | 66 | ~65 | 42 | 139 | 90 |
| Reactions in read output | **Yes** | No | No | No | No |
| Thread indicators | **Yes** | No | No | No | No |
| File attachments on send | **Yes** | No | No | Yes | No |
| Auto-chunking (>2000 chars) | **Yes** | No | No | No | No |
| Incremental reads (after/before) | **Yes** | No | No | No | No |
| Runtime | Native (Bun) | Docker/JVM | Node.js/Docker | Node.js | Node.js/Docker |
| Docker image size | N/A (no Docker needed) | ~400MB+ | ~150MB | — | ~73MB |

### Why this server?

Other Discord MCP servers fetch messages but strip context. When your AI reads a channel, it can't see which messages have been reacted to, which have threads, or which have attachments. It has to make separate API calls for each, burning tokens and rate limit budget.

This server puts that context inline on every message, so a single `read_messages` call gives the full picture.

## Bot permissions

The bot needs these Discord gateway intents (configured in the [Developer Portal](https://discord.com/developers/applications)):

- **Server Members Intent** — for moderation and role tools
- **Message Content Intent** — for reading message content
- **Presence Intent** — optional, for voice state tools

Minimum bot permissions (OAuth2 scope `bot`):
- Read Messages/View Channels
- Send Messages
- Manage Messages (for delete/edit)
- Add Reactions
- Read Message History
- Manage Channels (for channel CRUD)
- Manage Roles (for role tools)
- Kick/Ban Members (for moderation)

## Architecture

```
discord-mcp/
├── index.ts              # Entry point: MCP server + discord.js client
├── client.ts             # Client singleton, guild resolver, helpers
├── tools/
│   ├── _types.ts         # ToolDef type, chunk(), message formatter
│   ├── registry.ts       # Collects all modules, registers with MCP
│   ├── messages.ts       # read/send/edit/delete, reactions, attachments
│   ├── users.ts          # DMs, user lookup
│   ├── threads.ts        # Active thread listing
│   ├── channels.ts       # Channel CRUD
│   ├── categories.ts     # Category management
│   ├── roles.ts          # Role CRUD + assign/remove
│   ├── moderation.ts     # Kick, ban, timeout, nickname
│   ├── voice.ts          # Voice/stage channels, member control
│   ├── webhooks.ts       # Webhook CRUD + send
│   ├── events.ts         # Scheduled events
│   ├── permissions.ts    # Permission overwrites
│   ├── invites.ts        # Invite management
│   ├── emojis.ts         # Custom emoji CRUD
│   └── server-info.ts    # Server metadata
└── package.json
```

Each tool module exports a `ToolDef[]` array. The registry collects them all and handles MCP registration + error wrapping in one place. Adding a new tool is: define it in the right module, done.

## Credits

Built as a replacement for [SaseQ/discord-mcp](https://github.com/SaseQ/discord-mcp), which pioneered the comprehensive Discord MCP server approach. Tool schemas are inspired by that project's design.

## License

MIT
