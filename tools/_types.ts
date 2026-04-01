export type ToolDef = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (args: Record<string, unknown>) => Promise<string>
}

const MAX_CHUNK = 2000

/** Split text for Discord's 2000-char limit. Prefers paragraph > line > space > hard cut. */
export function chunk(text: string, limit: number = MAX_CHUNK): string[] {
  if (text.length <= limit) return [text]
  const out: string[] = []
  let rest = text
  while (rest.length > limit) {
    const para = rest.lastIndexOf('\n\n', limit)
    const line = rest.lastIndexOf('\n', limit)
    const space = rest.lastIndexOf(' ', limit)
    const cut = para > limit / 2 ? para : line > limit / 2 ? line : space > 0 ? space : limit
    out.push(rest.slice(0, cut))
    rest = rest.slice(cut).replace(/^\n+/, '')
  }
  if (rest) out.push(rest)
  return out
}

/** Format a message line for read_messages output. */
export function fmtMsg(m: {
  id: string
  author: { username: string }
  content: string
  createdAt: Date
  attachments: { size: number }
  hasThread: boolean
  reactions: { cache: Map<string, { emoji: { name: string | null }; count: number }> }
}): string {
  const atts = m.attachments.size > 0 ? ` [+${m.attachments.size}att]` : ''

  let reacts = ''
  if (m.reactions.cache.size > 0) {
    const parts: string[] = []
    for (const r of m.reactions.cache.values()) {
      parts.push(`${r.emoji.name ?? '?'}×${r.count}`)
    }
    reacts = ` [${parts.join(' ')}]`
  }

  const thread = m.hasThread ? ' [🧵 thread]' : ''
  const text = m.content.replace(/[\r\n]+/g, ' ').slice(0, 500)

  return `- (ID: ${m.id}) **[${m.author.username}]** \`${m.createdAt.toISOString()}\`: \`\`\`${text}\`\`\`${thread}${reacts}${atts}`
}
