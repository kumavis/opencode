export * as SessionCompactionEvent from "./session-compaction-event"

import { Event } from "./event"
import { SessionID } from "./session-id"
import { Schema } from "effect"
import { optional } from "./schema"
import { SessionV1 } from "./v1/session"

export const Compacted = Event.define({
  type: "session.compacted",
  schema: {
    sessionID: SessionID,
    // V1-only checkpoint: ordered native context, not a prompt or a request
    // to execute anything. Other runtimes may still emit the bare notification.
    checkpoint: optional(
      Schema.Struct({
        version: Schema.Literal(1),
        summaryID: SessionV1.MessageID,
        messages: Schema.Array(SessionV1.WithParts),
      }),
    ),
  },
})

export const Definitions = Event.inventory(Compacted)
