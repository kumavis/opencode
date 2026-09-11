// @ts-check
//
// Compaction is internal session mechanics, not model output. The `run` event
// loop uses these predicates to keep the compaction summary message and its
// synthetic continuation out of the consumer stream. They are pure so the
// discriminators are unit-testable without triggering a real context overflow
// through the CLI harness (which disables auto-compaction in tests).

type MessageInfoLike = {
  role?: string
  summary?: unknown
  mode?: unknown
  [key: string]: unknown
}

type PartLike = {
  messageID?: string
  type?: string
  synthetic?: boolean
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

// `summary === true` is written only for the compaction summary; a user
// message carries a `summary` object instead. `mode` is the agent name and
// would match a normal run of the built-in `compaction` agent, so it must not
// be used as a discriminator here.
export const isCompactionSummary = (info: MessageInfoLike): boolean =>
  info.role === "assistant" && info.summary === true

// Only the compaction continuation prompt carries this metadata. Other
// synthetic text parts (file/MCP injection, reminders, plugin messages) must
// still reach the output.
export const isCompactionContinuation = (part: PartLike): boolean =>
  part.type === "text" && part.synthetic === true && part.metadata?.compaction_continue === true

export const isHiddenCompactionPart = (part: PartLike, compactionMessages: ReadonlySet<string>): boolean =>
  (part.messageID !== undefined && compactionMessages.has(part.messageID)) || isCompactionContinuation(part)
