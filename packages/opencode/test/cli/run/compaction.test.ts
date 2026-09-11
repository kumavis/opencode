import { describe, expect, it } from "bun:test"
import { isCompactionContinuation, isCompactionSummary, isHiddenCompactionPart } from "@/cli/cmd/run/compaction"

describe("compaction filters", () => {
  // `mode` is the agent name; a run of the built-in `compaction` agent is a
  // normal run and must not be treated as a summary.
  it("recognizes only the assistant summary message", () => {
    expect(isCompactionSummary({ role: "assistant", summary: true })).toBe(true)
    expect(isCompactionSummary({ role: "assistant" })).toBe(false)
    expect(isCompactionSummary({ role: "assistant", summary: { diffs: [] } })).toBe(false)
    expect(isCompactionSummary({ role: "user", summary: { diffs: [] } })).toBe(false)
    expect(isCompactionSummary({ role: "assistant", mode: "compaction" })).toBe(false)
  })

  it("hides only the synthetic compaction continuation", () => {
    expect(
      isCompactionContinuation({
        type: "text",
        synthetic: true,
        metadata: { compaction_continue: true },
      }),
    ).toBe(true)
    expect(isCompactionContinuation({ type: "text", synthetic: true, metadata: {} })).toBe(false)
    expect(isCompactionContinuation({ type: "text", synthetic: true })).toBe(false)
    expect(
      isCompactionContinuation({
        type: "text",
        synthetic: false,
        metadata: { compaction_continue: true },
      }),
    ).toBe(false)
    expect(
      isCompactionContinuation({
        type: "reasoning",
        synthetic: true,
        metadata: { compaction_continue: true },
      }),
    ).toBe(false)
  })

  it("hides owned parts and continuations, and passes everything else", () => {
    const owned = new Set(["msg_summary"])
    expect(isHiddenCompactionPart({ messageID: "msg_summary", type: "text" }, owned)).toBe(true)
    expect(isHiddenCompactionPart({ messageID: "msg_answer", type: "text" }, owned)).toBe(false)
    expect(
      isHiddenCompactionPart(
        {
          messageID: "msg_answer",
          type: "text",
          synthetic: true,
          metadata: { compaction_continue: true },
        },
        owned,
      ),
    ).toBe(true)
  })
})
