# Discord MCP Server — Capabilities Reference

**Server**: `~/.claude/mcp-servers/discord/` (Bun/TypeScript, discord.js SDK)
**Tools**: 66
**Guild**: Default from `DISCORD_GUILD_ID` env var; every guild-scoped tool accepts optional `guildId` override
**Auth**: Bot token via `DISCORD_TOKEN` env var
**Rate limiting**: Handled transparently by discord.js (no manual throttle)

---

## Tools by Domain

### Messages (7 tools)

| Tool | Description | Key params |
|---|---|---|
| `read_messages` | Read recent message history | `channelId`*, `limit` (default 50), `after`, `before` |
| `send_message` | Send message, auto-splits >2000 chars | `channelId`*, `message`*, `files` (array, max 10, 25MB each) |
| `edit_message` | Edit existing message | `channelId`*, `messageId`*, `newMessage`* |
| `delete_message` | Delete a message | `channelId`*, `messageId`* |
| `add_reaction` | Add emoji reaction | `channelId`*, `messageId`*, `emoji`* |
| `remove_reaction` | Remove emoji reaction | `channelId`*, `messageId`*, `emoji`* |
| `get_attachment` | Get attachment metadata + URLs | `channelId`*, `messageId`* |

**Tested findings:**
- `read_messages` output includes inline indicators: `[🧵 thread]`, `[👍×2 ✅×1]` reactions, `[+1att]` attachments.
- `after` and `before` params enable incremental reads (fetch only new messages since last read).
- Messages over 2000 chars are auto-split at paragraph boundaries.
- File uploads via `files` array with `name` and `url` (base64 data URLs or HTTP URLs).

### Users & DMs (5 tools)

| Tool | Description | Key params |
|---|---|---|
| `get_user_id_by_name` | Resolve username to user ID | `username`* |
| `send_private_message` | Send DM to user | `userId`*, `message`* |
| `edit_private_message` | Edit a DM | `userId`*, `messageId`*, `newMessage`* |
| `delete_private_message` | Delete a DM | `userId`*, `messageId`* |
| `read_private_messages` | Read DM history | `userId`*, `limit`, `after`, `before` |

**Tested findings:**
- Bot must share a server with the user to send DMs.
- `get_user_id_by_name` searches guild members; does not resolve globally.

### Threads (9 tools)

| Tool | Description | Key params |
|---|---|---|
| `list_active_threads` | List all active threads | (none) |
| `create_thread` | Create thread on message or standalone | `channelId`*, `name`*, `messageId` (optional, for reply thread) |
| `archive_thread` | Archive (close) a thread | `threadId`* |
| `unarchive_thread` | Reopen archived thread | `threadId`* |
| `join_thread` | Bot joins thread | `threadId`* |
| `leave_thread` | Bot leaves thread | `threadId`* |
| `add_thread_member` | Add user to thread | `threadId`*, `userId`* |
| `remove_thread_member` | Remove user from thread | `threadId`*, `userId`* |
| `get_thread_info` | Get thread details | `threadId`* |

### Channels (7 tools)

| Tool | Description | Key params |
|---|---|---|
| `create_text_channel` | Create text channel | `name`*, `categoryId`, `topic` |
| `edit_text_channel` | Edit channel properties | `channelId`*, `name`, `topic`, `nsfw`, `rateLimitPerUser` |
| `delete_channel` | Delete a channel | `channelId`* |
| `find_channel` | Find channel by name | `channelName`* |
| `list_channels` | List all server channels | (none) |
| `get_channel_info` | Get channel details | `channelId`* |
| `move_channel` | Move to category/position | `channelId`*, `categoryId`, `position` |

### Categories (4 tools)

| Tool | Description | Key params |
|---|---|---|
| `create_category` | Create channel category | `name`* |
| `delete_category` | Delete category | `categoryId`* |
| `find_category` | Find category by name | `categoryName`* |
| `list_channels_in_category` | List channels in category | `categoryId`* |

### Roles (6 tools)

| Tool | Description | Key params |
|---|---|---|
| `list_roles` | List all server roles | (none) |
| `create_role` | Create role | `name`*, `color`, `hoist`, `mentionable`, `permissions` |
| `edit_role` | Edit role | `roleId`*, `name`, `color`, `permissions` |
| `delete_role` | Delete role | `roleId`* |
| `assign_role` | Assign role to member | `userId`*, `roleId`* |
| `remove_role` | Remove role from member | `userId`*, `roleId`* |

### Moderation (7 tools)

