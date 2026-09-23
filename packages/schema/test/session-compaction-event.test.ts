import { describe, expect, test } from "bun:test"
import { Schema } from "effect"
import { SessionCompactionEvent } from "../src/session-compaction-event"

const decode = Schema.decodeUnknownSync(SessionCompactionEvent.Compacted.data)

describe("V1 compaction checkpoint", () => {
  test("preserves bare notifications and omits an undefined checkpoint", () => {
    expect(String(decode({ sessionID: "ses_test" }).sessionID)).toBe("ses_test")
    const encode = Schema.encodeSync(SessionCompactionEvent.Compacted.data)
    expect(encode({ ...decode({ sessionID: "ses_test" }), checkpoint: undefined })).toEqual({ sessionID: "ses_test" })
  })

  test("accepts the versioned snapshot envelope", () => {
    const event = {
      sessionID: "ses_test",
      checkpoint: { version: 1, summaryID: "msg_summary", messages: [] },
    }
    expect(JSON.stringify(decode(event))).toBe(JSON.stringify(event))
  })

  test("rejects unknown versions, missing summary identity, and malformed messages", () => {
    const checkpoint = { version: 1, summaryID: "msg_summary", messages: [] }
    for (const invalid of [
      { ...checkpoint, version: 2 },
      { version: 1, messages: [] },
      { ...checkpoint, messages: [{}] },
    ]) {
      expect(() => decode({ sessionID: "ses_test", checkpoint: invalid })).toThrow()
    }
  })
})