| Tool | Description | Key params |
|---|---|---|
| `kick_member` | Kick member | `userId`*, `reason` |
| `ban_member` | Ban member | `userId`*, `reason`, `deleteMessageDays` |
| `unban_member` | Unban user | `userId`* |
| `timeout_member` | Timeout (mute) member | `userId`*, `durationSeconds`* |
| `remove_timeout` | Remove timeout | `userId`* |
| `set_nickname` | Set/remove nickname | `userId`*, `nickname` (null to remove) |
| `get_bans` | List banned users | (none) |

### Voice & Stage (6 tools)

| Tool | Description | Key params |
|---|---|---|
| `create_voice_channel` | Create voice channel | `name`*, `categoryId`, `bitrate`, `userLimit` |
| `create_stage_channel` | Create stage channel | `name`*, `categoryId` |
| `edit_voice_channel` | Edit voice/stage channel | `channelId`*, `name`, `bitrate`, `userLimit` |
| `move_member` | Move member to voice channel | `userId`*, `channelId`* |
| `disconnect_member` | Disconnect from voice | `userId`* |
| `modify_voice_state` | Server mute/deafen member | `userId`*, `mute`, `deaf` |

### Webhooks (4 tools)

| Tool | Description | Key params |
|---|---|---|
| `create_webhook` | Create webhook | `channelId`*, `name`* |
| `delete_webhook` | Delete webhook | `webhookId`* |
| `list_webhooks` | List channel webhooks | `channelId`* |
| `send_webhook_message` | Send via webhook | `webhookUrl`*, `message`* |

### Scheduled Events (5 tools)

| Tool | Description | Key params |
|---|---|---|
| `create_guild_scheduled_event` | Create event | `name`*, `scheduledStartTime`*, `entityType`* (VOICE/STAGE/EXTERNAL) |
| `edit_guild_scheduled_event` | Edit event | `eventId`* |
| `delete_guild_scheduled_event` | Delete event | `eventId`* |
| `list_guild_scheduled_events` | List events | (none) |
| `get_guild_scheduled_event_users` | Get interested users | `eventId`* |

### Permissions (4 tools)

| Tool | Description | Key params |
|---|---|---|
| `list_channel_permission_overwrites` | List overwrites | `channelId`* |
| `upsert_role_channel_permissions` | Set role permissions on channel | `channelId`*, `roleId`*, `allow`, `deny` |
| `upsert_member_channel_permissions` | Set member permissions on channel | `channelId`*, `userId`*, `allow`, `deny` |
| `delete_channel_permission_overwrite` | Remove overwrite | `channelId`*, `targetType`*, `targetId`* |

### Invites (4 tools)

| Tool | Description | Key params |
|---|---|---|
| `create_invite` | Create invite link | `channelId`*, `maxAge`, `maxUses`, `temporary` |
| `list_invites` | List active invites | (none) |
| `delete_invite` | Delete invite | `inviteCode`* |
| `get_invite_details` | Get invite info | `inviteCode`* |

### Emojis (5 tools)

| Tool | Description | Key params |
|---|---|---|
| `list_emojis` | List custom emojis | (none) |
| `get_emoji_details` | Get emoji info | `emojiId`* |
| `create_emoji` | Upload custom emoji | `name`*, `imageUrl` or `imageBase64` |
| `edit_emoji` | Edit emoji | `emojiId`*, `name` |
| `delete_emoji` | Delete emoji | `emojiId`* |

### Server (1 tool)

| Tool | Description | Key params |
|---|---|---|
| `get_server_info` | Get server metadata | (none) |

---

## Common Patterns

- **Guild resolution**: All guild-scoped tools accept optional `guildId`. Defaults to `DISCORD_GUILD_ID` env var.
- **Message format**: `read_messages` returns rich inline metadata: reactions `[👍×2]`, threads `[🧵 thread]`, attachments `[+1att]`.
- **Auto-chunking**: Messages over 2000 chars are split at paragraph boundaries.
- **File attachments**: `send_message` accepts `files` array (max 10 files, 25MB each).
- **Incremental reads**: `after` and `before` message ID params on read tools for pagination.
- **Permissions**: Accept named permission strings or bitfield numbers for `allow`/`deny`.

## Known Limitations

1. Bot must share a server with a user to send DMs.
2. `get_user_id_by_name` searches guild members only, not globally.
3. No message search/filter (Discord API limitation). Must read and scan.
4. Webhook messages cannot be edited via this server.
5. Stage channel tools require the bot to have Stage Moderator permissions.
6. File uploads via URL require the URL to be publicly accessible.
